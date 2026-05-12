
// AI Service (Financial Intent Analysis) - Using Groq (Free, 14.400 req/day)
// Groq uses an OpenAI-compatible API with Llama 3 models

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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

const SYSTEM_PROMPT = `Você é o assistente financeiro inteligente do Saldin.
Sua função é analisar mensagens e extrair TODAS as transações financeiras mencionadas.

REGRAS:
1. Se o usuário mencionar múltiplos gastos ou receitas (ex: "gastei 10 com café e 50 com almoço"), extraia TODOS como itens separados.
2. Se for uma pergunta de saldo ou extrato, use o "tipo" correspondente e deixe "items" vazio.
3. Para cada item em "items":
   - Extraia o VALOR numérico puro (ex: 120.50).
   - Identifique CATEGORIA e MÉTODO DE PAGAMENTO sugeridos.
   - 🚨 CRÍTICO: Se o usuário mencionar um BANCO ou CARTÃO específico (ex: "no Inter", "no Nubank", "no Itaú"), você DEVE usar o NOME DO BANCO como metodo_pagamento.
   - Crie uma DESCRIÇÃO objetiva.
4. O MÉTODO DE PAGAMENTO É OBRIGATÓRIO (ex: pix, debito, credito, dinheiro, boleto, inter, nubank, itau). Se não informado, defina o "status" como "incompleto".

RETORNE APENAS UM JSON VÁLIDO (sem explicações, sem markdown):
{"tipo":"transacao","items":[{"tipo":"gasto","valor":0,"descricao":"","categoria_sugerida":"","metodo_pagamento":""}],"status":"ok"}`;

export async function analyzeText(text: string): Promise<FinancialIntent> {
    try {
        console.log(`🤖 Starting AI Analysis for: "${text}"`);

        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY not configured.");
        }

        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                temperature: 0,
                max_tokens: 400,
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Groq API Error ${response.status}:`, errText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error("Empty response from Groq");

        console.log("✅ Groq Analysis Result:", content);
        return JSON.parse(content) as FinancialIntent;

    } catch (error) {
        console.error("❌ Groq Text Analysis Failed:", error);
        throw new Error("Falha ao processar inteligência financeira.");
    }
}
