import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "../whatsapp-webhook/ai-service.ts";
import { processTransaction, getBalance, getImportantAlerts, getPreferredAccount } from "../whatsapp-webhook/financial-service.ts";
import { generateTransactionCode, formatPremiumMessage } from "../whatsapp-webhook/transactionCommandHandler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Regex Patterns para os principais bancos brasileiros ───
const BANK_PATTERNS: { bank: string; regex: RegExp; swap?: boolean; isIncome?: boolean }[] = [
    // Padrões de COMPRA/DÉBITO (cartão) — GASTOS
    { bank: "Nubank", regex: /nubank.*?(?:compra|débito|debit).*?R\$\s*([\d.,]+).*?(?:em|no|na|at)\s+(.+?)(?:\.|$)/i },
    { bank: "Inter", regex: /inter.*?(?:compra|débito).*?R\$\s*([\d.,]+)\s*[-–]\s*(.+?)(?:\.|$)/i },
    { bank: "Itaú", regex: /itaú.*?(?:compra|débito)\s+(?:cartão\s+)?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Bradesco", regex: /bradesco.*?débito\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "C6", regex: /C6\s*Bank.*?R\$\s*([\d.,]+)\s+(?:em\s+)?(.+?)(?:\.|$)/i },
    { bank: "Mercado Pago", regex: /(?:mercado pago|você pagou|pagamento).*?R\$\s*([\d.,]+)\s+(?:para\s+)?(.+?)(?:\.|$)/i },
    { bank: "Caixa", regex: /(?:caixa|cef).*?(?:compra|transferência|transferencia|pix|pagamento).*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Santander", regex: /santander.*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },

    // Padrões de PIX / TRANSFERÊNCIA RECEBIDA (RECEITA)
    { bank: "Pix", regex: /pix\s+(?:recebido|receber|recebeu).*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Pix", regex: /pix\s+(?:recebido|receber|recebeu).*?(?:de|do|da)\s+(.+?),?\s*(?:no\s+)?valor\s+(?:de\s+)?R\$\s*([\d.,]+)/i, swap: true, isIncome: true },
    { bank: "Transferência", regex: /(?:transferência|transferencia)\s+recebida.*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },

    // Padrões de PIX / TRANSFERÊNCIA ENVIADA (GASTO)
    { bank: "Pix", regex: /pix\s+(?:enviado|realizado|feito|efetuado|pago).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    { bank: "Transferência", regex: /(?:transferência|transferencia).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },

    // Padrão genérico de Banco/R$ (assume GASTO)
    { bank: "Banco", regex: /(?:depósito|deposito|salário|salario|crédito|credito)\s+(?:em\s+conta\s+)?.*?R\$\s*([\d.,]+).*?(?:de|do|da|em)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Banco", regex: /(?:você\s+recebeu|recebeu|recebimento).*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Banco", regex: /R\$\s*([\d.,]+).*?(?:em|no|na|para|de)\s+(.+?)(?:\.|,\s*$|$)/i },
];

// ─── Legacy: Chave secreta para POST antigo ───
const INJECT_SECRET = Deno.env.get("INJECT_SECRET") || "saldin_inject_2026";

// ─── WhatsApp Send Helpers ───
function normalizeTo(phone: string): string {
    // Remove any non-digits
    let clean = phone.replace(/\D/g, "");
    
    // Handling Brazil 9th digit variations for Meta API
    // Meta historically prefers 12 digits (55DDXXXXXXXX) over 13 (55DD9XXXXXXXX) for some accounts
    if (clean.startsWith("55") && clean.length === 13) {
        // If it has 13 digits, the 5th digit is usually the extra '9'
        const ddd = clean.substring(2, 4);
        const number = clean.substring(5);
        console.log(`🔧 Normalizing Brazil number (13->12): ${clean} -> 55${ddd}${number}`);
        return `55${ddd}${number}`;
    }
    
    if (clean.startsWith("55") && clean.length === 12) {
        // Some Meta accounts (Test/Trial) might want the 9 added? 
        // But usually, trial accounts require exact format as registered.
        // The webhook does the opposite: 12 -> 13. 
        // Let's stick to what works in most cases or try both if it fails.
    }
    
    return clean;
}

async function sendWhatsApp(to: string, text: string): Promise<{ ok: boolean; errorCode?: number }> {
    const cleanTo = normalizeTo(to);
    
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
        console.error("❌ sendWhatsApp SKIPPED: META_ACCESS_TOKEN or META_PHONE_NUMBER_ID is not configured!");
        return { ok: false };
    }

    const sendMessage = async (recipient: string) => {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const body = {
            messaging_product: "whatsapp",
            to: recipient,
            type: "text",
            text: { body: text },
        };
        
        console.log(`📡 Sending to Meta: ${recipient} | Body length: ${text.length}`);
        
        const res = await fetch(url, {
            method: "POST",
            headers: { 
                Authorization: `Bearer ${META_ACCESS_TOKEN}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(body),
        });
        
        return await res.json();
    };

    try {
        let data = await sendMessage(cleanTo);
        
        // If it fails with #100 and it's a 12-digit number, try adding the 9
        // OR if it's 13 digits, we already tried 12. Let's try 13 if it failed?
        if (data.error && data.error.code === 100) {
            console.warn(`⚠️ Meta rejected ${cleanTo}. Trying variation...`);
            let variation = cleanTo;
            if (cleanTo.startsWith("55") && cleanTo.length === 12) {
                // Try 13 digits (add the 9)
                variation = cleanTo.substring(0, 4) + "9" + cleanTo.substring(4);
            } else if (cleanTo.startsWith("55") && cleanTo.length === 13) {
                // Try 12 digits (remove the 9)
                variation = cleanTo.substring(0, 4) + cleanTo.substring(5);
            }
            
            if (variation !== cleanTo) {
                console.log(`🔄 Retrying with variation: ${variation}`);
                data = await sendMessage(variation);
            }
        }

        if (data.error) {
            console.error("❌ sendWhatsApp final failure:", JSON.stringify(data.error));
            return { ok: false, errorCode: data.error.code };
        }
        
        console.log(`✅ WhatsApp sent to ${cleanTo}`);
        return { ok: true };
    } catch (e) {
        console.error("sendWhatsApp exception:", e);
        return { ok: false };
    }
}

async function sendWhatsAppTemplate(
    to: string,
    templateName: string,
    params: string[]
): Promise<boolean> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return false;
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "pt_BR" },
                    components: [{
                        type: "body",
                        parameters: params.map(p => ({ type: "text", text: p })),
                    }],
                },
            }),
        });
        const data = await res.json();
        if (data.error) {
            console.error(`Template '${templateName}' failed:`, data.error.code, data.error.message);
            return false;
        }
        console.info(`✅ Template '${templateName}' sent to ${to}`);
        return true;
    } catch (e) {
        console.error("sendWhatsAppTemplate error:", e);
        return false;
    }
}

async function sendInteractive(to: string, text: string, buttons: { id: string; title: string }[]) {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return;
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text },
                    action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
                },
            }),
        });
    } catch (e) {
        console.error("sendInteractive error:", e);
    }
}

// ─── Parser de Texto de Notificação ───
function parseNotificationText(text: string): { valor: number; estabelecimento: string; banco: string; isIncome: boolean } | null {
    const cleanText = text.trim();

    for (const { bank, regex, swap, isIncome } of BANK_PATTERNS) {
        const match = cleanText.match(regex);
        if (match) {
            // swap=true: group(1)=nome, group(2)=valor (ex: Pix recebido)
            const rawValue = (swap ? match[2] : match[1]).replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(rawValue);
            if (isNaN(valor) || valor <= 0) continue;

            const rawEstab = swap ? match[1] : match[2];
            const defaultLabel = isIncome ? "Recebimento" : "Compra";
            const estabelecimento = rawEstab
                ?.trim()
                .replace(/\*+/g, "")
                .replace(/\s+/g, " ")
                .substring(0, 80) || defaultLabel;

            return { valor, estabelecimento, banco: bank, isIncome: !!isIncome };
        }
    }

    return null;
}

// ─── Normaliza número de telefone para E.164 ───
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55")) return digits;
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return digits;
}

// ─── Busca usuário por capture_token (novo fluxo GET simplificado) ───
async function findUserByToken(token: string) {
    const cleanToken = token.trim();
    console.log(`[findUserByToken] Searching for: "${cleanToken}"`);
    const { data, error } = await supabase
        .from("whatsapp_users")
        .select("user_id, phone_number, is_verified, capture_token")
        .filter("capture_token", "ilike", cleanToken)
        .eq("is_verified", true)
        .maybeSingle();

    if (error) {
        console.error("❌ Token lookup query error:", error);
        return null;
    }
    if (!data) {
        console.warn(`⚠️ No verified user found for token: "${cleanToken}"`);
        return null;
    }
    return data;
}

// ─── Busca usuário por telefone (fluxo POST legado) ───
async function findUserByPhone(phone: string) {
    const normalizedPhone = normalizePhone(phone);
    const phoneVariations = [normalizedPhone];
    if (normalizedPhone.startsWith("55") && normalizedPhone.length === 13) {
        const ddd = normalizedPhone.substring(2, 4);
        const num = normalizedPhone.substring(4);
        phoneVariations.push(`55${ddd}${num.substring(1)}`);
    } else if (normalizedPhone.startsWith("55") && normalizedPhone.length === 12) {
        const ddd = normalizedPhone.substring(2, 4);
        const num = normalizedPhone.substring(4);
        phoneVariations.push(`55${ddd}9${num}`);
    }

    const { data, error } = await supabase
        .from("whatsapp_users")
        .select("user_id, phone_number, is_verified")
        .in("phone_number", phoneVariations)
        .eq("is_verified", true)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Phone lookup error:", error);
        return null;
    }
    return data;
}

// ─── Processa a transação e envia no WhatsApp ───
async function processAndNotify(userId: string, phoneToReply: string, text: string, source: string) {
    // Log de auditoria (Movido para antes do parse para debug)
    const { error: logError } = await supabase.from("whatsapp_logs").insert({
        phone_number: phoneToReply,
        whatsapp_user_id: null,
        message_content: JSON.stringify({ text, source, isIncoming: true }),
        message_type: "auto_notification",
        processed: false,
        processing_result: { text_raw: text, source },
    });
    if (logError) console.error("❌ Failed to insert audit log:", logError);

    const parsed = parseNotificationText(text);

    if (!parsed) {
        console.log("ℹ️ Notification not parseable as transaction. Ignoring silently.");
        return { status: "ignored", reason: "not_a_transaction" };
    }

    // Determina se é receita ou gasto:
    // 1) O parser regex já detecta via isIncome
    // 2) A IA pode confirmar/override via intent.items[0].tipo
    let isIncome = parsed.isIncome;

    console.log(`${isIncome ? '💰' : '💸'} Parsed: R$ ${parsed.valor} em "${parsed.estabelecimento}" (${parsed.banco}) [${isIncome ? 'RECEITA' : 'GASTO'}]`);

    // IA para categoria
    const aiText = isIncome
        ? `Recebi R$ ${parsed.valor} de ${parsed.estabelecimento}`
        : `Gastei R$ ${parsed.valor} em ${parsed.estabelecimento}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let intent: any = null;
    try {
        intent = await analyzeText(aiText);
        // Se a IA retornar tipo diferente do regex, priorizar a IA
        const aiTipo = intent?.items?.[0]?.tipo;
        if (aiTipo === "receita") isIncome = true;
        else if (aiTipo === "gasto") isIncome = false;
    } catch (e) {
        console.warn("AI analysis failed, using regex detection:", e);
    }

    const transactionType = isIncome ? "income" : "expense";
    console.log(`📋 Final type: ${transactionType} (regex=${parsed.isIncome}, ai=${intent?.items?.[0]?.tipo || 'N/A'})`);

    // Conta/cartão de destino
    const metodo = intent?.items?.[0]?.metodo_pagamento || "pix";
    const { id: targetAccountId, isCreditCard } = await getPreferredAccount(userId, metodo);

    // Registra transação com o tipo correto (income ou expense)
    const tCode = generateTransactionCode();
    const categoryId = intent?.items?.[0]?.categoria_sugerida
        ? await getCategoryId(userId, intent.items[0].categoria_sugerida)
        : null;

    const result = await processTransaction({
        userId,
        type: transactionType,
        amount: parsed.valor,
        description: parsed.estabelecimento,
        categoryId: categoryId || undefined,
        bankAccountId: targetAccountId || undefined,
        transactionCode: tCode,
        isCreditCard: isIncome ? false : isCreditCard, // Receita nunca vai para cartão de crédito
    });

    // Atualiza o log com o resultado
    await supabase.from("whatsapp_logs")
        .update({
            processed: true,
            processing_result: { valor: parsed.valor, estabelecimento: parsed.estabelecimento, tCode, type: transactionType },
        })
        .match({ phone_number: phoneToReply, message_type: "auto_notification", processed: false })
        .order("created_at", { ascending: false })
        .limit(1);

    // Monta resposta premium
    const alerts = await getImportantAlerts(userId);
    const defaultCategory = isIncome ? "Recebimentos" : "Compras";
    const premiumMsg = formatPremiumMessage(
        {
            id: result.id,
            description: parsed.estabelecimento,
            amount: parsed.valor,
            date: new Date().toISOString(),
            category: intent?.items?.[0]?.categoria_sugerida || defaultCategory,
            account_name: result.dest_name,
            type: transactionType,
            transaction_code: tCode,
            account_balance: result.account_balance,
        },
        { new_balance: result.new_balance },
        alerts
    );

    const actionLabel = isIncome ? "um recebimento" : "uma compra";
    const finalMsg = `🔔 *Auto-Captura Ativa*\n_Detectei ${actionLabel} via ${parsed.banco}_\n\n${premiumMsg}`;

    // Tenta enviar mensagem interativa (com botões)
    console.log(`📤 Enviando WhatsApp para ${phoneToReply.substring(0, 6)}...`);
    const msgResult = await sendWhatsApp(phoneToReply, finalMsg);

    if (!msgResult.ok && msgResult.errorCode === 131047) {
        // Janela de 24h expirada → tenta template
        console.info("⏰ 24h window expired, trying template fallback...");
        const categoria = intent?.items?.[0]?.categoria_sugerida || defaultCategory;
        const templateSent = await sendWhatsAppTemplate(phoneToReply, "auto_capture_confirmation", [
            String(parsed.valor).replace(".", ","),
            parsed.estabelecimento,
            categoria,
            tCode,
        ]);
        if (!templateSent) {
            console.error("❌ Template fallback also failed! Check if template 'auto_capture_confirmation' is approved in Meta.");
        }
    } else if (!msgResult.ok) {
        // Outro erro — logar detalhes
        console.error(`❌ WhatsApp send failed. ErrorCode: ${msgResult.errorCode || 'unknown'}. Check META_ACCESS_TOKEN and META_PHONE_NUMBER_ID env vars.`);
    } else if (msgResult.ok) {
        // Mensagem de texto funcionou, agora envia os botões
        console.log(`✅ WhatsApp message sent successfully to ${phoneToReply.substring(0, 6)}...`);
        await sendInteractive(phoneToReply, `Ações para ${tCode}:`, [
            { id: `excluir_${tCode}`, title: "🗑️ Excluir" },
            { id: `editar_${tCode}`, title: "📝 Editar" },
        ]);
    }

    console.log(`✅ Auto-registered: R$ ${parsed.valor} | ${parsed.estabelecimento} | Code: ${tCode}`);

    return {
        status: "success",
        transaction_code: tCode,
        valor: parsed.valor,
        estabelecimento: parsed.estabelecimento,
        banco: parsed.banco,
    };
}

// ─── MAIN HANDLER ───
Deno.serve(async (req: Request) => {
    // CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    const url = new URL(req.url);

    try {
        // ════════════════════════════════════════════
        // 🆕 FLUXO GET — Simplificado para MacroDroid
        // URL: /inject-notification?t=TOKEN&n=TEXTO_DA_NOTIFICACAO
        // O MacroDroid só precisa de "Abrir URL" com essa URL.
        // ════════════════════════════════════════════
        if (req.method === "GET") {
            const token = url.searchParams.get("t");
            const notificationText = url.searchParams.get("n");

            if (!token || !notificationText) {
                return new Response(JSON.stringify({ error: "Parâmetros t e n são obrigatórios" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            console.log(`📲 [GET] Token: ${token.substring(0, 8)}... | Text: ${notificationText.substring(0, 60)}`);

            // Busca usuário pelo token
            const userLink = await findUserByToken(token);
            if (!userLink) {
                console.warn("❌ Invalid or unverified token:", token.substring(0, 8));
                return new Response(JSON.stringify({ error: "Token inválido" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const result = await processAndNotify(
                userLink.user_id,
                userLink.phone_number,
                notificationText,
                "macrodroid_get"
            );

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // ════════════════════════════════════════════
        // 📮 FLUXO POST — Legado (mantido por compatibilidade)
        // Body: { secret, phone, text, source }
        // ════════════════════════════════════════════
        if (req.method === "POST") {
            let body;
            const rawBody = await req.text();
            try {
                body = JSON.parse(rawBody);
            } catch (err) {
                console.error("❌ Error parsing JSON body. Raw content received:", rawBody);
                // Log even failed attempts to help identify the source
                await supabase.from("whatsapp_logs").insert({
                    phone_number: "unknown",
                    message_content: JSON.stringify({ raw_body: rawBody, error: "invalid_json", method: "POST" }),
                    message_type: "error_log",
                    processed: false,
                    processing_result: { error: String(err) }
                });

                return new Response(JSON.stringify({ 
                    error: "Invalid or empty JSON body", 
                    received: rawBody,
                    tip: "MacroDroid body must be valid JSON: {\"secret\":\"...\", \"phone\":\"...\", \"text\":\"...\"}" 
                }), { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }
            console.log("📲 [POST] Received:", JSON.stringify(body));

            // Autenticação por secret ou token
            const secret = body.secret || req.headers.get("x-saldin-secret");
            const token = body.token;

            let userId: string;
            let phoneToReply: string;

            if (token) {
                // Novo: auth por token
                const userLink = await findUserByToken(token);
                if (!userLink) {
                    return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });
                }
                userId = userLink.user_id;
                phoneToReply = userLink.phone_number;
            } else if (secret === INJECT_SECRET) {
                // Legacy: auth por secret + phone
                const { phone, text } = body;
                if (!phone || !text) {
                    return new Response(JSON.stringify({ error: "phone e text são obrigatórios" }), { status: 400 });
                }
                const userLink = await findUserByPhone(phone);
                if (!userLink) {
                    return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 });
                }
                userId = userLink.user_id;
                phoneToReply = userLink.phone_number;
            } else {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const text = body.text;
            if (!text) {
                return new Response(JSON.stringify({ error: "text é obrigatório" }), { status: 400 });
            }

            const result = await processAndNotify(userId, phoneToReply, text, body.source || "api_post");

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response("Method Not Allowed", { status: 405 });

    } catch (e) {
        console.error("❌ inject-notification fatal error:", e);
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
});

// ─── Helper: busca category_id por nome ───
async function getCategoryId(userId: string, name: string): Promise<string | null> {
    const { data } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", `%${name}%`)
        .eq("type", "expense")
        .limit(1)
        .maybeSingle();

    if (data) return data.id;

    const { data: fallback } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", "%outros%")
        .eq("type", "expense")
        .limit(1)
        .maybeSingle();

    return fallback?.id || null;
}
