# Plano: Bloqueio de Acesso Premium e Limpeza de Dados

Este plano detalha as ações para implementar a trava de acesso para usuários não-premium e realizar o reset de dados para testes.

## 1. Banco de Dados (Migrações)
- [ ] Aplicar `20260318000000_subscription_system.sql`: Adiciona colunas de assinatura ao perfil.
- [ ] Aplicar `99999999_cleanup_geomar_data.sql`: Limpa dados do usuário `geomar@gmail.com` para reinício dos testes.

## 2. Frontend (Redirecionamento)
- [x] O componente `OnboardingRoute` já foi atualizado para verificar `profile.subscription_active`.
- [x] A página `SubscriptionExpired.tsx` foi criada para informar o usuário sobre o bloqueio.
- [ ] Ajustar `SubscriptionExpired.tsx` para refletir que a forma de pagamento ainda está sendo decidida (remover link direto da Hotmart se necessário).

## 3. WhatsApp (Backend)
- [x] A função `whatsapp-webhook` já possui a trava que verifica `subscription_active`.
- [x] Mensagem de erro informando sobre a expiração já está configurada.

## 4. Verificação de Fluxo
- [ ] Logar com `geomar@gmail.com`.
- [ ] Completar Onboarding.
- [ ] Ser redirecionado para `subscription-expired` (já que o reset define `subscription_active = false`).
- [ ] Tentar enviar mensagem no WhatsApp e receber a trava.
