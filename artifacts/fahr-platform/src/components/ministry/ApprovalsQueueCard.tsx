import React, { forwardRef, useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Undo2,
  ArrowUpRight,
  User,
  ShieldCheck,
  Clock,
  Quote,
  CornerUpLeft,
  Landmark,
  MessagesSquare,
  ChevronDown,
} from "lucide-react";
import type { Submission } from "@/lib/federal/model";
import type { ApprovalRecord } from "@/lib/federal/model";
import { competencyLabel, workingDaysPerYear } from "@/lib/federal";
import { useFederalData } from "@/lib/FederalDataContext";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ProjectConversation } from "@/components/project/ProjectConversation";
import { SubmissionStateBadge } from "@/components/project/SubmissionStateBadge";
import { ProjectSummary } from "@/components/project/ProjectBrief";
import { ProjectDetailSheet } from "@/components/project/ProjectDetailSheet";
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
  /** Deep-linked from a notification: ring the card so the eye lands on it. */
  highlighted?: boolean;
  /** Open the conversation on first render (used with a deep link). */
  defaultConversationOpen?: boolean;
};

export const ApprovalsQueueCard = forwardRef<HTMLDivElement, Props>(function ApprovalsQueueCard(
  { submission, ownerName, departmentName, approvals, onDecide, highlighted = false, defaultConversationOpen = false },
  ref,
) {
  const { escalations } = useFederalData();
  const [showConversation, setShowConversation] = useState(defaultConversationOpen);
  const [briefOpen, setBriefOpen] = useState(false);
  const decideFromSheet = (kind: DecisionKind) => {
    setBriefOpen(false);
    onDecide?.(kind);
  };
  useEffect(() => {
    if (defaultConversationOpen) setShowConversation(true);
  }, [defaultConversationOpen]);
  const managerSignOff = [...approvals].reverse().find((a) => a.role === "manager" && a.decision === "signed_off");
  const latestDecision = approvals[approvals.length - 1];
  const fahrReturned =
    submission.state === "awaiting_entity" && latestDecision?.decision === "returned_to_entity"
      ? latestDecision
      : undefined;
  const entityEscalation =
    submission.state === "escalated"
      ? [...approvals].reverse().find((a) => a.decision === "escalated")
      : undefined;
  const linkedEscalation =
    submission.state === "escalated" ? escalations.find((e) => e.submissionId === submission.id) : undefined;
  const latest = submission.timeline[submission.timeline.length - 1];

  return (
    <>
    <Card
      ref={ref}
      className={`border-border transition-colors hover:border-primary/40 ${
        highlighted ? "border-primary ring-2 ring-primary/30" : ""
      }`}
      data-testid={`card-queue-${submission.id}`}
      data-highlighted={highlighted ? "true" : undefined}
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
            <SubmissionStateBadge submission={submission} className="text-xs" />
            <Badge variant="outline" className={`text-xs ${impactClass(submission.impact)}`}>
              {submission.impact} impact
            </Badge>
            <Badge variant="outline" className={`text-xs ${governanceClass(submission.governanceStatus)}`}>
              <ShieldCheck className="mr-1 h-3 w-3" /> {submission.governanceStatus}
            </Badge>
          </div>
        </div>

        <ProjectSummary submission={submission} onOpen={() => setBriefOpen(true)} />

        <ProjectJourney submission={submission} variant="compact" />

        {fahrReturned && (
          <div
            className="rounded-md border border-accent/40 bg-accent/10 p-3 text-xs"
            data-testid={`notice-fahr-returned-${submission.id}`}
          >
            <p className="flex items-center gap-1.5 font-medium text-accent">
              <CornerUpLeft className="h-3.5 w-3.5" /> Returned by FAHR
            </p>
            <p className="mt-1 text-muted-foreground">
              {fahrReturned.by} · {fahrReturned.on}
            </p>
            {fahrReturned.note && (
              <p className="mt-1.5 flex items-start gap-1.5 text-foreground/80">
                <Quote className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                <span className="italic">{fahrReturned.note}</span>
              </p>
            )}
          </div>
        )}

        {submission.state === "escalated" && (
          <div
            className="rounded-md border border-primary/25 bg-primary/5 p-3 text-xs"
            data-testid={`notice-fahr-waiting-${submission.id}`}
          >
            <p className="flex items-center gap-1.5 font-medium text-primary">
              <Landmark className="h-3.5 w-3.5" /> Waiting for FAHR decision
            </p>
            <p className="mt-1 text-muted-foreground">
              {linkedEscalation
                ? `${linkedEscalation.status} at FAHR${linkedEscalation.assignee ? ` · with ${linkedEscalation.assignee}` : " · not yet assigned"}`
                : "With the FAHR Programme Team"}
              {entityEscalation ? ` · escalated by ${entityEscalation.by} on ${entityEscalation.on}` : ""}
            </p>
            {entityEscalation?.note && (
              <p className="mt-1.5 flex items-start gap-1.5 text-foreground/80">
                <Quote className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                <span className="italic">{entityEscalation.note}</span>
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Claimed impact</p>
            <p className="mt-0.5 font-medium text-foreground">
              {submission.hoursSavedPerMonth} h returned / month · {workingDaysPerYear(submission.hoursSavedPerMonth)}{" "}
              working days a year
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Competencies evidenced</p>
            <p className="mt-0.5 font-medium text-foreground">
              {submission.competencyIds.map(competencyLabel).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Department</p>
            <p className="mt-0.5 font-medium text-foreground">{departmentName}</p>
          </div>
        </div>

        {managerSignOff && (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Line manager signed off
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

        <AnimatePresence initial={false}>
          {showConversation && (
            <motion.div
              key="conversation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
              data-testid={`conversation-queue-${submission.id}`}
            >
              <div className="rounded-md border border-border p-3">
                <ProjectConversation submission={submission} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setShowConversation((open) => !open)}
            aria-expanded={showConversation}
            data-testid={`button-conversation-${submission.id}`}
          >
            <MessagesSquare className="mr-1.5 h-4 w-4" />
            {showConversation ? "Hide conversation" : "View conversation"}
            <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${showConversation ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
    <ProjectDetailSheet
      submission={briefOpen ? submission : null}
      onOpenChange={(open) => !open && setBriefOpen(false)}
      actions={
        onDecide ? (
          <div className="flex flex-wrap gap-2">
            <Button className="flex-1" onClick={() => decideFromSheet("endorse")} data-testid={`button-endorse-sheet-${submission.id}`}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Endorse
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => decideFromSheet("return")}>
              <Undo2 className="mr-1.5 h-4 w-4" /> Return to manager
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => decideFromSheet("escalate")}>
              <ArrowUpRight className="mr-1.5 h-4 w-4" /> Escalate to FAHR
            </Button>
          </div>
        ) : undefined
      }
    />
    </>
  );
});
