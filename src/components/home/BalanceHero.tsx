import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ChevronDown,
  Lock,
  PiggyBank,
  Info,
  Bitcoin,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BalanceBreakdown } from "@/lib/balanceCalculations";
import { AnimatedAmount } from "@/components/ui/motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";

interface BalanceHeroProps {
  balance: BalanceBreakdown;
  cryptoTotal?: number;
  cryptoEnabled?: boolean;
}

const chartConfig = {
  free: {
    label: "Bancos",
    color: "hsl(var(--essential))",
  },
  committed: {
    label: "Comprometido",
    color: "hsl(var(--impulse))",
  },
  saved: {
    label: "Guardado",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export const BalanceHero = ({ balance, cryptoTotal = 0, cryptoEnabled = false }: BalanceHeroProps) => {
  const [expanded, setExpanded] = useState(false);
  const patrimonioTotal = balance.saldoBruto + cryptoTotal;

  const total = Math.max(1, balance.saldoLivre) + balance.saldoComprometido + balance.saldoGuardado;

  const chartData = [
    { name: "free", value: Math.max(0, balance.saldoLivre), fill: "var(--color-free)" },
    { name: "committed", value: balance.saldoComprometido, fill: "var(--color-committed)" },
    { name: "saved", value: balance.saldoGuardado, fill: "var(--color-saved)" },
  ].filter(item => item.value > 0);

  return (
    <motion.div
      className="relative overflow-hidden p-8 rounded-[3rem] glass shadow-large border border-white/20 group"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Dynamic Animated Background Blurs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] opacity-30",
          balance.saldoLivre >= 0 ? "bg-essential" : "bg-destructive"
        )}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -30, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-24 -left-20 w-56 h-56 bg-accent/20 rounded-full blur-[70px] opacity-20"
      />

      {/* Top Section: Label & Badge */}
      <div className="relative flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-background/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-soft group-hover:scale-110 transition-transform duration-500">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="max-w-[100vw] leading-relaxed text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block mb-0.5">Saldo Disponível</span>
            <div className="flex items-center gap-1.5">
              <h4 className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold text-foreground/80 tracking-tight">Recursos em conta</h4>
              <Tooltip>
                <TooltipTrigger>
                  <div className="w-4 h-4 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                    <Info className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] glass p-4 rounded-2xl shadow-large border-primary/20">
                  <p className="max-w-[100vw] leading-relaxed text-xs font-bold text-primary mb-2 uppercase tracking-wider">Como calculamos?</p>
                  <p className="max-w-[100vw] leading-relaxed text-[11px] text-muted-foreground leading-relaxed">
                    Este é o seu **Saldo Livre**. Somamos tudo o que você tem e subtraímos o que já está comprometido com contas e dívidas este mês.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Status indicator pill */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors duration-500 shadow-sm",
            balance.saldoLivre >= 0
              ? "bg-essential/10 text-essential border-essential/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}
        >
          {balance.saldoLivre >= 0 ? "Consistente" : "Alerta de Fluxo"}
        </motion.div>
      </div>

      {/* Main Balance Display */}
      <div className="relative mb-8 text-center sm:text-left">
        <div className="relative inline-block">
          <AnimatedAmount
            value={balance.saldoLivre}
            className={cn(
              "text-5xl sm:text-7xl font-serif font-bold tracking-tight block tabular-nums leading-none",
              balance.saldoLivre >= 0 ? "text-foreground" : "text-destructive"
            )}
          />
          {/* Subtle underline gradient */}
          <div className={cn(
            "h-1.5 w-1/2 rounded-full mt-3 opacity-30 blur-sm mx-auto sm:mx-0",
            balance.saldoLivre >= 0 ? "bg-essential" : "bg-destructive"
          )} />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="group/btn flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-secondary/40 hover:bg-secondary/60 border border-border/40 transition-all active:scale-95"
        >
          <span className="font-bold uppercase tracking-[0.15em] text-[10px] text-muted-foreground group-hover/btn:text-foreground transition-colors">
            {expanded ? "Ocultar Composição" : "Análise de Saldo"}
          </span>
          <div className={cn(
            "p-1 rounded-full bg-background/50 shadow-soft transition-transform duration-500",
            expanded ? "rotate-180" : ""
          )}>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Quick stat icon */}
        <div className="flex gap-2">
          <div className="w-9 h-9 rounded-xl bg-essential/5 border border-essential/10 flex items-center justify-center">
            <TrendingUp className={cn("w-4 h-4", balance.saldoLivre >= 0 ? "text-essential" : "text-muted-foreground/30")} />
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-4 pt-6 border-t border-border/50"
          >
            {/* Donut Chart Visualization */}
            <div className="flex flex-col items-center">
              <div className="w-full relative py-2">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[160px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={75}
                      strokeWidth={5}
                      cornerRadius={8}
                      paddingAngle={5}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold font-serif"
                                >
                                  {Math.round((Math.max(0, balance.saldoLivre) / total) * 100)}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 20}
                                  className="fill-muted-foreground text-[10px] font-bold uppercase tracking-widest"
                                >
                                  Livre
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>

              {/* Legend area outside the SVG to avoid squashing */}
              <div className="w-full mt-2 px-6">
                <div className="flex flex-col gap-2.5">
                  {chartData.map((entry) => {
                    const config = chartConfig[entry.name as keyof typeof chartConfig];
                    const percentage = Math.round((entry.value / total) * 100);
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-xs transition-opacity hover:opacity-80">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <span className="max-w-[100vw] leading-relaxed text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            {config.label}
                          </span>
                        </div>
                        <span className="font-bold text-foreground">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* View description of distribution */}
            <div className="max-w-[100vw] leading-relaxed text-center px-4 pt-4 pb-2">
              <p className="max-w-[100vw] leading-relaxed text-xs text-muted-foreground leading-relaxed">
                Você tem <span className="max-w-[100vw] leading-relaxed text-essential font-bold font-sans">{Math.round((Math.max(0, balance.saldoLivre) / total) * 100)}%</span> do seu saldo total livre para uso imediato.
              </p>
            </div>

            {/* Composition Grid */}
            <div className="grid gap-3">
              {balance.saldoComprometido > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-impulse/10 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-impulse" />
                    </div>
                    <div>
                      <p className="max-w-[100vw] leading-relaxed text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Comprometido</p>
                      <AnimatedAmount
                        value={balance.saldoComprometido}
                        className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {balance.saldoGuardado > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-essential/10 flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-essential" />
                    </div>
                    <div>
                      <p className="max-w-[100vw] leading-relaxed text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Guardado</p>
                      <AnimatedAmount
                        value={balance.saldoGuardado}
                        className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cryptoEnabled && cryptoTotal > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F7931A]/5 border border-[#F7931A]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F7931A]/10 flex items-center justify-center">
                      <Bitcoin className="w-4 h-4 text-[#F7931A]" />
                    </div>
                    <div>
                      <p className="max-w-[100vw] leading-relaxed text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Criptoativos</p>
                      <AnimatedAmount
                        value={cryptoTotal}
                        className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Net Worth - Premium Style */}
            {cryptoEnabled && cryptoTotal > 0 && (
              <div className="p-4 rounded-[2rem] bg-gradient-to-r from-primary/10 to-accent/10 flex flex-col items-center gap-1">
                <p className="max-w-[100vw] leading-relaxed text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Patrimônio Real</p>
                <AnimatedAmount
                  value={patrimonioTotal}
                  className="max-w-[100vw] leading-relaxed text-xl font-serif font-bold text-primary"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
