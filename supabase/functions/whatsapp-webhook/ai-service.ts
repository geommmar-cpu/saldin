// AI Service (Financial Intent Analysis) - Using OpenAI GPT
import { OpenAI } from "npm:openai";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

export interface FinancialIntent {
    tipo: "receita" | "gasto" | "duvida" | "consulta_saldo" | "consulta_extrato";
    valor: number;
    descricao: string;
    categoria_sugerida: string;
    metodo_pagamento?: "pix" | "debito" | "credito" | "dinheiro" | "boleto" | "indefinido";
    status: "ok" | "incompleto";
    conta_sugerida?: string;
    raw_text?: string;
}

const SYSTEM_PROMPT = `Você é o assistente financeiro inteligente do Saldin.
Sua função é analisar mensagens de texto (ou transcrições de áudio) e extrair dados financeiros ou identificar intenções de consulta.

REGRAS:
1. Identifique se é RECEITA (entrada) ou GASTO (saída).
2. Se o usuário mencionar múltiplos valores (ex: um gasto e um estorno), foque na transação PRINCIPAL (geralmente a primeira mencionada ou a de maior valor). 
3. Se o usuário perguntar "saldo", "quanto tenho", "dinheiro na conta", classifique "tipo" como "consulta_saldo".
4. Se o usuário pedir "extrato", "últimas transações", "o que gastei", classifique "tipo" como "consulta_extrato".
5. Para receitas/gastos:
   - Extraia o VALOR como um número puro (ex: 120.50). NUNCA retorne strings como "R$ 120" ou fórmulas.
   - Identifique a CATEGORIA corretamente.
   - Crie uma DESCRIÇÃO curta e objetiva.
   - Identifique o MÉTODO DE PAGAMENTO (pix, debito, credito, dinheiro, boleto).
   - Se faltar o VALOR, status: "incompleto". Se tiver valor, status: "ok".

RETORNO OBRIGATÓRIO (JSON):
{
  "tipo": "receita" | "gasto" | "consulta_saldo" | "consulta_extrato", 
  "valor": number, 
  "descricao": string,
  "categoria_sugerida": string,
  "metodo_pagamento": "pix" | "debito" | "credito" | "dinheiro" | "boleto" | "indefinido",
  "status": "ok" | "incompleto"
}`;

export async function analyzeText(text: string): Promise<FinancialIntent> {
    try {
        console.log("🤖 Analyzing with GPT-4o-mini...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast and cost-effective
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: text }
            ],
            temperature: 0,
            max_tokens: 300,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from GPT");
        }

        console.log("✅ GPT Response:", content);
        const parsed = JSON.parse(content);
        return parsed as FinancialIntent;

    } catch (error) {
        console.error("❌ GPT Analysis Failed:", error);
        throw new Error("Falha ao processar inteligência financeira.");
    }
}
