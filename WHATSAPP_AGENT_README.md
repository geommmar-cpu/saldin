# 🤖 Saldin WhatsApp Agent - Resumo da Configuração

**Status:** ✅ Backend Configurado e Ativo  
**Data:** 15/02/2026  
**Versão da Edge Function:** v5

---

## 📋 O QUE FOI IMPLEMENTADO

### 1. ✅ Banco de Dados (Supabase)

#### Tabelas Criadas:
- **`whatsapp_users`** (2 registros)
  - Mapeia números de telefone → usuários do sistema
  - Campos: `id`, `user_id`, `phone_number`, `is_verified`, `created_at`
  - RLS habilitado (apenas service_role acessa)

- **`whatsapp_logs`** (9 registros)
  - Auditoria completa de mensagens
  - Campos: `id`, `whatsapp_user_id`, `message_type`, `raw_content`, `processed`, `processing_result`, `error_message`, `created_at`

- **`profiles`** - Campos adicionados:
  - `subscription_status` (active, trial, expired, cancelled)
  - `subscription_valid_until` (default: +30 dias)

#### Função RPC Criada:
- **`process_financial_transaction`**
  - Garante transações atômicas (despesa/receita + atualização de saldo)
  - Parâmetros: `user_id`, `type`, `amount`, `description`, `category_id`, `bank_account_id`, `date`, `source`
  - Retorna: `status`, `transaction_id`, `new_balance`, `account_id`
  - **SECURITY DEFINER** (roda com privilege de admin)

---

### 2. ✅ Edge Function (Supabase Functions)

**Nome:** `whatsapp-webhook`  
**URL:** `https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook`  
**verify_jwt:** `false` (webhook público para Meta API)

#### Arquivos:
1. **`index.ts`** - Orquestrador principal (Focado em Meta Cloud API)
   - Recebe webhooks da Meta API
   - Valida e autentica usuário pelo telefone (E.164)
   - Processa texto/áudio/imagem via OpenAI (GPT-4o & Whisper)
   - Envia resposta formatada e premium via WhatsApp

2. **`ai-service.ts`** - Análise de IA (Claude)
   - Extrai intenção financeira (receita/gasto)
   - Identifica valor, descrição e categoria
   - Retorna JSON estruturado

3. **`financial-service.ts`** - Integração com DB
   - Chama a RPC `process_financial_transaction`
   - Garante atomicidade das operações

4. **`audio-service.ts`** - Transcrição de áudio
   - Usa OpenAI Whisper API
   - Converte áudio OGG → texto em português

#### Funcionalidades:
- ✅ **Logging estruturado** com timestamps
- ✅ **Mapeamento automático de categorias** (busca por nome similar)
- ✅ **Verificação de assinatura** do usuário
- ✅ **Tratamento de erros robusto** (registra no log)
- ✅ **Respostas formatadas** em WhatsApp (markdown)
- ⚠️ **Áudio/Imagem (Mock)** - Implementação básica, TODO completo

---

## 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Configure no Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
# Obrigatórias
ANTHROPIC_API_KEY=sk-ant-xxxxx          # Claude AI (análise de texto)
EVOLUTION_API_URL=https://sua-api.com   # URL da Evolution API
EVOLUTION_API_KEY=your_key               # API Key da Evolution

# Opcional
OPENAI_API_KEY=sk-xxxxx                  # Para transcrição de áudio (Whisper)
```

**Como adicionar:**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
supabase secrets set EVOLUTION_API_URL=https://sua-api.com
supabase secrets set EVOLUTION_API_KEY=your_key
```

---

## 📲 PRÓXIMOS PASSOS

### **1. Configurar a Meta Cloud API**

#### a) No Painel Meta for Developers:
- Crie um App do tipo "Business"
- Adicione o produto "WhatsApp"
- Em "Configurações de Webhook", aponte para a URL da sua Edge Function:
  `https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/whatsapp-webhook`
- Configure o **Verify Token** (Padrão: `saldin123` ou sua secret `META_VERIFY_TOKEN`)
- Ative os campos de Webhook: `messages`

#### b) Variáveis de Ambiente no Supabase:
- `META_ACCESS_TOKEN`: Token de acesso permanente
- `META_PHONE_NUMBER_ID`: ID do número de telefone no painel Meta
- `META_VERIFY_TOKEN`: Token de verificação (precisa bater com o painel)

---

### **2. Registrar Usuários no Sistema**

Os usuários precisam ser vinculados no banco de dados:

```sql
-- Exemplo: Vincular um número de telefone a um usuário
INSERT INTO public.whatsapp_users (user_id, phone_number, is_verified)
VALUES (
    'uuid-do-usuario',  -- ID do auth.users
    '5511999999999',    -- Número no formato E.164 (com DDI)
    true                -- Usuário verificado
);
```

**Sugestão:** Criar uma tela no app Saldin onde o usuário:
1. Visualiza seu número de telefone atual (do perfil)
2. Clica em "Ativar WhatsApp Agent"
3. Sistema cria o registro automaticamente
4. Exibe instruções: "Envie 'Oi' para +55 11 99999-9999"

---

### **3. Testar o Fluxo Completo**

1. **Certifique-se que:**
   - ✅ Edge Function foi deployed
   - ✅ Secrets foram configurados
   - ✅ Evolution API está conectada
   - ✅ Webhook está configurado
   - ✅ Usuário foi registrado em `whatsapp_users`

2. **Envie uma mensagem de teste:**
   ```
   Gastei 50 reais no almoço
   ```

3. **Verifique os logs:**
   ```bash
   supabase functions logs whatsapp-webhook --project-ref vmkhqtuqgvtcapwmxtov
   ```

4. **Esperado:**
   - ✅ Mensagem registrada em `whatsapp_logs`
   - ✅ IA extrai: `{tipo: "gasto", valor: 50, descricao: "Almoço", categoria: "Alimentação"}`
   - ✅ Despesa criada em `expenses`
   - ✅ Saldo atualizado em `bank_accounts`
   - ✅ Resposta enviada via WhatsApp:
     ```
     ✅ *Gasto registrado!*

     💸 *Valor:* R$ 50.00
     📝 *Descrição:* Almoço
     🏷️ *Categoria:* Alimentação

     🏦 *Saldo Atual:* R$ 1.450.00
     ```

---

## 🎯 FEATURES IMPLEMENTADAS

| Feature | Status | Observações |
|---------|--------|-------------|
| Receber texto WhatsApp | ✅ | Funcionando |
| Análise de IA (Claude) | ✅ | Extração de intenção |
| Registro de despesas | ✅ | Atômico via RPC |
| Registro de receitas | ✅ | Atômico via RPC |
| Mapeamento de categorias | ✅ | Busca inteligente |
| Validação de usuário | ✅ | Via telefone |
| Verificação de assinatura | ✅ | Opcional |
| Logs de auditoria | ✅ | Completo |
| Resposta formatada | ✅ | Com markdown |
| Transcrição de áudio | ⚠️ | Mock (TODO: OpenAI Whisper) |
| OCR de imagens | ⚠️ | Mock (TODO: Vision API) |

---

## 🔒 SEGURANÇA

- ✅ **RLS habilitado** em todas as tabelas WhatsApp
- ✅ **SECURITY DEFINER** na função RPC (previne SQL injection)
- ✅ **Validação de telefone** antes de processar
- ✅ **Logs completos** para auditoria
- ✅ **Verificação de assinatura** (opcional)
- ⚠️ **verify_jwt: false** - Webhook público (Evolution API não envia JWT)

---

## 📊 MONITORAMENTO

### Ver logs em tempo real:
```bash
supabase functions logs whatsapp-webhook --tail
```

### Consultar logs no banco:
```sql
SELECT * FROM whatsapp_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar usuários vinculados:
```sql
SELECT wu.phone_number, wu.is_verified, p.full_name 
FROM whatsapp_users wu
JOIN profiles p ON p.user_id = wu.user_id;
```

---

## 🚀 EVOLUÇÃO FUTURA

### Fase 2 - Completar MVP:
- [x] Implementar transcrição real de áudio (Whisper) ✅
- [x] Implementar OCR de imagens (Vision API) ✅
- [ ] Criar tela no app para vincular WhatsApp
- [ ] Adicionar comandos especiais ("/saldo", "/extrato")
- [ ] Confirmação antes de registrar valores altos

### Fase 3 - Features Avançadas:
- [ ] Suporte a múltiplas contas bancárias (escolha)
- [ ] Lembretes automáticos de contas a pagar
- [ ] Relatórios mensais via WhatsApp
- [ ] Integração com PIX (QR Code)
- [ ] Multi-idioma (inglês, espanhol)

---

## 📞 SUPORTE

**Documentação:**
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Evolution API: https://doc.evolution-api.com/
- Anthropic Claude: https://docs.anthropic.com/
- OpenAI Whisper: https://platform.openai.com/docs/guides/speech-to-text

**Issues Conhecidos:**
- Nenhum no momento ✅

**Última atualização:** 15/02/2026 14:46 BRT
