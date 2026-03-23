import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, AlertTriangle, TrendingUp, Calendar, Zap, CreditCard, Target, Loader2, ChevronRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useSmartAlerts, type SmartAlert, type AlertSeverity } from "@/hooks/useAlerts";

const alertStyles: Record<AlertSeverity, { bg: string; border: string; icon: string }> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "bg-red-500/20 text-red-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "bg-amber-500/20 text-amber-500",
  },
  info: {
    bg: "bg-secondary",
    border: "border-border",
    icon: "bg-muted text-muted-foreground",
  },
};

function getAlertIcon(category: SmartAlert["category"], type: AlertSeverity) {
  if (category === "credit_card") return CreditCard;
  if (category === "receivable") return TrendingUp;
  if (category === "goal") return Target;
  if (type === "critical") return Zap;
  return Calendar;
}

function AlertCard({ alert, index }: { alert: SmartAlert; index: number }) {
  const navigate = useNavigate();
  const styles = alertStyles[alert.type];
  const Icon = getAlertIcon(alert.category, alert.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`p-4 rounded-xl border-2 ${styles.bg} ${styles.border}`}
    >
      <div className="flex gap-3 items-start">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm leading-tight">{alert.title}</h3>
            {alert.type === "critical" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-semibold shrink-0">
                Urgente
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{alert.message}</p>
          {alert.actionPath && (
            <button
              onClick={() => navigate(alert.actionPath!)}
              className="mt-2 text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              {alert.actionLabel} <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const Alerts = () => {
  const navigate = useNavigate();
  const { data: alerts = [], isLoading, refetch, isFetching } = useSmartAlerts();

  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <title>Saldin | Alertas</title>
      <meta name="description" content="Alertas inteligentes do Saldin: faturas, cobranças e metas." />

      {/* Header */}
      <header className="px-5 pt-safe-top sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="pt-4 pb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold">Alertas</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isLoading ? "Verificando..." : `${alerts.length} alerta${alerts.length !== 1 ? "s" : ""} ativo${alerts.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Summary pills */}
        {!isLoading && alerts.length > 0 && (
          <FadeIn>
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold border border-red-500/20">
                  <Zap className="w-3 h-3" /> {criticalCount} urgente{criticalCount > 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" /> {warningCount} atenção
                </span>
              )}
            </div>
          </FadeIn>
        )}

        {/* Alert list */}
        {!isLoading && alerts.map((alert, index) => (
          <AlertCard key={alert.id} alert={alert} index={index} />
        ))}

        {/* Empty state */}
        {!isLoading && alerts.length === 0 && (
          <FadeIn delay={0.1}>
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-medium mb-2">Tudo em dia! ✅</p>
              <p className="text-muted-foreground text-sm">
                Nenhuma fatura vencendo, nenhuma cobrança pendente.<br />
                Seu financeiro está sob controle.
              </p>
            </div>
          </FadeIn>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Alerts;
