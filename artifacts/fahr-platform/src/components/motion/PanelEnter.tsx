import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION } from "./motionTokens";

type PanelEnterProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait, so the panel itself finishes opening first. */
  delay?: number;
};

/**
 * Enter animation for the contents of a sheet, drawer or dialog.
 *
 * The shell of a shadcn `Sheet` / `Dialog` already animates via its own
 * data-state classes — animating it again fights that transition. This wraps
 * the *inside* of an open panel so detail views settle in after it opens.
 */
export function PanelEnter({ children, className, delay = 0.08 }: PanelEnterProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: MOTION.travel.card }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.out, delay: reduceMotion ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
