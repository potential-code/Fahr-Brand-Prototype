import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { STAGES, type StageId } from "@/lib/workplaceProject";

type Props = {
  current: StageId;
  /** Stage ids whose readiness criteria are all met. */
  complete: Set<StageId>;
  onSelect: (id: StageId) => void;
};

/** The staged build, always visible so the learner knows where they are and can move back. */
export function StageStepper({ current, complete, onSelect }: Props) {
  const currentIndex = STAGES.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Project stages" className="rounded-xl border border-border bg-card p-2">
      <ol className="flex flex-col gap-1 md:flex-row md:items-stretch md:gap-0">
        {STAGES.map((stage, i) => {
          const isCurrent = stage.id === current;
          const isDone = complete.has(stage.id);
          const isPast = i < currentIndex;

          return (
            <li key={stage.id} className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onSelect(stage.id)}
                aria-current={isCurrent ? "step" : undefined}
                data-testid={`step-${stage.id}`}
                className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start transition-colors ${
                  isCurrent ? "bg-primary/8" : "hover:bg-muted"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-2 border-primary text-primary"
                        : isPast
                          ? "border border-accent/50 text-accent"
                          : "border border-border text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-xs font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    {stage.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {isDone ? "Complete" : isCurrent ? "In progress" : "Not started"}
                  </span>
                </span>
                {isCurrent && (
                  <motion.span
                    layoutId="stage-underline"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
