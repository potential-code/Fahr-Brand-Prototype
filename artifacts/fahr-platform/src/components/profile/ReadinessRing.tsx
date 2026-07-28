import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/CountUp";

type ReadinessRingProps = {
  /** 0-100 readiness score. */
  value: number;
  /** Diameter in pixels. */
  size?: number;
  caption?: string;
  /** Renders the dashed unmeasured state instead of a score. */
  empty?: boolean;
};

/**
 * The learner's overall readiness, drawn as an arc that sweeps to the score.
 * Sits on the dark profile hero, so the track is a white tint.
 */
export function ReadinessRing({ value, size = 132, caption = "Readiness", empty = false }: ReadinessRingProps) {
  const reduceMotion = useReducedMotion();
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }} data-testid="ring-readiness">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="9" className="stroke-white/15" />
        {!empty && (
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reduceMotion ? offset : circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: reduceMotion ? 0 : 1.3, ease: "easeOut" }}
          />
        )}
        {empty && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="6 10"
            className="stroke-white/35"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {empty ? (
          <span className="text-3xl font-bold leading-none text-white/50">—</span>
        ) : (
          <span className="text-3xl font-bold leading-none text-white tabular-nums">
            <CountUp to={value} suffix="%" />
          </span>
        )}
        <span className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-white/60">{caption}</span>
      </div>
    </div>
  );
}
