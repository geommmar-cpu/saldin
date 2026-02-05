import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "highlight" | "warning";
  className?: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  variant = "default",
  className,
}: StatCardProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl p-5 transition-all duration-200",
        variant === "default" && "bg-card border border-border shadow-soft",
        variant === "highlight" && "gradient-warm text-primary-foreground shadow-medium",
        variant === "warning" && "bg-impulse/10 border-2 border-impulse/30",
        className
      )}
    >
      <p
        className={cn(
          "text-sm font-medium",
          variant === "highlight" ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {title}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <p
          className={cn(
            "font-serif text-3xl font-semibold tracking-tight",
            variant === "warning" && "text-impulse"
          )}
        >
          {value}
        </p>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              trend === "up" && "text-impulse",
              trend === "down" && "text-essential",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            <TrendIcon className="h-4 w-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      {subtitle && (
        <p
          className={cn(
            "mt-1 text-sm",
            variant === "highlight" ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
