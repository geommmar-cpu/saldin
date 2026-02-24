// AI Service (Financial Intent Analysis) - Using OpenAI GPT
import { OpenAI } from "npm:openai";

const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY")!,
});

export interface FinancialItem {
    tipo: "receita" | "gasto";
    valor: number;
    descricao: string;
    categoria_sugerida: string;
    metodo_pagamento: string; // "pix", "debito", "credito", "dinheiro", "boleto" or specific name like "inter", "nubank"
}

export interface FinancialIntent {
    tipo: "transacao" | "duvida" | "consulta_saldo" | "consulta_extrato";
    items: FinancialItem[];
    status: "ok" | "incompleto";
}

const SYSTEM_PROMPT = `Você é o assistente financeiro inteligente do Saldin.
Sua função é analisar mensagens e extrair TODAS as transações financeiras mencionadas.

REGRAS:
1. Se o usuário mencionar múltiplos gastos ou receitas (ex: "gastei 10 com café e 50 com almoço"), extraia TODOS como itens separados.
2. Se for uma pergunta de saldo ou extrato, use o "tipo" correspondente e deixe "items" vazio.
3. Para cada item em "items":
   - Extraia o VALOR numérico puro (ex: 120.50).
   - Identifique CATEGORIA e MÉTODO DE PAGAMENTO.
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
