import React from "react";
import { RotateCcw } from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";

/**
 * What the department manager sent back, shown to the learner on their own
 * workplace project. Returning a project always carries comments, so this is
 * the learner's side of that exchange — verbatim, not summarised.
 */
export function ManagerRevisionNotice({ className = "" }: { className?: string }) {
  const { submissions, approvals, focus } = useFederalData();

  const returned = submissions.filter(
    (s) => s.personId === focus.learnerId && s.state === "revision_requested",
  );
  if (returned.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`} data-testid="notice-revision-requested">
      {returned.map((submission) => {
        const decision = [...approvals]
          .reverse()
          .find((a) => a.submissionId === submission.id && a.decision === "revision_requested");
        return (
          <div
            key={submission.id}
            className="rounded-xl border border-accent/40 bg-accent/5 p-5"
            data-testid={`notice-revision-${submission.id}`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-foreground">
                <RotateCcw className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Revision requested on &ldquo;{submission.title}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {decision?.by ?? "Your department manager"}
                    {decision?.on ? ` · ${decision.on}` : ""}
                  </p>
                </div>
                {decision?.note && (
                  <blockquote className="border-s-2 border-accent/50 ps-3 text-sm leading-relaxed text-foreground">
                    {decision.note}
                  </blockquote>
                )}
                <p className="text-xs text-muted-foreground">
                  Address the comments and resubmit — it returns to the same sign-off queue.
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
