// Session store for the federal programme model.
//
// The four role consoles read the same state from here, so a decision taken as
// a line manager is visible to the entity admin, FAHR and leadership for the
// rest of the session. Session-scoped only — front-end mock, no backend.

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { AGENTS } from "@/lib/constants";
import { deriveLiveLearner, type LiveLearnerState } from "@/lib/federal/live";
import {
  buildNotifications,
  type FederalNotification,
  type NotificationRole,
} from "@/lib/federal/notifications";
import type {
  ApprovalRecord,
  AuditEvent,
  Credential,
  Escalation,
  Ministry,
  Person,
  Submission,
  SubmissionState,
  TimelineEntry,
} from "@/lib/federal/model";
import {
  APPROVALS,
  AUDIT_EVENTS,
  CREDENTIALS,
  ESCALATIONS,
  FOCUS,
  MINISTRIES,
  PEOPLE,
  SESSIONS,
  SUBMISSIONS,
} from "@/lib/federal/seed";
import { levelForScore, statusForSignals } from "@/lib/federal/selectors";

/** Everything a role action can change during the session. */
type MutableState = {
  submissions: Record<string, { state: SubmissionState; reviewer?: string; timeline: TimelineEntry[] }>;
  approvals: ApprovalRecord[];
  audit: AuditEvent[];
  credentials: Credential[];
  escalations: Escalation[];
  /** Triage changes FAHR made to an escalation, seeded or raised this session. */
  escalationPatches: Record<string, Partial<Escalation>>;
  /** ministryId -> revised monthly token quota, in millions. */
  quotas: Record<string, number>;
  /** ministryId -> entity administrator FAHR assigned this session. */
  entityAdmins: Record<string, string>;
  readNotificationIds: string[];
};

const EMPTY_STATE: MutableState = {
  submissions: {},
  approvals: [],
  audit: [],
  credentials: [],
  escalations: [],
  escalationPatches: {},
  quotas: {},
  entityAdmins: {},
  readNotificationIds: [],
};

const STORAGE_KEY = "fahr.federal.session.v1";

const SUBMISSION_STATES: SubmissionState[] = [
  "awaiting_manager",
  "revision_requested",
  "awaiting_entity",
  "endorsed",
  "escalated",
  "deployed",
];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Session storage can hold anything — a stale shape from an earlier build, or
 * hand-edited nonsense. Anything unrecognised is dropped rather than trusted.
 */
function readStored(): MutableState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_STATE;

    const validIds = new Set(SUBMISSIONS.map((s) => s.id));
    const submissions: MutableState["submissions"] = {};
    if (isRecord(parsed.submissions)) {
      for (const [id, value] of Object.entries(parsed.submissions)) {
        if (!validIds.has(id) || !isRecord(value)) continue;
        const state = value.state;
        if (typeof state !== "string" || !SUBMISSION_STATES.includes(state as SubmissionState)) continue;
        const timeline = Array.isArray(value.timeline)
          ? value.timeline.filter(
              (t): t is TimelineEntry =>
                isRecord(t) && typeof t.date === "string" && typeof t.event === "string",
            )
          : [];
        submissions[id] = {
          state: state as SubmissionState,
          reviewer: typeof value.reviewer === "string" ? value.reviewer : undefined,
          timeline,
        };
      }
    }

    const quotas: Record<string, number> = {};
    if (isRecord(parsed.quotas)) {
      const ministryIds = new Set(MINISTRIES.map((m) => m.id));
      for (const [id, value] of Object.entries(parsed.quotas)) {
        if (ministryIds.has(id) && typeof value === "number" && Number.isFinite(value) && value > 0) {
          quotas[id] = value;
        }
      }
    }

    const entityAdmins: Record<string, string> = {};
    if (isRecord(parsed.entityAdmins)) {
      const ministryIds = new Set(MINISTRIES.map((m) => m.id));
      for (const [id, value] of Object.entries(parsed.entityAdmins)) {
        if (ministryIds.has(id) && typeof value === "string" && value.trim()) entityAdmins[id] = value;
      }
    }

    const escalationPatches: Record<string, Partial<Escalation>> = {};
    if (isRecord(parsed.escalationPatches)) {
      for (const [id, value] of Object.entries(parsed.escalationPatches)) {
        if (isRecord(value)) escalationPatches[id] = value as Partial<Escalation>;
      }
    }

    const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

    return {
      escalationPatches,
      entityAdmins,
      submissions,
      approvals: asArray<ApprovalRecord>(parsed.approvals).filter((a) => isRecord(a) && typeof a.id === "string"),
      audit: asArray<AuditEvent>(parsed.audit).filter((a) => isRecord(a) && typeof a.id === "string"),
      credentials: asArray<Credential>(parsed.credentials).filter((c) => isRecord(c) && typeof c.id === "string"),
      escalations: asArray<Escalation>(parsed.escalations).filter((e) => isRecord(e) && typeof e.id === "string"),
      quotas,
      readNotificationIds: isStringArray(parsed.readNotificationIds) ? parsed.readNotificationIds : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function persist(state: MutableState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is a convenience here; the session still works without it.
  }
}

/** Today, formatted the way every seeded date is written. */
function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

let idCounter = 0;
const nextId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
};

export type DecisionOptions = { by?: string; note?: string };

/** An entity, learner-support agent or system raising an item with FAHR. */
export type EscalationRequest = {
  ministryId: string;
  subject: string;
  kind: Escalation["kind"];
  detail: string;
  raisedBy?: string;
  /** Named agent, when the platform rather than a person raised it. */
  agent?: string;
  submissionId?: string;
  requestedQuotaM?: number;
  personId?: string;
  priority?: Escalation["priority"];
};

/** The fields FAHR can change while triaging an escalation. */
export type EscalationTriage = {
  status?: Escalation["status"];
  assignee?: string;
  priority?: Escalation["priority"];
  resolution?: string;
};

export type CredentialRequest = {
  personId: string;
  personName?: string;
  title: string;
  levelId?: string;
  submissionId?: string;
  by?: string;
};

export type FederalDataValue = {
  /** Ministries with any quota change from this session applied. */
  ministries: Ministry[];
  /** The authored roster, with the demo learner's live figures applied. */
  people: Person[];
  submissions: Submission[];
  approvals: ApprovalRecord[];
  auditEvents: AuditEvent[];
  credentials: Credential[];
  escalations: Escalation[];
  sessions: typeof SESSIONS;
  /** Live learner-journey state for the person the demo is played as. */
  live: LiveLearnerState;
  focus: typeof FOCUS;

  getPerson: (personId: string) => Person | undefined;
  getSubmission: (submissionId: string) => Submission | undefined;
  /** A manager's direct reports. */
  teamOf: (managerId: string) => Person[];
  /** Decisions recorded against a submission, oldest first. */
  approvalsFor: (submissionId: string) => ApprovalRecord[];

  // Cross-role actions.
  signOff: (submissionId: string, options?: DecisionOptions) => void;
  requestRevision: (submissionId: string, options?: DecisionOptions) => void;
  endorse: (submissionId: string, options?: DecisionOptions) => void;
  escalate: (submissionId: string, options?: DecisionOptions) => void;
  issueCredential: (request: CredentialRequest) => void;
  adjustQuota: (ministryId: string, quotaM: number, options?: DecisionOptions) => void;
  /** Raises a new federal escalation and returns its id. */
  raiseEscalation: (input: EscalationRequest) => string;
  triageEscalation: (escalationId: string, patch: EscalationTriage, options?: DecisionOptions) => void;
  assignEntityAdmin: (ministryId: string, adminName: string, options?: DecisionOptions) => void;
  recordAudit: (event: Omit<AuditEvent, "id" | "time"> & { time?: string }) => void;

  // Notifications.
  notificationsFor: (role: NotificationRole) => FederalNotification[];
  isNotificationRead: (id: string) => boolean;
  unreadCountFor: (role: NotificationRole) => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role: NotificationRole) => void;

  /** Drops every decision taken this session. */
  resetSession: () => void;
};

const FederalDataContext = createContext<FederalDataValue | null>(null);

export function FederalDataProvider({ children }: { children: React.ReactNode }) {
  const { result, courseProgress, getCoursePercent } = useLearnerProgress();
  const [state, setStateRaw] = useState<MutableState>(readStored);

  const update = useCallback((patch: (prev: MutableState) => MutableState) => {
    setStateRaw((prev) => {
      const next = patch(prev);
      persist(next);
      return next;
    });
  }, []);

  const live = useMemo(
    () => deriveLiveLearner({ result, courseProgress, getCoursePercent }),
    [result, courseProgress, getCoursePercent],
  );

  /** The roster with the demo learner's seeded figures replaced by live ones. */
  const people = useMemo<Person[]>(
    () =>
      PEOPLE.map((person) => {
        if (!person.live) return person;
        const score = live.assessed ? live.assessmentScore : person.assessmentScore;
        return {
          ...person,
          levelId: live.assessed ? live.levelId : levelForScore(score).id,
          assessmentScore: score,
          pathwayProgress: live.pathwayProgress,
          competencyScores: live.competencyScores ?? person.competencyScores,
          gapCompetencyIds: live.assessed ? live.gapCompetencyIds : person.gapCompetencyIds,
          status: statusForSignals(live.pathwayProgress, 0),
        };
      }),
    [live],
  );

  const ministries = useMemo<Ministry[]>(
    () =>
      MINISTRIES.map((ministry) => {
        const quota = state.quotas[ministry.id];
        const admin = state.entityAdmins[ministry.id];
        if (!quota && !admin) return ministry;
        return {
          ...ministry,
          tokenQuotaM: quota ?? ministry.tokenQuotaM,
          entityAdmin: admin ?? ministry.entityAdmin,
        };
      }),
    [state.quotas, state.entityAdmins],
  );

  const submissions = useMemo<Submission[]>(
    () =>
      SUBMISSIONS.map((submission) => {
        const override = state.submissions[submission.id];
        if (!override) return submission;
        return {
          ...submission,
          state: override.state,
          reviewer: override.reviewer ?? submission.reviewer,
          timeline: [...submission.timeline, ...override.timeline],
        };
      }),
    [state.submissions],
  );

  const approvals = useMemo(() => [...APPROVALS, ...state.approvals], [state.approvals]);
  const auditEvents = useMemo(() => [...state.audit, ...AUDIT_EVENTS], [state.audit]);
  const credentials = useMemo(() => [...state.credentials, ...CREDENTIALS], [state.credentials]);
  const escalations = useMemo(
    () =>
      [...state.escalations, ...ESCALATIONS].map((escalation) => {
        const patch = state.escalationPatches[escalation.id];
        return patch ? { ...escalation, ...patch } : escalation;
      }),
    [state.escalations, state.escalationPatches],
  );

  const recordAudit = useCallback(
    (event: Omit<AuditEvent, "id" | "time"> & { time?: string }) =>
      update((prev) => ({
        ...prev,
        audit: [{ id: nextId("ae"), time: event.time ?? "Just now", ...event }, ...prev.audit],
      })),
    [update],
  );

  /** Moves a submission along the chain and records the decision and audit trail. */
  const decide = useCallback(
    (
      submissionId: string,
      decision: ApprovalRecord["decision"],
      role: ApprovalRecord["role"],
      nextState: SubmissionState,
      reviewer: string | undefined,
      event: string,
      options: DecisionOptions | undefined,
      auditAction: string,
      risk: AuditEvent["risk"],
      auditStatus: string,
    ) => {
      const submission = SUBMISSIONS.find((s) => s.id === submissionId);
      if (!submission) return;
      const by = options?.by ?? "Demo user";
      const on = today();
      update((prev) => {
        const existing = prev.submissions[submissionId];
        return {
          ...prev,
          submissions: {
            ...prev.submissions,
            [submissionId]: {
              state: nextState,
              reviewer,
              timeline: [
                ...(existing?.timeline ?? []),
                { date: on, event: options?.note ? `${event} — ${options.note}` : event },
              ],
            },
          },
          approvals: [
            ...prev.approvals,
            { id: nextId("a"), submissionId, role, decision, by, on, note: options?.note },
          ],
          audit: [
            {
              id: nextId("ae"),
              time: "Just now",
              actor: by,
              agent: "Human decision",
              action: `${auditAction}: ${submission.title}`,
              risk,
              status: auditStatus,
              ministryId: submission.ministryId,
            },
            ...prev.audit,
          ],
        };
      });
    },
    [update],
  );

  const signOff = useCallback(
    (submissionId: string, options?: DecisionOptions) =>
      decide(
        submissionId,
        "signed_off",
        "manager",
        "awaiting_entity",
        "Entity Admin",
        "Line manager signed off — sent for entity endorsement",
        options,
        "Signed off workplace project",
        "Low",
        "Approved",
      ),
    [decide],
  );

  const requestRevision = useCallback(
    (submissionId: string, options?: DecisionOptions) =>
      decide(
        submissionId,
        "revision_requested",
        "manager",
        "revision_requested",
        undefined,
        "Revision requested",
        options,
        "Requested revision on workplace project",
        "Medium",
        "Returned to learner",
      ),
    [decide],
  );

  const endorse = useCallback(
    (submissionId: string, options?: DecisionOptions) =>
      decide(
        submissionId,
        "endorsed",
        "ministry",
        "endorsed",
        undefined,
        "Entity endorsed the project",
        options,
        "Endorsed workplace project",
        "Low",
        "Approved",
      ),
    [decide],
  );

  const escalate = useCallback(
    (submissionId: string, options?: DecisionOptions) => {
      const submission = SUBMISSIONS.find((s) => s.id === submissionId);
      decide(
        submissionId,
        "escalated",
        "ministry",
        "escalated",
        "FAHR Programme Team",
        "Escalated to FAHR for federal review",
        options,
        "Escalated workplace project to FAHR",
        "Medium",
        "Open",
      );
      if (!submission) return;
      update((prev) => ({
        ...prev,
        escalations: [
          {
            id: nextId("es"),
            ministryId: submission.ministryId,
            subject: submission.title,
            kind: "Approval",
            raisedOn: today(),
            raisedBy: options?.by ?? "Entity Admin",
            status: "Open",
            detail: options?.note ?? "Entity referred this project for a federal decision.",
            submissionId,
          },
          ...prev.escalations,
        ],
      }));
    },
    [decide, update],
  );

  const issueCredential = useCallback(
    (request: CredentialRequest) => {
      const person = PEOPLE.find((p) => p.id === request.personId);
      const personName = request.personName ?? person?.name ?? "Federal employee";
      const levelId = request.levelId ?? person?.levelId ?? "practitioner";
      const initials = personName
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const code = `FAHR-${new Date().getFullYear()}-${initials}-${Math.floor(1000 + Math.random() * 9000)}`;
      update((prev) => ({
        ...prev,
        credentials: [
          {
            id: nextId("cr"),
            personId: request.personId,
            personName,
            title: request.title,
            levelId,
            issuedOn: today(),
            ministryId: person?.ministryId ?? FOCUS.ministryId,
            submissionId: request.submissionId,
            verificationCode: code,
          },
          ...prev.credentials,
        ],
        audit: [
          {
            id: nextId("ae"),
            time: "Just now",
            actor: request.by ?? "FAHR Programme Team",
            agent: "Human decision",
            action: `Issued credential to ${personName}: ${request.title}`,
            risk: "Low" as const,
            status: "Issued",
            ministryId: person?.ministryId,
          },
          ...prev.audit,
        ],
      }));
    },
    [update],
  );

  /** An entity, a learner-support agent or the platform raising a federal item. */
  const raiseEscalation = useCallback(
    (input: EscalationRequest) => {
      const ministry = MINISTRIES.find((m) => m.id === input.ministryId);
      const id = nextId("es");
      update((prev) => ({
        ...prev,
        escalations: [
          {
            id,
            ministryId: input.ministryId,
            subject: input.subject,
            kind: input.kind,
            raisedOn: today(),
            raisedBy: input.raisedBy ?? "Entity Admin",
            status: "Open",
            detail: input.detail,
            submissionId: input.submissionId,
            requestedQuotaM: input.requestedQuotaM,
            personId: input.personId,
            priority: input.priority ?? "Standard",
          },
          ...prev.escalations,
        ],
        audit: [
          {
            id: nextId("ae"),
            time: "Just now",
            actor: input.raisedBy ?? "Entity Admin",
            agent: input.agent ?? "Human decision",
            action: `Raised ${input.kind.toLowerCase()} escalation to FAHR: ${input.subject}`,
            risk: "Medium" as const,
            status: "Open",
            ministryId: ministry?.id,
          },
          ...prev.audit,
        ],
      }));
      return id;
    },
    [update],
  );

  /** FAHR triaging an escalation: assignment, progress and resolution. */
  const triageEscalation = useCallback(
    (escalationId: string, patch: EscalationTriage, options?: DecisionOptions) => {
      const escalation = [...ESCALATIONS].find((e) => e.id === escalationId);
      update((prev) => {
        const known = escalation ?? prev.escalations.find((e) => e.id === escalationId);
        if (!known) return prev;
        const merged: Partial<Escalation> = {
          ...prev.escalationPatches[escalationId],
          ...patch,
          ...(patch.status === "Resolved" ? { resolvedOn: today() } : {}),
        };
        const describe = patch.status
          ? patch.status === "Resolved"
            ? `Resolved escalation: ${known.subject}`
            : `Moved escalation to ${patch.status.toLowerCase()}: ${known.subject}`
          : patch.assignee
            ? `Assigned escalation to ${patch.assignee}: ${known.subject}`
            : `Updated escalation: ${known.subject}`;
        return {
          ...prev,
          escalationPatches: { ...prev.escalationPatches, [escalationId]: merged },
          audit: [
            {
              id: nextId("ae"),
              time: "Just now",
              actor: options?.by ?? "FAHR Programme Team",
              agent: "Human decision",
              action: options?.note ? `${describe} — ${options.note}` : describe,
              risk: "Low" as const,
              status: patch.status ?? "Updated",
              ministryId: known.ministryId,
            },
            ...prev.audit,
          ],
        };
      });
    },
    [update],
  );

  /** FAHR naming (or replacing) an entity's administrator. */
  const assignEntityAdmin = useCallback(
    (ministryId: string, adminName: string, options?: DecisionOptions) => {
      const ministry = MINISTRIES.find((m) => m.id === ministryId);
      if (!ministry || !adminName.trim()) return;
      update((prev) => ({
        ...prev,
        entityAdmins: { ...prev.entityAdmins, [ministryId]: adminName.trim() },
        audit: [
          {
            id: nextId("ae"),
            time: "Just now",
            actor: options?.by ?? "FAHR Programme Team",
            agent: "Human decision",
            action: `Assigned ${adminName.trim()} as entity administrator for ${ministry.shortName}`,
            risk: "Low" as const,
            status: "Applied",
            ministryId,
          },
          ...prev.audit,
        ],
      }));
    },
    [update],
  );

  const adjustQuota = useCallback(
    (ministryId: string, quotaM: number, options?: DecisionOptions) => {
      const ministry = MINISTRIES.find((m) => m.id === ministryId);
      if (!ministry || !Number.isFinite(quotaM) || quotaM <= 0) return;
      update((prev) => ({
        ...prev,
        quotas: { ...prev.quotas, [ministryId]: quotaM },
        audit: [
          {
            id: nextId("ae"),
            time: "Just now",
            actor: options?.by ?? "FAHR Programme Team",
            agent: AGENTS.analytics,
            action: `Adjusted ${ministry.shortName} token quota to ${quotaM}M`,
            risk: "Low" as const,
            status: "Applied",
            ministryId,
          },
          ...prev.audit,
        ],
      }));
    },
    [update],
  );

  const getPerson = useCallback((personId: string) => people.find((p) => p.id === personId), [people]);

  const getSubmission = useCallback(
    (submissionId: string) => submissions.find((s) => s.id === submissionId),
    [submissions],
  );

  const teamOf = useCallback(
    (managerId: string) => people.filter((p) => p.managerId === managerId),
    [people],
  );

  const approvalsFor = useCallback(
    (submissionId: string) => approvals.filter((a) => a.submissionId === submissionId),
    [approvals],
  );

  const notificationsFor = useCallback(
    (role: NotificationRole) =>
      buildNotifications(role, {
        submissions,
        escalations,
        sessions: SESSIONS,
        team: people.filter((p) => p.managerId === FOCUS.managerId),
        live,
      }),
    [submissions, escalations, people, live],
  );

  const isNotificationRead = useCallback(
    (id: string) => state.readNotificationIds.includes(id),
    [state.readNotificationIds],
  );

  const unreadCountFor = useCallback(
    (role: NotificationRole) =>
      notificationsFor(role).filter((n) => !state.readNotificationIds.includes(n.id)).length,
    [notificationsFor, state.readNotificationIds],
  );

  const markNotificationRead = useCallback(
    (id: string) =>
      update((prev) =>
        prev.readNotificationIds.includes(id)
          ? prev
          : { ...prev, readNotificationIds: [...prev.readNotificationIds, id] },
      ),
    [update],
  );

  const markAllNotificationsRead = useCallback(
    (role: NotificationRole) => {
      const ids = notificationsFor(role).map((n) => n.id);
      update((prev) => ({
        ...prev,
        readNotificationIds: Array.from(new Set([...prev.readNotificationIds, ...ids])),
      }));
    },
    [notificationsFor, update],
  );

  const resetSession = useCallback(() => update(() => EMPTY_STATE), [update]);

  const value = useMemo<FederalDataValue>(
    () => ({
      ministries,
      people,
      submissions,
      approvals,
      auditEvents,
      credentials,
      escalations,
      sessions: SESSIONS,
      live,
      focus: FOCUS,
      getPerson,
      getSubmission,
      teamOf,
      approvalsFor,
      signOff,
      requestRevision,
      endorse,
      escalate,
      issueCredential,
      adjustQuota,
      raiseEscalation,
      triageEscalation,
      assignEntityAdmin,
      recordAudit,
      notificationsFor,
      isNotificationRead,
      unreadCountFor,
      markNotificationRead,
      markAllNotificationsRead,
      resetSession,
    }),
    [
      ministries,
      people,
      submissions,
      approvals,
      auditEvents,
      credentials,
      escalations,
      live,
      getPerson,
      getSubmission,
      teamOf,
      approvalsFor,
      signOff,
      requestRevision,
      endorse,
      escalate,
      issueCredential,
      adjustQuota,
      raiseEscalation,
      triageEscalation,
      assignEntityAdmin,
      recordAudit,
      notificationsFor,
      isNotificationRead,
      unreadCountFor,
      markNotificationRead,
      markAllNotificationsRead,
      resetSession,
    ],
  );

  return <FederalDataContext.Provider value={value}>{children}</FederalDataContext.Provider>;
}

export function useFederalData(): FederalDataValue {
  const ctx = useContext(FederalDataContext);
  if (!ctx) throw new Error("useFederalData must be used inside FederalDataProvider");
  return ctx;
}
