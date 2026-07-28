import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

type CountUpProps = {
  /** Final value to count up to. */
  to: number;
  /** Decimal places to display. */
  decimals?: number;
  /** Animation duration in seconds. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/**
 * Animates a number from zero to `to` the first time it scrolls into view.
 * Respects the user's reduced-motion preference by rendering the final value.
 */
export function CountUp({ to, decimals = 0, duration = 1.1, prefix, suffix, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);
  /**
   * Where the next tween starts. Zero on first reveal, then wherever the last
   * one landed — so a figure that changes while the user is on the screen
   * counts up from what they were reading, not from zero all over again.
   */
  const fromRef = useRef(reduceMotion ? to : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(to);
      fromRef.current = to;
      return;
    }
    if (!inView) return;
    const from = fromRef.current;
    if (from === to) return;
    const controls = animate(from, to, {
      // A small correction settles quickly; a first reveal takes the full run.
      duration: from === 0 ? duration : Math.min(duration, 0.5),
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
      onComplete: () => {
        fromRef.current = to;
      },
    });
    return () => {
      fromRef.current = to;
      controls.stop();
    };
  }, [inView, to, duration, reduceMotion]);

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
