import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  MessageCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useReceivableById, useUpdateReceivable, useDeleteReceivable } from "@/hooks/useReceivables";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

type ReceivableStatus = "pending" | "received" | "cancelled";

const statusConfig: Record<ReceivableStatus, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { 
    label: "Em aberto", 
    color: "text-accent", 
    bgColor: "bg-accent/10",
    icon: Clock 
  },
  received: { 
    label: "Recebido", 
    color: "text-essential", 
    bgColor: "bg-essential/10",
    icon: CheckCircle2 
  },
  cancelled: { 
    label: "Cancelado", 
    color: "text-muted-foreground", 
    bgColor: "bg-muted",
    icon: Clock 
  },
};

const getDueDateInfo = (dueDate: Date | null) => {
  if (!dueDate) return { isOverdue: false, isDueSoon: false, daysText: "Sem data" };
  
  const today = new Date();
  const daysUntilDue = differenceInDays(dueDate, today);
  
  if (daysUntilDue < 0) {
    return { isOverdue: true, isDueSoon: false, daysText: `${Math.abs(daysUntilDue)} dias atrasado` };
  } else if (daysUntilDue === 0) {
    return { isOverdue: false, isDueSoon: true, daysText: "Vence hoje" };
  } else if (daysUntilDue <= 3) {
    return { isOverdue: false, isDueSoon: true, daysText: `Vence em ${daysUntilDue} dia${daysUntilDue > 1 ? "s" : ""}` };
  }
  return { isOverdue: false, isDueSoon: false, daysText: `Vence em ${daysUntilDue} dias` };
};

const ReceivableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: receivable, isLoading } = useReceivableById(id);
  const updateReceivable = useUpdateReceivable();
  const deleteReceivable = useDeleteReceivable();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const dueDateInfo = useMemo(() => {
    if (!receivable?.due_date) return { isOverdue: false, isDueSoon: false, daysText: "Sem data" };
    return getDueDateInfo(new Date(receivable.due_date));
  }, [receivable]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleMarkAsReceived = async () => {
    if (!id || !receivable) return;

    try {
      await updateReceivable.mutateAsync({
        id,
        status: "received",
        received_at: new Date().toISOString(),
      });
      toast.success("Valor marcado como recebido!");
      navigate("/");
    } catch (error) {
      console.error("Error marking as received:", error);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteReceivable.mutateAsync(id);
      setShowDeleteDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error deleting receivable:", error);
    }
  };

  const handleSendReminder = () => {
    if (!receivable) return;
    
    const formattedAmount = formatCurrency(Number(receivable.amount));
    const formattedDate = receivable.due_date 
      ? format(new Date(receivable.due_date), "dd/MM/yyyy")
      : "a combinar";
    
    const message = dueDateInfo.isOverdue
      ? `Olá ${receivable.debtor_name}! Tudo bem? Passando para lembrar sobre o valor de ${formattedAmount}${receivable.description ? ` referente a "${receivable.description}"` : ""}. O pagamento estava previsto para ${formattedDate}. Consegue me retornar sobre isso?`
      : `Olá ${receivable.debtor_name}! Tudo bem? Passando para lembrar sobre o valor de ${formattedAmount}${receivable.description ? ` referente a "${receivable.description}"` : ""}, combinado para ${formattedDate}. Só para confirmar que está tudo certo!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    
    toast.success("WhatsApp aberto! Selecione o contato.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!receivable) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-muted-foreground mb-4">Valor a receber não encontrado</p>
        <Button variant="ghost" onClick={() => navigate("/")}>
          Voltar
        </Button>
      </div>
    );
  }

  const config = statusConfig[receivable.status as ReceivableStatus] || statusConfig.pending;
  const StatusIcon = config.icon;
  const isOverdue = dueDateInfo.isOverdue;
  const allReceived = receivable.status === "received";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-4">
          <FadeIn>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-serif text-2xl font-semibold flex-1">
                Detalhes
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/receivables/${id}/edit`)}
              >
                <Edit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </header>

      <main className="px-5 pb-8 space-y-6">
        {/* Main Card */}
        <FadeIn delay={0.05}>
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-2xl font-semibold">
                  {receivable.debtor_name}
                </p>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm mt-1",
                  allReceived ? statusConfig.received.bgColor : isOverdue ? "bg-impulse/10" : config.bgColor
                )}>
                  {allReceived ? (
                    <CheckCircle2 className="w-4 h-4 text-essential" />
                  ) : (
                    <StatusIcon className={cn("w-4 h-4", isOverdue ? "text-impulse" : config.color)} />
                  )}
                  <span className={allReceived ? "text-essential" : isOverdue ? "text-impulse" : config.color}>
                    {allReceived ? "Quitado" : isOverdue ? "Atrasado" : config.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center py-6 border-y border-border">
              <p className="text-sm text-muted-foreground mb-1">Valor a receber</p>
              <p className="font-serif text-4xl font-semibold text-essential">
                {formatCurrency(Number(receivable.amount))}
              </p>
            </div>

            {/* Details */}
            <div className="pt-6 space-y-4">
              {/* Due Date */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isOverdue && !allReceived ? "bg-impulse/10" : "bg-muted"
                )}>
                  <Calendar className={cn(
                    "w-5 h-5",
                    isOverdue && !allReceived ? "text-impulse" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Data combinada</p>
                  <p className={cn(
                    "font-medium",
                    isOverdue && !allReceived && "text-impulse"
                  )}>
                    {allReceived 
                      ? "Recebido" 
                      : receivable.due_date 
                        ? format(new Date(receivable.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : "Sem data definida"}
                  </p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Registrado em</p>
                  <p className="font-medium">
                    {format(new Date(receivable.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Description */}
              {receivable.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-foreground">{receivable.description}</p>
                </div>
              )}
            </div>
          </Card>
        </FadeIn>

        {/* Action Buttons */}
        {!allReceived && (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-base gap-2"
                onClick={handleMarkAsReceived}
                disabled={updateReceivable.isPending}
              >
                <CheckCircle2 className="w-5 h-5" />
                Marcar como recebido
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-base gap-2"
                onClick={handleSendReminder}
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                Enviar cobrança via WhatsApp
              </Button>
            </div>
          </FadeIn>
        )}
      </main>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Excluir valor a receber?"
        description="Esta ação não pode ser desfeita."
        isLoading={deleteReceivable.isPending}
        entityName="valor a receber"
      />
    </div>
  );
};

export default ReceivableDetail;
