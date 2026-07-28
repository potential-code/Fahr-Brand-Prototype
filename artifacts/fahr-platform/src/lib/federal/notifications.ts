// Role-aware notification centre.
//
// Notifications are derived from the session state rather than authored, so
// signing off a submission as a manager actually clears the manager's alert and
// raises the entity's — the same event travelling up the chain.

import type { Escalation, Person, ScheduledSession, Submission } from "./model";
import { MINISTRY_BY_ID } from "./selectors";
import { FOCUS } from "./seed";
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
  live: LiveLearnerState;
};

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

function managerNotifications(input: NotificationInput): FederalNotification[] {
  const out: FederalNotification[] = [];
  const teamIds = new Set(input.team.map((p) => p.id));

  for (const submission of input.submissions) {
    if (submission.state !== "awaiting_manager" || !teamIds.has(submission.personId)) continue;
    const person = input.team.find((p) => p.id === submission.personId);
    out.push({
      id: `n-mgr-approval-${submission.id}`,
      title: "Workplace project awaiting your sign-off",
      body: `${person?.name ?? "A team member"} submitted "${submission.title}".`,
      time: submission.submittedOn,
      href: "/manager/validations",
      kind: "approval",
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
    out.push({
      id: `n-ent-approval-${submission.id}`,
      title: "Project awaiting entity endorsement",
      body: `"${submission.title}" cleared line manager sign-off and needs your decision.`,
      time: submission.submittedOn,
      href: "/ministry/approvals",
      kind: "approval",
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

  for (const escalation of input.escalations) {
    if (escalation.status === "Resolved") continue;
    const ministry = MINISTRY_BY_ID[escalation.ministryId];
    out.push({
      id: `n-fahr-escalation-${escalation.id}`,
      title: `${escalation.kind} escalation from ${ministry?.shortName ?? "an entity"}`,
      body: escalation.subject,
      time: escalation.raisedOn,
      href: "/fahr/escalations",
      kind: escalation.kind === "Quota" ? "quota" : "policy",
    });
  }

  const escalatedProjects = input.submissions.filter((s) => s.state === "escalated");
  if (escalatedProjects.length > 0) {
    out.push({
      id: "n-fahr-approvals",
      title: `${escalatedProjects.length} project${escalatedProjects.length === 1 ? "" : "s"} awaiting federal decision`,
      body: escalatedProjects.map((s) => s.title).join(", "),
      time: "Today",
      href: "/fahr/escalations",
      kind: "approval",
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

function leadershipNotifications(): FederalNotification[] {
  return [
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
      return LEARNER_NOTIFICATIONS;
    case "manager":
      return managerNotifications(input);
    case "ministry":
      return ministryNotifications(input);
    case "fahr":
      return fahrNotifications(input);
    case "leadership":
      return leadershipNotifications();
    default:
      return [];
  }
}
