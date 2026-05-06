# 🤖 Saldin WhatsApp Agent - Resumo da Configuração

**Status:** ✅ Backend Migrado para Evolution API  
**Data:** 06/05/2026  
**Versão da Edge Function:** v6 (Evolution API)

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. ✅ Banco de Dados (Supabase)
- **`whatsapp_users`**: Mapeia números de telefone → usuários do sistema.
- **`whatsapp_logs`**: Auditoria completa de mensagens (incluindo JSON da Evolution).
- **RPC `process_financial_transaction`**: Garante transações atômicas.

---

### 2. ✅ Edge Function (Supabase Functions)

**Nome:** `whatsapp-webhook`  
**URL:** `https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook`  
**verify_jwt:** `false` (Webhook público para Evolution API)

#### Arquivos:
1. **`index.ts`** - Orquestrador principal (Focado em Evolution API)
   - Recebe webhooks da Evolution (`messages.upsert`)
   - Valida usuário pelo telefone (JID cleaning)
   - Processa texto/áudio/imagem via OpenAI
   - Responde via Evolution API (`sendText`, `sendButtons`)

2. **`ai-service.ts`**, **`financial-service.ts`**, **`audio-service.ts`**, **`image-service.ts`**
   - Serviços de apoio para análise, banco de dados e processamento de mídia.

---

## 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Configure no Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
# Evolution API
EVOLUTION_API_URL=https://sua-api.com
EVOLUTION_API_KEY=seu_token_aqui
EVOLUTION_INSTANCE=nome_da_instancia

# IA e Processamento
ANTHROPIC_API_KEY=sk-ant-xxxxx          # Claude AI (análise de texto)
OPENAI_API_KEY=sk-xxxxx                  # Whisper (áudio) e GPT-4o (imagens)
```

**Comando CLI:**
```bash
supabase secrets set EVOLUTION_API_URL=... EVOLUTION_API_KEY=... EVOLUTION_INSTANCE=...
```

---

## 📲 CONFIGURAÇÃO NA EVOLUTION API

1. **Instância:** Crie uma instância e conecte o WhatsApp.
2. **Webhook:**
   - URL: `https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook`
   - Eventos: `MESSAGES_UPSERT`
   - Habilite "Send JSON" e, se possível, "Webhook Base64" para mídia (opcional, o sistema tenta baixar via API se necessário).

---

## 🎯 FEATURES SUPORTADAS

| Feature | Status |
|---------|--------|
| Receber texto | ✅ |
| Transcrição de áudio | ✅ |
| OCR de comprovantes | ✅ |
| Botões interativos | ✅ |
| Comandos (/saldo, /extrato) | ✅ |
| Edição/Exclusão via Chat | ✅ |

---

## 🔒 SEGURANÇA
- Validação de telefone em `whatsapp_users`.
- Verificação de assinatura ativa em `profiles`.
- Logs de auditoria para cada interação.

---

## 📊 MONITORAMENTO
```bash
supabase functions logs whatsapp-webhook --tail
```

**Última atualização:** 06/05/2026 09:35 BRT
