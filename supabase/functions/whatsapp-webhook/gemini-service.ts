
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");


export async function transcribeAudioWithGemini(
    buffer: ArrayBuffer,
    mimeType: string = "audio/ogg"
): Promise<string> {
    try {
        if (!buffer || buffer.byteLength === 0) {
            console.error("❌ Groq Whisper: Buffer is empty!");
            throw new Error("Empty audio buffer.");
        }

        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
        if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured.");

        console.log(`🎤 Groq Whisper: Transcribing ${(buffer.byteLength / 1024).toFixed(2)} KB of audio...`);

        // Build multipart form with the audio blob
        const cleanMime = mimeType.split(';')[0] || "audio/ogg";
        const extension = cleanMime.includes("mp4") ? "mp4" : cleanMime.includes("mpeg") ? "mp3" : "ogg";
        const audioBlob = new Blob([buffer], { type: cleanMime });
        
        const formData = new FormData();
        formData.append("file", audioBlob, `audio.${extension}`);
        formData.append("model", "whisper-large-v3-turbo");
        formData.append("language", "pt");
        formData.append("response_format", "text");

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: formData,
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Groq Whisper API Error ${response.status}:`, errText);
            throw new Error(`Groq Whisper error: ${response.status}`);
        }

        const text = await response.text();
        console.log("✅ Groq Whisper Transcription:", text);
        return text.trim() || "";

    } catch (error) {
        console.error("❌ Groq Whisper Transcription failed:", error);
        return "";
    }
}

export async function analyzeImageWithGemini(
    buffer: ArrayBuffer,
    mimeType: string = "image/jpeg"
): Promise<any> {
    try {
        if (!buffer || buffer.byteLength === 0) {
            throw new Error("Empty image buffer provided.");
        }

        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
        if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured.");

        const uint8Array = new Uint8Array(buffer);
        const base64 = encodeBase64(uint8Array);
        const cleanMime = mimeType.split(';')[0] || "image/jpeg";

        console.log(`🖼️ Groq Vision: Analyzing image (${(buffer.byteLength / 1024).toFixed(2)} KB)...`);

        const PROMPT = `Você é o assistente financeiro visual do Saldin.
Analise a IMAGEM (comprovante, nota fiscal, recibo ou foto de produto) e extraia dados financeiros.

REGRAS:
1. Identifique o VALOR TOTAL pago.
2. Identifique o NOME do estabelecimento/pessoa (para Descrição).
3. Identifique a CATEGORIA sugerida (Alimentação, Transporte, Moradia, etc).
4. Se for comprovante de transferência, identifique o destinatário.
5. Identifique o MÉTODO DE PAGAMENTO (Pix, Crédito, Débito, Dinheiro, Boleto).
6. O MÉTODO DE PAGAMENTO É OBRIGATÓRIO. Se não identificado, defina "status" como "incompleto".

RETORNE APENAS JSON VÁLIDO (sem markdown):
{"tipo":"transacao","items":[{"tipo":"gasto","valor":0,"descricao":"","categoria_sugerida":"","metodo_pagamento":""}],"status":"ok"}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: { url: `data:${cleanMime};base64,${base64}` }
                        },
                        { type: "text", text: PROMPT }
                    ]
                }],
                temperature: 0,
                max_tokens: 500,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Groq Vision API Error ${response.status}:`, errText);
            throw new Error(`Groq Vision error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty response from Groq Vision");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not parse JSON from Groq Vision response");

        const jsonContent = JSON.parse(jsonMatch[0]);
        console.log("✅ Groq Vision Result:", JSON.stringify(jsonContent));
        return jsonContent;

    } catch (error) {
        console.error("❌ Groq Vision Processing Failed:", error);
        throw error;
    }
}

export async function analyzeTextWithGemini(text: string): Promise<any> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const SYSTEM_PROMPT = `Você é o assistente financeiro inteligente do Saldin.
Sua função é analisar mensagens e extrair TODAS as transações financeiras mencionadas.

REGRAS:
1. Se o usuário mencionar múltiplos gastos ou receitas (ex: "gastei 10 com café e 50 com almoço"), extraia TODOS como itens separados.
2. Se for uma pergunta de saldo ou extrato, use o "tipo" correspondente e deixe "items" vazio.
3. Para cada item em "items":
   - Extraia o VALOR numérico puro (ex: 120.50).
   - Identifique CATEGORIA e MÉTODO DE PAGAMENTO sugeridos.
   - 🚨 CRÍTICO: Se o usuário mencionar um BANCO ou CARTÃO específico (ex: "no Inter", "no Nubank", "no Itaú"), você DEVE usar o NOME DO BANCO como metodo_pagamento. NÃO use termos genéricos como "credito" ou "debito" se o nome do banco estiver presente.
   - Crie uma DESCRIÇÃO objetiva.
4. O MÉTODO DE PAGAMENTO É OBRIGATÓRIO (ex: pix, debito, credito, dinheiro, boleto, inter, nubank, itau). Se o usuário não informar nada, defina o "status" como "incompleto".

RETORNO OBRIGATÓRIO (JSON):
{
  "tipo": "transacao" | "consulta_saldo" | "consulta_extrato", 
  "items": [
    {
      "tipo": "gasto" | "receita",
      "valor": number,
      "descricao": string,
      "categoria_sugerida": string,
      "metodo_pagamento": string
    }
  ],
  "status": "ok" | "incompleto"
}`;

        console.log("🤖 Analyzing Text with Gemini 1.5 Flash...");
        
        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: `Mensagem do usuário: "${text}"` }
        ]);

        const response = await result.response;
        const responseText = response.text();
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Could not parse JSON from Gemini response");
        
        return JSON.parse(jsonMatch[0]);

    } catch (error) {
        console.error("❌ Gemini Text Analysis Failed:", error);
        throw error;
    }
}
