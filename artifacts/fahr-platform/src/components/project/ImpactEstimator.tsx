import React from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import type { ImpactEstimate, ProjectDraft } from "@/lib/workplaceProject";

type Props = {
  draft: ProjectDraft;
  impact: ImpactEstimate;
  onChange: (patch: Partial<ProjectDraft>) => void;
  disabled?: boolean;
};

/** A number that settles into place whenever it changes. */
function Live({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.35, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`inline-block tabular-nums ${className ?? ""}`}
    >
      {value.toLocaleString("en-US")}
    </motion.span>
  );
}

/**
 * Live estimate of what the project returns, as one plain sum: the team's
 * hours on the task today, the hours left once the twin takes its share, and
 * the difference over a month.
 */
export function ImpactEstimator({ draft, impact, onChange, disabled = false }: Props) {
  const rows: { key: keyof ProjectDraft; label: string; value: number; min: number; max: number; step: number; suffix: string }[] = [
    { key: "hoursPerWeek", label: "Hours one person spends on it each week", value: draft.hoursPerWeek, min: 1, max: 20, step: 1, suffix: "h" },
    { key: "peopleAffected", label: "People in your team who do it", value: draft.peopleAffected, min: 1, max: 60, step: 1, suffix: "" },
    { key: "automationPct", label: "How much of it your twin takes on", value: draft.automationPct, min: 10, max: 95, step: 5, suffix: "%" },
  ];

  const todayPerWeek = draft.hoursPerWeek * draft.peopleAffected;
  const withTwinPerWeek = Math.round(todayPerWeek * (1 - draft.automationPct / 100));

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

      {/* Today → with the twin, then what that adds up to. */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              <Live value={todayPerWeek} />
              <span className="ms-1 text-xs font-medium text-muted-foreground">h a week</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {draft.peopleAffected} {draft.peopleAffected === 1 ? "person" : "people"} × {draft.hoursPerWeek}h
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-3 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary">With your twin</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              <Live value={withTwinPerWeek} />
              <span className="ms-1 text-xs font-medium text-muted-foreground">h a week</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Twin takes on {draft.automationPct}%</p>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-foreground" data-testid="impact-summary">
          That gives your team back about{" "}
          <span className="font-bold text-primary">
            <Live value={impact.hoursPerMonth} /> hours a month
          </span>
          .
        </p>
      </div>

      <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">{impact.bandNote}</p>
    </div>
  );
}
