
// Image Processing Service (OCR & Vision) - Using Gemini 1.5 Flash
import { analyzeImageWithGemini } from "./gemini-service.ts";

export interface FinancialItem {
    tipo: "receita" | "gasto";
    valor: number;
    descricao: string;
    categoria_sugerida: string;
    metodo_pagamento: string;
}

export interface FinancialIntent {
    tipo: "transacao" | "duvida" | "consulta_saldo" | "consulta_extrato";
    items: FinancialItem[];
    status: "ok" | "incompleto";
}

/**
 * Analyzes an image (receipt, invoice, etc.) using Gemini 1.5 Flash Vision.
 * 
 * @param buffer The image file buffer
 * @returns The extracted financial intent
 */
export async function processImage(buffer: ArrayBuffer): Promise<FinancialIntent> {
    try {
        if (!buffer || buffer.byteLength === 0) {
            throw new Error("Empty image buffer provided.");
        }

        console.log("🤖 Redirecting image analysis to Gemini Service...");
        
        // Gemini handles the prompt and extraction internally now
        const result = await analyzeImageWithGemini(buffer);
        
        return result as FinancialIntent;

    } catch (error) {
        console.error("❌ Image Processing Failed:", error);
        throw error;
    }
}
