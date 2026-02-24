
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "./ai-service.ts";
import { processImage } from "./image-service.ts";
import { transcribeAudio } from "./audio-service.ts";
import { processTransaction, getBalance, getLastTransactions, getPreferredAccount } from "./financial-service.ts";
import { generateTransactionCode, formatPremiumMessage, handleExcluirCommand, handleEditarCommand, processEditStep } from "./transactionCommandHandler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── META API HELPERS ───

function normalizeTo(phone: string): string {
    // Handling Brazil 9th digit for Meta Test Accounts
    // If it's 55 + DDD (2) + 8 digits, add the '9'
    if (phone.startsWith("55") && phone.length === 12) {
        console.log(`🔧 Normalizing Brazil number: ${phone} -> ${phone.substring(0, 4)}9${phone.substring(4)}`);
        return phone.substring(0, 4) + "9" + phone.substring(4);
    }
    return phone;
}

async function sendWhatsApp(to: string, text: string): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
        console.error("❌ Missing META credentials");
        return;
    }

    const normalizedToValue = normalizeTo(to);
    console.log(`📤 [v22.0] Sending Text to ${normalizedToValue}...`);
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: normalizedToValue,
                type: "text",
                text: { body: text }
            })
        });
        const data = await resp.json();
        console.log(`✅ Response for ${normalizedToValue}:`, JSON.stringify(data));
        if (data.error) console.error("❌ Meta API Error:", data.error);
    } catch (e) { console.error(`❌ Failed:`, e); }
}

async function sendWhatsAppInteractive(to: string, text: string, buttons: { id: string, title: string }[]): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return;
    const normalizedToValue = normalizeTo(to);

    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: normalizedToValue,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text },
                    action: {
                        buttons: buttons.map(b => ({
                            type: "reply",
                            reply: { id: b.id, title: b.title }
                        }))
                    }
                }
            })
        });
        const data = await resp.json();
        console.log(`✅ Interactive Response:`, JSON.stringify(data));
    } catch (e) { console.error(`❌ Interactive Failed:`, e); }
}

async function sendWhatsAppTemplate(to: string, templateName: string = "hello_world"): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
        console.error("❌ Missing META credentials");
        return;
    }

    const normalizedToValue = normalizeTo(to);
    console.log(`📤 [v22.0] Sending Template to ${normalizedToValue}...`);
    try {
        const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${META_ACCESS_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: normalizedToValue,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: "en_US" }
                }
            })
        });
        const data = await resp.json();
        console.log(`✅ Template Response for ${normalizedToValue}:`, JSON.stringify(data));
    } catch (e) { console.error(`❌ Failed:`, e); }
}

async function markMessageAsRead(messageId: string): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) return;
    try {
        const url = `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`;
        await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                status: "read",
                message_id: messageId
            })
        });
    } catch (e) { console.error("Error marking read:", e); }
}

async function downloadMedia(mediaId: string): Promise<ArrayBuffer | null> {
    try {
        // 1. Get Media URL
        const urlRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: { "Authorization": `Bearer ${META_ACCESS_TOKEN}` }
        });
        if (!urlRes.ok) return null;
        const urlData = await urlRes.json();
        const mediaUrl = urlData.url;

        // 2. Download Binary
        const mediaRes = await fetch(mediaUrl, {
            headers: { "Authorization": `Bearer ${META_ACCESS_TOKEN}` }
        });
        if (!mediaRes.ok) return null;
        return await mediaRes.arrayBuffer();

    } catch (e) {
        console.error("Error downloading media:", e);
        return null;
    }
}

// ─── UTILS ───

async function getCategoryId(userId: string, categoryName: string, type: "income" | "expense"): Promise<string | null> {
    const { data } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", categoryName)
        .eq("type", type)
        .single();

    if (data) return data.id;

    // Fallback: Busca categoria 'Outros'
    const { data: fallback } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", "%outros%")
        .eq("type", type)
        .limit(1)
        .single();

    return fallback?.id || null;
}

// ─── MAIN HANDLER ───

Deno.serve(async (req: Request) => {
    const startTime = Date.now();
    let logId: string | null = null;

    try {
        const url = new URL(req.url);

        // 1. GET Verification (Meta Handshake)
        if (req.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");
            const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "saldin123";

            if (mode === "subscribe" && token === VERIFY_TOKEN) {
                console.log("✅ Webhook verified!");
                return new Response(challenge, { status: 200 });
            }
            return new Response("Forbidden", { status: 403 });
        }

        // 2. POST Handling (Messages)
        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

        const payload = await req.json();
        console.log("📥 New Payload Received:", JSON.stringify(payload));

        // 1. Meta API Extraction (Strict)
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) {
            if (value?.statuses?.[0]) {
                const status = value.statuses[0];
                if (status.status === "failed") {
                    console.error(`❌ Meta Delivery FAILED for ${status.recipient_id}:`, JSON.stringify(status.errors || status));
                } else {
                    console.log(`ℹ️ Status Update: ${status.status} for ${status.recipient_id}`);
                }
                return new Response("Status update acknowledged", { status: 200 });
            }
            return new Response("No message to process", { status: 200 });
        }

        const remoteJid = message.from;
        const messageId = message.id;
        const messageType = message.type;
        const contactName = value?.contacts?.[0]?.profile?.name || "Usuário";

        console.log(`🚀 [META] Msg from ${remoteJid} (${contactName}) - Type: ${messageType}`);

        // Mark as read (Non-blocking to avoid timeouts)
        markMessageAsRead(messageId).catch(e => console.error("Read Mark Error:", e));

        // 2. User Lookup (Handling Brazil 9th digit variations)
        let variations = [remoteJid];
        if (remoteJid.startsWith("55") && remoteJid.length >= 10) {
            const ddd = remoteJid.substring(2, 4);
            const body = remoteJid.substring(4);
            if (body.length === 9) variations.push("55" + ddd + body.substring(1));
            else if (body.length === 8) variations.push("55" + ddd + "9" + body);
        }

        console.log("🔍 Looking for user variations:", variations);

        const { data: userLink, error: userError } = await supabaseAdmin
            .from("whatsapp_users")
            .select("user_id, is_verified, phone_number, id")
            .in("phone_number", variations)
            .eq("is_verified", true)
            .limit(1)
            .maybeSingle();

        if (userError) console.error("❌ DB User Lookup Error:", userError);

        // 3. Log incoming message
        const { data: logData, error: logError } = await supabaseAdmin
            .from("whatsapp_logs")
            .insert({
                phone_number: remoteJid,
                whatsapp_user_id: userLink?.id || null,
                message_content: JSON.stringify(message),
                message_type: messageType,
                processed: false,
                message_id: messageId
            })
            .select()
            .single();

        if (logError && logError.code === "23505") {
            return new Response("Duplicate", { status: 200 });
        }
        if (logData) logId = logData.id;

        if (userError || !userLink) {
            console.warn("❌ Unverified user:", remoteJid);
            if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Unverified" }).eq("id", logId);
            await sendWhatsApp(remoteJid, "❌ Olá! Este número não está vinculado a uma conta Saldin. Ative o WhatsApp Agent nas configurações do aplicativo.");
            return new Response("Unauthorized", { status: 200 });
        }

        const userId = userLink.user_id;
        const phoneToSend = remoteJid; // IMPORTANTE: Responder EXATAMENTE para o número de onde veio (remoteJid), não variações.

        console.log(`🎯 Target phone for reply: ${phoneToSend}`);

        // 3. Content Extraction
        let textToAnalyze = "";
        let intent: any = null;

        if (messageType === "text") {
            textToAnalyze = message.text?.body || "";
        }
        else if (messageType === "audio") {
            const mediaId = message.audio?.id;
            if (mediaId) {
                const buffer = await downloadMedia(mediaId);
                if (buffer) {
                    try {
                        textToAnalyze = await transcribeAudio(buffer, message.audio?.mime_type);
                    } catch (err) {
                        console.error("Transcription error:", err);
                        await sendWhatsApp(phoneToSend, "❌ Erro ao processar o áudio.");
                        return new Response("Audio Error", { status: 200 });
                    }
                }
            }
        }
        else if (messageType === "image") {
            const mediaId = message.image?.id;
            if (mediaId) {
                const buffer = await downloadMedia(mediaId);
                if (buffer) {
                    try {
                        intent = await processImage(buffer);
                    } catch (err) {
                        console.error("Vision error:", err);
                        await sendWhatsApp(phoneToSend, "❌ Erro ao ler a imagem do comprovante.");
                        return new Response("Vision Error", { status: 200 });
                    }
                }
            }
        }
        else if (messageType === "interactive") {
            const interactive = message.interactive;
            if (interactive?.type === "button_reply") {
                const replyId = interactive.button_reply?.id; // Ex: "excluir_A5H2"
                textToAnalyze = replyId.replace("_", " "); // -> "excluir A5H2"
                console.log(`🔘 Button Clicked: ${replyId} -> ${textToAnalyze}`);
            }
        }

        // 4. Command & Edit Flow
        if (textToAnalyze) {
            const cleanText = textToAnalyze.trim();
            const normalizedCmd = cleanText.toLowerCase().replace(/[^\w\s]/gi, ''); // Remove emojis/pontuação

            // C. FLOW DE EDIÇÃO (MÁXIMA PRIORIDADE SE JÁ EXISTIR UM ESTADO)
            const editResult = await processEditStep(userId, cleanText);
            if (editResult.success) {
                await sendWhatsApp(phoneToSend, editResult.message);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Edit Step OK", { status: 200 });
            }

            // A. TESTE DE TEMPLATE (Prioridade Máxima)
            if (normalizedCmd === 'template' || normalizedCmd === 'teste template') {
                console.log("🧪 Template test triggered for:", phoneToSend);
                await sendWhatsAppTemplate(phoneToSend);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Template Test OK", { status: 200 });
            }

            // A.1 TESTE MANUAL (Para o comando que você me pediu agora)
            if (normalizedCmd === 'teste template agora' || normalizedCmd === 'enviar template') {
                console.log("🧪 Manual Template Test for:", phoneToSend);
                await sendWhatsAppTemplate(phoneToSend, "hello_world");
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Manual Template OK", { status: 200 });
            }

            // B. SAUDAÇÕES E AJUDA (Prioridade Alta)
            const greetings = ['oi', 'ola', 'olá', 'teste', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello', 'oie'];
            const helpCommands = ['ajuda', 'ajuda', 'comando', 'comandos', 'help', '/help', 'como usar', 'o que voce faz'];

            if (greetings.includes(normalizedCmd) || greetings.some(g => normalizedCmd.startsWith(g + " "))) {
                console.log("👋 Greeting detected.");
                await sendWhatsApp(phoneToSend, "Olá! 👋 Sou o assistente do Saldin. \nComo posso ajudar? Você pode registrar um gasto (ex: 'Almoço 35.00'), ou pedir seu 'saldo' ou 'extrato'. \n\nPara ver a lista completa de comandos, digite *AJUDA*.");
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Greeting OK", { status: 200 });
            }

            if (helpCommands.includes(normalizedCmd)) {
                console.log("❓ Help command detected.");
                const helpMsg = `🤖 *SALDIN - GUIA RÁPIDO*\n\n` +
                    `✍️ *COMO REGISTRAR*\n` +
                    `Basta digitar o valor e a descrição. Exemplos:\n` +
                    `• \`50 cafezinho\`\n` +
                    `• \`120.50 mercado no pix\`\n` +
                    `• \`Recebi 2000 do freela\`\n\n` +
                    `🎙️ *ÁUDIO E FOTO*\n` +
                    `Pode mandar áudio descrevendo o gasto ou foto de comprovante/cupom fiscal. Eu leio tudo! 📸\n\n` +
                    `📊 *CONSULTAS*\n` +
                    `• *Saldo*: Veja seu Saldo Livre atual.\n` +
                    `• *Extrato*: Veja as últimas 6 movimentações.\n\n` +
                    `⚙️ *GERENCIAR*\n` +
                    `• *Editar [ID]*: Altera valor ou categoria.\n` +
                    `• *Excluir [ID]*: Remove o registro.\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `_Saldin • Controle total. Zero planilhas._ 🚀`;

                await sendWhatsApp(phoneToSend, helpMsg);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Help OK", { status: 200 });
            }

            // 3. Normal Commands (Delete, Edit, Saldo, Extrato)
            const deleteMatch = cleanText.match(/(?:excluir|deletar|remover)(?:\s+)?([A-Z2-9]{4})?/i);
            if (deleteMatch && (deleteMatch[1] || cleanText.toLowerCase().trim() === 'excluir')) {
                const code = deleteMatch[1]?.toUpperCase().trim();
                if (!code) {
                    await sendWhatsApp(phoneToSend, "🤔 Qual transação você deseja excluir? Por favor, use o formato: *excluir [ID]* (ex: _excluir A1B2_).");
                    return new Response("Delete No ID", { status: 200 });
                }
                const res = await handleExcluirCommand(userId, code);
                await sendWhatsApp(phoneToSend, res.message);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Delete", { status: 200 });
            }

            const editMatch = cleanText.match(/(?:editar|alterar|mudar)(?:\s+)?([A-Z2-9]{4})?/i);
            if (editMatch && (editMatch[1] || cleanText.toLowerCase().trim() === 'editar')) {
                const code = editMatch[1]?.toUpperCase().trim();
                if (!code) {
                    await sendWhatsApp(phoneToSend, "🤔 Qual transação você deseja editar? Por favor, use o formato: *editar [ID]* (ex: _editar A1B2_).");
                    return new Response("Edit No ID", { status: 200 });
                }
                const res = await handleEditarCommand(userId, code);
                await sendWhatsApp(phoneToSend, res.message);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Edit", { status: 200 });
            }

            if (normalizedCmd === 'saldo' || normalizedCmd === '/saldo') {
                const balanceLivre = await getBalance(userId);
                const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceLivre);
                const msg = `💰 *SEU SALDO DISPONÍVEL*\n━━━━━━━━━━━━━━━━━━━━\n*${formatted}*\n━━━━━━━━━━━━━━━━━━━━\n\n_Este é o seu *Saldo Livre*, subtraindo compromissos e contas pendentes._ ✨`;
                await sendWhatsApp(phoneToSend, msg);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Saldo", { status: 200 });
            }

            if (normalizedCmd === 'extrato' || normalizedCmd === '/extrato') {
                await sendExtrato(userId, phoneToSend);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Extrato", { status: 200 });
            }
        }

        // 5. AI Analysis
        if (textToAnalyze && !intent) {
            console.log("🤖 Analyzing:", textToAnalyze);
            intent = await analyzeText(textToAnalyze);
            console.log("📊 Result:", intent);
        }

        if (logId && intent) {
            await supabaseAdmin.from("whatsapp_logs").update({ processing_result: intent, processed: intent.status === "ok" }).eq("id", logId);
        }

        if (!intent || intent.tipo === 'duvida') {
            if (textToAnalyze) {
                await sendWhatsApp(phoneToSend, "🤔 Não consegui identificar a operação. Se for um registro, use o formato: 'Valor Descrição' (ex: '50 cafezinho').");
            }
            return new Response("Ok", { status: 200 });
        }

        // 6. Execute Intent
        if (intent.status === "incompleto") {
            await sendWhatsApp(phoneToSend, "🤔 Pode me dar mais detalhes? Preciso do *valor*, da *descrição* e de *como você pagou* (ex: pix, débito, crédito ou dinheiro).");
            return new Response("Incomplete", { status: 200 });
        }

        if (intent.tipo === 'consulta_saldo') {
            const balance = await getBalance(userId);
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);
            await sendWhatsApp(phoneToSend, `💰 Seu saldo atual é: *${formatted}*`);
            return new Response("OK", { status: 200 });
        }

        if (intent.tipo === 'consulta_extrato') {
            await sendExtrato(userId, phoneToSend);
            return new Response("OK", { status: 200 });
        }

        // 7. MULTIPLE TRANSACTIONS PROCESSING
        if (intent.tipo === 'transacao' || (intent.items && intent.items.length > 0)) {
            const isSingle = intent.items.length === 1;
            let summaryMsg = isSingle ? "" : "✅ *RESUMO DAS OPERAÇÕES*\n━━━━━━━━━━━━━━━━━━━━\n\n";
            let totalProcessed = 0;
            let lastTCode = "";

            for (const item of intent.items) {
                try {
                    const categoryId = await getCategoryId(userId, item.categoria_sugerida, item.tipo === "receita" ? "income" : "expense");
                    const { id: targetAccountId, isCreditCard } = await getPreferredAccount(userId, item.metodo_pagamento);
                    const tCode = generateTransactionCode();
                    lastTCode = tCode;

                    await processTransaction({
                        userId,
                        type: item.tipo === "receita" ? "income" : "expense",
                        amount: item.valor,
                        description: item.descricao,
                        categoryId: categoryId || undefined,
                        bankAccountId: targetAccountId || undefined,
                        transactionCode: tCode,
                        isCreditCard: isCreditCard
                    });

                    const valStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor);
                    const icon = item.tipo === 'receita' ? '💰' : '💸';

                    if (isSingle) {
                        const balance = await getBalance(userId);
                        const balStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);

                        summaryMsg = `${icon} *${item.tipo === 'receita' ? 'RECEITA REGISTRADA' : 'GASTO CONFIRMADO'}*\n` +
                            `━━━━━━━━━━━━━━━━━━━━\n\n` +
                            `📝 *${item.descricao}*\n` +
                            `💵 *${valStr}*\n\n` +
                            `📂 Categoria: _${item.categoria_sugerida || 'Geral'}_\n` +
                            `🔑 ID: \`${tCode}\`\n\n` +
                            `━━━━━━━━━━━━━━━━━━━━\n` +
                            `📊 *SALDO:* ${balStr}`;
                    } else {
                        summaryMsg += `${icon} *${item.descricao}*\n   Valor: *${valStr}*\n   ID: \`${tCode}\`\n\n`;
                    }
                    totalProcessed++;
                } catch (err) {
                    console.error(`❌ Item Failed: ${item.descricao}`, err);
                }
            }

            if (totalProcessed > 0) {
                if (isSingle) {
                    await sendWhatsAppInteractive(phoneToSend, summaryMsg, [
                        { id: `excluir_${lastTCode}`, title: "🗑️ Excluir" },
                        { id: `editar_${lastTCode}`, title: "📝 Editar" }
                    ]);
                } else {
                    const balance = await getBalance(userId);
                    const balStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);
                    summaryMsg += "━━━━━━━━━━━━━━━━━━━━\n";
                    summaryMsg += `📊 *SALDO TOTAL:* ${balStr}\n\n`;
                    summaryMsg += `_Para excluir, use: excluir ID_`;
                    await sendWhatsApp(phoneToSend, summaryMsg);
                }
            } else {
                // If it failed because of a specific reason, we might want to tell the user
                await sendWhatsApp(phoneToSend, "❌ Não consegui processar seu pedido. Verifique se você possui contas/cartões cadastrados ou se o valor está correto.");
            }

            return new Response("Multi-Success", { status: 200 });
        }

        return new Response("No Action", { status: 200 });

    } catch (e) {
        console.error("Fatal Error:", e);
        if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: String(e) }).eq("id", logId);
        return new Response("Internal Error", { status: 500 });
    }
});


async function sendExtrato(userId: string, phone: string) {
    try {
        const queryLimit = 10;
        const { data: exps } = await supabaseAdmin.from('expenses').select('amount, description, date, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(queryLimit);
        const { data: incs } = await supabaseAdmin.from('incomes').select('amount, description, date, type, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(queryLimit);
        const { data: ccs } = await supabaseAdmin.from('credit_card_purchases').select('total_amount, description, purchase_date, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(queryLimit);

        const trs = [
            ...(exps || []).map((e: any) => ({ ...e, type: 'expense' })),
            ...(incs || []).map((i: any) => ({ ...i, type: 'income' })),
            ...(ccs || []).map((c: any) => ({ amount: c.total_amount, description: c.description, created_at: c.created_at, type: 'expense', isCC: true }))
        ]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 7); // Show last 7

        if (!trs.length) {
            await sendWhatsApp(phone, "📄 Nenhuma transação recente encontrada.");
        } else {
            let msg = "📄 *EXTRATO RECENTE*\n";
            msg += "━━━━━━━━━━━━━━━━━━━━\n\n";
            trs.forEach((t: any) => {
                const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount));
                const icon = t.type === 'income' ? '💰' : '💸';
                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR');
                const suffix = (t as any).isCC ? " 💳" : "";
                msg += `${icon} *${t.description}*${suffix}\n   ${val} • _${dateStr}_\n\n`;
            });
            msg += "━━━━━━━━━━━━━━━━━━━━\n";
            msg += "_Saldin • Controle Total._ ✨";
            await sendWhatsApp(phone, msg);
        }
    } catch (e) {
        console.error("Extrato error:", e);
    }
}
