import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, AlertTriangle, TrendingUp, Calendar, Zap } from "lucide-react";
import { motion } from "framer-motion";

// Mock alerts data - this page shows static/mock content for now
// A future version could create an alerts table in the database

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
}

const alertStyles = {
  critical: {
    bg: "bg-impulse/10",
    border: "border-impulse/30",
    icon: "bg-impulse/20 text-impulse",
  },
  warning: {
    bg: "bg-accent/10",
    border: "border-accent/30",
    icon: "bg-accent/20 text-accent",
  },
  info: {
    bg: "bg-secondary",
    border: "border-border",
    icon: "bg-muted text-muted-foreground",
  },
};

const alertIcons = {
  critical: Zap,
  warning: TrendingUp,
  info: Calendar,
};

// Empty alerts for now - can be populated later
const mockAlerts: Alert[] = [];

export const Alerts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="pt-4 pb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-xl font-semibold">Alertas</h1>
            <p className="text-sm text-muted-foreground">
              {mockAlerts.length} alerta{mockAlerts.length !== 1 ? "s" : ""} ativo{mockAlerts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-4">
        <FadeIn>
          <p className="text-muted-foreground text-sm">
            Alertas críticos não podem ser desativados. Eles existem para te proteger.
          </p>
        </FadeIn>

        {mockAlerts.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-essential/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-essential" />
              </div>
              <p className="font-medium mb-2">Nenhum alerta</p>
              <p className="text-muted-foreground">
                Você não tem alertas no momento.
              </p>
            </div>
          </FadeIn>
        ) : (
          mockAlerts.map((alert, index) => {
            const styles = alertStyles[alert.type];
            const Icon = alertIcons[alert.type] || AlertTriangle;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 ${styles.bg} ${styles.border}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{alert.title}</h3>
                      {alert.type === "critical" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-impulse text-impulse-foreground">
                          Crítico
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Alerts;
