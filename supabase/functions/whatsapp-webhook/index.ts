
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

async function sendWhatsApp(to: string, text: string): Promise<void> {
    if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
        console.error("❌ Meta Token or Phone ID not set.");
        return;
    }

    // 🇧🇷 Estratégia de "Tiro Duplo" para o Brasil em modo Sandbox
    let targets = [to];
    if (to.startsWith("55")) {
        const clean = to.replace(/\D/g, "");
        if (clean.length === 12) { // Sem o 9
            targets.push("55" + clean.substring(2, 4) + "9" + clean.substring(4));
        } else if (clean.length === 13) { // Com o 9
            targets.push("55" + clean.substring(2, 4) + clean.substring(5));
        }
    }

    for (const target of [...new Set(targets)]) {
        console.log(`📤 Sending Meta API to ${target}...`);
        try {
            const url = `https://graph.facebook.com/v19.0/${META_PHONE_NUMBER_ID}/messages`;
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: target,
                    type: "text",
                    text: { body: text.replace(/[*_~`]/g, "") }
                })
            });

            const data = await resp.json();
            if (!resp.ok) {
                console.error(`❌ Meta API Error for ${target} (${resp.status}):`, JSON.stringify(data));
            } else {
                console.log(`✅ WhatsApp sent to ${target}:`, JSON.stringify(data));
            }
        } catch (e) {
            console.error(`❌ Failed to send to ${target}:`, e);
        }
    }
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

        // Check if valid Meta payload
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) {
            return new Response("No message to process", { status: 200 }); // Ack status updates
        }

        // Extract basic data
        const remoteJid = message.from; // Phone number (no @s.whatsapp.net suffix usually)
        const messageId = message.id;
        const messageType = message.type;
        const contactName = value?.contacts?.[0]?.profile?.name || "Usuário";

        console.log(`🚀 [META] Msg from ${remoteJid} (${contactName}) - Type: ${messageType}`);

        // Mark as read immediately (UX)
        await markMessageAsRead(messageId);

        // Log to DB
        const { data: logData, error: logError } = await supabaseAdmin
            .from("whatsapp_logs")
            .insert({
                phone_number: remoteJid,
                message_content: JSON.stringify(message),
                message_type: messageType,
                processed: false,
                message_id: messageId,
                dedup_key: null
            })
            .select()
            .single();

        if (logError && logError.code === "23505") {
            console.log("🔁 Duplicate message blocked:", messageId);
            return new Response("Duplicate", { status: 200 }); // Ack to stop retries
        }
        if (logData) logId = logData.id;

        // 3. User Lookup
        // Meta sends "554799..." (raw number). We need to match with our DB.
        // We will try exact match first, then variations (9 digit).

        let userId = "";
        let phoneToSend = remoteJid;

        // Construct variations for lookup
        let variations = [remoteJid];
        // If BR number (55)
        if (remoteJid.startsWith("55") && remoteJid.length >= 10) {
            const ddd = remoteJid.substring(2, 4);
            const body = remoteJid.substring(4);

            if (body.length === 9) { // Has 9th digit
                variations.push("55" + ddd + body.substring(1)); // Remove 9
            } else if (body.length === 8) { // No 9th digit
                variations.push("55" + ddd + "9" + body); // Add 9
            }
        }

        const { data: userLink, error: userError } = await supabaseAdmin
            .from("whatsapp_users")
            .select("user_id, is_verified, phone_number")
            .in("phone_number", variations)
            .eq("is_verified", true)
            .limit(1)
            .maybeSingle();

        if (userError || !userLink) {
            console.warn("❌ Unverified user:", remoteJid);
            if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Unverified" }).eq("id", logId);
            await sendWhatsApp(phoneToSend, "❌ Olá! Parece que seu número não está identificado. Vincule seu WhatsApp no app Saldin (Configurações > WhatsApp).");
            return new Response("Unauthorized", { status: 200 });
        }

        userId = userLink.user_id;

        // 4. Content Extraction
        let textToAnalyze = "";
        let intent: any = null;

        if (messageType === "text") {
            textToAnalyze = message.text?.body || "";
        }
        else if (messageType === "audio") {
            const mediaId = message.audio?.id;
            console.log("🎤 Audio ID:", mediaId);
            if (mediaId) {
                const buffer = await downloadMedia(mediaId);
                if (buffer) {
                    try {
                        textToAnalyze = await transcribeAudio(buffer, message.audio?.mime_type);
                    } catch (err) {
                        console.error("Transcription error:", err);
                        await sendWhatsApp(phoneToSend, "❌ Erro ao transcrever seu áudio. Tente falar mais claro ou enviar por texto.");
                        return new Response("Audio Error", { status: 200 });
                    }
                }
            }
        }
        else if (messageType === "image") {
            const mediaId = message.image?.id;
            console.log("📸 Image ID:", mediaId);
            if (mediaId) {
                const buffer = await downloadMedia(mediaId);
                if (buffer) {
                    try {
                        intent = await processImage(buffer);
                        console.log("📸 Vision Intent:", intent);
                    } catch (err) {
                        console.error("Vision error:", err);
                        await sendWhatsApp(phoneToSend, "❌ Erro ao analisar a imagem. Tente enviar uma foto mais nítida do comprovante.");
                        return new Response("Vision Error", { status: 200 });
                    }
                }
            }
        }


        // 5. Command & Edit Flow
        if (textToAnalyze) {
            textToAnalyze = textToAnalyze.trim();

            // Check Edit Flow State
            const editResult = await processEditStep(userId, textToAnalyze);
            if (editResult.success) {
                await sendWhatsApp(phoneToSend, editResult.message);
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Edit Step", { status: 200 });
            }

            // Normalize Commands
            const normalizedCmd = textToAnalyze.toLowerCase().replace(/[*_~`]/g, "");

            // Excluir
            const deleteMatch = normalizedCmd.match(/excluir.*?(txn-\d{8}-[a-z0-9]{6})/i);
            if (deleteMatch) {
                const res = await handleExcluirCommand(userId, deleteMatch[1].toUpperCase().trim());
                await sendWhatsApp(phoneToSend, res.message);
                return new Response("Delete", { status: 200 });
            }

            // Saldo
            if (normalizedCmd.match(/^\/?saldo$/)) {
                const balance = await getBalance(userId);
                const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);
                await sendWhatsApp(phoneToSend, `💰 Seu saldo atual é: *${formatted}*`);
                return new Response("Saldo", { status: 200 });
            }

            // Extrato
            if (normalizedCmd.match(/^\/?extrato$/)) {
                await sendExtrato(userId, phoneToSend);
                return new Response("Extrato", { status: 200 });
            }
        }

        // 6. AI Analysis
        if (textToAnalyze) {
            console.log("🤖 Analyzing:", textToAnalyze);
            intent = await analyzeText(textToAnalyze);
            console.log("📊 Result:", intent);
        }

        if (logId && intent) {
            await supabaseAdmin.from("whatsapp_logs").update({ processing_result: intent, processed: intent.status === "ok" }).eq("id", logId);
        }

        if (!intent) return new Response("Ok", { status: 200 });

        // 7. Execute Intent
        if (intent.status === "incompleto") {
            await sendWhatsApp(phoneToSend, "🤔 Não entendi. Pode detalhar? (Ex: 'Gastei 50 no almoço')");
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

        // Transaction
        const categoryId = await getCategoryId(userId, intent.categoria_sugerida, intent.tipo === "receita" ? "income" : "expense");
        const targetAccountId = await getPreferredAccount(userId, intent.metodo_pagamento);
        const tCode = generateTransactionCode();

        const result = await processTransaction({
            userId,
            type: intent.tipo === "receita" ? "income" : "expense",
            amount: intent.valor,
            description: intent.descricao,
            categoryId: categoryId || undefined,
            bankAccountId: targetAccountId || undefined,
            transactionCode: tCode
        });

        const msg = formatPremiumMessage({
            id: result.id,
            description: result.description,
            amount: result.amount,
            date: result.created_at || new Date().toISOString(),
            category: intent.categoria_sugerida,
            account: result.is_credit_card ? "Cartão de Crédito" : (result.dest_name || "Conta"),
            type: intent.tipo === 'receita' ? 'income' : 'expense',
            transaction_code: tCode
        }, { previous_balance: 0, new_balance: result.new_balance, invoice: 0, available_balance: result.new_balance });

        await sendWhatsApp(phoneToSend, msg);

        return new Response("Success", { status: 200 });

    } catch (e) {
        console.error("Fatal Error:", e);
        if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: String(e) }).eq("id", logId);
        return new Response("Internal Error", { status: 500 });
    }
});


async function sendExtrato(userId: string, phone: string) {
    try {
        const queryLimit = 5;
        const { data: exps } = await supabaseAdmin.from('expenses').select('amount, description, date, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(queryLimit);
        const { data: incs } = await supabaseAdmin.from('incomes').select('amount, description, date, type, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(queryLimit);

        const trs = [...(exps || []).map((e: any) => ({ ...e, type: 'expense' })), ...(incs || []).map((i: any) => ({ ...i, type: 'income' }))]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, queryLimit);

        if (!trs.length) {
            await sendWhatsApp(phone, "📄 Nenhuma transação recente.");
        } else {
            let msg = "📄 *Extrato (Últimas 5):*\n\n";
            trs.forEach((t: any) => {
                const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount));
                const icon = t.type === 'income' ? '🟢' : '🔴';
                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR');
                msg += `${icon} *${t.description}*\n   ${val} em ${dateStr}\n\n`;
            });
            await sendWhatsApp(phone, msg);
        }
    } catch (e) { console.error(e); }
}
