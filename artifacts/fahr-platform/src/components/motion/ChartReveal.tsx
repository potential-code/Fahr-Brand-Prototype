import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MOTION, prefersReducedMotion } from "./motionTokens";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ChartRevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * `wipe` draws the plot in from the left — right for time series and bars.
   * `rise` grows it from the baseline — right for distributions and columns.
   */
  direction?: "wipe" | "rise";
  delay?: number;
};

/**
 * Draw-in for a chart, run on the wrapper with GSAP.
 *
 * Section-level motion only: never put framer-motion on the same node, and let
 * the chart's own bars and points handle any inner animation.
 */
export function ChartReveal({ children, className, direction = "wipe", delay = 0 }: ChartRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      const from =
        direction === "wipe"
          ? { clipPath: "inset(0 100% 0 0)", opacity: 0.4 }
          : { clipPath: "inset(100% 0 0 0)", opacity: 0.4 };

      gsap.fromTo(
        el,
        from,
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          duration: MOTION.duration.slow + 0.3,
          delay,
          ease: MOTION.ease.gsapOut,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    },
    { scope: ref, dependencies: [direction, delay] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
