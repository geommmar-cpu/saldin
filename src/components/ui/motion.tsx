import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition(props: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("min-h-screen", props.className)}
      {...props}
    >
      {props.children}
    </motion.div>
  );
}

export function FadeIn(props: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: props.delay }}
      className={props.className}
      {...props}
    >
      {props.children}
    </motion.div>
  );
}

export function ScaleIn(props: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: props.delay }}
      className={props.className}
      {...props}
    >
      {props.children}
    </motion.div>
  );
}

export function SlideUp(props: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: props.delay }}
      className={props.className}
      {...props}
    >
      {props.children}
    </motion.div>
  );
}

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
