import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import type { Readiness, StageId } from "@/lib/workplaceProject";

type Props = {
  readiness: Readiness;
  onJump: (stage: StageId) => void;
};

/** How close the brief is to submittable, and precisely what is holding it back. */
export function ReadinessMeter({ readiness, onJump }: Props) {
  const reduceMotion = useReducedMotion();
  const { percent, items, submittable, nextUp } = readiness;

  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-[86px] w-[86px] shrink-0">
          <svg viewBox="0 0 86 86" className="h-full w-full -rotate-90">
            <circle cx="43" cy="43" r={radius} className="fill-none stroke-muted" strokeWidth="8" />
            <motion.circle
              cx="43"
              cy="43"
              r={radius}
              className={`fill-none ${submittable ? "stroke-primary" : "stroke-accent"}`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground" data-testid="text-readiness">
              {percent}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">ready</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Submission readiness</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {submittable
              ? "Everything an evaluator needs is in the brief. You can submit."
              : nextUp
                ? `Next: ${nextUp.label.toLowerCase()}.`
                : ""}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-border pt-4">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onJump(item.stage)}
              className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-start transition-colors hover:bg-muted"
            >
              {item.done ? (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              )}
              <span className="min-w-0">
                <span className={`block text-xs font-medium ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {item.label}
                </span>
                {!item.done && <span className="block text-[11px] text-muted-foreground">{item.hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
