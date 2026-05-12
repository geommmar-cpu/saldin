
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeText } from "./ai-service.ts";
import { processImage } from "./image-service.ts";
import { transcribeAudioWithGemini } from "./gemini-service.ts";
import { processTransaction, getBalance, getLastTransactions, getPreferredAccount, getImportantAlerts } from "./financial-service.ts";
import { generateTransactionCode, formatPremiumMessage, handleExcluirCommand, handleEditarCommand, processEditStep } from "./transactionCommandHandler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── EVOLUTION API HELPERS ───

async function sendWhatsApp(to: string, text: string): Promise<void> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
        console.error("❌ Missing EVOLUTION credentials");
        return;
    }

    const number = to.split('@')[0];
    console.log(`📤 [Evolution] Sending Text to ${number}...`);
    try {
        const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
            body: JSON.stringify({
                number: number,
                text: text,
                options: { delay: 1200, presence: "composing" }
            })
        });
        const data = await resp.json();
        if (resp.ok) {
            console.log(`✅ Message sent to Evolution successfully:`, JSON.stringify(data));
        } else {
            console.error(`❌ Evolution Send Error [${resp.status}]:`, JSON.stringify(data));
        }
    } catch (e) { 
        console.error(`❌ Fetch Exception for ${number}:`, e); 
    }
}

async function sendWhatsAppWithLinks(to: string, text: string, buttons: { id: string, title: string }[]): Promise<void> {
    const number = to.split('@')[0];
    const options = buttons.map((b, i) => `*${i + 1}* - ${b.title.replace('🗑️ ', '').replace('📝 ', '')}`).join('\n');
    const fullText = `${text}\n\n${options}\n\n_Responda apenas o número da opção._`;
    await sendWhatsApp(to, fullText);
}

async function markMessageAsRead(remoteJid: string, messageId: string): Promise<void> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return;
    try {
        const url = `${EVOLUTION_API_URL}/chat/markMessageAsRead/${EVOLUTION_INSTANCE}`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
            body: JSON.stringify({
                readMessages: [{ remoteJid, id: messageId }]
            })
        });
    } catch (e) { console.error("Error marking read:", e); }
}

async function sendTypingIndicator(to: string): Promise<void> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) return;
    try {
        const url = `${EVOLUTION_API_URL}/chat/presenceUpdate/${EVOLUTION_INSTANCE}`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
            body: JSON.stringify({
                number: to.split('@')[0],
                presence: "composing"
            })
        });
    } catch (e) { console.error("Error sending typing indicator:", e); }
}

async function downloadMedia(messageKey: any, base64FromPayload?: string): Promise<ArrayBuffer | null> {
    try {
        let base64 = base64FromPayload;

        if (!base64) {
            const messageId = messageKey.id;
            console.log(`📥 [Evolution] Downloading media via API for message: ${messageId}`);
            
            // Tentamos primeiro o endpoint /chat (mais comum em versões novas)
            const endpoints = [
                `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`,
                `${EVOLUTION_API_URL}/message/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`
            ];

            for (const url of endpoints) {
                console.log(`📥 [Evolution] Trying endpoint: ${url}`);
                const resp = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
                    body: JSON.stringify({ message: { key: messageKey } })
                });

                if (resp.ok) {
                    const data = await resp.json();
                    base64 = data.base64;
                    if (base64) {
                        console.log(`✅ [Evolution] Media downloaded successfully from ${url.includes('/chat/') ? '/chat' : '/message'}`);
                        break;
                    }
                } else {
                    const errorText = await resp.text();
                    console.warn(`⚠️ [Evolution] Endpoint ${url} failed: ${resp.status} - ${errorText}`);
                }
            }
        } else {
            console.log(`📥 [Evolution] Using base64 from payload (Length: ${base64.length})`);
        }

        if (!base64) {
            console.error("❌ [Evolution] Could not retrieve base64 from any source.");
            return null;
        }

        const binaryString = atob(base64.split(',')[1] || base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;

    } catch (e) {
        console.error("Error downloading media from Evolution:", e);
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
    console.log(`🚀 [System] Incoming Request: ${req.method}`);
    
    if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE) {
        console.error("❌ CRITICAL: EVOLUTION_API_URL or EVOLUTION_INSTANCE is missing from environment variables!");
    }

    const startTime = Date.now();
    let logId: string | null = null;

    try {
        if (req.method === "GET") {
            return new Response("Evolution Webhook Active", { status: 200 });
        }

        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

        let payload;
        try {
            payload = await req.json();
        } catch (err) {
            console.error("❌ Failed to parse JSON payload:", err);
            return new Response("Invalid JSON", { status: 400 });
        }
        
        console.log("📥 Evolution Payload Received:", JSON.stringify(payload));

        // 1. Evolution API Extraction
        if (payload.event !== "messages.upsert") {
            return new Response("Event ignored", { status: 200 });
        }

        // 🔒 Trava de Segurança: Só responde se a instância for a correta
        if (payload.instance !== EVOLUTION_INSTANCE) {
            console.log(`🚫 Ignorando mensagem da instância ${payload.instance} (Esperado: ${EVOLUTION_INSTANCE})`);
            return new Response("Instance mismatch", { status: 200 });
        }

        const data = payload.data;
        if (!data || data.key?.fromMe) {
            return new Response("No data or from me", { status: 200 });
        }

        const remoteJid = data.key.remoteJid;

        // 🔒 Ignorar Grupos e Newsletters
        if (remoteJid.endsWith("@g.us") || remoteJid.endsWith("@newsletter")) {
            console.log(`ℹ️ Ignorando mensagem de grupo/newsletter: ${remoteJid}`);
            return new Response("Ignored: Group or Newsletter", { status: 200 });
        }

        const messageId = data.key.id;
        const messageType = data.messageType;
        const contactName = data.pushName || "Usuário";
        const messageContent = data.message;

        if (!messageContent) return new Response("No message content", { status: 200 });

        console.log(`🚀 [Evolution] Msg from ${remoteJid} (${contactName}) - Type: ${messageType}`);

        // Mark as read (Non-blocking)
        markMessageAsRead(remoteJid, messageId).catch(e => console.error("Read Mark Error:", e));
        
        // Show "processing" reaction
        sendTypingIndicator(remoteJid).catch(e => console.error("Typing Mark Error:", e));

        // 2. User Lookup (Cleaning phone number from JID)
        const purePhone = remoteJid.split('@')[0];
        const variations = [purePhone];
        if (purePhone.startsWith("55") && purePhone.length >= 10) {
            const ddd = purePhone.substring(2, 4);
            const body = purePhone.substring(4);
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
                phone_number: purePhone,
                whatsapp_user_id: userLink?.id || null,
                message_content: JSON.stringify(data),
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
            console.warn("❌ Unverified user:", purePhone);
            if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Unverified" }).eq("id", logId);
            await sendWhatsApp(remoteJid, "❌ Olá! Este número não está vinculado a uma conta Saldin. Ative o WhatsApp Agent nas configurações do aplicativo.");
            return new Response("Unauthorized", { status: 200 });
        }

        const userId = userLink.user_id;
        const phoneToSend = remoteJid;

        // 2.5 Subscription Check
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from("profiles")
            .select("subscription_active")
            .eq("user_id", userId)
            .single();

        if (profileErr || !profile?.subscription_active) {
            console.warn(`🛑 Access Denied: User ${userId} (${remoteJid}) has no active subscription.`);
            const inactiveMsg = "⚠️ *Sua assinatura do Saldin expirou ou está inativa.*\n━━━━━━━━━━━━━━━━━━━━\nPara continuar usando o assistente e registrar seus gastos, regularize seu pagamento no aplicativo ou na Hotmart.\n\n_Acesse o app para mais detalhes._";
            await sendWhatsApp(phoneToSend, inactiveMsg);
            if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true, error_message: "Subscription Inactive" }).eq("id", logId);
            return new Response("Unauthorized Subscription", { status: 200 });
        }

        // 3. Content Extraction
        let textToAnalyze = "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let intent: any = null;

        if (messageType === "conversation") {
            textToAnalyze = messageContent.conversation || "";
        }
        else if (messageType === "extendedTextMessage") {
            textToAnalyze = messageContent.extendedTextMessage?.text || "";
        }
        else if (messageType === "audioMessage") {
            // Raio-X do áudio
            console.log("🔍 [Raio-X Áudio] Chaves em data:", Object.keys(data).join(", "));
            if (messageContent.audioMessage) {
                console.log("🔍 [Raio-X Áudio] Chaves em audioMessage:", Object.keys(messageContent.audioMessage).join(", "));
            }

            const b64 = data.base64 || payload.base64 || messageContent.audioMessage?.base64 || data.message?.audioMessage?.base64;
            console.log(`🎤 Audio detected. Final Base64 length: ${b64?.length || 0}`);
            
            const buffer = await downloadMedia(data.key, b64);
            if (buffer) {
                try {
                    console.log(`🎤 Buffer ready (${buffer.byteLength} bytes). Calling Gemini...`);
                    textToAnalyze = await transcribeAudioWithGemini(buffer, messageContent.audioMessage?.mimetype);
                    console.log(`🎤 Gemini Result: "${textToAnalyze}"`);
                } catch (err) {
                    console.error("❌ Audio Processing Flow Error:", err);
                    await sendWhatsApp(phoneToSend, "❌ Desculpe, tive um problema ao ouvir seu áudio. Pode tentar mandar por texto?");
                    return new Response("Audio Error", { status: 200 });
                }
            } else {
                console.error("❌ Failed to get audio buffer.");
            }
        }
        else if (messageType === "imageMessage") {
            const b64 = data.base64 || payload.base64 || messageContent.imageMessage?.base64 || data.message?.imageMessage?.base64;
            const buffer = await downloadMedia(data.key, b64);
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
        else if (messageType === "buttonsResponseMessage") {
            const replyId = messageContent.buttonsResponseMessage?.selectedButtonId;
            textToAnalyze = replyId?.replace("_", " ") || "";
            console.log(`🔘 Button Clicked: ${replyId} -> ${textToAnalyze}`);
        }
        else if (messageType === "templateButtonReplyMessage") {
             const replyId = messageContent.templateButtonReplyMessage?.selectedId;
             textToAnalyze = replyId?.replace("_", " ") || "";
        }

        // 4. Command & Edit Flow
        if (textToAnalyze) {
            const userInput = textToAnalyze.trim();
            const normalizedCmd = userInput.toLowerCase().replace(/[^\w\s]/gi, '');
            
            // Check for ongoing states (Edit or Post-Transaction Menu)
            const { data: state } = await supabaseAdmin.from('conversation_states').select('*').eq('user_id', userId).maybeSingle();

            if (state) {
                // A. Post-transaction numeric menu (1=Delete, 2=Edit)
                if (state.step === 'post_transaction_action') {
                    const lastCode = state.context?.last_transaction_code;
                    if (userInput === '1') {
                        const result = await handleExcluirCommand(userId, lastCode);
                        await sendWhatsApp(phoneToSend, result.message);
                        await supabaseAdmin.from('conversation_states').delete().eq('user_id', userId);
                        return new Response("Deleted", { status: 200 });
                    } else if (userInput === '2') {
                        const result = await handleEditarCommand(userId, lastCode);
                        await sendWhatsApp(phoneToSend, result.message);
                        return new Response("Editing", { status: 200 });
                    }
                }

                // B. Existing multi-step editing
                const editResult = await processEditStep(userId, userInput);
                if (editResult.success) {
                    await sendWhatsApp(phoneToSend, editResult.message);
                    if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                    return new Response("Edit Step OK", { status: 200 });
                }
            }

            // B. SAUDAÇÕES E AJUDA
            const greetings = ['oi', 'ola', 'olá', 'teste', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello', 'oie'];
            const helpCommands = ['ajuda', 'ajuda', 'comando', 'comandos', 'help', '/help', 'como usar', 'o que voce faz'];

            if (greetings.includes(normalizedCmd) || greetings.some(g => normalizedCmd.startsWith(g + " "))) {
                await sendWhatsApp(phoneToSend, "Olá! 👋 Sou o assistente do Saldin. \nComo posso ajudar? Você pode registrar um gasto (ex: 'Almoço 35.00'), ou pedir seu 'saldo' ou 'extrato'. \n\nPara ver a lista completa de comandos, digite *AJUDA*.");
                if (logId) await supabaseAdmin.from("whatsapp_logs").update({ processed: true }).eq("id", logId);
                return new Response("Greeting OK", { status: 200 });
            }

            if (helpCommands.includes(normalizedCmd)) {
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

            // 3. Normal Commands
            const deleteMatch = userInput.match(/(?:excluir|deletar|remover)(?:\s+)?([A-Z2-9]{4})?/i);
            if (deleteMatch && (deleteMatch[1] || userInput.toLowerCase().trim() === 'excluir')) {
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

            const editMatch = userInput.match(/(?:editar|alterar|mudar)(?:\s+)?([A-Z2-9]{4})?/i);
            if (editMatch && (editMatch[1] || userInput.toLowerCase().trim() === 'editar')) {
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
                const alerts = await getImportantAlerts(userId);
                const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceLivre);

                let msg = `💰 *SEU SALDO DISPONÍVEL*\n━━━━━━━━━━━━━━━━━━━━\n*${formatted}*\n━━━━━━━━━━━━━━━━━━━━\n\n_Este é o seu *Saldo Livre*, subtraindo compromissos e contas pendentes._ ✨`;

                if (alerts.length > 0) {
                    msg += `\n\n⚠️ *AVISOS IMPORTANTES*\n${alerts.map(a => `• ${a}`).join('\n')}`;
                }

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
            console.log(`🤖 Starting AI Analysis for: "${textToAnalyze}"`);
            intent = await analyzeText(textToAnalyze);
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
            const alerts = await getImportantAlerts(userId);
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);

            let msg = `💰 Seu saldo atual é: *${formatted}*`;
            if (alerts.length > 0) {
                msg += `\n\n⚠️ *AVISOS IMPORTANTES*\n${alerts.map(a => `• ${a}`).join('\n')}`;
            }
            await sendWhatsApp(phoneToSend, msg);
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
                    console.log(`📂 Finding category for: ${item.categoria_sugerida}`);
                    const categoryId = await getCategoryId(userId, item.categoria_sugerida, item.tipo === "receita" ? "income" : "expense");
                    
                    console.log(`💳 Finding account for: ${item.metodo_pagamento}`);
                    const { id: targetAccountId, isCreditCard, name: accName } = await getPreferredAccount(userId, item.metodo_pagamento);
                    
                    if (!targetAccountId) {
                        console.error(`❌ No account found for user ${userId} and method ${item.metodo_pagamento}`);
                        continue;
                    }

                    const tCode = generateTransactionCode();
                    lastTCode = tCode;

                    console.log(`🚀 Executing processTransaction for ${item.descricao}...`);
                    const result = await processTransaction({
                        userId,
                        type: item.tipo === "receita" ? "income" : "expense",
                        amount: item.valor,
                        description: item.descricao,
                        categoryId: categoryId || undefined,
                        bankAccountId: targetAccountId || undefined,
                        transactionCode: tCode,
                        isCreditCard: isCreditCard
                    });
                    console.log(`✅ Transaction saved: ${result.id}`);

                    const valStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor);
                    const icon = item.tipo === 'receita' ? '💰' : '💸';

                    if (isSingle) {
                        const alerts = await getImportantAlerts(userId);
                        summaryMsg = formatPremiumMessage({
                            id: result.id,
                            description: item.descricao,
                            amount: item.valor,
                            date: new Date().toISOString(),
                            category: item.categoria_sugerida,
                            account_name: result.dest_name,
                            type: item.tipo === "receita" ? "income" : "expense",
                            transaction_code: tCode,
                            account_balance: result.account_balance
                        }, { new_balance: result.new_balance }, alerts) || "✅ Transação registrada!";
                        console.log(`📝 Generated Summary: ${summaryMsg}`);
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
                    console.log(`💬 Sending confirmation with links to ${phoneToSend}`);
                    
                    // Salvar estado para permitir resposta numérica (1 ou 2)
                    await supabaseAdmin.from('conversation_states').upsert({
                        user_id: userId,
                        step: 'post_transaction_action',
                        context: { last_transaction_code: lastTCode },
                        updated_at: new Date().toISOString()
                    });

                    await sendWhatsAppWithLinks(phoneToSend, summaryMsg, [
                        { id: `excluir_${lastTCode}`, title: "🗑️ Excluir" },
                        { id: `editar_${lastTCode}`, title: "📝 Editar" }
                    ]);
                } else {
                    console.log(`💬 Sending summary message to ${phoneToSend}`);
                    const balance = await getBalance(userId);
                    const alerts = await getImportantAlerts(userId);
                    const balStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance);
                    summaryMsg += "━━━━━━━━━━━━━━━━━━━━\n";
                    summaryMsg += `📊 *SALDO TOTAL:* ${balStr}\n`;

                    if (alerts.length > 0) {
                        summaryMsg += `\n⚠️ *AVISOS IMPORTANTES*\n${alerts.map(a => `• ${a}`).join('\n')}\n`;
                    }

                    summaryMsg += `\n_Para excluir, use: excluir ID_`;
                    await sendWhatsApp(phoneToSend, summaryMsg);
                }
            } else {
                await sendWhatsApp(phoneToSend, "❌ Não consegui processar seu pedido. Verifique se você possui contas/cartões cadastrados.");
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(exps || []).map((e: any) => ({ ...e, type: 'expense' })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(incs || []).map((i: any) => ({ ...i, type: 'income' })),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(ccs || []).map((c: any) => ({ amount: c.total_amount, description: c.description, created_at: c.created_at, type: 'expense', isCC: true }))
        ]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 7);

        if (!trs.length) {
            await sendWhatsApp(phone, "📄 Nenhuma transação recente encontrada.");
        } else {
            let msg = "📄 *EXTRATO RECENTE*\n";
            msg += "━━━━━━━━━━━━━━━━━━━━\n\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            trs.forEach((t: any) => {
                const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount));
                const icon = t.type === 'income' ? '💰' : '💸';
                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const suffix = (t as any).isCC ? " 💳" : "";
                msg += `${icon} *${t.description}*${suffix}\n   ${val} • _${dateStr}_\n\n`;
            });
            msg += "━━━━━━━━━━━━━━━━━━━━\n";

            const alerts = await getImportantAlerts(userId);
            if (alerts.length > 0) {
                msg += `⚠️ *AVISOS IMPORTANTES*\n${alerts.map(a => `• ${a}`).join('\n')}\n━━━━━━━━━━━━━━━━━━━━\n`;
            }

            msg += "_Saldin • Controle Total._ ✨";
            await sendWhatsApp(phone, msg);
        }
    } catch (e) {
        console.error("Extrato error:", e);
    }
}

