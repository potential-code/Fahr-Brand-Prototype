import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION } from "./motionTokens";

type PageEnterProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before the page settles into place. */
  delay?: number;
};

/**
 * Page-level enter animation for admin screens: the content lifts into place
 * once, on mount. Sections inside still reveal on scroll with `ScrollReveal`.
 */
export function PageEnter({ children, className, delay = 0 }: PageEnterProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: MOTION.travel.page }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.out, delay }}
    >
      {children}
    </motion.div>
  );
}
