import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Undo2, ArrowUpRight, User, ShieldCheck, Clock, Quote } from "lucide-react";
import type { Submission } from "@/lib/federal/model";
import type { ApprovalRecord } from "@/lib/federal/model";
import { SUBMISSION_STATE_LABEL, competencyLabel } from "@/lib/federal";
import type { DecisionKind } from "./ApprovalsDecisionDialog";

const impactClass = (impact: Submission["impact"]): string =>
  impact === "High"
    ? "bg-accent/15 text-accent border-accent/30"
    : impact === "Medium"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-muted text-muted-foreground";

const governanceClass = (status: Submission["governanceStatus"]): string =>
  status === "Compliant"
    ? "bg-green-50 text-green-700 border-green-200"
    : status === "Needs Review"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

type Props = {
  submission: Submission;
  ownerName: string;
  departmentName: string;
  /** Manager sign-off (or other) records for this submission. */
  approvals: ApprovalRecord[];
  /** When set, action buttons are shown and fire this decision. */
  onDecide?: (kind: DecisionKind) => void;
};

export function ApprovalsQueueCard({
  submission,
  ownerName,
  departmentName,
  approvals,
  onDecide,
}: Props) {
  const managerSignOff = approvals.find((a) => a.role === "manager");
  const latest = submission.timeline[submission.timeline.length - 1];

  return (
    <Card
      className="border-border transition-colors hover:border-primary/40"
      data-testid={`card-queue-${submission.id}`}
    >
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-primary">{submission.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> {ownerName}
              </span>
              <span>·</span>
              <span>{departmentName}</span>
              <span>·</span>
              <span>Submitted {submission.submittedOn}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-xs ${impactClass(submission.impact)}`}>
              {submission.impact} impact
            </Badge>
            <Badge variant="outline" className={`text-xs ${governanceClass(submission.governanceStatus)}`}>
              <ShieldCheck className="mr-1 h-3 w-3" /> {submission.governanceStatus}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{submission.description}</p>

        <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Claimed impact</p>
            <p className="mt-0.5 font-medium text-foreground">
              AED {submission.estimatedValueAed.toLocaleString()} / yr · {submission.hoursSavedPerMonth}h saved/mo
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Competencies evidenced</p>
            <p className="mt-0.5 font-medium text-foreground">
              {submission.competencyIds.map(competencyLabel).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Current state</p>
            <p className="mt-0.5 font-medium text-foreground">{SUBMISSION_STATE_LABEL[submission.state]}</p>
          </div>
        </div>

        {managerSignOff && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Department manager signed off
            </p>
            <p className="mt-1 text-muted-foreground">
              {managerSignOff.by} · {managerSignOff.on}
            </p>
            {managerSignOff.note && (
              <p className="mt-1.5 flex items-start gap-1.5 text-foreground/80">
                <Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                <span className="italic">{managerSignOff.note}</span>
              </p>
            )}
          </div>
        )}

        {latest && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {latest.date} — {latest.event}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {onDecide ? (
            <>
              <Button size="sm" onClick={() => onDecide("endorse")} data-testid={`button-endorse-${submission.id}`}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Endorse
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecide("return")}
                data-testid={`button-return-${submission.id}`}
              >
                <Undo2 className="mr-1.5 h-4 w-4" /> Return to manager
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecide("escalate")}
                data-testid={`button-escalate-${submission.id}`}
              >
                <ArrowUpRight className="mr-1.5 h-4 w-4" /> Escalate to FAHR
              </Button>
            </>
          ) : (
            <Link href={`/ministry/people/${submission.personId}`}>
              <Button size="sm" variant="ghost" data-testid={`link-owner-${submission.id}`}>
                <User className="mr-1.5 h-4 w-4" /> View {ownerName}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
