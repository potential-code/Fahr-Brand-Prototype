import React from "react";
import { Badge } from "@/components/ui/badge";
import { useFederalData } from "@/lib/FederalDataContext";
import { SUBMISSION_STATE_LABEL } from "@/lib/federal/selectors";
import type { Submission } from "@/lib/federal/model";

/**
 * A project's state, with the reason when it came back to someone's queue
 * ("Resubmitted", "Returned by entity", "Returned by FAHR") so a reviewer
 * knows it is not a first look.
 */
export function SubmissionStateBadge({ submission, className = "" }: { submission: Submission; className?: string }) {
  const { approvalsFor } = useFederalData();
  const latest = approvalsFor(submission.id).at(-1);

  let label = SUBMISSION_STATE_LABEL[submission.state];
  let tone = "border-border text-muted-foreground";

  if (submission.state === "awaiting_manager" && latest?.decision === "resubmitted") {
    label = "Resubmitted";
    tone = "border-primary/30 bg-primary/5 text-primary";
  } else if (submission.state === "awaiting_manager" && latest?.role === "ministry") {
    label = "Returned by entity";
    tone = "border-accent/40 bg-accent/10 text-accent";
  } else if (submission.state === "awaiting_entity" && latest?.decision === "returned_to_entity") {
    label = "Returned by FAHR";
    tone = "border-accent/40 bg-accent/10 text-accent";
  } else if (submission.state === "revision_requested") {
    tone = "border-accent/40 bg-accent/10 text-accent";
  } else if (submission.state === "deployed" || submission.state === "endorsed") {
    tone = "border-green-200 bg-green-50 text-green-700";
  } else if (submission.state === "escalated") {
    tone = "border-primary/30 bg-primary/10 text-primary";
  }

  return (
    <Badge variant="outline" className={`${tone} ${className}`} data-testid={`badge-state-${submission.id}`}>
      {label}
    </Badge>
  );
}
