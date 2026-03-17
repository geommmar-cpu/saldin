import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { BottomNav } from "@/components/BottomNav";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CreditCard as CreditCardIcon,
  Trash2, Settings, Loader2,
} from "lucide-react";
import { useCreditCardById, useCardStatementData, useCardUsedLimit, useDeleteCreditCard } from "@/hooks/useCreditCards";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getCategoryById } from "@/lib/categories";
import { getCardGradient } from "@/lib/cardBranding";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CARD_COLORS: Record<string, string> = {
  "#14b8a6": "from-cyan-500 to-teal-700",
  "#3B82F6": "from-blue-500 to-indigo-700",
  "#10B981": "from-emerald-500 to-teal-700",
  "#F59E0B": "from-amber-500 to-orange-700",
  "#EF4444": "from-red-500 to-rose-700",
  "#EC4899": "from-pink-500 to-fuchsia-700",
  "#6366F1": "from-indigo-500 to-cyan-700",
  "#14B8A6": "from-teal-500 to-cyan-700",
};

export default function CreditCardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: card, isLoading } = useCreditCardById(id);
  const { data: usedLimit = 0 } = useCardUsedLimit(id);
  const deleteCard = useDeleteCreditCard();

  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const { data: statementItems = [] } = useCardStatementData(id, selectedMonth);

  const statementTotal = statementItems.reduce((s, i) => s + Number(i.amount), 0);
  const availableLimit = (card?.credit_limit || 0) - usedLimit;

  // Determine gradient: prefer user-selected predefined color, else fallback to brand detection
  const gradientClass = card ? (CARD_COLORS[card.color] || getCardGradient(card.card_name)) : "";

  const handleDelete = async () => {
    if (!id) return;
    await deleteCard.mutateAsync(id);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
      <title>Saldin | CreditCardDetail</title>
      <meta name="description" content="Manage your creditcarddetail easily with Saldin." />
      <meta property="og:title" content="Saldin - CreditCardDetail" />
      <meta property="og:description" content="Manage your creditcarddetail easily with Saldin." />
        
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="max-w-[100vw] leading-relaxed text-muted-foreground">Cartão não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold flex-1">{card.card_name}</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/cards/${card.id}/edit`)}>
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover cartão?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O cartão será desativado. Compras e parcelas existentes serão mantidas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="px-5 py-4 space-y-6">
        {/* Card Summary */}
        <FadeIn>
          <div className={cn(
            "rounded-2xl p-5 text-white bg-gradient-to-br shadow-lg relative overflow-hidden",
            gradientClass
          )}>
            <div className="absolute top-4 right-4 opacity-20">
              <CreditCardIcon className="w-16 h-16" />
            </div>
            <div className="relative z-10">
              <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed opacity-80">{card.card_brand || "Cartão"}</p>
              <h3 className="max-w-[100vw] leading-relaxed text-xl font-bold">{card.card_name}</h3>
              {card.last_four_digits && (
                <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed opacity-70 font-mono mt-2">•••• {card.last_four_digits}</p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm leading-relaxed">
                <div>
                  <p className="max-w-[100vw] leading-relaxed text-xs opacity-60">Limite</p>
                  <p className="font-semibold">{formatCurrency(card.credit_limit)}</p>
                </div>
                <div>
                  <p className="max-w-[100vw] leading-relaxed text-xs opacity-60">Usado</p>
                  <p className="font-semibold">{formatCurrency(usedLimit)}</p>
                </div>
                <div className="max-w-[100vw] leading-relaxed text-right">
                  <p className="max-w-[100vw] leading-relaxed text-xs opacity-60">Disponível</p>
                  <p className="font-semibold">{formatCurrency(availableLimit)}</p>
                </div>
              </div>
              {/* Limit bar */}
              <div className="mt-3 h-2 rounded-full bg-background/20">
                <div
                  className="h-full rounded-full bg-background/80 transition-all"
                  style={{ width: `${Math.min((usedLimit / (card.credit_limit || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Month Selector */}
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(m => subMonths(m, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-serif text-lg leading-relaxed font-semibold capitalize">
              {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(m => addMonths(m, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </FadeIn>

        {/* Statement Summary */}
        <FadeIn delay={0.15}>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground">Fatura do mês</p>
                <p className="max-w-[100vw] leading-relaxed text-2xl font-serif font-bold">{formatCurrency(statementTotal)}</p>
              </div>
              <div className="max-w-[100vw] leading-relaxed text-right text-sm leading-relaxed text-muted-foreground">
                <p>Fecha dia {card.closing_day}</p>
                <p>Vence dia {card.due_day}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Installments List */}
        <FadeIn delay={0.2}>
          <h3 className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-semibold text-muted-foreground mb-3">
            Lançamentos ({statementItems.length})
          </h3>
          {statementItems.length === 0 ? (
            <div className="max-w-[100vw] leading-relaxed text-center py-8">
              <span className="max-w-[100vw] leading-relaxed text-3xl mb-2 block">📭</span>
              <p className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground">Nenhuma parcela neste mês</p>
            </div>
          ) : (
            <div className="space-y-2">
              {statementItems.map((item, i) => {
                const cat = item.purchase?.category_id
                  ? getCategoryById(item.purchase.category_id)
                  : undefined;
                const CatIcon = cat?.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      cat ? "bg-muted/50" : "bg-muted"
                    )}>
                      {CatIcon ? (
                        <CatIcon className={cn("w-5 h-5", cat?.color)} />
                      ) : (
                        <CreditCardIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-relaxed truncate">
                        {item.purchase?.description || "Compra"}
                      </p>
                      <p className="max-w-[100vw] leading-relaxed text-xs text-muted-foreground">
                        {item.installment_number}/{item.purchase?.total_installments || 1}
                        {" · "}
                        {item.status === "paid" ? "Paga" : "Aberta"}
                      </p>
                    </div>
                    <p className="font-semibold text-sm leading-relaxed tabular-nums">
                      {formatCurrency(item.amount)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </FadeIn>
      </main>

      <BottomNav />
    </div>
  );
}
