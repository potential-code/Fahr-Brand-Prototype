// One reading of where a workplace project is in its lifecycle, shared by every
// dashboard. The learner, manager, entity, FAHR and leadership all render the
// same tracker and the same conversation from these helpers, so a project can
// never look different depending on who is looking at it.

import type { ApprovalDecision, ApprovalRecord, Submission, SubmissionState } from "./model";

export type JourneyStepId = "submitted" | "manager" | "entity" | "fahr" | "live";

/** `returned` marks the step that sent the project back; `skipped` a step the project did not need. */
export type JourneyStepStatus = "done" | "current" | "returned" | "skipped" | "upcoming";

export type JourneyStep = {
  id: JourneyStepId;
  label: string;
  status: JourneyStepStatus;
};

/** Who the project is waiting on, from the point of view of the person looking at it. */
export type JourneyTone = "action" | "waiting" | "live";

export type Journey = {
  steps: JourneyStep[];
  /** Person or team accountable for the next move. */
  owner: string;
  /** One line that says what is happening now. */
  headline: string;
  tone: JourneyTone;
  /** Most recent decision on the project, if any. */
  latest?: ApprovalRecord;
};

const STEP_LABEL: Record<JourneyStepId, string> = {
  submitted: "Submitted",
  manager: "Department manager",
  entity: "Entity",
  fahr: "FAHR",
  live: "Live",
};

const ORDER: JourneyStepId[] = ["submitted", "manager", "entity", "fahr", "live"];

export const isLive = (state: SubmissionState): boolean => state === "deployed" || state === "endorsed";

/** How each decision reads in a conversation or timeline. */
export const DECISION_LABEL: Record<ApprovalDecision, string> = {
  submitted: "Submitted the project",
  resubmitted: "Revised and resubmitted",
  signed_off: "Signed off — sent to the entity",
  revision_requested: "Requested a revision",
  endorsed: "Endorsed — project is live",
  escalated: "Escalated to FAHR",
  approved_live: "Approved for federal rollout — project is live",
  returned_to_entity: "Returned to the entity",
  credential_issued: "Issued a credential",
};

export const ROLE_LABEL: Record<ApprovalRecord["role"], string> = {
  learner: "Learner",
  manager: "Department manager",
  ministry: "Entity admin",
  fahr: "FAHR",
};

/** A decision the entity took that sent the project back to the manager. */
const isEntityReturn = (a?: ApprovalRecord) => a?.role === "ministry" && a.decision === "revision_requested";

export function journeyFor(
  submission: Submission,
  approvals: ApprovalRecord[],
  names: { learner?: string; manager?: string } = {},
): Journey {
  const own = approvals.filter((a) => a.submissionId === submission.id);
  const latest = own[own.length - 1];
  const wasEscalated = own.some((a) => a.decision === "escalated");

  const status: Record<JourneyStepId, JourneyStepStatus> = {
    submitted: "done",
    manager: "upcoming",
    entity: "upcoming",
    fahr: "upcoming",
    live: "upcoming",
  };
  let owner = "";
  let headline = "";
  let tone: JourneyTone = "waiting";

  switch (submission.state) {
    case "awaiting_manager":
      status.manager = "current";
      if (isEntityReturn(latest)) status.entity = "returned";
      owner = submission.reviewer && submission.reviewer !== "Department manager"
        ? submission.reviewer
        : names.manager ?? "Department manager";
      headline =
        latest?.decision === "resubmitted"
          ? "Resubmitted — back with the department manager"
          : isEntityReturn(latest)
            ? "Returned by the entity — back with the department manager"
            : "Waiting for department manager sign-off";
      break;
    case "revision_requested":
      status.submitted = "current";
      status.manager = "returned";
      owner = names.learner ?? "Learner";
      headline = "Revision requested — the learner needs to update and resubmit";
      tone = "action";
      break;
    case "awaiting_entity":
      status.manager = "done";
      status.entity = "current";
      if (latest?.decision === "returned_to_entity") status.fahr = "returned";
      owner = "Entity admin";
      headline =
        latest?.decision === "returned_to_entity"
          ? "Returned by FAHR — back with the entity"
          : "Waiting for entity endorsement";
      break;
    case "escalated":
      status.manager = "done";
      status.entity = "done";
      status.fahr = "current";
      owner = "FAHR Programme Team";
      headline = "Escalated — waiting for a federal decision";
      break;
    case "endorsed":
    case "deployed":
      status.manager = "done";
      status.entity = "done";
      status.fahr = wasEscalated || submission.state === "deployed" ? "done" : "skipped";
      status.live = "done";
      owner = "In service";
      headline = status.fahr === "done" ? "Approved by FAHR — live across the federal programme" : "Endorsed by the entity — live";
      tone = "live";
      break;
  }

  return {
    steps: ORDER.map((id) => ({ id, label: STEP_LABEL[id], status: status[id] })),
    owner,
    headline,
    tone,
    latest,
  };
}

export type ThreadMessage = {
  id: string;
  role: ApprovalRecord["role"] | "system";
  by: string;
  on: string;
  /** What happened, e.g. "Requested a revision". */
  title: string;
  /** The person's own words, verbatim. */
  note?: string;
  decision?: ApprovalDecision;
};

/**
 * The project's conversation: every decision and reply, oldest first. Seeded
 * projects that predate the session fall back to their timeline entries.
 */
export function projectThread(submission: Submission, approvals: ApprovalRecord[]): ThreadMessage[] {
  const own = approvals.filter((a) => a.submissionId === submission.id && a.decision !== "credential_issued");
  if (own.length === 0) {
    return submission.timeline.map((entry, i) => ({
      id: `${submission.id}-t${i}`,
      role: "system" as const,
      by: "Platform",
      on: entry.date,
      title: entry.event,
    }));
  }
  return own.map((a) => ({
    id: a.id,
    role: a.role,
    by: a.by,
    on: a.on,
    title: DECISION_LABEL[a.decision],
    note: a.note,
    decision: a.decision,
  }));
}

/** The demo learner's own project, if they have submitted one. */
export const learnerProject = (submissions: Submission[], learnerId: string): Submission | undefined =>
  submissions.find((s) => s.personId === learnerId);
