import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "../whatsapp-webhook/ai-service.ts";
import { processTransaction, getBalance, getImportantAlerts, getPreferredAccount } from "../whatsapp-webhook/financial-service.ts";
import { generateTransactionCode, formatPremiumMessage } from "../whatsapp-webhook/transactionCommandHandler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN");
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log(`🔑 Credential Check: ID starting with "${META_PHONE_NUMBER_ID?.substring(0, 4)}...", Token starting with "${META_ACCESS_TOKEN?.substring(0, 7)}..."`);

// ─── Tipos de Padrão de Notificação ───
type ParsedPatternType = 'normal' | 'withdrawal' | 'transfer';
type BankPattern = {
    bank: string;           // Banco REMETENTE (quem enviou a notificação)
    regex: RegExp;
    swap?: boolean;         // grupo(1)=descrição, grupo(2)=valor
    isIncome?: boolean;
    patternType?: ParsedPatternType; // 'withdrawal' | 'transfer' | 'normal'
};

// ─── Regex Patterns para os principais bancos brasileiros ───
const BANK_PATTERNS: BankPattern[] = [
    // ── SAQUES → vira transferência para "Dinheiro em Mãos" ──
    { bank: "Banco", regex: /saque\s*(?:24h|eletrônico|atm|caixa)?.*?R\$\s*([\d.,]+)/i, patternType: 'withdrawal' },

    // ── COMPRA/DÉBITO (Cartão) — GASTOS ──
    { bank: "Nubank",      regex: /nubank.*?(?:compra|débito|debit).*?R\$\s*([\d.,]+).*?(?:em|no|na|at)\s+(.+?)(?:\.|$)/i },
    { bank: "Inter",       regex: /inter.*?(?:compra|débito).*?R\$\s*([\d.,]+)\s*[-–]\s*(.+?)(?:\.|$)/i },
    { bank: "Itaú",        regex: /itaú.*?(?:compra|débito)\s+(?:cartão\s+)?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Bradesco",    regex: /bradesco.*?débito\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "C6",          regex: /C6\s*Bank.*?R\$\s*([\d.,]+)\s+(?:em\s+)?(.+?)(?:\.|$)/i },
    { bank: "Mercado Pago",regex: /(?:mercado pago|você pagou).*?R\$\s*([\d.,]+)\s+(?:para\s+)?(.+?)(?:\.|$)/i },
    { bank: "Santander",   regex: /santander.*?(?:compra|débito).*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Caixa",       regex: /(?:caixa|cef).*?(?:compra|pagamento).*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },

    // ── PIX RECEBIDO — RECEITA ──
    // Formato Caixa: "Pix recebido Fulano te enviou um Pix de R$ X"
    { bank: "Pix", regex: /pix\s+recebido\s+(.+?)\s+te\s+enviou.*?R\$\s*([\d.,]+)/i, swap: true, isIncome: true },
    // Formato Inter/Nubank: "Pix recebido - R$ X de Fulano"
    { bank: "Pix", regex: /pix\s+(?:recebido|receber|recebeu).*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    // Formato com valor antes: "De Nome, valor R$ X"
    { bank: "Pix", regex: /pix\s+(?:recebido|receber|recebeu).*?(?:de|do|da)\s+(.+?),?\s*(?:no\s+)?valor\s+(?:de\s+)?R\$\s*([\d.,]+)/i, swap: true, isIncome: true },
    { bank: "Transferência", regex: /(?:transferência|transferencia)\s+recebida.*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },

    // ── PIX ENVIADO ─ identifica destinatário corretamente ──
    // Formato Caixa: "Pix realizado R$ X para Fulano na sua conta final XXXX"
    { bank: "Caixa", regex: /pix\s+(?:realizado|enviado).*?R\$\s*([\d.,]+).*?para\s+(.+?)(?:\s+na\s+sua\s+conta|\.|,|$)/i },
    // Formato genérico
    { bank: "Pix", regex: /pix\s+(?:enviado|realizado|feito|efetuado|pago).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    { bank: "Transferência", regex: /(?:transferência|transferencia).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },

    // ── RECEITAS GENÉRICAS ──
    { bank: "Banco", regex: /(?:depósito|deposito|salário|salario|crédito|credito)\s+(?:em\s+conta\s+)?.*?R\$\s*([\d.,]+).*?(?:de|do|da|em)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Banco", regex: /(?:você\s+recebeu|recebeu|recebimento).*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },

    // ── PADRÃO GENÉRICO DE ÚLTIMA RESORT ──
    { bank: "Banco", regex: /R\$\s*([\d.,]+).*?(?:em|no|na|para|de)\s+(.+?)(?:\.|,\s*$|$)/i },
];

// Detecta o banco remetente a partir do nome do app / cabeçalho da notificação
function detectSenderBank(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('nubank'))   return 'Nubank';
    if (t.includes('inter'))    return 'Inter';
    if (t.includes('caixa') || t.includes('cef')) return 'Caixa';
    if (t.includes('itaú') || t.includes('itau')) return 'Itaú';
    if (t.includes('bradesco')) return 'Bradesco';
    if (t.includes('santander')) return 'Santander';
    if (t.includes('c6 bank') || t.includes('c6bank')) return 'C6';
    if (t.includes('mercado pago')) return 'Mercado Pago';
    if (t.includes('picpay'))   return 'PicPay';
    if (t.includes('neon'))     return 'Neon';
    if (t.includes('pagbank'))  return 'PagBank';
    if (t.includes('sicoob'))   return 'Sicoob';
    if (t.includes('sicredi'))  return 'Sicredi';
    if (t.includes('banco do brasil') || t.includes('bb ')) return 'BB';
    return 'Banco';
}

// ─── Legacy: Chave secreta para POST antigo ───
const INJECT_SECRET = Deno.env.get("INJECT_SECRET") || "saldin_inject_2026";

// ─── WhatsApp Send Helpers ───
function normalizeTo(phone: string): string {
    // Remove any non-digits
    let clean = phone.replace(/\D/g, "");
    
    // Se o número tem 12 dígitos (55DDXXXXXXXX), ALINHA com o webhook que funciona
    // Em muitos casos de contas Meta no Brasil, o 13º dígito (o 9 extra) é necessário ou bloqueado.
    // O webhook que funciona hoje ADICIONA o 9 se tiver 12.
    if (clean.startsWith("55") && clean.length === 12) {
        console.log(`🔧 Normalizing Brazil number (12->13): ${clean} -> ${clean.substring(0, 4)}9${clean.substring(4)}`);
        return clean.substring(0, 4) + "9" + clean.substring(4);
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
    
    const cleanTo = normalizeTo(to);
    const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;

    const sendRequest = async (recipient: string) => {
        // Limpeza de parâmetros para evitar rejeição da Meta por caracteres suspeitos ou excesso de tamanho
        const sanitizedParams = params.map(p => {
            let clean = String(p || "")
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
                .replace(/[^\w\s\d,.]/g, "") // Remove tudo que não for letra, espaço, número, vírgula ou ponto
                .substring(0, 60) // Limite de 60 caracteres por variável
                .trim();
            return clean;
        });

        console.info(`📤 Sending Template to ${recipient}:`, JSON.stringify(sanitizedParams));

        const payload = {
            messaging_product: "whatsapp",
            to: recipient,
            type: "template",
            template: {
                name: templateName,
                language: { code: "pt_BR" },
                components: [{
                    type: "body",
                    parameters: sanitizedParams.map(p => ({ type: "text", text: p })),
                }],
            },
        };
        
        const res = await fetch(url, {
            method: "POST",
            headers: { 
                Authorization: `Bearer ${META_ACCESS_TOKEN}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(payload),
        });
        return await res.json();
    };

    try {
        let data = await sendRequest(cleanTo);

        // Se falhar com #100, tenta a variação do número (com/sem o 9)
        if (data.error && data.error.code === 100) {
            console.warn(`⚠️ Template rejected for ${cleanTo}. Trying variation...`);
            let variation = cleanTo;
            if (cleanTo.startsWith("55") && cleanTo.length === 12) {
                variation = cleanTo.substring(0, 4) + "9" + cleanTo.substring(4);
            } else if (cleanTo.startsWith("55") && cleanTo.length === 13) {
                variation = cleanTo.substring(0, 4) + cleanTo.substring(5);
            }

            if (variation !== cleanTo) {
                console.log(`🔄 Retrying template with variation: ${variation}`);
                data = await sendRequest(variation);
            }
        }

        if (data.error) {
            console.error(`❌ Template '${templateName}' failure:`, JSON.stringify(data.error, null, 2));
            return false;
        }
        
        console.info(`✅ Template '${templateName}' sent to ${cleanTo}`);
        return true;
    } catch (e) {
        console.error("sendWhatsAppTemplate exception:", e);
        return false;
    }
}

async function sendInteractive(to: string, text: string, buttons: { id: string; title: string }[]): Promise<{ ok: boolean; errorCode?: number }> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return { ok: false };
    const cleanTo = normalizeTo(to);
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text },
                    action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
                },
            }),
        });
        const data = await res.json();
        
        if (data.error && data.error.code === 100) {
            console.warn(`⚠️ Meta rejected ${cleanTo}. Trying variation...`);
            let variation = cleanTo;
            if (cleanTo.startsWith("55") && cleanTo.length === 12) {
                variation = cleanTo.substring(0, 4) + "9" + cleanTo.substring(4);
            } else if (cleanTo.startsWith("55") && cleanTo.length === 13) {
                variation = cleanTo.substring(0, 4) + cleanTo.substring(5);
            }

            if (variation !== cleanTo) {
                const res2 = await fetch(url, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                         messaging_product: "whatsapp",
                         to: variation,
                         type: "interactive",
                         interactive: { type: "button", body: { text }, action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) } }
                    })
                });
                const data2 = await res2.json();
                if (data2.error) return { ok: false, errorCode: data2.error.code };
                return { ok: true };
            }
        }

        if (data.error) return { ok: false, errorCode: data.error.code };
        return { ok: true };
    } catch (e) {
        console.error("sendInteractive error:", e);
        return { ok: false };
    }
}

// ─── Parser de Texto de Notificação ───
type NotificationParsed = {
    valor: number;
    estabelecimento: string;
    banco: string;          // Banco remetente (ex: Caixa, Inter)
    isIncome: boolean;
    isWithdrawal: boolean;  // É um saque?
    isTransfer: boolean;    // É transferência entre contas próprias (detectado depois)?
};

function parseNotificationText(text: string): NotificationParsed | null {
    const cleanText = text.trim();
    // Detecta o banco remetente pelo conteúdo geral do texto (nome do app, etc.)
    const senderBank = detectSenderBank(cleanText);

    for (const { regex, swap, isIncome, patternType } of BANK_PATTERNS) {
        const match = cleanText.match(regex);
        if (!match) continue;

        const isWithdrawal = patternType === 'withdrawal';

        if (isWithdrawal) {
            // Saque: grupo(1)=valor, sem descrição
            const rawValue = match[1].replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(rawValue);
            if (isNaN(valor) || valor <= 0) continue;
            return {
                valor,
                estabelecimento: "Saque em Espécie",
                banco: senderBank,
                isIncome: false,
                isWithdrawal: true,
                isTransfer: false,
            };
        }

        // Pix/Transferência normal: 2 grupos
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

        return {
            valor,
            estabelecimento,
            banco: senderBank, // <-- Sempre usa o banco detectado no texto, não o padrão generic
            isIncome: !!isIncome,
            isWithdrawal: false,
            isTransfer: false,
        };
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

// ─── Mostra "digitando" no WhatsApp ───
async function sendTypingIndicator(to: string): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return;
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: normalizeTo(to),
                type: "sender_action",
                sender_action: "typing_on"
            })
        });
    } catch (e) {
        console.error("Error sending typing indicator:", e);
    }
}

// ─── Verifica se o destinatário é uma conta do próprio usuário ───
async function findOwnAccount(userId: string, recipientName: string): Promise<{ id: string; bank_name: string } | null> {
    if (!recipientName || recipientName.length < 3) return null;
    const { data } = await supabase
        .from("bank_accounts")
        .select("id, bank_name")
        .eq("user_id", userId)
        .eq("active", true)
        .ilike("bank_name", `%${recipientName.substring(0, 10)}%`)
        .maybeSingle();
    return data || null;
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

    // Mostra o "Digitando..." no celular do usuário agora que sabemos que é válido e a IA vai pensar
    sendTypingIndicator(phoneToReply).catch(e => console.error(e));

    // ─── CASO 1: SAQUE ─ Cria transferência da conta bancária para Dinheiro em Mãos ───
    if (parsed.isWithdrawal) {
        console.log(`💵 SAQUE detectado: R$ ${parsed.valor} em ${parsed.banco}`);

        // Acha a conta de origem (banco que gerou o saque)
        const { data: sourceAcc } = await supabase
            .from("bank_accounts")
            .select("id, bank_name")
            .eq("user_id", userId)
            .eq("active", true)
            .ilike("bank_name", `%${parsed.banco}%`)
            .maybeSingle();

        // Acha a conta "Dinheiro em Mãos" (ou similar)
        const { data: cashAcc } = await supabase
            .from("bank_accounts")
            .select("id, bank_name")
            .eq("user_id", userId)
            .eq("active", true)
            .or("bank_name.ilike.%dinheiro%,bank_name.ilike.%mãos%,bank_name.ilike.%maos%,bank_name.ilike.%especie%,bank_name.ilike.%espécie%,bank_name.ilike.%cash%")
            .maybeSingle();

        const tCode = generateTransactionCode();
        const categoryId = await getCategoryId(userId, "Saques", "expense");

        // Saída do banco
        const expenseResult = await processTransaction({
            userId,
            type: "expense",
            amount: parsed.valor,
            description: `Saque - ${parsed.banco}`,
            categoryId: categoryId || undefined,
            bankAccountId: sourceAcc?.id || undefined,
            transactionCode: tCode,
            isCreditCard: false,
        });

        // Entrada no Dinheiro em Mãos
        if (cashAcc) {
            const tCode2 = generateTransactionCode();
            const cashCatId = await getCategoryId(userId, "Saques", "income");
            await processTransaction({
                userId,
                type: "income",
                amount: parsed.valor,
                description: `Saque recebido - ${parsed.banco}`,
                categoryId: cashCatId || undefined,
                bankAccountId: cashAcc.id,
                transactionCode: tCode2,
                isCreditCard: false,
            });
        }

        const alerts = await getImportantAlerts(userId);
        const premiumMsg = formatPremiumMessage({
            id: expenseResult.id,
            description: parsed.estabelecimento,
            amount: parsed.valor,
            date: new Date().toISOString(),
            category: "Saque",
            account_name: sourceAcc?.bank_name || parsed.banco,
            type: "expense",
            transaction_code: tCode,
            account_balance: expenseResult.account_balance,
        }, { new_balance: expenseResult.new_balance }, alerts);

        const finalMsg = `🏧 *Auto-Captura Ativa*\n_Saque da sua conta ${sourceAcc?.bank_name || parsed.banco} → ${cashAcc?.bank_name || "Dinheiro em Mãos"}_\n\n${premiumMsg}`;
        await sendInteractive(phoneToReply, finalMsg, [
            { id: `excluir_${tCode}`, title: "🗑️ Excluir" },
            { id: `editar_${tCode}`, title: "📝 Editar" },
        ]);
        console.log(`✅ Saque registrado: R$ ${parsed.valor} | Code: ${tCode}`);
        return { status: "success", transaction_code: tCode };
    }

    // ─── CASO 2: Detecta se é transferência entre contas próprias ───
    if (!parsed.isIncome) {
        const ownAcc = await findOwnAccount(userId, parsed.estabelecimento);
        if (ownAcc) {
            console.log(`🔄 TRANSFERÊNCIA PRÓPRIA detectada: R$ ${parsed.valor} → ${ownAcc.bank_name}`);
            parsed.isTransfer = true;

            // Acha a conta de origem pelo banco remetente
            const { data: sourceAcc } = await supabase
                .from("bank_accounts")
                .select("id, bank_name")
                .eq("user_id", userId)
                .eq("active", true)
                .ilike("bank_name", `%${parsed.banco}%`)
                .maybeSingle();

            const tCodeOut = generateTransactionCode();
            const tCodeIn = generateTransactionCode();
            const catTransfId = await getCategoryId(userId, "Transferências", "expense");
            const catTransfIncId = await getCategoryId(userId, "Transferências", "income");

            // Saída da conta de origem
            const expResult = await processTransaction({
                userId, type: "expense", amount: parsed.valor,
                description: `Transferência para ${ownAcc.bank_name}`,
                categoryId: catTransfId || undefined,
                bankAccountId: sourceAcc?.id || undefined,
                transactionCode: tCodeOut, isCreditCard: false,
            });

            // Entrada na conta destino
            await processTransaction({
                userId, type: "income", amount: parsed.valor,
                description: `Transferência de ${sourceAcc?.bank_name || parsed.banco}`,
                categoryId: catTransfIncId || undefined,
                bankAccountId: ownAcc.id,
                transactionCode: tCodeIn, isCreditCard: false,
            });

            const alerts = await getImportantAlerts(userId);
            const premiumMsg = formatPremiumMessage({
                id: expResult.id,
                description: `${sourceAcc?.bank_name || parsed.banco} → ${ownAcc.bank_name}`,
                amount: parsed.valor, date: new Date().toISOString(),
                category: "Transferência Interna", account_name: ownAcc.bank_name,
                type: "expense", transaction_code: tCodeOut,
                account_balance: expResult.account_balance,
            }, { new_balance: expResult.new_balance }, alerts);

            const finalMsg = `🔄 *Auto-Captura Ativa*\n_Transferência entre suas contas_\n\n${premiumMsg}`;
            await sendInteractive(phoneToReply, finalMsg, [
                { id: `excluir_${tCodeOut}`, title: "🗑️ Excluir" },
            ]);
            console.log(`✅ Transferência interna registrada: R$ ${parsed.valor}`);
            return { status: "success", transaction_code: tCodeOut };
        }
    }

    // ─── CASO 3: Transação Normal (Receita ou Gasto) ───
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

    // Conta/cartão de destino — tenta identificar pelo banco remetente
    const metodo = intent?.items?.[0]?.metodo_pagamento || parsed.banco.toLowerCase();
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
        isCreditCard: isIncome ? false : isCreditCard,
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

    console.log(`📤 Enviando WhatsApp para ${phoneToReply.substring(0, 6)}...`);
    const msgResult = await sendInteractive(phoneToReply, finalMsg, [
        { id: `excluir_${tCode}`, title: "🗑️ Excluir" },
        { id: `editar_${tCode}`, title: "📝 Editar" },
    ]);

    if (!msgResult.ok && (msgResult.errorCode === 131047 || msgResult.errorCode === 100)) {
        console.info("⏰ 24h window expired or Error 100, trying template fallback...");
        const categoria = intent?.items?.[0]?.categoria_sugerida || defaultCategory;
        const formattedAmount = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parsed.valor);
        const templateSent = await sendWhatsAppTemplate(phoneToReply, "registro_despesa", [
            formattedAmount, parsed.estabelecimento, categoria, tCode,
        ]);
        if (!templateSent) {
            console.error("❌ Template fallback also failed! Check if template 'registro_despesa' is approved in Meta.");
        }
    } else if (!msgResult.ok) {
        console.error(`❌ WhatsApp send failed. ErrorCode: ${msgResult.errorCode || 'unknown'}.`);
    } else {
        console.log(`✅ WhatsApp Interactive sent to ${phoneToReply.substring(0, 6)}...`);
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
    
    // Log de conferência para bater com o painel da Meta
    console.log(`🔑 Using META_PHONE_NUMBER_ID: ${META_PHONE_NUMBER_ID?.substring(0, 5)}... | Token starts with: ${META_ACCESS_TOKEN?.substring(0, 7)}...`);

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
async function getCategoryId(userId: string, name: string, type: "income" | "expense" = "expense"): Promise<string | null> {
    const { data } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", `%${name}%`)
        .eq("type", type)
        .limit(1)
        .maybeSingle();

    if (data) return data.id;

    const { data: fallback } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", "%outros%")
        .eq("type", type)
        .limit(1)
        .maybeSingle();

    return fallback?.id || null;
}
