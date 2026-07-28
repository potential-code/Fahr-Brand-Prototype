// Shared building blocks for the entity content, events and communications
// screens. Keeps the three pages lean and the KPI / filter / badge styling
// consistent across all of them.

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stagger, StaggerItem, CountUp } from "@/components/motion";
import type { LucideIcon } from "lucide-react";

export type Kpi = {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: LucideIcon;
  color: string;
  testId: string;
  /** Optional caption under the number. */
  hint?: string;
};

/** A staggered row of animated KPI cards, one per screen. */
export function KpiRow({ kpis, className }: { kpis: Kpi[]; className?: string }) {
  return (
    <Stagger
      as="div"
      className={className ?? "grid grid-cols-2 gap-4 md:grid-cols-4"}
      data-testid="kpi-row"
    >
      {kpis.map((kpi) => (
        <StaggerItem key={kpi.testId} as="div">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex h-full flex-col gap-2 p-5">
              <div className="flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-3xl font-bold tracking-tight" data-testid={kpi.testId}>
                <CountUp
                  to={kpi.value}
                  prefix={kpi.prefix}
                  suffix={kpi.suffix}
                  decimals={kpi.decimals}
                />
              </p>
              {kpi.hint && <p className="text-xs text-muted-foreground">{kpi.hint}</p>}
            </CardContent>
          </Card>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** A labelled filter Select that always carries an "all" option. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "All",
  testId,
  className = "w-full sm:w-[190px]",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  testId: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className} aria-label={label} data-testid={testId}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const STATUS_TONES: Record<string, string> = {
  // content
  Published: "bg-green-50 text-green-700 border-green-200",
  "In review": "bg-amber-50 text-amber-700 border-amber-200",
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Retired: "bg-rose-50 text-rose-700 border-rose-200",
  // events
  Open: "bg-green-50 text-green-700 border-green-200",
  Full: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-slate-100 text-slate-600 border-slate-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  // communications
  Sent: "bg-green-50 text-green-700 border-green-200",
};

/** Legible status pill shared across the three screens. */
export function StatusPill({ status, testId }: { status: string; testId?: string }) {
  return (
    <Badge
      variant="outline"
      className={STATUS_TONES[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}
      data-testid={testId}
    >
      {status}
    </Badge>
  );
}

/** A slim fill bar with a "filled / total" label — used for seats and coverage. */
export function FillBar({
  filled,
  total,
  className = "",
}: {
  filled: number;
  total: number;
  className?: string;
}) {
  const pct = total <= 0 ? 0 : Math.min(100, Math.round((filled / total) * 100));
  const tone = pct >= 100 ? "bg-amber-500" : pct >= 75 ? "bg-primary" : "bg-secondary";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {filled}/{total}
      </span>
    </div>
  );
}
