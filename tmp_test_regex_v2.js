
const patterns = [
    { bank: "Caixa", regex: /(?:caixa|cef).*?compra\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Pix", regex: /pix\s+(?:enviado|realizado|feito|efetuado).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    { bank: "Pix_Income", regex: /(?:transferência|transferencia)\s+recebida.*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Pix_Expense", regex: /(?:transferência|transferencia)\s+(?:enviada|realizada).*?R\$\s*([\d.,]+).*?(?:para|de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i },
];

const testStrings = [
    "Caixa: Compra R$ 1,00 inter",
    "Caixa: Transferência realizada R$ 1,00 para Banco Inter",
    "Caixa: Pix enviado R$ 1,00 para Banco Inter",
    "Transferência enviada: R$ 1,00 para Banco Inter",
    "Pix enviado: R$ 1,00 para Inter",
    "Inter: Pix recebido de R$ 1,00 de Fulano",
    "Caixa: Voce realizou uma transferencia de R$ 1,00 para Inter",
    "Transferencia de R$ 1,00 realizada para Inter",
    "Transferência de R$ 1,00 para Banco Inter"
];

const results = testStrings.map(text => {
    for (const p of patterns) {
        const match = text.match(p.regex);
        if (match) {
            return { text, match: true, bank: p.bank, valor: match[1], estab: match[2], income: !!p.isIncome };
        }
    }
    return { text, match: false };
});

const fs = require('fs');
fs.writeFileSync('tmp_results_utf8.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to tmp_results_utf8.json');
