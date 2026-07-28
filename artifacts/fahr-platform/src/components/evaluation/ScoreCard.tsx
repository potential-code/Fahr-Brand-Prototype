import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import type { EvaluationDimension } from "@/lib/workplaceProject";

type Props = {
  dimensions: EvaluationDimension[];
  overall: number;
  verdict: string;
};

function band(value: number): { text: string; bar: string } {
  if (value >= 90) return { text: "text-primary", bar: "bg-primary" };
  if (value >= 75) return { text: "text-accent", bar: "bg-accent" };
  return { text: "text-muted-foreground", bar: "bg-muted-foreground/60" };
}

/** The four evaluation dimensions: scores reveal on load, evidence opens on demand. */
export function ScoreCard({ dimensions, overall, verdict }: Props) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-5 border-b border-border p-5">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-primary/15 bg-primary/5">
          <span className="text-2xl font-bold text-primary">
            <CountUp to={overall} />
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">overall</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Evaluation scorecard</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{verdict}</p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {dimensions.map((dimension, i) => {
          const isOpen = open === dimension.id;
          const tone = band(dimension.value);

          return (
            <li key={dimension.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : dimension.id)}
                aria-expanded={isOpen}
                className="w-full px-5 py-4 text-start transition-colors hover:bg-muted/40"
                data-testid={`dimension-${dimension.id}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{dimension.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{dimension.value}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`h-full rounded-full ${tone.bar}`}
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: `${dimension.value}%` }}
                    transition={{ duration: 0.9, delay: reduceMotion ? 0 : 0.15 + i * 0.14, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{dimension.summary}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                    {isOpen ? "Hide evidence" : "See evidence"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mx-5 mb-4 rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Assessed by {dimension.assessedBy}
                      </p>
                      <ul className="mt-2.5 space-y-2">
                        {dimension.evidence.map((line) => (
                          <li key={line} className="flex gap-2 text-xs leading-relaxed text-foreground">
                            <Quote className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
