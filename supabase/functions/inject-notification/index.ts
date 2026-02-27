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
// Cada banco tem um padrão específico de notificação.
// A ordem importa: mais específico primeiro.
const BANK_PATTERNS: { bank: string; regex: RegExp }[] = [
    // Nubank: "Compra aprovada de R$ 89,90 no MERCADO LIVRE"
    { bank: "Nubank", regex: /(?:compra|débito|debit).*?R\$\s*([\d.,]+).*?(?:em|no|na|at)\s+(.+?)(?:\.|$)/i },
    // Inter: "Compra aprovada R$ 89,90 - Mercado Livre"  
    { bank: "Inter", regex: /(?:compra|débito).*?R\$\s*([\d.,]+)\s*[-–]\s*(.+?)(?:\.|$)/i },
    // Itaú: "Compra Cartão R$ 89,90 MERCADO LIVRE"
    { bank: "Itaú", regex: /(?:compra|débito)\s+(?:cartão\s+)?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    // Bradesco: "Débito R$ 89,90 Mercado Livre"
    { bank: "Bradesco", regex: /débito\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    // C6: "C6 Bank: Compra de R$ 89,90 em Mercado Livre"
    { bank: "C6", regex: /C6\s*Bank.*?R\$\s*([\d.,]+)\s+(?:em\s+)?(.+?)(?:\.|$)/i },
    // Mercado Pago: "Você pagou R$ 89,90 para Mercado Livre"
    { bank: "Mercado Pago", regex: /(?:você pagou|pagamento).*?R\$\s*([\d.,]+)\s+(?:para\s+)?(.+?)(?:\.|$)/i },
    // Caixa via SMS: "Caixa Eco Fed: Compra R$ 89,90 MERCADO LIVRE"
    { bank: "Caixa", regex: /(?:caixa|cef).*?compra\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    // Santander: "Santander: Compra aprovada R$ 89,90 MERCADO LIVRE"
    { bank: "Santander", regex: /santander.*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    // Genérico: qualquer texto com R$ (fallback)
    { bank: "Banco", regex: /R\$\s*([\d.,]+).*?(?:em|no|na|em)\s+(.+?)(?:\.|$)/i },
];

// ─── Chaves de Autenticação ───
// A inject-notification usa uma chave secreta para evitar abusos.
// Configure INJECT_SECRET nos Supabase Secrets.
const INJECT_SECRET = Deno.env.get("INJECT_SECRET") || "saldin_inject_2026";

// ─── WhatsApp Send Helper ───
async function sendWhatsApp(to: string, text: string): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return;
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body: text },
            }),
        });
    } catch (e) {
        console.error("sendWhatsApp error:", e);
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

    for (const { bank, regex } of BANK_PATTERNS) {
        const match = cleanText.match(regex);
        if (match) {
            // Normaliza o valor: "1.234,56" → 1234.56
            const rawValue = match[1].replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(rawValue);

            if (isNaN(valor) || valor <= 0) continue;

            // Limpa o nome do estabelecimento
            const estabelecimento = match[2]
                ?.trim()
                .replace(/\*+/g, "") // remove asteriscos do Nubank
                .replace(/\s+/g, " ")
                .substring(0, 80) || "Compra";

            return { valor, estabelecimento, banco: bank };
        }
    }

    return null;
}

// ─── Normaliza número de telefone para E.164 ───
function normalizePhone(phone: string): string {
    // Remove tudo exceto dígitos
    const digits = phone.replace(/\D/g, "");
    // Se começar com 55 (Brasil), mantém
    if (digits.startsWith("55")) return digits;
    // Se tiver 10-11 dígitos, adiciona 55
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return digits;
}

// ─── MAIN HANDLER ───
Deno.serve(async (req: Request) => {
    // CORS para facilitar testes locais
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const body = await req.json();
        console.log("📲 [inject-notification] Received:", JSON.stringify(body));

        // ─── 1. Autenticação por chave secreta ───
        const secret = body.secret || req.headers.get("x-saldin-secret");
        if (secret !== INJECT_SECRET) {
            console.warn("⛔ Unauthorized inject attempt");
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // ─── 2. Extrai campos obrigatórios ───
        const { phone, text, source } = body;
        // phone: número do usuário (para buscar no DB e responder via WhatsApp)
        // text: texto bruto da notificação/SMS
        // source: "macrodroid" | "shortcuts_ios" | "manual"

        if (!phone || !text) {
            return new Response(JSON.stringify({ error: "phone e text são obrigatórios" }), { status: 400 });
        }

        const normalizedPhone = normalizePhone(phone);
        console.log(`📱 Phone: ${normalizedPhone} | Source: ${source || "unknown"}`);

        // ─── 3. Busca usuário no banco ───
        // Tenta variações do número (com e sem 9º dígito)
        const phoneVariations = [normalizedPhone];
        if (normalizedPhone.startsWith("55") && normalizedPhone.length === 13) {
            // Tem o 9: tenta sem
            const ddd = normalizedPhone.substring(2, 4);
            const num = normalizedPhone.substring(4);
            phoneVariations.push(`55${ddd}${num.substring(1)}`);
        } else if (normalizedPhone.startsWith("55") && normalizedPhone.length === 12) {
            // Sem o 9: tenta com
            const ddd = normalizedPhone.substring(2, 4);
            const num = normalizedPhone.substring(4);
            phoneVariations.push(`55${ddd}9${num}`);
        }

        const { data: userLink, error: userError } = await supabase
            .from("whatsapp_users")
            .select("user_id, phone_number, is_verified")
            .in("phone_number", phoneVariations)
            .eq("is_verified", true)
            .limit(1)
            .maybeSingle();

        if (userError || !userLink) {
            console.warn("❌ User not found for phone:", normalizedPhone);
            return new Response(JSON.stringify({ error: "Usuário não encontrado ou não verificado" }), { status: 404 });
        }

        const userId = userLink.user_id;
        const phoneToReply = userLink.phone_number; // Responde para o número exato do cadastro

        // ─── 4. Parseia o texto da notificação ───
        const parsed = parseNotificationText(text);

        if (!parsed) {
            // Se não conseguiu parsear (ex: notificação de aprovação de limite, não de gasto),
            // ignora silenciosamente sem responder para não poluir o WhatsApp.
            console.log("ℹ️ Notification not parseable as transaction. Ignoring silently.");
            return new Response(JSON.stringify({ status: "ignored", reason: "not_a_transaction" }), { status: 200 });
        }

        console.log(`💸 Parsed: R$ ${parsed.valor} em "${parsed.estabelecimento}" (${parsed.banco})`);

        // ─── 5. Usa a IA para análise complementar (categoria e método) ───
        const aiText = `Gastei R$ ${parsed.valor} em ${parsed.estabelecimento}`;
        let intent: any = null;
        try {
            intent = await analyzeText(aiText);
        } catch (e) {
            console.warn("AI analysis failed, using defaults:", e);
        }

        // ─── 6. Determina conta/cartão de destino ───
        const metodo = intent?.items?.[0]?.metodo_pagamento || "pix";
        const { id: targetAccountId, isCreditCard } = await getPreferredAccount(userId, metodo);

        // ─── 7. Registra a transação ───
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

        // ─── 8. Loga no banco para auditoria ───
        await supabase.from("whatsapp_logs").insert({
            phone_number: normalizedPhone,
            whatsapp_user_id: null,
            message_content: JSON.stringify({ text, source, parsed }),
            message_type: "auto_notification",
            processed: true,
            processing_result: { valor: parsed.valor, estabelecimento: parsed.estabelecimento, tCode },
        });

        // ─── 9. Monta resposta premium e envia no WhatsApp ───
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

        // Adiciona indicador de que foi auto-capturado da notificação
        const finalMsg = `🔔 *Auto-Captura Ativa*\n_Detectei uma compra via ${parsed.banco}_\n\n${premiumMsg}`;

        await sendInteractive(phoneToReply, finalMsg, [
            { id: `excluir_${tCode}`, title: "🗑️ Excluir" },
            { id: `editar_${tCode}`, title: "📝 Editar" },
        ]);

        console.log(`✅ Auto-registered: R$ ${parsed.valor} | ${parsed.estabelecimento} | Code: ${tCode}`);

        return new Response(
            JSON.stringify({
                status: "success",
                transaction_code: tCode,
                valor: parsed.valor,
                estabelecimento: parsed.estabelecimento,
                banco: parsed.banco,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
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

    // Fallback: "Outros"
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
