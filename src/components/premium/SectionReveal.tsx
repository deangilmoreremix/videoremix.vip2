import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: keyof JSX.IntrinsicElements;
}

const SectionReveal: React.FC<SectionRevealProps> = ({
  children,
  className = "",
  delay = 0,
  y = 24,
  as = "section",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] as any;

  return (
    <Component
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.55,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={className}
    >
      {children}
    </Component>
  );
};

export default SectionReveal;
