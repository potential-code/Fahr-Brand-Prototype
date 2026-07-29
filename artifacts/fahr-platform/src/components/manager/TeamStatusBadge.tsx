import React from "react";
import { Badge } from "@/components/ui/badge";
import type { LearnerStatus } from "@/lib/federal";
import type { CertificationState } from "@/lib/entityAdmin/model";

const STATUS_LABEL: Record<LearnerStatus, string> = {
  "on-track": "On Track",
  excelling: "Excelling",
  "needs-attention": "Needs Attention",
  "at-risk": "At Risk",
};

/** Learner status, styled the same way wherever a manager sees a team row. */
export function TeamStatusBadge({ status }: { status: LearnerStatus }) {
  if (status === "at-risk") {
    return (
      <Badge variant="destructive" className="shadow-none" data-testid={`status-${status}`}>
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  const tone =
    status === "excelling"
      ? "bg-primary/10 text-primary border-primary/20"
      : status === "needs-attention"
        ? "bg-accent/10 text-accent border-accent/25"
        : "bg-secondary/10 text-secondary border-secondary/20";
  return (
    <Badge variant="outline" className={tone} data-testid={`status-${status}`}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * Completion and certification standing. Certification is an achievement, so
 * the scale runs from a filled primary badge down to a plain outline — nothing
 * here is a warning.
 */
export function CertificationBadge({ state }: { state: CertificationState }) {
  const tone =
    state === "Certified"
      ? "bg-primary/10 text-primary border-primary/25"
      : state === "Ready to certify"
        ? "bg-accent/10 text-accent border-accent/25"
        : state === "In progress"
          ? "bg-secondary/10 text-secondary border-secondary/20"
          : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={tone} data-testid={`certification-${state.toLowerCase().replace(/\s+/g, "-")}`}>
      {state}
    </Badge>
  );
}
