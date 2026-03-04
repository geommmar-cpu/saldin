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
const BANK_PATTERNS: { bank: string; regex: RegExp; swap?: boolean }[] = [
    // Padrões de COMPRA/DÉBITO (cartão)
    { bank: "Nubank", regex: /(?:compra|débito|debit).*?R\$\s*([\d.,]+).*?(?:em|no|na|at)\s+(.+?)(?:\.|$)/i },
    { bank: "Inter", regex: /(?:compra|débito).*?R\$\s*([\d.,]+)\s*[-–]\s*(.+?)(?:\.|$)/i },
    { bank: "Itaú", regex: /(?:compra|débito)\s+(?:cartão\s+)?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Bradesco", regex: /débito\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "C6", regex: /C6\s*Bank.*?R\$\s*([\d.,]+)\s+(?:em\s+)?(.+?)(?:\.|$)/i },
    { bank: "Mercado Pago", regex: /(?:você pagou|pagamento).*?R\$\s*([\d.,]+)\s+(?:para\s+)?(.+?)(?:\.|$)/i },
    { bank: "Caixa", regex: /(?:caixa|cef).*?compra\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Santander", regex: /santander.*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },

    // Padrões de PIX (enviado: valor vem primeiro)
    { bank: "Pix", regex: /pix\s+(?:enviado|realizado|feito|efetuado).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    // Pix recebido: nome vem primeiro, valor depois → swap=true
    { bank: "Pix", regex: /pix\s+(?:recebido|receber).*?(?:de|do\(a\)|do|da)\s+(.+?),?\s*(?:no\s+)?valor\s+(?:de\s+)?R\$\s*([\d.,]+)/i, swap: true },
    // Transferências
    { bank: "Pix", regex: /(?:transferência|transferencia)\s+(?:enviada|realizada|recebida).*?R\$\s*([\d.,]+).*?(?:para|de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i },

    // Padrão genérico (deve ser o último)
    { bank: "Banco", regex: /R\$\s*([\d.,]+).*?(?:em|no|na|para|de)\s+(.+?)(?:\.|,\s*$|$)/i },
];

// ─── Legacy: Chave secreta para POST antigo ───
const INJECT_SECRET = Deno.env.get("INJECT_SECRET") || "saldin_inject_2026";

// ─── WhatsApp Send Helpers ───
async function sendWhatsApp(to: string, text: string): Promise<{ ok: boolean; errorCode?: number }> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return { ok: false };
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body: text },
            }),
        });
        const data = await res.json();
        if (data.error) {
            console.error("sendWhatsApp error:", data.error.code, data.error.message);
            return { ok: false, errorCode: data.error.code };
        }
        return { ok: true };
    } catch (e) {
        console.error("sendWhatsApp error:", e);
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
function parseNotificationText(text: string): { valor: number; estabelecimento: string; banco: string } | null {
    const cleanText = text.trim();

    for (const { bank, regex, swap } of BANK_PATTERNS) {
        const match = cleanText.match(regex);
        if (match) {
            // swap=true: group(1)=nome, group(2)=valor (ex: Pix recebido)
            const rawValue = (swap ? match[2] : match[1]).replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(rawValue);
            if (isNaN(valor) || valor <= 0) continue;

            const rawEstab = swap ? match[1] : match[2];
            const estabelecimento = rawEstab
                ?.trim()
                .replace(/\*+/g, "")
                .replace(/\s+/g, " ")
                .substring(0, 80) || "Compra";

            return { valor, estabelecimento, banco: bank };
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
    const { data, error } = await supabase
        .from("whatsapp_users")
        .select("user_id, phone_number, is_verified, capture_token")
        .eq("capture_token", token)
        .eq("is_verified", true)
        .maybeSingle();

    if (error) {
        console.error("Token lookup error:", error);
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
    const parsed = parseNotificationText(text);

    if (!parsed) {
        console.log("ℹ️ Notification not parseable as transaction. Ignoring silently.");
        return { status: "ignored", reason: "not_a_transaction" };
    }

    console.log(`💸 Parsed: R$ ${parsed.valor} em "${parsed.estabelecimento}" (${parsed.banco})`);

    // IA para categoria
    const aiText = `Gastei R$ ${parsed.valor} em ${parsed.estabelecimento}`;
    let intent: any = null;
    try {
        intent = await analyzeText(aiText);
    } catch (e) {
        console.warn("AI analysis failed, using defaults:", e);
    }

    // Conta/cartão de destino
    const metodo = intent?.items?.[0]?.metodo_pagamento || "pix";
    const { id: targetAccountId, isCreditCard } = await getPreferredAccount(userId, metodo);

    // Registra transação
    const tCode = generateTransactionCode();
    const categoryId = intent?.items?.[0]?.categoria_sugerida
        ? await getCategoryId(userId, intent.items[0].categoria_sugerida)
        : null;

    const result = await processTransaction({
        userId,
        type: "expense",
        amount: parsed.valor,
        description: parsed.estabelecimento,
        categoryId: categoryId || undefined,
        bankAccountId: targetAccountId || undefined,
        transactionCode: tCode,
        isCreditCard,
    });

    // Log de auditoria
    await supabase.from("whatsapp_logs").insert({
        phone_number: phoneToReply,
        whatsapp_user_id: null,
        message_content: JSON.stringify({ text, source, parsed }),
        message_type: "auto_notification",
        processed: true,
        processing_result: { valor: parsed.valor, estabelecimento: parsed.estabelecimento, tCode },
    });

    // Monta resposta premium
    const alerts = await getImportantAlerts(userId);
    const premiumMsg = formatPremiumMessage(
        {
            id: result.id,
            description: parsed.estabelecimento,
            amount: parsed.valor,
            date: new Date().toISOString(),
            category: intent?.items?.[0]?.categoria_sugerida || "Compras",
            account_name: result.dest_name,
            type: "expense",
            transaction_code: tCode,
            account_balance: result.account_balance,
        },
        { new_balance: result.new_balance },
        alerts
    );

    const finalMsg = `🔔 *Auto-Captura Ativa*\n_Detectei uma compra via ${parsed.banco}_\n\n${premiumMsg}`;

    // Tenta enviar mensagem interativa (com botões)
    const msgResult = await sendWhatsApp(phoneToReply, finalMsg);

    if (!msgResult.ok && msgResult.errorCode === 131047) {
        // Janela de 24h expirada → tenta template
        console.info("⏰ 24h window expired, trying template fallback...");
        const categoria = intent?.items?.[0]?.categoria_sugerida || "Compras";
        await sendWhatsAppTemplate(phoneToReply, "auto_capture_confirmation", [
            String(parsed.valor).replace(".", ","),
            parsed.estabelecimento,
            categoria,
            tCode,
        ]);
    } else if (msgResult.ok) {
        // Mensagem de texto funcionou, agora envia os botões
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
            const body = await req.json();
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
