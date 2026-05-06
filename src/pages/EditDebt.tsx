import { useState, useEffect } from "react";
import { toLocalDateString } from "@/lib/dateUtils";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Check, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebtById, useUpdateDebt } from "@/hooks/useDebts";
import { toast } from "sonner";
import { parseCurrency, formatCurrency } from "@/lib/currency";
import { toLocalDateString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

export const EditDebt = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: debt, isLoading: isLoadingDebt } = useDebtById(id);
  const updateDebt = useUpdateDebt();

  const [creditorName, setCreditorName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [dueDate, setDueDate] = useState<string>(toLocalDateString());

  const isRecurring = debt ? !debt.is_installment : false;

  useEffect(() => {
    if (debt) {
      setCreditorName(debt.creditor_name || "");
      setTotalAmount(formatCurrency(Number(debt.total_amount), false));
      setInstallments((debt.total_installments || 1).toString());
      setInstallmentAmount(formatCurrency(Number(debt.installment_amount || 0), false));
      if (debt.due_date) setDueDate(debt.due_date);
    }
  }, [debt]);

  const handleSave = async () => {
    if (!id) return;
    const parsedTotal = parseCurrency(totalAmount);
    const parsedInstallments = parseInt(installments) || 1;

    if (parsedTotal <= 0 || !creditorName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await updateDebt.mutateAsync({
        id,
        creditor_name: creditorName.trim(),
        total_amount: parsedTotal,
        total_installments: parsedInstallments,
        installment_amount: parsedTotal / parsedInstallments,
        due_date: dueDate,
      });
      navigate("/");
    } catch (error) {
      console.error("Error updating debt:", error);
    }
  };

  if (isLoadingDebt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
      <title>Saldin | EditDebt</title>
      <meta name="description" content="Manage your editdebt easily with Saldin." />
      <meta property="og:title" content="Saldin - EditDebt" />
      <meta property="og:description" content="Manage your editdebt easily with Saldin." />
        
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <p className="max-w-[100vw] leading-relaxed text-muted-foreground">Dívida não encontrada</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Editar Dívida</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 overflow-y-auto pb-32">
        <FadeIn className="leading-relaxed mb-6">
          <Label className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground mb-2 block">Nome da dívida</Label>
          <Input placeholder="Ex: Cartão Nubank..." value={creditorName} onChange={(e) => setCreditorName(e.target.value)} maxLength={50} />
        </FadeIn>

        <FadeIn delay={0.05} className="leading-relaxed mb-6">
          <Label className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground mb-2 block">Valor total</Label>
          <CurrencyInput
            value={totalAmount}
            onChange={setTotalAmount}
            inputSize="lg"
          />
        </FadeIn>

        {!isRecurring && (
          <FadeIn delay={0.1} className="leading-relaxed mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground mb-2 block">Nº de parcelas</Label>
                <Input type="number" inputMode="numeric" value={installments} onChange={(e) => setInstallments(e.target.value)} min={1} max={120} className="h-12" />
              </div>
              <div>
                <Label className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground mb-2 block">Valor da parcela</Label>
                <CurrencyInput
                  value={installmentAmount}
                  onChange={setInstallmentAmount}
                />
              </div>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={0.15} className="leading-relaxed mb-6">
          <Label className="max-w-[100vw] leading-relaxed text-sm leading-relaxed text-muted-foreground mb-2 block">Data de vencimento</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-transparent border border-input rounded-md outline-none focus:ring-2 focus:ring-primary/50 text-sm leading-relaxed"
            />
          </div>
        </FadeIn>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-sm border-t border-border">
        <Button variant="warm" size="lg" className="w-full gap-2" onClick={handleSave} disabled={updateDebt.isPending}>
          {updateDebt.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default EditDebt;
