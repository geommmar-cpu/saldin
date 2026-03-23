import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";
import { useAuth } from "./useAuth";
import { differenceInDays, parseISO, startOfMonth, format } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type AlertSeverity = "critical" | "warning" | "info";

export interface SmartAlert {
  id: string;
  type: AlertSeverity;
  category: "credit_card" | "receivable" | "goal" | "debt";
  title: string;
  message: string;
  actionPath?: string;
  actionLabel?: string;
  amount?: number;
}

export function useSmartAlerts() {
  const { user } = useAuth();

  return useQuery<SmartAlert[]>({
    queryKey: ["smart-alerts", user?.id],
    queryFn: async (): Promise<SmartAlert[]> => {
      if (!user) return [];
      const alerts: SmartAlert[] = [];
      const today = new Date();
      const refMonth = format(startOfMonth(today), "yyyy-MM-dd");

      // ── 1. Faturas de cartão vencendo nos próximos 7 dias ──────────────
      try {
        const { data: cards } = await db
          .from("credit_cards")
          .select("id, card_name, due_day, credit_limit")
          .eq("active", true);

        for (const card of cards || []) {
          const dueDay = card.due_day;
          if (!dueDay) continue;

          // Calcular data de vencimento deste mês
          const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
          if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1); // próxima fatura

          const daysUntilDue = differenceInDays(dueDate, today);

          // Buscar valor da fatura do mês
          const { data: installments } = await db
            .from("credit_card_installments")
            .select("amount, purchase_id")
            .eq("reference_month", refMonth)
            .eq("status", "open");

          if (!installments?.length) continue;

          const purchaseIds = [...new Set((installments as any[]).map((i: any) => i.purchase_id))];
          const { data: cardPurchases } = await db
            .from("credit_card_purchases")
            .select("id")
            .in("id", purchaseIds)
            .eq("card_id", card.id);

          const cardPurchaseIds = new Set((cardPurchases || []).map((p: any) => p.id));
          const faturaTotal = (installments as any[])
            .filter((i: any) => cardPurchaseIds.has(i.purchase_id))
            .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

          if (faturaTotal <= 0) continue;

          if (daysUntilDue <= 3) {
            alerts.push({
              id: `cc-due-${card.id}`,
              type: "critical",
              category: "credit_card",
              title: `Fatura vencendo em ${daysUntilDue === 0 ? "hoje" : `${daysUntilDue} dia${daysUntilDue > 1 ? "s" : ""}`}`,
              message: `${card.card_name}: fatura de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(faturaTotal)} vence em breve.`,
              actionPath: `/credit-cards`,
              actionLabel: "Ver Cartão",
              amount: faturaTotal,
            });
          } else if (daysUntilDue <= 7) {
            alerts.push({
              id: `cc-due-${card.id}`,
              type: "warning",
              category: "credit_card",
              title: `Fatura vence em ${daysUntilDue} dias`,
              message: `${card.card_name}: prepare ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(faturaTotal)} para o pagamento.`,
              actionPath: `/credit-cards`,
              actionLabel: "Ver Cartão",
              amount: faturaTotal,
            });
          }
        }
      } catch (e) {
        console.warn("Alerts: erro ao checar faturas", e);
      }

      // ── 2. A Receber vencidos ou vencendo nos próximos 5 dias ──────────
      try {
        const { data: receivables } = await db
          .from("receivables")
          .select("id, debtor_name, amount, due_date")
          .eq("status", "pending");

        for (const r of receivables || []) {
          if (!r.due_date) continue;
          const dueDate = parseISO(r.due_date);
          const daysDiff = differenceInDays(dueDate, today);
          const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

          if (daysDiff < 0) {
            alerts.push({
              id: `recv-overdue-${r.id}`,
              type: "critical",
              category: "receivable",
              title: `Cobrança atrasada ${Math.abs(daysDiff)} dia${Math.abs(daysDiff) > 1 ? "s" : ""}`,
              message: `${r.debtor_name} deve ${fmt.format(Number(r.amount))} desde ${dueDate.toLocaleDateString("pt-BR")}.`,
              actionPath: `/receivables`,
              actionLabel: "Ver Cobranças",
              amount: Number(r.amount),
            });
          } else if (daysDiff <= 5) {
            alerts.push({
              id: `recv-due-${r.id}`,
              type: "warning",
              category: "receivable",
              title: `Lembrar de cobrar ${r.debtor_name}`,
              message: `${fmt.format(Number(r.amount))} vencem${daysDiff === 0 ? " hoje" : ` em ${daysDiff} dia${daysDiff > 1 ? "s" : ""}`}.`,
              actionPath: `/receivables`,
              actionLabel: "Ver Cobranças",
              amount: Number(r.amount),
            });
          }
        }
      } catch (e) {
        console.warn("Alerts: erro ao checar recebíveis", e);
      }

      // ── 3. Metas próximas do objetivo (≥80%) ──────────────────────────
      try {
        const { data: goals } = await db
          .from("goals")
          .select("id, name, current_amount, target_amount, status")
          .eq("status", "in_progress");

        for (const g of goals || []) {
          const progress = Number(g.current_amount) / Number(g.target_amount);
          if (progress >= 0.8 && progress < 1) {
            const missing = Number(g.target_amount) - Number(g.current_amount);
            alerts.push({
              id: `goal-near-${g.id}`,
              type: "info",
              category: "goal",
              title: `Meta "${g.name}" quase lá! 🎯`,
              message: `Faltam apenas ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(missing)} para atingir o objetivo.`,
              actionPath: `/goals/${g.id}`,
              actionLabel: "Ver Meta",
              amount: missing,
            });
          }
        }
      } catch (e) {
        console.warn("Alerts: erro ao checar metas", e);
      }

      // Ordenar: critical primeiro, depois warning, depois info
      const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
      return alerts.sort((a, b) => order[a.type] - order[b.type]);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchOnWindowFocus: true,
  });
}
