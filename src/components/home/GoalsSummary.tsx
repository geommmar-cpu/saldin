import { motion } from "framer-motion";
import {
  PiggyBank,
  Plus,
  Plane,
  Car,
  Home,
  Laptop,
  GraduationCap,
  Gamepad2,
  Shirt,
  Heart,
  Target,
  ShieldCheck,
  Smartphone,
  Bike
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/balanceCalculations";
import type { Goal } from "@/types/goal";

interface GoalsSummaryProps {
  goals: Goal[];
  totalSaved: number;
  totalTarget: number;
}

// Helper to determine theme based on goal name
const getGoalTheme = (name: string) => {
  const lowerName = name.toLowerCase();

  // Images from Unsplash (w=400 for thumbnails)
  if (lowerName.includes("viagem") || lowerName.includes("férias") || lowerName.includes("trip") || lowerName.includes("passeio") || lowerName.includes("mundo") || lowerName.includes("praia")) {
    return {
      icon: Plane,
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=500&auto=format&fit=crop", // Airplane wing
      overlay: "bg-blue-900/40"
    };
  }
  if (lowerName.includes("carro") || lowerName.includes("moto") || lowerName.includes("veículo") || lowerName.includes("uber") || lowerName.includes("automóvel")) {
    return {
      icon: Car,
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=500&auto=format&fit=crop", // Modern car
      overlay: "bg-slate-900/50"
    };
  }
  if (lowerName.includes("casa") || lowerName.includes("apt") || lowerName.includes("imóvel") || lowerName.includes("reforma") || lowerName.includes("móveis") || lowerName.includes("construção")) {
    return {
      icon: Home,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=500&auto=format&fit=crop", // Modern house interior
      overlay: "bg-orange-900/40"
    };
  }
  if (lowerName.includes("reserva") || lowerName.includes("emergência") || lowerName.includes("poupança") || lowerName.includes("investimento") || lowerName.includes("milhão")) {
    return {
      icon: ShieldCheck,
      image: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=500&auto=format&fit=crop", // Coins/Money plant
      overlay: "bg-emerald-900/50"
    };
  }
  if (lowerName.includes("pc") || lowerName.includes("computador") || lowerName.includes("notebook") || lowerName.includes("tech") || lowerName.includes("setup")) {
    return {
      icon: Laptop,
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=500&auto=format&fit=crop", // Laptop code
      overlay: "bg-indigo-900/60"
    };
  }
  if (lowerName.includes("celular") || lowerName.includes("iphone") || lowerName.includes("samsung")) {
    return {
      icon: Smartphone,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500&auto=format&fit=crop", // Mobile phone
      overlay: "bg-zinc-900/50"
    };
  }
  if (lowerName.includes("estudo") || lowerName.includes("faculdade") || lowerName.includes("curso") || lowerName.includes("pós")) {
    return {
      icon: GraduationCap,
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=500&auto=format&fit=crop", // Graduation
      overlay: "bg-blue-900/50"
    };
  }
  if (lowerName.includes("casamento") || lowerName.includes("festa") || lowerName.includes("aliança")) {
    return {
      icon: Heart,
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=500&auto=format&fit=crop", // Wedding ring/flowers
      overlay: "bg-pink-900/40"
    };
  }

  // Default Theme (Abstract)
  return {
    icon: Target,
    image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=500&auto=format&fit=crop", // Abstract gradient
    overlay: "bg-teal-900/40"
  };
};

export function GoalsSummary({ goals, totalSaved, totalTarget }: GoalsSummaryProps) {
  const navigate = useNavigate();
  // Filter only active goals
  const activeGoals = goals.filter(g => g.status === "in_progress" || !g.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-1 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="max-w-[100vw] leading-relaxed text-sm leading-relaxed font-semibold text-foreground uppercase tracking-wider">Minhas Metas</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-primary font-medium hover:underline p-0"
          onClick={() => navigate("/goals")}
        >
          Ver todas
        </Button>
      </div>

      <div
        className="w-full max-w-full pb-6 pt-2"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex gap-4 snap-x snap-mandatory min-w-full w-max px-4">
          {activeGoals.map((goal) => {
            const theme = getGoalTheme(goal.name);
            const Icon = theme.icon;
            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isCompleted = progress >= 100;

            return (
              <motion.div
                key={goal.id}
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="snap-center shrink-0 w-[170px] h-[220px] rounded-[2rem] p-5 relative overflow-hidden shadow-large group cursor-pointer border border-white/10 active:scale-95 transition-transform"
              >
                {/* Image background with zoom effect on hover */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-125"
                  style={{ backgroundImage: `url(${theme.image})` }}
                />

                {/* Layered Overlays for depth */}
                <div className={cn(
                  "absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-20",
                  theme.overlay
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                {/* Glow highlight on top */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                  {/* Category/Icon Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-background/15 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-soft group-hover:rotate-12 transition-transform duration-500">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    {isCompleted && (
                      <div className="bg-essential px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-medium">
                        Concluída
                      </div>
                    )}
                  </div>

                  {/* Goal Name */}
                  <div className="mt-4">
                    <p className="font-bold text-lg leading-relaxed leading-tight text-white drop-shadow-lg group-hover:translate-x-1 transition-transform">
                      {goal.name}
                    </p>
                  </div>

                  {/* Footer with Glowing Progress */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2 px-0.5">
                      <span className="max-w-[100vw] leading-relaxed text-[10px] text-white font-bold opacity-100">
                        {Math.round(progress)}%
                      </span>
                      <span className="max-w-[100vw] leading-relaxed text-[10px] text-white/70 font-medium">
                        {formatCurrency(goal.target_amount)}
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-2 w-full bg-background/15 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="relative h-full bg-primary rounded-full"
                      >
                        {/* Glowing tip */}
                        <div className="absolute top-0 right-0 bottom-0 w-2 bg-background blur-[4px] opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                      </motion.div>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                      <PiggyBank className="w-3 h-3 text-white/50 shrink-0" />
                      <p className="max-w-[100vw] leading-relaxed text-[9px] text-white/60 truncate font-semibold">
                        {formatCurrency(goal.current_amount)} salvos
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add New Goal Card */}
          <div
            onClick={() => navigate("/goals/add")}
            className="snap-center shrink-0 w-[60px] h-[200px] rounded-[1.5rem] border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="max-w-[100vw] leading-relaxed text-[10px] font-medium text-muted-foreground text-center leading-tight">
              Nova<br />Meta
            </span>
          </div>

          {/* Spacer so last item isn't flush with edge */}
          <div className="w-2 shrink-0" />
        </div>
      </div>
    </div>
  );
};
