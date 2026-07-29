import React from "react";
import { CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { CountUp } from "@/components/motion";
import type { LucideIcon } from "lucide-react";

/** One KPI card for a report, with an animated counter. */
export function ReportKpi({
  label,
  value,
  suffix,
  prefix,
  decimals,
  icon: Icon,
  tone = "text-primary",
  testId,
}: {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon?: LucideIcon;
  tone?: string;
  testId?: string;
}) {
  return (
    <StatCard className="h-full" data-testid={testId}>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${tone}`} />}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-2xl font-bold tracking-tight">
          <CountUp to={value} suffix={suffix} prefix={prefix} decimals={decimals} />
        </p>
      </CardContent>
    </StatCard>
  );
}

/** Colour for a readiness / score cell in the heat table. */
export function scoreTone(score: number): string {
  if (score >= 70) return "bg-green-50 text-green-700 border border-green-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-red-50 text-red-700 border border-red-200";
}

/** A small legible pill used in report tables. */
export function ReportPill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "good" | "warn" | "bad" | "accent";
}) {
  const cls =
    tone === "good"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "bad"
          ? "bg-red-50 text-red-700 border-red-200"
          : tone === "accent"
            ? "bg-accent/10 text-accent border-accent/20"
            : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}
