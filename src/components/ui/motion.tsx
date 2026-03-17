import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  function PageTransition({ children, className, ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn("min-h-screen", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

export const FadeIn = React.forwardRef<HTMLDivElement, PageTransitionProps & { delay?: number }>(
  function FadeIn({ children, className, delay = 0, ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

export const ScaleIn = React.forwardRef<HTMLDivElement, PageTransitionProps & { delay?: number }>(
  function ScaleIn({ children, className, delay = 0, ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

export const SlideUp = React.forwardRef<HTMLDivElement, PageTransitionProps & { delay?: number }>(
  function SlideUp({ children, className, delay = 0, ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ duration: 0.4, ease: "easeOut", delay }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

export function AnimatedAmount({
  value,
  className,
  prefix = "R$ "
}: {
  value: number;
  className?: string;
  prefix?: string;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const start = displayValue;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      const current = start + (end - start) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, displayValue]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
