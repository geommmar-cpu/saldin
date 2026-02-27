# 🔔 Saldin — Captura Automática de Gastos

**Status:** ✅ Edge Function `inject-notification` criada  
**Endpoint:** `https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/inject-notification`

---

## 🔐 Variável de Ambiente (Adicionar no Supabase)

```bash
supabase secrets set INJECT_SECRET=saldin_inject_2026
```

> Troque `saldin_inject_2026` por uma string aleatória antes de ir para produção.

---

## 📱 ANDROID — MacroDroid (Gratuito)

### O que o usuário faz:
1. Baixa o **MacroDroid** na Play Store (gratuito)
2. Abre o app e importa a macro abaixo
3. Preenche seu número de telefone na variável
4. Ativa a macro — **nunca mais precisa mexer**

### Macro JSON (distribuir para o usuário):

```json
{
  "m_trigger": {
    "type": "notification_received",
    "apps": [
      "com.nu.production",
      "br.com.intermedium",
      "com.c6bank.app",
      "br.com.itau",
      "com.bradesco",
      "com.santander.app",
      "br.gov.caixa.caixatem",
      "com.mercadopago.wallet",
      "com.picpay"
    ],
    "filter_text": ""
  },
  "m_action_list": [
    {
      "type": "http_request",
      "url": "https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/inject-notification",
      "method": "POST",
      "headers": "Content-Type: application/json",
      "body": "{\"secret\":\"saldin_inject_2026\",\"phone\":\"[SEU_NUMERO_55XXXXXXXXXXX]\",\"text\":\"{nf_title} {nf_text}\",\"source\":\"macrodroid\"}"
    }
  ],
  "m_name": "Saldin - Captura de Gastos"
}
```

### Variáveis do MacroDroid:
- `{nf_title}` = título da notificação (ex: "Nubank")
- `{nf_text}` = corpo da notificação (ex: "Compra de R$ 89,90 aprovada")

---

## 🍎 iOS — Apple Shortcuts (Atalhos)

### Não precisa instalar nada. O app "Atalhos" já vem no iPhone.

### O que o usuário faz:
1. Recebe um link do Saldin: `https://www.icloud.com/shortcuts/[SEU_ATALHO_ID]`
2. Toca no link → toca em **"Adicionar Atalho"**
3. Vai em **Atalhos → Automação → Ativa "Saldin Captura"**
4. Pronto. Funciona automaticamente.

### Configuração da Automação no Shortcuts:

```
GATILHO:
  Quando um app receber notificação
  App: [Nubank / Inter / C6 / etc.]
  Filtro: contém "R$" ou "aprovada"

AÇÕES:
  1. Obter Conteúdo de "Notificação"
     → Armazenar em variável: notif_text

  2. URL: POST https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/inject-notification
     Corpo JSON:
     {
       "secret": "saldin_inject_2026",
       "phone": "55119XXXXXXXX",
       "text": [notif_text],
       "source": "shortcuts_ios"
     }

  3. Buscar Conteúdo de URL (executa o POST)
```

---

## 🧪 Teste Manual (Via curl)

```bash
curl -X POST \
  https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/inject-notification \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "saldin_inject_2026",
    "phone": "SEU_NUMERO_AQUI",
    "text": "Nubank: Compra aprovada de R$ 89,90 no MERCADO LIVRE",
    "source": "teste_manual"
  }'
```

### Resposta esperada:
```json
{
  "status": "success",
  "transaction_code": "A1B2",
  "valor": 89.90,
  "estabelecimento": "MERCADO LIVRE",
  "banco": "Nubank"
}
```

---

## 📊 Padrões de Notificação Suportados

| Banco | Exemplo de Texto | Suporte |
|---|---|---|
| Nubank | `Compra aprovada de R$ 89,90 no MERCADO LIVRE` | ✅ |
| Inter | `Compra aprovada R$ 89,90 - Mercado Livre` | ✅ |
| C6 Bank | `C6 Bank: Compra de R$ 89,90 em Mercado Livre` | ✅ |
| Itaú | `Compra Cartão R$ 89,90 MERCADO LIVRE` | ✅ |
| Bradesco | `Débito R$ 89,90 Mercado Livre` | ✅ |
| Santander | `Santander: Compra aprovada R$ 89,90 MERCADO LIVRE` | ✅ |
| Caixa | `Caixa Eco Fed: Compra R$ 89,90 MERCADO LIVRE` | ✅ |
| Mercado Pago | `Você pagou R$ 89,90 para Mercado Livre` | ✅ |

---

## 🔒 Segurança

- ✅ Chave secreta (`INJECT_SECRET`) obrigatória em todas as requisições
- ✅ Usuário deve estar cadastrado e verificado em `whatsapp_users`
- ✅ Todas as injeções são logadas em `whatsapp_logs` com `source: auto_notification`
- ✅ Notificações não financeiras são ignoradas silenciosamente (sem spam no WhatsApp)
- ✅ Botões "Excluir" e "Editar" disponíveis no WhatsApp para correções

---

## 🚀 Deploy

```bash
supabase functions deploy inject-notification --project-ref vmkhqtuqgvtcapwmxtov
```
