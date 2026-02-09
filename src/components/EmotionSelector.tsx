import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldCheck, Target, Smile, Flame, ThumbsUp, ThumbsDown, LucideIcon } from "lucide-react";

export type EmotionCategory = "essential" | "obligation" | "pleasure" | "impulse";

interface EmotionOption {
  id: EmotionCategory;
  icon: LucideIcon;
  label: string;
  description: string;
}

const emotionOptions: EmotionOption[] = [
  {
    id: "essential",
    icon: ShieldCheck,
    label: "Essencial",
    description: "Necessidade básica",
  },
  {
    id: "obligation",
    icon: Target,
    label: "Obrigação",
    description: "Tinha que pagar",
  },
  {
    id: "pleasure",
    icon: Smile,
    label: "Prazer",
    description: "Me fez bem",
  },
  {
    id: "impulse",
    icon: Flame,
    label: "Impulso",
    description: "Não planejei",
  },
];

interface EmotionSelectorProps {
  value?: EmotionCategory;
  onChange: (value: EmotionCategory) => void;
}

export const EmotionSelector = ({ value, onChange }: EmotionSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {emotionOptions.map((option, index) => {
        const Icon = option.icon;
        return (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              value === option.id
                ? "border-transparent shadow-medium"
                : "bg-card border-border hover:border-muted-foreground/30"
            )}
            style={
              value === option.id
                ? {
                    backgroundColor: `hsl(var(--${option.id}))`,
                    color: `hsl(var(--${option.id}-foreground))`,
                  }
                : undefined
            }
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              value === option.id ? "bg-white/20" : "bg-muted"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="font-medium">{option.label}</p>
              <p
                className={cn(
                  "text-xs",
                  value === option.id ? "opacity-80" : "text-muted-foreground"
                )}
              >
                {option.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

interface ConfirmationSelectorProps {
  value?: boolean;
  onChange: (value: boolean) => void;
  question?: string;
}

export const ConfirmationSelector = ({
  value,
  onChange,
  question = "Você faria isso de novo hoje?",
}: ConfirmationSelectorProps) => {
  return (
    <div className="space-y-3">
      <p className="text-center text-muted-foreground">{question}</p>
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 font-medium",
            value === true
              ? "bg-essential text-essential-foreground border-transparent shadow-medium"
              : "bg-card border-border hover:border-essential/50"
          )}
        >
          <ThumbsUp className="w-5 h-5" />
          <span>Sim</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 font-medium",
            value === false
              ? "bg-impulse text-impulse-foreground border-transparent shadow-medium"
              : "bg-card border-border hover:border-impulse/50"
          )}
        >
          <ThumbsDown className="w-5 h-5" />
          <span>Não</span>
        </motion.button>
      </div>
    </div>
  );
};
