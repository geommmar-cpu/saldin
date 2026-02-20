
// Image Processing Service (OCR & Vision) - Using OpenAI GPT-4o
import { OpenAI } from "npm:openai";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

export interface FinancialIntent {
    tipo: "receita" | "gasto" | "duvida" | "consulta_saldo" | "consulta_extrato" | "incompleto";
    valor: number;
    descricao: string;
    categoria_sugerida: string;
    metodo_pagamento: string;
    status: "ok" | "incompleto";
}

/**
 * Analyzes an image (receipt, invoice, etc.) using GPT-4o Vision.
 * 
 * @param buffer The image file buffer
 * @returns The extracted financial intent
 */
export async function processImage(buffer: ArrayBuffer): Promise<FinancialIntent> {
    try {
        if (!buffer || buffer.byteLength === 0) {
            throw new Error("Empty image buffer provided.");
        }

        // Convert Buffer to Base64 for the vision API
        const base64Image = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("🤖 Analyzing Image with GPT-4o Vision...");

        const SYSTEM_PROMPT = `Você é o assistente financeiro visual do Saldin.
Analise a IMAGEM (comprovante, nota fiscal, recibo ou foto de produto) e extraia dados financeiros.

REGRAS:
1. Identifique o VALOR TOTAL pago.
2. Identifique o NOME do estabelecimento/pessoa (para Descrição).
3. Identifique a CATEGORIA (Alimentação, Transporte, Moradia, etc).
4. Se for comprovante de transferência, identifique o destinatário.
5. Identifique o MÉTODO DE PAGAMENTO se possível (Pix, Cartão, Dinheiro).

RETORNO (JSON):
{
  "tipo": "gasto" (ou "receita" se for recebimento), 
  "valor": number, 
  "descricao": string,
  "categoria_sugerida": string,
  "metodo_pagamento": string,
  "status": "ok" | "incompleto"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise este comprovante financeiro:" },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ],
            max_tokens: 300,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Sem resposta do GPT Vision");

        console.log("✅ Vision Result:", content);
        return JSON.parse(content) as FinancialIntent;

    } catch (error) {
        console.error("❌ Image Processing Failed:", error);
        throw error;
    }
}
