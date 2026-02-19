# Task: QuickExpense — Tela Única de Registro de Gastos

## Objetivo
Substituir AddExpense + ConfirmExpense (2 telas, 4 passos) por uma única tela inteligente.
Meta: registro em menos de 10 segundos.

## Decisões de Arquitetura
- Novo arquivo: `src/pages/QuickExpense.tsx`
- Rotas atualizadas: `/expenses/add` e `/confirm/:id` → `/expenses/quick`
- Teclado numérico: mantido como painel fixo na parte inferior
- Lógica do handleComplete: reutilizada e consolidada do ConfirmExpense

## Estrutura da Tela (de cima para baixo)
1. Header (voltar + título "Novo Gasto")
2. Display do valor (grande, clicável para reabrir teclado)
3. Categorias rápidas (scroll horizontal, 6 botões + "ver mais")
4. Forma de pagamento (4 ícones: PIX | Dinheiro | Débito | Crédito)
5. Conta de saída (dropdown compacto, pré-selecionada última usada) — ou cartão se crédito
6. Data (padrão hoje, toque para mudar)
7. Descrição (campo opcional)
8. Toggle "Gasto meu / Para outra pessoa"
   - Se "outra pessoa": nome + valor a receber (parcial) + data devolução
9. Se Crédito: "Parcelar?" toggle + número de parcelas
10. Botão REGISTRAR (fixo no bottom, grande, laranja)
11. Painel do teclado numérico (bottom sheet persistente; some quando scroll para baixo)

## Campos de Estado
- `amount: string` — valor digitado
- `categoryId: string | undefined`
- `paymentMethod: "cash" | "debit" | "credit" | "pix" | undefined`
- `selectedBankId: string | undefined`
- `selectedCardId: string | undefined`
- `date: string` — default hoje (toLocalDateString())
- `description: string` — opcional
- `isForOtherPerson: boolean` — toggle
- `reimbursementName: string`
- `reimbursementAmount: string` — valor parcial a receber
- `reimbursementDate: string`
- `installments: number` — 1 por padrão
- `showKeypad: boolean` — controla visibilidade do teclado

## Fluxo de Salvamento (handleSave)
1. Resolve UUID da categoria (reutilizar lógica do ConfirmExpense)
2. Se crédito → createCreditCardPurchase
3. Se outros → createExpense (ou createBulkExpenses se parcelas > 1)
4. Atualiza saldo bancário
5. Se "outra pessoa" → createReceivable com valor parcial
6. Toast + animação de sucesso + navigate("/")

## Design
- Paleta: Amber/Orange (marca Saldin) + fundo claro
- Tipografia: valor em fonte grande (text-5xl, font-bold)
- Categorias: pills horizontais com ícone+nome
- Pagamento: 4 grandes ícones quadrados selecionáveis
- Micro-animações: framer-motion para campos dinâmicos
- Bottom sheet teclado: slide up/down animado

## Arquivos Afetados
- [x] Criar: `src/pages/QuickExpense.tsx`
- [x] Editar: `src/App.tsx` — remapear rotas
- [x] Manter: `AddExpense.tsx` e `ConfirmExpense.tsx` (não deletar, apenas redirecionar)
