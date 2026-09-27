import React from "react";
import { CornerUpLeft, Send } from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import type { Submission } from "@/lib/federal/model";

/**
 * Why a project is back in the manager's queue, when it is not a first look:
 * the learner resubmitted after a revision, or the entity sent it back. Shows
 * who took the decision and their note verbatim. Renders nothing otherwise.
 */
export function ReturnContext({ submission, className = "" }: { submission: Submission; className?: string }) {
  const { approvalsFor } = useFederalData();
  if (submission.state !== "awaiting_manager") return null;
  const latest = approvalsFor(submission.id).at(-1);
  if (!latest) return null;

  const resubmitted = latest.role === "learner" && latest.decision === "resubmitted";
  const entityReturn = latest.role === "ministry" && latest.decision === "revision_requested";
  if (!resubmitted && !entityReturn) return null;

  const Icon = resubmitted ? Send : CornerUpLeft;
  const reason = resubmitted
    ? `${latest.by} revised and resubmitted it on ${latest.on}`
    : `Returned by the entity (${latest.by}) on ${latest.on}`;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-sm ${
        resubmitted ? "border-primary/20 bg-primary/5" : "border-accent/40 bg-accent/5"
      } ${className}`}
      data-testid={`return-context-${submission.id}`}
    >
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${resubmitted ? "text-primary" : "text-accent"}`}>
        <Icon className="h-3.5 w-3.5" /> {reason}
      </p>
      {latest.note && (
        <blockquote className="mt-1.5 border-s-2 border-border ps-3 text-sm italic leading-relaxed text-foreground">
          “{latest.note}”
        </blockquote>
      )}
    </div>
  );
}
