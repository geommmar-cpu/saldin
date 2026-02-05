import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validatePassword, getPasswordStrength, getStrengthLabel } from "@/lib/passwordValidation";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthChecklistProps {
  password: string;
  className?: string;
}

export const PasswordStrengthChecklist = ({ password, className }: PasswordStrengthChecklistProps) => {
  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);
  const strengthInfo = getStrengthLabel(strength);

  if (!password) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn("font-medium", strengthInfo.color)}>
            {strengthInfo.label}
          </span>
        </div>
        <Progress 
          value={strength} 
          className={cn(
            "h-1.5",
            strength < 40 && "[&>div]:bg-destructive",
            strength >= 40 && strength < 80 && "[&>div]:bg-yellow-500",
            strength >= 80 && strength < 100 && "[&>div]:bg-primary",
            strength === 100 && "[&>div]:bg-green-500"
          )}
        />
      </div>

      {/* Common password warning */}
      {validation.isCommonPassword && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Esta senha é muito comum e fácil de adivinhar</span>
        </div>
      )}

      {/* Rules checklist */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground mb-2">Requisitos:</p>
        {validation.rules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              rule.passed ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
            )}
          >
            {rule.passed ? (
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/50" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthChecklist;
