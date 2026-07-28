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

  useEffect(() => {
    if (reduceMotion) {
      setValue(to);
      return;
    }
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
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
