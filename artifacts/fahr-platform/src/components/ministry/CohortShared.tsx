// Shared building blocks for the entity cohorts list and cohort detail screens.
//
// Small presentational and control components so neither page becomes a
// thousand-line file. Everything here reads the entity admin / federal stores
// through props rather than reaching for them directly.

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CohortStatus } from "@/lib/federal/model";
import { PATHWAY_OPTIONS } from "@/lib/entityAdmin/seed";
import type {
  AssessmentOutcome,
  CertificationState,
} from "@/lib/entityAdmin/model";
import type { LearnerStatus } from "@/lib/federal/model";

export const COHORT_STATUSES: CohortStatus[] = ["Planning", "Onboarding", "Active", "Completed"];

/** Pathway options plus the "Unassigned" sentinel the store understands. */
export const PATHWAY_CHOICES = ["Unassigned", ...PATHWAY_OPTIONS];

const STATUS_CLASS: Record<CohortStatus, string> = {
  Planning: "bg-slate-100 text-slate-700 border-slate-200",
  Onboarding: "bg-blue-50 text-blue-700 border-blue-200",
  Active: "bg-green-50 text-green-700 border-green-200",
  Completed: "bg-primary/10 text-primary border-primary/20",
};

/**
 * Rendered as a span rather than the shadcn `Badge` (a div) so the pill can sit
 * inside the `PageHeader` description paragraph without invalid nesting.
 */
export function CohortStatusBadge({ status }: { status: CohortStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
      data-testid={`badge-status-${status}`}
    >
      {status}
    </span>
  );
}

const OUTCOME_CLASS: Record<AssessmentOutcome, string> = {
  Passed: "bg-green-50 text-green-700 border-green-200",
  "Awaiting assessment": "bg-slate-100 text-slate-600 border-slate-200",
  "Retake needed": "bg-amber-50 text-amber-700 border-amber-200",
};

export function OutcomeBadge({ outcome }: { outcome: AssessmentOutcome }) {
  return (
    <Badge variant="outline" className={OUTCOME_CLASS[outcome]}>
      {outcome}
    </Badge>
  );
}

const CERT_CLASS: Record<CertificationState, string> = {
  Certified: "bg-primary/10 text-primary border-primary/20",
  "Ready to certify": "bg-accent/10 text-accent border-accent/20",
  "In progress": "bg-blue-50 text-blue-700 border-blue-200",
  "Not started": "bg-slate-100 text-slate-600 border-slate-200",
};

export function CertificationBadge({ state }: { state: CertificationState }) {
  return (
    <Badge variant="outline" className={CERT_CLASS[state]}>
      {state}
    </Badge>
  );
}

const ENGAGEMENT_CLASS: Record<LearnerStatus, string> = {
  excelling: "bg-green-50 text-green-700 border-green-200",
  "on-track": "bg-blue-50 text-blue-700 border-blue-200",
  "needs-attention": "bg-amber-50 text-amber-700 border-amber-200",
  "at-risk": "bg-red-50 text-red-700 border-red-200",
};

const ENGAGEMENT_LABEL: Record<LearnerStatus, string> = {
  excelling: "Excelling",
  "on-track": "On track",
  "needs-attention": "Needs attention",
  "at-risk": "At risk",
};

export function EngagementBadge({ status }: { status: LearnerStatus }) {
  return (
    <Badge variant="outline" className={ENGAGEMENT_CLASS[status]}>
      {ENGAGEMENT_LABEL[status]}
    </Badge>
  );
}

/** A compact status control that writes straight through to the store. */
export function CohortStatusSelect({
  value,
  onChange,
  testId,
}: {
  value: CohortStatus;
  onChange: (status: CohortStatus) => void;
  testId: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CohortStatus)}>
      <SelectTrigger className="h-8 w-[140px]" data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COHORT_STATUSES.map((status) => (
          <SelectItem key={status} value={status} data-testid={`${testId}-${status}`}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A pathway control that writes straight through to the store. */
export function PathwaySelect({
  value,
  onChange,
  testId,
  className,
}: {
  value: string;
  onChange: (pathway: string) => void;
  testId: string;
  className?: string;
}) {
  const known = PATHWAY_CHOICES.includes(value) ? value : "Unassigned";
  return (
    <Select value={known} onValueChange={onChange}>
      <SelectTrigger className={className ?? "h-8 w-[220px]"} data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PATHWAY_CHOICES.map((pathway) => (
          <SelectItem key={pathway} value={pathway} data-testid={`${testId}-${pathway.replace(/\s+/g, "-")}`}>
            {pathway}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
