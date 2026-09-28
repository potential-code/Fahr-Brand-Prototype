import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, CornerUpLeft, Minus } from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import { journeyFor, type JourneyStep, type JourneyTone } from "@/lib/federal/journey";
import type { Submission } from "@/lib/federal/model";

const TONE_CHIP: Record<JourneyTone, string> = {
  action: "border-accent/40 bg-accent/10 text-accent",
  waiting: "border-primary/25 bg-primary/5 text-primary",
  live: "border-green-200 bg-green-50 text-green-700",
};

const TONE_LABEL: Record<JourneyTone, string> = {
  action: "Action required",
  waiting: "In review",
  live: "Live",
};

function StepDot({ step }: { step: JourneyStep }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors";
  switch (step.status) {
    case "done":
      return (
        <span className={`${base} bg-primary text-primary-foreground`}>
          <Check className="h-3.5 w-3.5" />
        </span>
      );
    case "current":
      return (
        <span className={`${base} relative border-2 border-primary bg-card text-primary`}>
          <span className="absolute inset-0 animate-ping rounded-full border border-primary/40 motion-reduce:hidden" />
          <span className="h-2 w-2 rounded-full bg-primary" />
        </span>
      );
    case "returned":
      return (
        <span className={`${base} border-2 border-accent bg-accent/10 text-accent`}>
          <CornerUpLeft className="h-3.5 w-3.5" />
        </span>
      );
    case "skipped":
      return (
        <span className={`${base} border border-dashed border-border text-muted-foreground`}>
          <Minus className="h-3.5 w-3.5" />
        </span>
      );
    default:
      return <span className={`${base} border border-border bg-card text-muted-foreground`} />;
  }
}

const STEP_CAPTION: Record<JourneyStep["status"], string> = {
  done: "Done",
  current: "Now",
  returned: "Sent back",
  skipped: "Not needed",
  upcoming: "Next",
};

/**
 * Where a workplace project is in Submitted → Department manager → Entity → FAHR →
 * Live. The same tracker renders on every dashboard, so the project always
 * reads the same whoever is looking at it.
 */
export function ProjectJourney({
  submission,
  variant = "full",
  className = "",
}: {
  submission: Submission;
  variant?: "full" | "compact";
  className?: string;
}) {
  const { approvals, getPerson } = useFederalData();
  const reduceMotion = useReducedMotion();
  const learner = getPerson(submission.personId);
  const journey = journeyFor(submission, approvals, { learner: learner?.name });

  if (variant === "compact") {
    return (
      <div className={`space-y-1.5 ${className}`} data-testid={`journey-${submission.id}`}>
        <ol className="flex items-center gap-1" aria-label="Project progress">
          {journey.steps.map((step, i) => (
            <li key={step.id} className="flex flex-1 items-center gap-1" title={`${step.label}: ${STEP_CAPTION[step.status]}`}>
              <span
                data-status={step.status}
                className={`h-1.5 flex-1 rounded-full ${
                  step.status === "done"
                    ? "bg-primary"
                    : step.status === "current"
                      ? "bg-primary/45"
                      : step.status === "returned"
                        ? "bg-accent"
                        : step.status === "skipped"
                          ? "bg-border/60"
                          : "bg-border"
                }`}
              />
              {i < journey.steps.length - 1 && <span className="sr-only">then</span>}
            </li>
          ))}
        </ol>
        <p className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{journey.headline}</span>
          <span className="shrink-0 font-medium text-foreground">{journey.owner}</span>
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`} data-testid={`journey-${submission.id}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{journey.headline}</p>
          <p className="text-xs text-muted-foreground">
            {journey.tone === "live" ? "In service" : <>Now with <span className="font-medium text-foreground">{journey.owner}</span></>}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CHIP[journey.tone]}`}
          data-testid={`journey-tone-${submission.id}`}
        >
          {TONE_LABEL[journey.tone]}
        </span>
      </div>

      <ol className="grid grid-cols-5 gap-1" aria-label="Project progress">
        {journey.steps.map((step, i) => (
          <li
            key={step.id}
            className="relative flex flex-col items-center text-center"
            data-testid={`journey-step-${step.id}`}
            data-status={step.status}
            aria-current={step.status === "current" ? "step" : undefined}
          >
            {i > 0 && (
              <span aria-hidden className="absolute end-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 bg-border">
                <motion.span
                  className={`block h-full origin-left rtl:origin-right ${step.status === "returned" ? "bg-accent" : "bg-primary"}`}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: step.status === "upcoming" || step.status === "skipped" ? 0 : 1 }}
                  transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.08 }}
                />
              </span>
            )}
            <span className="relative z-10">
              <StepDot step={step} />
            </span>
            <span className={`mt-1.5 text-[11px] font-semibold ${step.status === "current" ? "text-primary" : "text-foreground"}`}>
              {step.label}
            </span>
            <span className={`text-[10px] ${step.status === "returned" ? "text-accent" : "text-muted-foreground"}`}>
              {STEP_CAPTION[step.status]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
