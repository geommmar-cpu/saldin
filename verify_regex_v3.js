
const patterns = [
    { bank: "Nubank", regex: /nubank.*?(?:compra|débito|debit).*?R\$\s*([\d.,]+).*?(?:em|no|na|at)\s+(.+?)(?:\.|$)/i },
    { bank: "Inter", regex: /inter.*?(?:compra|débito).*?R\$\s*([\d.,]+)\s*[-–]\s*(.+?)(?:\.|$)/i },
    { bank: "Itaú", regex: /itaú.*?(?:compra|débito)\s+(?:cartão\s+)?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Bradesco", regex: /bradesco.*?débito\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "C6", regex: /C6\s*Bank.*?R\$\s*([\d.,]+)\s+(?:em\s+)?(.+?)(?:\.|$)/i },
    { bank: "Mercado Pago", regex: /(?:mercado pago|você pagou|pagamento).*?R\$\s*([\d.,]+)\s+(?:para\s+)?(.+?)(?:\.|$)/i },
    { bank: "Caixa", regex: /(?:caixa|cef).*?(?:compra|transferência|transferencia|pix|pagamento).*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Santander", regex: /santander.*?R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Pix_Income", regex: /pix\s+(?:recebido|receber|recebeu).*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Pix_Income_Swap", regex: /pix\s+(?:recebido|receber|recebeu).*?(?:de|do|da)\s+(.+?),?\s*(?:no\s+)?valor\s+(?:de\s+)?R\$\s*([\d.,]+)/i, swap: true, isIncome: true },
    { bank: "Transferência_Income", regex: /(?:transferência|transferencia)\s+recebida.*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Pix_Expense", regex: /pix\s+(?:enviado|realizado|feito|efetuado|pago).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    { bank: "Transferência_Expense", regex: /(?:transferência|transferencia).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    { bank: "Banco_Income_1", regex: /(?:depósito|deposito|salário|salario|crédito|credito)\s+(?:em\s+conta\s+)?.*?R\$\s*([\d.,]+).*?(?:de|do|da|em)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Banco_Income_2", regex: /(?:você\s+recebeu|recebeu|recebimento).*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Banco_Generic", regex: /R\$\s*([\d.,]+).*?(?:em|no|na|para|de)\s+(.+?)(?:\.|,\s*$|$)/i },
];

const testStrings = [
    { text: "Caixa: Compra R$ 1,00 inter", expectedBank: "Caixa" },
    { text: "Caixa: Transferência realizada R$ 1,00 para Banco Inter", expectedBank: "Caixa" },
    { text: "Caixa: Pix enviado R$ 1,00 para Banco Inter", expectedBank: "Caixa" },
    { text: "Transferência enviada: R$ 1,00 para Banco Inter", expectedBank: "Transferência_Expense" },
    { text: "Pix enviado: R$ 1,00 para Inter", expectedBank: "Pix_Expense" },
    { text: "Inter: Pix recebido de R$ 1,00 de Fulano", expectedBank: "Pix_Income" },
    { text: "Caixa: Voce realizou uma transferencia de R$ 1,00 para Inter", expectedBank: "Caixa" },
    { text: "Transferencia de R$ 1,00 realizada para Inter", expectedBank: "Transferência_Expense" },
    { text: "Transferência de R$ 1,00 para Banco Inter", expectedBank: "Transferência_Expense" },
    { text: "Nubank: Compra aprovada de R$ 89,90 no MERCADO LIVRE", expectedBank: "Nubank" },
    { text: "Pix recebido de Fulano no valor de R$ 50,00", expectedBank: "Pix_Income_Swap" }
];

const results = testStrings.map(({text, expectedBank}) => {
    let matchResult = null;
    for (const p of patterns) {
        const match = text.match(p.regex);
        if (match) {
            matchResult = { 
                text, 
                match: true, 
                bank: p.bank, 
                valor: p.swap ? match[2] : match[1], 
                estab: p.swap ? match[1] : match[2], 
                income: !!p.isIncome,
                correct: p.bank === expectedBank
            };
            break;
        }
    }
    return matchResult || { text, match: false, correct: false };
});

import fs from 'fs';
fs.writeFileSync('verification_results_v3.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Verification results written to verification_results_v3.json');

const failures = results.filter(r => !r.match || !r.correct);
if (failures.length > 0) {
    console.error('VERIFICATION FAILED for some cases:', failures);
} else {
    console.log('ALL TEST CASES PASSED!');
}
