import { motion } from "framer-motion";

interface AmountDisplayProps {
  amount: string;
  label?: string;
}

/**
 * AmountDisplay - Exibe o valor formatado com animação
 * Suporta tanto formato auto-formatado (1.234,56) quanto raw digits
 */
export const AmountDisplay = ({ amount, label = "Valor" }: AmountDisplayProps) => {
  const displayValue = amount || "0,00";

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl text-muted-foreground">R$</span>
        <motion.span
          key={amount}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="font-serif text-6xl font-semibold tabular-nums"
        >
          {displayValue}
        </motion.span>
      </div>
    </div>
  );
};

export default AmountDisplay;
