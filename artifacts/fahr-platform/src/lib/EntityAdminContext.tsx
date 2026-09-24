// Session store for the entity (Ministry) admin console.
//
// The federal store owns anything more than one role sees — submissions,
// approvals, credentials, escalations, the audit trail. This store owns the
// administration layer: cohorts the admin creates, accounts they invite or
// reassign, content they publish or retire, events they schedule or cancel and
// communications they send. Every action that a stakeholder would expect to see
// in the audit trail is also written there through the federal store, so the
// FAHR console shows what the entity did.
//
// Session-scoped only — front-end mock, no backend.

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useFederalData } from "@/lib/FederalDataContext";
import { AGENTS } from "@/lib/constants";
import { COMPETENCY_BY_ID } from "@/lib/learningData";
import type { Cohort, CohortStatus, ContentItem } from "@/lib/federal/model";
import { CONTENT_ITEMS, FOCUS, SESSIONS } from "@/lib/federal/seed";
import { COHORT_BY_ID, cohortsOf } from "@/lib/federal/selectors";
import {
  CONTENT_META,
  ENTITY_ACCOUNTS,
  ENTITY_ADMIN,
  ENTITY_COMMUNICATIONS,
} from "@/lib/entityAdmin/seed";
import { eventFromSession } from "@/lib/entityAdmin/selectors";
import type {
  AccountOverride,
  AccountStatus,
  Communication,
  CommunicationChannel,
  CommunicationKind,
  ConsentState,
  ContentOverride,
  ContentRecord,
  ContentStatus,
  CohortOverride,
  EntityAccount,
  EntityEvent,
  EventFormat,
  EventOverride,
  PlatformRole,
} from "@/lib/entityAdmin/model";

const STORAGE_KEY = "fahr.entityAdmin.session.v1";

type MutableState = {
  cohorts: Cohort[];
  cohortOverrides: Record<string, CohortOverride>;
  accounts: EntityAccount[];
  accountOverrides: Record<string, AccountOverride>;
  events: EntityEvent[];
  eventOverrides: Record<string, EventOverride>;
  communications: Communication[];
};

const EMPTY_STATE: MutableState = {
  cohorts: [],
  cohortOverrides: {},
  accounts: [],
  accountOverrides: {},
  events: [],
  eventOverrides: {},
  communications: [],
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Session storage can hold a stale shape from an earlier build. Anything that
 * does not look like what we wrote is dropped rather than trusted.
 */
function readStored(): MutableState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_STATE;
    const list = <T,>(value: unknown): T[] =>
      Array.isArray(value) ? (value.filter((v) => isRecord(v) && typeof v.id === "string") as T[]) : [];
    const map = <T,>(value: unknown): Record<string, T> =>
      isRecord(value)
        ? (Object.fromEntries(
            Object.entries(value).filter(([, v]) => isRecord(v)),
          ) as Record<string, T>)
        : {};
    return {
      cohorts: list<Cohort>(parsed.cohorts),
      cohortOverrides: map<CohortOverride>(parsed.cohortOverrides),
      accounts: list<EntityAccount>(parsed.accounts),
      accountOverrides: map<AccountOverride>(parsed.accountOverrides),
      events: list<EntityEvent>(parsed.events),
      eventOverrides: map<EventOverride>(parsed.eventOverrides),
      communications: list<Communication>(parsed.communications),
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
    // Storage is a convenience; the session still works without it.
  }
}

/** Today, formatted the way every seeded date is written. */
function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

let counter = 0;
const nextId = (prefix: string) => {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
};

const emailFor = (name: string): string =>
  `${name
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .join(".")}@mohap.gov.ae`;

/** Bumps a semantic-ish version label: v1.2 -> v1.3. */
function bumpVersion(version: string, minor = true): string {
  const match = version.match(/^v?(\d+)\.(\d+)$/);
  if (!match) return version;
  const major = Number(match[1]);
  const patch = Number(match[2]);
  return minor ? `v${major}.${patch + 1}` : `v${major + 1}.0`;
}

export type CreateCohortInput = {
  name: string;
  departmentId?: string;
  learners: number;
  startsOn: string;
  status?: CohortStatus;
};

export type InviteUserInput = {
  name: string;
  email?: string;
  jobRole: string;
  departmentId?: string;
  cohortId?: string;
  platformRole: PlatformRole;
};

export type CreateContentInput = {
  title: string;
  type: ContentItem["type"];
  programme: string;
  pathway: string;
  competencyId: string;
  audience: string;
  language: ContentItem["language"];
  durationMins: number;
  summary: string;
};

export type ScheduleEventInput = {
  title: string;
  summary: string;
  format: EventFormat;
  facilitator: string;
  date: string;
  time: string;
  location: string;
  seats: number;
  audienceLabel: string;
  competencyId?: string;
};

export type SendCommunicationInput = {
  kind: CommunicationKind;
  subject: string;
  body: string;
  audienceKind: Communication["audienceKind"];
  audienceId?: string;
  audienceLabel: string;
  recipients: number;
  channel: CommunicationChannel;
  /** Set for a scheduled send; omitted sends immediately. */
  scheduledFor?: string;
  cadence?: string;
};

export type EntityAdminValue = {
  /** The entity's cohorts: seeded plus anything created this session. */
  cohorts: Cohort[];
  getCohort: (cohortId: string) => Cohort | undefined;
  accounts: EntityAccount[];
  getAccount: (accountId: string) => EntityAccount | undefined;
  events: EntityEvent[];
  getEvent: (eventId: string) => EntityEvent | undefined;
  communications: Communication[];

  createCohort: (input: CreateCohortInput) => Cohort;
  setCohortStatus: (cohortId: string, status: CohortStatus) => void;

  inviteUser: (input: InviteUserInput) => EntityAccount;
  /** Bulk import: one invite per row, returned in the order given. */
  importUsers: (rows: InviteUserInput[]) => EntityAccount[];
  updateAccount: (accountId: string, patch: AccountOverride) => void;
  setAccountStatus: (accountId: string, status: AccountStatus) => void;
  requestConsent: (accountId: string) => void;
  setConsent: (accountId: string, consent: ConsentState) => void;


  scheduleEvent: (input: ScheduleEventInput) => EntityEvent;
  rescheduleEvent: (eventId: string, date: string, time: string, note?: string) => void;
  cancelEvent: (eventId: string, note?: string) => void;
  updateEventSeats: (eventId: string, seats: number) => void;

  sendCommunication: (input: SendCommunicationInput) => Communication;

  /** Drops everything the entity admin did this session. */
  resetEntitySession: () => void;
};

const EntityAdminContext = createContext<EntityAdminValue | null>(null);

export function EntityAdminProvider({ children }: { children: React.ReactNode }) {
  const { recordAudit } = useFederalData();
  const [state, setStateRaw] = useState<MutableState>(readStored);

  const update = useCallback((patch: (prev: MutableState) => MutableState) => {
    setStateRaw((prev) => {
      const next = patch(prev);
      persist(next);
      return next;
    });
  }, []);

  const audit = useCallback(
    (action: string, status: string, risk: "Low" | "Medium" | "High" = "Low", agent = "Human decision") => {
      recordAudit({
        actor: ENTITY_ADMIN,
        agent,
        action,
        risk,
        status,
        ministryId: FOCUS.ministryId,
      });
    },
    [recordAudit],
  );

  // -- Cohorts --------------------------------------------------------------

  const cohorts = useMemo<Cohort[]>(() => {
    const seeded = cohortsOf(FOCUS.ministryId).map((cohort) => {
      const override = state.cohortOverrides[cohort.id];
      return override ? { ...cohort, ...override } : cohort;
    });
    const created = state.cohorts.map((cohort) => {
      const override = state.cohortOverrides[cohort.id];
      return override ? { ...cohort, ...override } : cohort;
    });
    return [...created, ...seeded];
  }, [state.cohorts, state.cohortOverrides]);

  const getCohort = useCallback(
    (cohortId: string) => cohorts.find((c) => c.id === cohortId) ?? COHORT_BY_ID[cohortId],
    [cohorts],
  );

  const createCohort = useCallback(
    (input: CreateCohortInput): Cohort => {
      const cohort: Cohort = {
        id: nextId("coh"),
        ministryId: FOCUS.ministryId,
        departmentId: input.departmentId,
        name: input.name,
        status: input.status ?? "Planning",
        learners: Math.max(0, Math.round(input.learners)),
        progress: 0,
        startsOn: input.startsOn,
      };
      update((prev) => ({ ...prev, cohorts: [cohort, ...prev.cohorts] }));
      audit(
        `Created cohort ${cohort.name} (${cohort.learners} learners)`,
        "Created",
      );
      return cohort;
    },
    [audit, update],
  );

  const setCohortStatus = useCallback(
    (cohortId: string, status: CohortStatus) => {
      const cohort = getCohort(cohortId);
      update((prev) => ({
        ...prev,
        cohortOverrides: {
          ...prev.cohortOverrides,
          [cohortId]: { ...prev.cohortOverrides[cohortId], status },
        },
      }));
      audit(`Moved ${cohort?.name ?? "a cohort"} to ${status}`, status);
    },
    [audit, getCohort, update],
  );

  // -- Accounts -------------------------------------------------------------

  const accounts = useMemo<EntityAccount[]>(() => {
    const apply = (account: EntityAccount): EntityAccount => {
      const override = state.accountOverrides[account.id];
      return override ? { ...account, ...override } : account;
    };
    return [...state.accounts.map(apply), ...ENTITY_ACCOUNTS.map(apply)];
  }, [state.accounts, state.accountOverrides]);

  const getAccount = useCallback(
    (accountId: string) => accounts.find((a) => a.id === accountId),
    [accounts],
  );

  const buildInvite = useCallback((input: InviteUserInput): EntityAccount => ({
    id: nextId("ea"),
    name: input.name,
    email: input.email?.trim() ? input.email.trim() : emailFor(input.name),
    jobRole: input.jobRole,
    departmentId: input.departmentId,
    cohortId: input.cohortId,
    platformRole: input.platformRole,
    status: "Invited",
    lastActive: "—",
    profileCompletion: 15,
    missingProfileFields: ["Job family", "Learning goals", "Preferred language"],
    consent: "Pending",
    invitedOn: today(),
    createdInSession: true,
  }), []);

  const inviteUser = useCallback(
    (input: InviteUserInput): EntityAccount => {
      const account = buildInvite(input);
      update((prev) => ({ ...prev, accounts: [account, ...prev.accounts] }));
      audit(`Invited ${account.name} as ${account.platformRole}`, "Invited");
      return account;
    },
    [audit, buildInvite, update],
  );

  const importUsers = useCallback(
    (rows: InviteUserInput[]): EntityAccount[] => {
      const created = rows.map(buildInvite);
      if (created.length === 0) return [];
      update((prev) => ({ ...prev, accounts: [...created, ...prev.accounts] }));
      audit(`Bulk imported ${created.length} accounts`, "Invited");
      return created;
    },
    [audit, buildInvite, update],
  );

  const updateAccount = useCallback(
    (accountId: string, patch: AccountOverride) => {
      const account = accounts.find((a) => a.id === accountId);
      update((prev) => ({
        ...prev,
        accountOverrides: {
          ...prev.accountOverrides,
          [accountId]: { ...prev.accountOverrides[accountId], ...patch },
        },
      }));
      const parts: string[] = [];
      if (patch.platformRole) parts.push(`platform role ${patch.platformRole}`);
      if (patch.departmentId) parts.push("department");
      if (patch.cohortId) parts.push("cohort");
      if (patch.jobRole) parts.push(`job role ${patch.jobRole}`);
      audit(
        `Updated ${account?.name ?? "an account"}${parts.length > 0 ? `: ${parts.join(", ")}` : ""}`,
        "Updated",
      );
    },
    [accounts, audit, update],
  );

  const setAccountStatus = useCallback(
    (accountId: string, status: AccountStatus) => {
      const account = accounts.find((a) => a.id === accountId);
      update((prev) => ({
        ...prev,
        accountOverrides: {
          ...prev.accountOverrides,
          [accountId]: { ...prev.accountOverrides[accountId], status },
        },
      }));
      audit(
        `Set ${account?.name ?? "an account"} to ${status}`,
        status,
        status === "Suspended" ? "Medium" : "Low",
      );
    },
    [accounts, audit, update],
  );

  const setConsent = useCallback(
    (accountId: string, consent: ConsentState) => {
      const account = accounts.find((a) => a.id === accountId);
      update((prev) => ({
        ...prev,
        accountOverrides: {
          ...prev.accountOverrides,
          [accountId]: { ...prev.accountOverrides[accountId], consent },
        },
      }));
      audit(`Recorded ${consent.toLowerCase()} data consent for ${account?.name ?? "an account"}`, consent, "Medium");
    },
    [accounts, audit, update],
  );

  const requestConsent = useCallback(
    (accountId: string) => {
      const account = accounts.find((a) => a.id === accountId);
      audit(`Requested data-processing consent from ${account?.name ?? "an account"}`, "Requested");
    },
    [accounts, audit],
  );

  // -- Content --------------------------------------------------------------

  // -- Events ---------------------------------------------------------------

  const events = useMemo<EntityEvent[]>(() => {
    const apply = (event: EntityEvent): EntityEvent => {
      const override = state.eventOverrides[event.id];
      if (!override) return event;
      const { note: _note, ...rest } = override;
      return { ...event, ...rest };
    };
    const seeded = SESSIONS.filter((s) => s.ministryId === FOCUS.ministryId)
      .map(eventFromSession)
      .map(apply);
    return [...state.events.map(apply), ...seeded];
  }, [state.events, state.eventOverrides]);

  const getEvent = useCallback((eventId: string) => events.find((e) => e.id === eventId), [events]);

  const scheduleEvent = useCallback(
    (input: ScheduleEventInput): EntityEvent => {
      const event: EntityEvent = {
        id: nextId("ev"),
        title: input.title,
        summary: input.summary,
        format: input.format,
        facilitator: input.facilitator,
        date: input.date,
        time: input.time,
        location: input.location,
        seats: Math.max(1, Math.round(input.seats)),
        registered: 0,
        audienceLabel: input.audienceLabel,
        competencyId: input.competencyId,
        status: "Open",
        createdInSession: true,
      };
      update((prev) => ({ ...prev, events: [event, ...prev.events] }));
      audit(
        `Scheduled ${event.format.toLowerCase()} "${event.title}" on ${event.date} (${event.seats} seats)`,
        "Scheduled",
      );
      return event;
    },
    [audit, update],
  );

  const rescheduleEvent = useCallback(
    (eventId: string, date: string, time: string, note?: string) => {
      const event = events.find((e) => e.id === eventId);
      update((prev) => ({
        ...prev,
        eventOverrides: {
          ...prev.eventOverrides,
          [eventId]: { ...prev.eventOverrides[eventId], date, time, note, status: "Open" },
        },
      }));
      audit(
        `Rescheduled "${event?.title ?? "an event"}" to ${date}, ${time}${note ? ` — ${note}` : ""}`,
        "Rescheduled",
        "Medium",
      );
    },
    [audit, events, update],
  );

  const cancelEvent = useCallback(
    (eventId: string, note?: string) => {
      const event = events.find((e) => e.id === eventId);
      update((prev) => ({
        ...prev,
        eventOverrides: {
          ...prev.eventOverrides,
          [eventId]: { ...prev.eventOverrides[eventId], status: "Cancelled", note },
        },
      }));
      audit(
        `Cancelled "${event?.title ?? "an event"}"${note ? ` — ${note}` : ""}`,
        "Cancelled",
        "Medium",
      );
    },
    [audit, events, update],
  );

  const updateEventSeats = useCallback(
    (eventId: string, seats: number) => {
      const event = events.find((e) => e.id === eventId);
      if (!event || !Number.isFinite(seats) || seats < 1) return;
      const rounded = Math.round(seats);
      update((prev) => ({
        ...prev,
        eventOverrides: {
          ...prev.eventOverrides,
          [eventId]: {
            ...prev.eventOverrides[eventId],
            seats: rounded,
            status: rounded <= event.registered ? "Full" : "Open",
          },
        },
      }));
      audit(`Changed "${event.title}" capacity to ${rounded} seats`, "Updated");
    },
    [audit, events, update],
  );

  // -- Communications -------------------------------------------------------

  const communications = useMemo<Communication[]>(
    () => [...state.communications, ...ENTITY_COMMUNICATIONS],
    [state.communications],
  );

  const sendCommunication = useCallback(
    (input: SendCommunicationInput): Communication => {
      const scheduled = Boolean(input.scheduledFor);
      const record: Communication = {
        id: nextId("cm"),
        kind: input.kind,
        subject: input.subject,
        body: input.body,
        audienceKind: input.audienceKind,
        audienceId: input.audienceId,
        audienceLabel: input.audienceLabel,
        recipients: Math.max(0, Math.round(input.recipients)),
        channel: input.channel,
        status: scheduled ? "Scheduled" : "Sent",
        sentOn: scheduled ? undefined : today(),
        scheduledFor: input.scheduledFor,
        cadence: input.cadence,
        by: ENTITY_ADMIN,
        createdInSession: true,
      };
      update((prev) => ({ ...prev, communications: [record, ...prev.communications] }));
      audit(
        `${scheduled ? "Scheduled" : "Sent"} ${record.kind.toLowerCase()} "${record.subject}" to ${record.audienceLabel} (${record.recipients} recipients)`,
        record.status,
        "Low",
        AGENTS.coaching,
      );
      return record;
    },
    [audit, update],
  );

  const resetEntitySession = useCallback(() => {
    setStateRaw(EMPTY_STATE);
    persist(EMPTY_STATE);
  }, []);

  const value = useMemo<EntityAdminValue>(
    () => ({
      cohorts,
      getCohort,
      accounts,
      getAccount,
      events,
      getEvent,
      communications,
      createCohort,
      setCohortStatus,
      inviteUser,
      importUsers,
      updateAccount,
      setAccountStatus,
      requestConsent,
      setConsent,
      scheduleEvent,
      rescheduleEvent,
      cancelEvent,
      updateEventSeats,
      sendCommunication,
      resetEntitySession,
    }),
    [
      cohorts,
      getCohort,
      accounts,
      getAccount,
      events,
      getEvent,
      communications,
      createCohort,
      setCohortStatus,
      inviteUser,
      importUsers,
      updateAccount,
      setAccountStatus,
      requestConsent,
      setConsent,
      scheduleEvent,
      rescheduleEvent,
      cancelEvent,
      updateEventSeats,
      sendCommunication,
      resetEntitySession,
    ],
  );

  return <EntityAdminContext.Provider value={value}>{children}</EntityAdminContext.Provider>;
}

export function useEntityAdmin(): EntityAdminValue {
  const ctx = useContext(EntityAdminContext);
  if (!ctx) throw new Error("useEntityAdmin must be used inside EntityAdminProvider");
  return ctx;
}
