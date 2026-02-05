import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  Calendar,
  Loader2,
  Layers,
  Clock,
} from "lucide-react";
import { useDebts } from "@/hooks/useDebts";
import { cn } from "@/lib/utils";
import { addMonths, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthProjection {
  month: Date;
  label: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    amount: number;
    type: "debt" | "installment";
    currentInstallment?: number;
    totalInstallments?: number;
  }>;
}

export default function Overview() {
  const navigate = useNavigate();
  const [monthsToShow, setMonthsToShow] = useState(6);

  // Fetch active debts
  const { data: debts = [], isLoading } = useDebts("active");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  // Calculate projections for each month
  const projections: MonthProjection[] = [];
  const today = new Date();
  
  for (let i = 0; i < monthsToShow; i++) {
    const targetMonth = addMonths(startOfMonth(today), i);
    const monthLabel = format(targetMonth, "MMM 'de' yyyy", { locale: ptBR });
    
    const items: MonthProjection["items"] = [];
    let total = 0;
    
    debts.forEach(debt => {
      const debtStart = new Date(debt.created_at);
      const monthsFromStart = Math.floor(
        (targetMonth.getTime() - debtStart.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      
      // Check if this debt is still active in this month
      if (debt.is_installment && debt.total_installments) {
        if (monthsFromStart >= 0 && monthsFromStart < debt.total_installments) {
          const currentInstallment = (debt.current_installment || 0) + monthsFromStart;
          if (currentInstallment < debt.total_installments) {
            items.push({
              id: debt.id,
              name: debt.creditor_name,
              amount: Number(debt.installment_amount || 0),
              type: "installment",
              currentInstallment: currentInstallment + 1,
              totalInstallments: debt.total_installments,
            });
            total += Number(debt.installment_amount || 0);
          }
        }
      } else if (!debt.is_installment && monthsFromStart >= 0) {
        items.push({
          id: debt.id,
          name: debt.creditor_name,
          amount: Number(debt.installment_amount || debt.total_amount || 0),
          type: "debt",
        });
        total += Number(debt.installment_amount || debt.total_amount || 0);
      }
    });
    
    projections.push({
      month: targetMonth,
      label: monthLabel,
      total,
      items,
    });
  }

  // Total committed for the period
  const totalCommitted = projections.reduce((sum, p) => sum + p.total, 0);
  const maxMonthTotal = Math.max(...projections.map(p => p.total), 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-3">
          <FadeIn>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-serif text-xl font-semibold">Parcelas Futuras</h1>
                <p className="text-xs text-muted-foreground">Mapa de compromissos</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Summary Card */}
        <FadeIn delay={0.05}>
          <div className="p-5 rounded-xl bg-card border border-border shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-impulse/15 flex items-center justify-center">
                <Layers className="h-6 w-6 text-impulse" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total comprometido</p>
                <p className="font-serif text-2xl font-semibold text-impulse">
                  {formatCurrency(totalCommitted)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos {monthsToShow} meses · {debts.length} dívida{debts.length !== 1 ? "s" : ""} ativa{debts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </FadeIn>

        {/* Timeline Visual */}
        <FadeIn delay={0.1}>
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Linha do tempo
            </h2>
            
            {projections.length === 0 || projections.every(p => p.total === 0) ? (
              <div className="p-6 rounded-xl bg-card border border-border text-center">
                <div className="w-12 h-12 rounded-full bg-essential/15 mx-auto mb-3 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-essential" />
                </div>
                <p className="font-medium mb-1">Nenhum compromisso futuro</p>
                <p className="text-sm text-muted-foreground">
                  Você não tem parcelas ou dívidas ativas.
                </p>
              </div>
            ) : (
              projections.map((projection, index) => (
                <motion.div
                  key={projection.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium capitalize">{projection.label}</span>
                    <span className={cn(
                      "font-semibold",
                      projection.total > 0 ? "text-impulse" : "text-muted-foreground"
                    )}>
                      {projection.total > 0 ? formatCurrency(projection.total) : "Livre"}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  {projection.total > 0 && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(projection.total / maxMonthTotal) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        className={cn(
                          "h-full rounded-full",
                          projection.total >= maxMonthTotal * 0.8 ? "bg-impulse" : "bg-obligation"
                        )}
                      />
                    </div>
                  )}
                  
                  {/* Items */}
                  {projection.items.length > 0 && (
                    <div className="space-y-2">
                      {projection.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => navigate(`/debts/${item.id}`)}
                          className="w-full flex items-center justify-between text-sm hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="truncate">{item.name}</span>
                            {item.type === "installment" && item.currentInstallment && item.totalInstallments && (
                              <span className="text-xs text-muted-foreground">
                                ({item.currentInstallment}/{item.totalInstallments})
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {formatCurrency(item.amount)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </FadeIn>

        {/* Show more button */}
        {debts.length > 0 && (
          <FadeIn delay={0.3}>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMonthsToShow(prev => prev + 6)}
            >
              Ver mais {6} meses
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </FadeIn>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
