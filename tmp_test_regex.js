
const patterns = [
    { bank: "Caixa", regex: /(?:caixa|cef).*?compra\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i },
    { bank: "Caixa", regex: /(?:caixa|cef).*?transferência\s+realizada\s+R\$\s*([\d.,]+)\s+(.+?)(?:\.|$)/i }, // Hypothetical Fix
    { bank: "Pix", regex: /pix\s+(?:enviado|realizado|feito|efetuado).*?R\$\s*([\d.,]+).*?(?:para|a)\s+(.+?)(?:\.|,\s*$|$)/i },
    { bank: "Pix", regex: /(?:transferência|transferencia)\s+recebida.*?R\$\s*([\d.,]+).*?(?:de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i, isIncome: true },
    { bank: "Pix", regex: /(?:transferência|transferencia)\s+(?:enviada|realizada).*?R\$\s*([\d.,]+).*?(?:para|de|do|da)\s+(.+?)(?:\.|,\s*$|$)/i },
];

const testStrings = [
    "Caixa: Compra R$ 1,00 inter",
    "Caixa: Transferência realizada R$ 1,00 para Banco Inter",
    "Caixa: Pix enviado R$ 1,00 para Banco Inter",
    "Transferência enviada: R$ 1,00 para Banco Inter",
    "Pix enviado: R$ 1,00 para Inter",
    "Inter: Pix recebido de R$ 1,00 de Fulano",
    "Caixa: Voce realizou uma transferencia de R$ 1,00 para Inter"
];

function parse(text) {
    for (const { bank, regex, isIncome } of patterns) {
        const match = text.match(regex);
        if (match) {
            console.log(`MATCH [${bank}]: "${text}"`);
            console.log(`  Valor: ${match[1]}, Estab: ${match[2]}, Income: ${!!isIncome}`);
            return;
        }
    }
    console.log(`NO MATCH: "${text}"`);
}

testStrings.forEach(parse);
