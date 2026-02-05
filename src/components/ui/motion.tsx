import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition = ({
  children,
  className,
  ...props
}: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("min-h-screen", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FadeIn = ({
  children,
  className,
  delay = 0,
  ...props
}: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({
  children,
  className,
  delay = 0,
  ...props
}: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const SlideUp = ({
  children,
  className,
  delay = 0,
  ...props
}: PageTransitionProps & { delay?: number }) => {
  return (
    <motion.div
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
};
