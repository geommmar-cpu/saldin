import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, Calendar, Smartphone, CreditCard, MessageCircle, Pencil } from "lucide-react";
import { PeriodFilter, SourceFilter, EmotionFilter, ItemTypeFilter } from "@/types/expense";

interface FilterSheetProps {
  periodFilter: PeriodFilter;
  sourceFilter: SourceFilter;
  emotionFilter: EmotionFilter;
  typeFilter?: ItemTypeFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  onSourceChange: (source: SourceFilter) => void;
  onEmotionChange: (emotion: EmotionFilter) => void;
  onTypeChange?: (type: ItemTypeFilter) => void;
  onReset: () => void;
}

const periodOptions: { id: PeriodFilter; label: string }[] = [
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mês" },
  { id: "custom", label: "Personalizado" },
];

const sourceOptions: { id: SourceFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Todas", icon: Smartphone },
  { id: "manual", label: "Manual", icon: Pencil },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "bank", label: "Banco", icon: CreditCard },
];

const emotionOptions: { id: EmotionFilter; label: string; color: string }[] = [
  { id: "all", label: "Todas", color: "muted" },
  { id: "essential", label: "Essencial", color: "essential" },
  { id: "obligation", label: "Obrigação", color: "obligation" },
  { id: "pleasure", label: "Prazer", color: "pleasure" },
  { id: "impulse", label: "Impulso", color: "impulse" },
];

const typeOptions: { id: ItemTypeFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "expense", label: "Gastos" },
  { id: "income", label: "Receitas" },
  { id: "debt", label: "Dívidas" },
];

export const FilterSheet = ({
  periodFilter,
  sourceFilter,
  emotionFilter,
  typeFilter = "all",
  onPeriodChange,
  onSourceChange,
  onEmotionChange,
  onTypeChange,
  onReset,
}: FilterSheetProps) => {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    periodFilter !== "month" || sourceFilter !== "all" || emotionFilter !== "all" || typeFilter !== "all";

  const handleApply = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="soft" size="icon" className="relative">
          <Filter className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-serif text-xl">Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Period Filter */}
          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </p>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPeriodChange(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    periodFilter === option.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          {onTypeChange && (
            <div>
              <p className="text-sm font-medium mb-3">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTypeChange(option.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      typeFilter === option.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Source Filter */}
          <div>
            <p className="text-sm font-medium mb-3">Origem</p>
            <div className="flex flex-wrap gap-2">
              {sourceOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSourceChange(option.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                      sourceFilter === option.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Emotion Filter */}
          <div>
            <p className="text-sm font-medium mb-3">Categoria emocional</p>
            <div className="flex flex-wrap gap-2">
              {emotionOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEmotionChange(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    emotionFilter === option.id
                      ? option.color === "muted"
                        ? "bg-primary text-primary-foreground"
                        : `bg-${option.color} text-primary-foreground`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  style={
                    emotionFilter === option.id && option.color !== "muted"
                      ? { backgroundColor: `hsl(var(--${option.color}))` }
                      : undefined
                  }
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={onReset}
              disabled={!hasActiveFilters}
            >
              Limpar filtros
            </Button>
            <Button variant="warm" className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
