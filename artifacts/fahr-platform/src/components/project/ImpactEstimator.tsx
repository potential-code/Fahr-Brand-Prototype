import React from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import type { ImpactEstimate, ProjectDraft } from "@/lib/workplaceProject";

type Props = {
  draft: ProjectDraft;
  impact: ImpactEstimate;
  onChange: (patch: Partial<ProjectDraft>) => void;
  disabled?: boolean;
};

function Figure({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
      <motion.p
        key={value}
        initial={{ opacity: 0.35, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-xl font-bold text-foreground tabular-nums"
      >
        {value.toLocaleString("en-US")}
        <span className="ms-1 text-xs font-medium text-muted-foreground">{unit}</span>
      </motion.p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

/** Live estimate of what the project returns, recalculated as the learner drags. */
export function ImpactEstimator({ draft, impact, onChange, disabled = false }: Props) {
  const rows: { key: keyof ProjectDraft; label: string; value: number; min: number; max: number; step: number; suffix: string }[] = [
    { key: "hoursPerWeek", label: "Hours the task takes each person, per week", value: draft.hoursPerWeek, min: 1, max: 20, step: 1, suffix: "h" },
    { key: "peopleAffected", label: "People who do this task", value: draft.peopleAffected, min: 1, max: 60, step: 1, suffix: "" },
    { key: "automationPct", label: "Share of the task the assistant carries", value: draft.automationPct, min: 10, max: 95, step: 5, suffix: "%" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5" data-testid="impact-estimator">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Impact estimate</p>
            <p className="text-xs text-muted-foreground">Calculated live by {AGENTS.analytics}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            impact.band === "High"
              ? "border-primary/30 bg-primary/5 text-primary"
              : impact.band === "Solid"
                ? "border-accent/40 bg-accent/5 text-accent"
                : "border-border text-muted-foreground"
          }
        >
          {impact.band} impact
        </Badge>
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <label className="text-xs font-medium text-foreground">{row.label}</label>
              <span className="text-xs font-bold tabular-nums text-primary">
                {row.value}
                {row.suffix}
              </span>
            </div>
            <Slider
              className="mt-2"
              value={[row.value]}
              min={row.min}
              max={row.max}
              step={row.step}
              disabled={disabled}
              onValueChange={([v]) => onChange({ [row.key]: v } as Partial<ProjectDraft>)}
              aria-label={row.label}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
        <Figure value={impact.hoursPerMonth} unit="h" label="returned each month" />
        <Figure value={impact.workingDaysReturned} unit="days" label="of working time a year" />
        <Figure value={impact.cycleReductionPct} unit="%" label="faster turnaround" />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{impact.bandNote}</p>
    </div>
  );
}
