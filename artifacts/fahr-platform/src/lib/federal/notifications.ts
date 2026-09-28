// Role-aware notification centre.
//
// Notifications are derived from the session state rather than authored, so
// signing off a submission as a manager actually clears the manager's alert and
// raises the entity's — the same event travelling up the chain.

import type { ApprovalRecord, DirectMessage, Escalation, Person, ScheduledSession, Submission } from "./model";
import { MINISTRY_BY_ID } from "./selectors";
import { APPROVALS, FOCUS } from "./seed";
import type { LiveLearnerState } from "./live";

export type NotificationKind =
  | "approval"
  | "risk"
  | "milestone"
  | "policy"
  | "quota"
  | "briefing"
  | "learning";

export type FederalNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  /** Screen the notification opens. */
  href: string;
  kind: NotificationKind;
};

export type NotificationRole = "learner" | "manager" | "ministry" | "fahr" | "leadership";

export type NotificationInput = {
  submissions: Submission[];
  escalations: Escalation[];
  sessions: ScheduledSession[];
  /** The manager's direct reports, with live figures already applied. */
  team: Person[];
  /** Every decision recorded against a submission — carries the manager's comments. */
  approvals: ApprovalRecord[];
  live: LiveLearnerState;
  /** Messages managers sent this session. */
  directMessages: DirectMessage[];
  /** Everyone, to name who a message came from. */
  people: Person[];
};

/** Where the learner reads what their manager sent them. */
export const MANAGER_THREAD_HREF = "/learner/messages?thread=manager";

/** The learner's notifications, unchanged from the learner journey. */
const LEARNER_NOTIFICATIONS: FederalNotification[] = [
  {
    id: "n-learner-1",
    title: "Your baseline assessment is ready",
    body: "Eight questions. Your pathway is generated from the result.",
    time: "Today",
    href: "/learner/assessment",
    kind: "learning",
  },
  {
    id: "n-learner-2",
    title: "New adaptive module added",
    body: "Stakeholder Alignment with AI was added to your learning pathway.",
    time: "Yesterday",
    href: "/learner/mission",
    kind: "learning",
  },
  {
    id: "n-learner-3",
    title: "Masterclass: Agentic AI in Public Policy",
    body: "Virtual session on 20 August 2026. Registration is open.",
    time: "3 days ago",
    href: "/learner/community",
    kind: "learning",
  },
];

const SEEDED_APPROVAL_IDS = new Set(APPROVALS.map((a) => a.id));

/** Decisions taken during this session, newest first. Seeded history never raises an alert. */
const sessionDecisions = (input: NotificationInput): ApprovalRecord[] =>
  input.approvals.filter((a) => !SEEDED_APPROVAL_IDS.has(a.id)).reverse();

/**
 * Keys a queue alert to how many decisions the project has seen, so a project
 * that comes back to the same queue raises a fresh, unread alert rather than
 * reusing the one already read the first time round.
 */
const round = (input: NotificationInput, submissionId: string) =>
  input.approvals.filter((a) => a.submissionId === submissionId).length;

const messagesHref = (submissionId: string) => `/learner/messages?project=${submissionId}`;

/** How a decision on their project reads to the learner. */
function learnerCopy(decision: ApprovalRecord, title: string): { title: string; body: string } | null {
  const said = decision.note ? ` "${decision.note}"` : "";
  switch (decision.decision) {
    case "revision_requested":
      return decision.role === "manager"
        ? { title: `Action required: revise "${title}"`, body: `${decision.by} asked for changes.${said}` }
        : null;
    case "signed_off":
      return { title: "Your department manager signed off your project", body: `${decision.by} sent "${title}" to the entity for endorsement.` };
    case "escalated":
      return { title: "Your project was escalated to FAHR", body: `The entity referred "${title}" for a federal decision.${said}` };
    case "returned_to_entity":
      return { title: "FAHR returned your project to the entity", body: `The entity is reviewing FAHR's comments on "${title}".${said}` };
    case "endorsed":
      return { title: "Your project is live", body: `The entity endorsed "${title}". Your certificate is ready.` };
    case "approved_live":
      return { title: "Your project is live across the federal programme", body: `FAHR approved "${title}" for federal rollout. Your certificate is ready.` };
    default:
      return null;
  }
}

/**
 * The learner's own notifications: every decision taken on their project this
 * session, newest first, each opening that project's conversation. A revision
 * request carries the manager's comments verbatim — the learner should never
 * have to guess what was asked of them.
 */
function learnerNotifications(input: NotificationInput): FederalNotification[] {
  const out: FederalNotification[] = [];
  const own = new Map(
    input.submissions.filter((s) => s.personId === FOCUS.learnerId).map((s) => [s.id, s]),
  );

  for (const decision of sessionDecisions(input)) {
    const submission = own.get(decision.submissionId);
    if (!submission || decision.role === "learner") continue;
    const copy = learnerCopy(decision, submission.title);
    if (!copy) continue;
    out.push({
      id: `n-learner-${decision.id}`,
      ...copy,
      time: decision.on,
      href: messagesHref(submission.id),
      kind: decision.decision === "revision_requested" ? "approval" : "milestone",
    });
  }

  // Oldest first, each pushed to the front, so the newest message leads.
  for (const message of input.directMessages) {
    if (message.toId !== FOCUS.learnerId) continue;
    const from = input.people.find((p) => p.id === message.fromId)?.name ?? "Your department manager";
    out.unshift({
      id: `n-learner-${message.id}`,
      title: `New message from ${from}`,
      body: message.body.length > 90 ? `${message.body.slice(0, 87)}…` : message.body,
      time: message.on,
      href: MANAGER_THREAD_HREF,
      kind: "milestone",
    });
  }

  return [...out, ...LEARNER_NOTIFICATIONS];
}

/** Where a manager reads their conversation with one member of the team. */
export const managerThreadHref = (personId: string) => `/manager/messages?member=${personId}`;

function managerNotifications(input: NotificationInput): FederalNotification[] {
  const out: FederalNotification[] = [];
  const teamIds = new Set(input.team.map((p) => p.id));

  // Replies from the team, newest first.
  for (const message of input.directMessages) {
    if (message.toId !== FOCUS.managerId || !teamIds.has(message.fromId)) continue;
    const name = input.team.find((p) => p.id === message.fromId)?.name ?? "A team member";
    out.unshift({
      id: `n-mgr-${message.id}`,
      title: `New message from ${name}`,
      body: message.body.length > 90 ? `${message.body.slice(0, 87)}…` : message.body,
      time: message.on,
      href: managerThreadHref(message.fromId),
      kind: "milestone",
    });
  }

  for (const submission of input.submissions) {
    if (submission.state !== "awaiting_manager" || !teamIds.has(submission.personId)) continue;
    const person = input.team.find((p) => p.id === submission.personId);
    const latest = input.approvals.filter((a) => a.submissionId === submission.id).at(-1);
    const name = person?.name ?? "A team member";
    const copy =
      latest?.decision === "resubmitted"
        ? { title: `${name} resubmitted their project`, body: latest.note ? `"${submission.title}" — "${latest.note}"` : `"${submission.title}" is back for your sign-off.` }
        : latest?.role === "ministry"
          ? { title: "Entity returned a project to you", body: `"${submission.title}"${latest.note ? ` — "${latest.note}"` : " needs another look."}` }
          : { title: "Workplace project awaiting your sign-off", body: `${name} submitted "${submission.title}".` };
    out.push({
      id: `n-mgr-approval-${submission.id}-${round(input, submission.id)}`,
      ...copy,
      time: latest?.on ?? submission.submittedOn,
      href: `/manager/validations?project=${submission.id}`,
      kind: "approval",
    });
  }

  for (const decision of sessionDecisions(input)) {
    if (decision.decision !== "approved_live" && decision.decision !== "endorsed") continue;
    const submission = input.submissions.find((s) => s.id === decision.submissionId);
    if (!submission || !teamIds.has(submission.personId)) continue;
    const person = input.team.find((p) => p.id === submission.personId);
    out.push({
      id: `n-mgr-live-${decision.id}`,
      title: `${person?.name ?? "A team member"}'s project is live`,
      body: `"${submission.title}" — ${decision.decision === "approved_live" ? "approved by FAHR for federal rollout" : "endorsed by the entity"}.`,
      time: decision.on,
      href: `/manager/team/${submission.personId}`,
      kind: "milestone",
    });
  }

  for (const person of input.team) {
    if (person.status !== "at-risk") continue;
    out.push({
      id: `n-mgr-risk-${person.id}`,
      title: `${person.name} is falling behind`,
      body: `${person.pathwayProgress}% of the pathway complete, last active ${person.lastActive.toLowerCase()}.`,
      time: "Today",
      href: `/manager/team/${person.id}`,
      kind: "risk",
    });
  }

  const nextSession = input.sessions.find((s) => s.ministryId === FOCUS.ministryId && s.status !== "Completed");
  if (nextSession) {
    out.push({
      id: `n-mgr-session-${nextSession.id}`,
      title: "Team session confirmed",
      body: `${nextSession.title} — ${nextSession.date}, ${nextSession.registered} of ${nextSession.seats} seats taken.`,
      time: "2 days ago",
      href: "/manager/reports",
      kind: "milestone",
    });
  }

  return out;
}

function ministryNotifications(input: NotificationInput): FederalNotification[] {
  const out: FederalNotification[] = [];
  const ministry = MINISTRY_BY_ID[FOCUS.ministryId];

  for (const submission of input.submissions) {
    if (submission.ministryId !== FOCUS.ministryId || submission.state !== "awaiting_entity") continue;
    const latest = input.approvals.filter((a) => a.submissionId === submission.id).at(-1);
    const returned = latest?.decision === "returned_to_entity";
    out.push({
      id: `n-ent-approval-${submission.id}-${round(input, submission.id)}`,
      title: returned ? "FAHR returned a project to you" : "Project awaiting entity endorsement",
      body: returned
        ? `"${submission.title}"${latest?.note ? ` — "${latest.note}"` : " needs another look."}`
        : `"${submission.title}" cleared department manager sign-off and needs your decision.`,
      time: latest?.on ?? submission.submittedOn,
      href: `/ministry/approvals?project=${submission.id}`,
      kind: "approval",
    });
  }

  for (const decision of sessionDecisions(input)) {
    if (decision.decision !== "approved_live") continue;
    const submission = input.submissions.find((s) => s.id === decision.submissionId);
    if (!submission || submission.ministryId !== FOCUS.ministryId) continue;
    out.push({
      id: `n-ent-live-${decision.id}`,
      title: "FAHR approved a project — it is live",
      body: `"${submission.title}" was approved for federal rollout.`,
      time: decision.on,
      href: `/ministry/portfolio`,
      kind: "milestone",
    });
  }

  for (const escalation of input.escalations) {
    if (escalation.ministryId !== FOCUS.ministryId) continue;
    out.push({
      id: `n-ent-escalation-${escalation.id}`,
      title: `Escalation ${escalation.status.toLowerCase()} with FAHR`,
      body: escalation.subject,
      time: escalation.raisedOn,
      href: "/ministry/approvals",
      kind: "policy",
    });
  }

  out.push({
    id: "n-ent-cohort",
    title: "Cohort milestone reached",
    body: "Comms & Marketing Batch 1 passed the halfway point of its pathway.",
    time: "Yesterday",
    href: "/ministry/cohorts",
    kind: "milestone",
  });

  if (ministry && ministry.tokensUsedM / ministry.tokenQuotaM >= 0.8) {
    out.push({
      id: "n-ent-quota",
      title: "AI usage approaching quota",
      body: `${Math.round((ministry.tokensUsedM / ministry.tokenQuotaM) * 100)}% of the entity's monthly token allocation is consumed.`,
      time: "Today",
      href: "/ministry/reports",
      kind: "quota",
    });
  }

  return out;
}

function fahrNotifications(input: NotificationInput): FederalNotification[] {
  const out: FederalNotification[] = [];

  for (const submission of input.submissions) {
    if (submission.state !== "escalated") continue;
    const ministry = MINISTRY_BY_ID[submission.ministryId];
    const latest = input.approvals.filter((a) => a.submissionId === submission.id).at(-1);
    out.push({
      id: `n-fahr-project-${submission.id}-${round(input, submission.id)}`,
      title: `Project decision needed from ${ministry?.shortName ?? "an entity"}`,
      body: latest?.note ? `"${submission.title}" — "${latest.note}"` : `"${submission.title}" is waiting for a federal decision.`,
      time: latest?.on ?? submission.submittedOn,
      href: `/fahr/escalations?tab=projects&project=${submission.id}`,
      kind: "approval",
    });
  }

  for (const escalation of input.escalations) {
    // Project escalations are raised above, as the decision itself.
    if (escalation.status === "Resolved" || escalation.submissionId) continue;
    const ministry = MINISTRY_BY_ID[escalation.ministryId];
    out.push({
      id: `n-fahr-escalation-${escalation.id}`,
      title: `${escalation.kind} escalation from ${ministry?.shortName ?? "an entity"}`,
      body: escalation.subject,
      time: escalation.raisedOn,
      href: "/fahr/escalations?tab=queue",
      kind: escalation.kind === "Quota" ? "quota" : "policy",
    });
  }

  const overQuota = Object.values(MINISTRY_BY_ID).filter((m) => m.tokensUsedM > m.tokenQuotaM);
  if (overQuota.length > 0) {
    out.push({
      id: "n-fahr-quota",
      title: "Entity over its AI usage quota",
      body: `${overQuota.map((m) => m.shortName).join(", ")} exceeded the monthly allocation.`,
      time: "Yesterday",
      href: "/fahr/entities",
      kind: "quota",
    });
  }

  out.push({
    id: "n-fahr-policy",
    title: "Governance policy review due",
    body: "The human-in-the-loop policy is scheduled for its quarterly review this week.",
    time: "2 days ago",
    href: "/fahr/governance",
    kind: "policy",
  });

  return out;
}

function leadershipNotifications(input: NotificationInput): FederalNotification[] {
  const live: FederalNotification[] = [];
  for (const decision of sessionDecisions(input)) {
    if (decision.decision !== "approved_live" && decision.decision !== "endorsed") continue;
    const submission = input.submissions.find((s) => s.id === decision.submissionId);
    if (!submission) continue;
    const ministry = MINISTRY_BY_ID[submission.ministryId];
    live.push({
      id: `n-lead-live-${decision.id}`,
      title: `New project live: ${submission.title}`,
      body: `${ministry?.shortName ?? "An entity"} · ${submission.hoursSavedPerMonth} hours returned a month.`,
      time: decision.on,
      href: `/leadership?project=${submission.id}`,
      kind: "milestone",
    });
  }
  return [
    ...live,
    {
      id: "n-lead-briefing",
      title: "Quarterly readiness briefing is ready",
      body: "National AI readiness, entity ranking and capability gaps for Q3 2026.",
      time: "Today",
      href: "/leadership/briefings",
      kind: "briefing",
    },
    {
      id: "n-lead-outcomes",
      title: "Programme outcomes updated",
      body: "Hours saved and value created were refreshed with September delivery data.",
      time: "Yesterday",
      href: "/leadership/outcomes",
      kind: "milestone",
    },
    {
      id: "n-lead-risk",
      title: "Two entities below the readiness threshold",
      body: "Justice and Interior remain under the 65% on-track line.",
      time: "3 days ago",
      href: "/leadership/ministries",
      kind: "risk",
    },
  ];
}

/** Notifications for a role, newest concern first. */
export function buildNotifications(
  role: NotificationRole,
  input: NotificationInput,
): FederalNotification[] {
  switch (role) {
    case "learner":
      return learnerNotifications(input);
    case "manager":
      return managerNotifications(input);
    case "ministry":
      return ministryNotifications(input);
    case "fahr":
      return fahrNotifications(input);
    case "leadership":
      return leadershipNotifications(input);
    default:
      return [];
  }
}
