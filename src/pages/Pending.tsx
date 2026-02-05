import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, AlertTriangle, ChevronRight, CreditCard, MessageCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePendingExpenses } from "@/hooks/useExpenses";

export const Pending = () => {
  const navigate = useNavigate();

  // Fetch real pending expenses from Supabase
  const { data: pendingExpenses = [], isLoading } = usePendingExpenses();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const total = pendingExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "integration":
        return CreditCard;
      case "whatsapp":
        return MessageCircle;
      default:
        return CreditCard;
    }
  };

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
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="pt-4 pb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-xl font-semibold">Gastos Pendentes</h1>
            <p className="text-sm text-muted-foreground">
              {pendingExpenses.length} aguardando confirmação
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* Explanation */}
        <FadeIn>
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Por que confirmar?</p>
              <p className="text-sm text-muted-foreground">
                Gastos importados precisam da sua reflexão emocional para entrar
                nas análises de comportamento.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Summary */}
        {pendingExpenses.length > 0 && (
          <FadeIn delay={0.1}>
            <div className="p-4 rounded-xl bg-card border border-border shadow-soft">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total pendente</p>
                  <p className="font-serif text-2xl font-semibold">{formatCurrency(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {pendingExpenses.length} gasto{pendingExpenses.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Pending List */}
        {pendingExpenses.length > 0 && (
          <FadeIn delay={0.2}>
            <div className="space-y-2">
              {pendingExpenses.map((expense, index) => {
                const SourceIcon = getSourceIcon(expense.source);
                return (
                  <motion.button
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/confirm/${expense.id}`)}
                    className="w-full p-4 rounded-xl bg-card border-2 border-accent/30 shadow-soft flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
                  >
                    {/* Source Icon */}
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <SourceIcon className="w-5 h-5 text-accent" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {expense.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(expense.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>

                    {/* Amount and Arrow */}
                    <div className="flex items-center gap-2">
                      <p className="font-semibold whitespace-nowrap">
                        {formatCurrency(Number(expense.amount))}
                      </p>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </FadeIn>
        )}

        {/* Empty State */}
        {pendingExpenses.length === 0 && (
          <FadeIn delay={0.2}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-essential/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-essential" />
              </div>
              <p className="font-medium mb-2">Tudo em dia!</p>
              <p className="text-muted-foreground">
                Nenhum gasto aguardando confirmação.
              </p>
            </div>
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Pending;
