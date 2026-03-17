import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Building,
  ShoppingBag,
  CheckCircle2,
  Loader2,
  Zap,
  Calendar,
  ShieldCheck,
  TrendingDown,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebts, useDebtStats, DebtRow } from "@/hooks/useDebts";
import { format, addMonths, differenceInMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryIcons: Record<string, React.ElementType> = {
  credit_card: CreditCard,
  loan: Building,
  financing: Building,
  store: ShoppingBag,
  personal: CreditCard,
  other: CreditCard,
};

const categoryLabels: Record<string, string> = {
  credit_card: "Cartão de crédito",
  loan: "Empréstimo",
  financing: "Financiamento",
  store: "Loja",
  personal: "Pessoal",
  other: "Outros",
};

export const Debts = () => {
  const navigate = useNavigate();
  const [showPaid, setShowPaid] = useState(false);

  // Fetch real data from Supabase
  const { data: debts = [], isLoading } = useDebts("all");
  const { data: stats } = useDebtStats();

  const activeDebts = debts.filter((d) => d.status === "active");
  const paidDebts = debts.filter((d) => d.status === "paid");

  const totalMonthlyCommitment = stats?.totalMonthly ?? 0;

  // ── Calculation for Debt Freedom Plan ──
  const now = new Date();

  const totalOwed = useMemo(() => {
    return activeDebts.reduce((sum, d) => {
      const total = Number(d.total_amount || 0);
      const paid = Number(d.paid_amount || 0);
      return sum + (total - paid);
    }, 0);
  }, [activeDebts]);

  const totalOriginal = useMemo(() => {
    return activeDebts.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  }, [activeDebts]);

  const overallProgress = totalOriginal > 0
    ? Math.round(((totalOriginal - totalOwed) / totalOriginal) * 100)
    : 100;

  const [extraPayment, setExtraPayment] = useState(0);

  const { monthsToFreedom, freedomDate } = useMemo(() => {
    let maxMonths = 0;
    activeDebts.forEach(d => {
      if (d.is_installment && d.total_installments && d.current_installment) {
        const remainingRemaining = d.total_installments - d.current_installment;
        if (remainingRemaining > maxMonths) maxMonths = remainingRemaining;
      }
    });

    const fDate = addMonths(now, maxMonths);
    return { monthsToFreedom: maxMonths, freedomDate: fDate };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDebts]);

  const { acceleratedMonths, acceleratedDate, monthsSaved } = useMemo(() => {
    if (extraPayment <= 0 || activeDebts.length === 0) {
      return { acceleratedMonths: monthsToFreedom, acceleratedDate: freedomDate, monthsSaved: 0 };
    }

    // Simple snowball simulation
    // We assume the extra payment applies to the total monthly effort
    const totalMonthlyEffort = totalMonthlyCommitment + extraPayment;

    // Approximate new duration: Total remaining balance / total monthly effort
    // We round up because you can't have half a month of payment effort
    const newMonths = Math.ceil(totalOwed / totalMonthlyEffort);

    // Safety check: accelerated months shouldn't exceed original max installments 
    // (though mathematically unlikely if extraPayment > 0)
    const finalAccMonths = Math.min(newMonths, monthsToFreedom);
    const accDate = addMonths(now, finalAccMonths);
    const saved = monthsToFreedom - finalAccMonths;

    return {
      acceleratedMonths: finalAccMonths,
      acceleratedDate: accDate,
      monthsSaved: saved > 0 ? saved : 0
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraPayment, activeDebts, totalOwed, totalMonthlyCommitment, monthsToFreedom, freedomDate]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDebtClick = (debt: DebtRow) => {
    navigate(`/debts/${debt.id}`, { state: { debt } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
      <title>Saldin | Debts</title>
      <meta name="description" content="Manage your debts easily with Saldin." />
      <meta property="og:title" content="Saldin - Debts" />
      <meta property="og:description" content="Manage your debts easily with Saldin." />
        
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-semibold">Dívidas</h1>
              <p className="max-w-[100vw] leading-relaxed text-xs text-muted-foreground">
                Parcelamentos e compromissos
              </p>
            </div>
          </div>
          <Button
            variant="warm"
            size="sm"
            onClick={() => navigate("/debts/add")}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-6 pt-4">
        {/* ── Plano de Liberdade Hero ── */}
        {activeDebts.length > 0 && (
          <FadeIn>
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <span className="max-w-[100vw] leading-relaxed text-[10px] font-bold uppercase tracking-widest text-primary/80">Plano de Guerra</span>
                </div>

                <div className="space-y-1 mb-6">
                  <h2 className="max-w-[100vw] leading-relaxed text-2xl font-serif font-bold leading-tight">
                    Sua Independência em <span className="max-w-[100vw] leading-relaxed text-primary capitalize">{format(extraPayment > 0 ? acceleratedDate : freedomDate, "MMMM yyyy", { locale: ptBR })}</span>
                  </h2>
                  <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-slate-400">
                    Faltam <span className="max-w-[100vw] leading-relaxed text-white font-bold">{extraPayment > 0 ? acceleratedMonths : monthsToFreedom} meses</span> para você não dever mais nada a ninguém.
                  </p>
                </div>

                {/* Overall Progress */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                    <span className="max-w-[100vw] leading-relaxed text-slate-400">Progresso de Quitação</span>
                    <span className="max-w-[100vw] leading-relaxed text-primary">{overallProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="space-y-0.5">
                    <p className="max-w-[100vw] leading-relaxed text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Restante</p>
                    <p className="max-w-[100vw] leading-relaxed text-lg leading-relaxed font-bold text-white tracking-tight">{formatCurrency(totalOwed)}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="max-w-[100vw] leading-relaxed text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso Mensal</p>
                    <p className="max-w-[100vw] leading-relaxed text-lg leading-relaxed font-bold text-impulse tracking-tight">{formatCurrency(totalMonthlyCommitment)}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Action Call for Snowball */}
        {activeDebts.length > 1 && (
          <FadeIn delay={0.1}>
            <div className="p-4 rounded-xl bg-essential/5 border border-essential/20 flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-essential/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-essential" />
              </div>
              <div>
                <p className="max-w-[100vw] leading-relaxed text-xs font-bold text-essential uppercase">Estratégia Recomendada</p>
                <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-foreground">Focha em quitar <strong>{activeDebts.sort((a, b) => (Number(a.total_amount) - Number(a.paid_amount)) - (Number(b.total_amount) - Number(b.paid_amount)))[0].creditor_name}</strong> primeiro para ganhar fôlego.</p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── Acelerador de Independência ── */}
        {activeDebts.length > 0 && (
          <FadeIn delay={0.15}>
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Acelerador de Independência</h3>
                  <p className="max-w-[100vw] leading-relaxed text-xs text-muted-foreground">Quanto você pode pagar a mais por mês?</p>
                </div>
                {monthsSaved > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20"
                  >
                    -{monthsSaved} {monthsSaved === 1 ? 'mês' : 'meses'} 🚀
                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="max-w-[100vw] leading-relaxed text-2xl font-bold tracking-tight">{formatCurrency(extraPayment)}</span>
                  <span className="max-w-[100vw] leading-relaxed text-[10px] font-bold uppercase text-muted-foreground tracking-widest pb-1">Pagamento Extra</span>
                </div>

                <input aria-label="Input field" 
                  type="range"
                  min="0"
                  max={totalMonthlyCommitment * 2}
                  step="50"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                />

                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
                  <span>R$ 0</span>
                  <span>{formatCurrency(totalMonthlyCommitment * 2)}</span>
                </div>
              </div>

              {monthsSaved > 0 && (
                <div className="pt-2">
                  <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed leading-relaxed">
                    Com <strong className="max-w-[100vw] leading-relaxed text-primary">{formatCurrency(extraPayment)} extra</strong>, você antecipa sua liberdade para <strong className="max-w-[100vw] leading-relaxed text-foreground capitalize">{format(acceleratedDate, "MMMM 'de' yyyy", { locale: ptBR })}</strong>.
                  </p>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Active Debts */}
        {activeDebts.length > 0 && (
          <FadeIn delay={0.1}>
            <h2 className="font-serif text-lg leading-relaxed font-semibold mb-2">
              Dívidas ativas
            </h2>
            <div className="space-y-2">
              {activeDebts.map((debt, index) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onClick={() => handleDebtClick(debt)}
                  delay={index * 0.05}
                />
              ))}
            </div>
          </FadeIn>
        )}

        {/* Empty State */}
        {activeDebts.length === 0 && (
          <FadeIn delay={0.1} className="max-w-[100vw] leading-relaxed text-center py-12">
            <div className="w-16 h-16 rounded-full bg-essential/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-essential" />
            </div>
            <h3 className="font-semibold mb-1">Sem dívidas ativas</h3>
            <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground">
              Você não tem compromissos pendentes
            </p>
          </FadeIn>
        )}

        {/* Paid Debts Toggle */}
        {paidDebts.length > 0 && (
          <FadeIn delay={0.2}>
            <button
              onClick={() => setShowPaid(!showPaid)}
              className="w-full p-3 rounded-xl bg-muted/50 text-center text-sm leading-relaxed text-muted-foreground hover:bg-muted transition-colors"
            >
              {showPaid ? "Ocultar" : "Ver"} {paidDebts.length} dívida
              {paidDebts.length !== 1 ? "s" : ""} quitada
              {paidDebts.length !== 1 ? "s" : ""}
            </button>

            {showPaid && (
              <div className="space-y-2 mt-3">
                {paidDebts.map((debt, index) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    onClick={() => handleDebtClick(debt)}
                    delay={index * 0.05}
                  />
                ))}
              </div>
            )}
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

interface DebtCardProps {
  debt: DebtRow;
  onClick: () => void;
  delay?: number;
}

const DebtCard = ({ debt, onClick, delay = 0 }: DebtCardProps) => {
  const Icon = categoryIcons["other"]; // Default icon since we removed category
  const isPaid = debt.status === "paid";
  const isRecurring = !debt.is_installment;
  const progress = isRecurring
    ? 0
    : Math.round(((debt.current_installment || 0) / (debt.total_installments || 1)) * 100);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all",
        "bg-card border shadow-soft hover:shadow-medium",
        isPaid
          ? "border-essential/30 opacity-70"
          : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
            isPaid ? "bg-essential/15" : "bg-impulse/15"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isPaid ? "text-essential" : "text-impulse"
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold truncate text-base">{debt.creditor_name}</p>
            {isPaid && (
              <span className="max-w-[100vw] leading-relaxed text-[10px] px-1.5 py-0.5 rounded-full bg-essential/10 text-essential font-bold uppercase tracking-tighter shrink-0 border border-essential/20">
                Quitada
              </span>
            )}
            {isRecurring && !isPaid && (
              <span className="max-w-[100vw] leading-relaxed text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-bold uppercase tracking-tighter shrink-0 border border-accent/20">
                Recorrente
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="font-medium">{debt.description || "Dívida"}</span>
            {!isRecurring && (
              <>
                <span className="opacity-30">·</span>
                <span className="font-bold text-foreground/70">
                  Faltam {Number(debt.total_installments || 0) - Number(debt.current_installment || 0)} parcelas
                </span>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {!isRecurring && !isPaid && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: delay + 0.2, duration: 0.5 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="max-w-[100vw] leading-relaxed text-right flex-shrink-0 self-center">
          <p className="font-bold tabular-nums text-lg leading-relaxed tracking-tight">
            {formatCurrency(Number(debt.installment_amount || 0))}
          </p>
          <p className="max-w-[100vw] leading-relaxed text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Mensal</p>
        </div>
      </div>

      {/* Footer Info */}
      {!isPaid && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>Finaliza em {format(addMonths(new Date(debt.created_at), Number(debt.total_installments || 0)), "MM/yy")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/60">
            <ShieldCheck className="w-3 h-3" />
            <span>{Math.round(((Number(debt.total_amount) - Number(debt.paid_amount)) / Number(debt.total_amount)) * 100)}% restante</span>
          </div>
        </div>
      )}
    </motion.button>
  );
};

export default Debts;
