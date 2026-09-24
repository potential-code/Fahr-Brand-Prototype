// Session store for the FAHR programme console.
//
// The cross-role spine (projects, quota, escalations, credentials) lives in
// `FederalDataContext`. What the *central programme team* administers lives
// here: guardrail enforcement and its policy versions, the integration estate
// and its API credentials, federal user roles, the competency framework and
// catalogue, communications, and the entity onboarding pipeline.
//
// Every action writes to the shared audit trail, so a change made on any of
// these screens shows up in Governance for the rest of the session.
//
// Session-scoped only — front-end mock, no backend.

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AGENTS, CAPABILITY_LEVELS } from "@/lib/constants";
import { COMPETENCIES, type Competency } from "@/lib/learningData";
import { useFederalData } from "@/lib/FederalDataContext";
import type { ContentItem, PlatformUser } from "@/lib/federal/model";
import { CONTENT_ITEMS, GOVERNANCE_POLICIES, PLATFORM_USERS } from "@/lib/federal/seed";
import { ladderRows } from "@/lib/federal/reporting";
import {
  ANNOUNCEMENTS,
  API_CREDENTIALS,
  CATALOGUE_REVISIONS,
  COMPETENCY_EXPECTATIONS,
  ENTITY_ONBOARDINGS,
  GUARDRAIL_EFFECTS,
  GUARDRAIL_EFFECT_BY_ID,
  INTEGRATIONS,
  ONBOARDING_STAGE_ORDER,
  PERSONALISATION_RULE_BY_COMPETENCY,
  POLICY_VERSIONS,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementChannel,
  type AnnouncementKind,
  type ApiCredential,
  type CatalogueRevision,
  type EntityAdminInvite,
  type EntityOnboarding,
  type GuardrailEffect,
  type Integration,
  type IntegrationStatus,
  type OnboardingStageId,
  type PolicyVersion,
} from "@/lib/federal/fahrConsole";

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

type ConsoleState = {
  /** Guardrail id -> enforced. Absent means the seeded value stands. */
  guardrails: Record<string, boolean>;
  policyVersions: PolicyVersion[];
  integrations: Record<string, { status?: IntegrationStatus; lastSync?: string; statusNote?: string }>;
  apiCredentials: ApiCredential[];
  revokedApiCredentialIds: string[];
  announcements: Announcement[];
  userPatches: Record<string, { roleLabel?: string; status?: PlatformUser["status"] }>;
  invitedUsers: PlatformUser[];
  cataloguePatches: Record<string, { status?: ContentItem["status"]; version?: string; updatedOn?: string }>;
  catalogueRevisions: CatalogueRevision[];
  competencyPatches: Record<string, { label?: string; description?: string }>;
  /** competencyId -> levelId -> expectation text. */
  expectationPatches: Record<string, Record<string, string>>;
  /** competencyId -> catalogue item ids mapped to it. */
  mappingPatches: Record<string, string[]>;
  onboardingPatches: Record<string, Partial<EntityOnboarding>>;
  newOnboardings: EntityOnboarding[];
};

const EMPTY_STATE: ConsoleState = {
  guardrails: {},
  policyVersions: [],
  integrations: {},
  apiCredentials: [],
  revokedApiCredentialIds: [],
  announcements: [],
  userPatches: {},
  invitedUsers: [],
  cataloguePatches: {},
  catalogueRevisions: [],
  competencyPatches: {},
  expectationPatches: {},
  mappingPatches: {},
  onboardingPatches: {},
  newOnboardings: [],
};

const STORAGE_KEY = "fahr.console.session.v1";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Anything unrecognised in storage is dropped rather than trusted. */
function readStored(): ConsoleState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_STATE;
    const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
    const asMap = <T,>(value: unknown): Record<string, T> => (isRecord(value) ? (value as Record<string, T>) : {});
    const guardrails: Record<string, boolean> = {};
    if (isRecord(parsed.guardrails)) {
      const ids = new Set(GOVERNANCE_POLICIES.map((p) => p.id));
      for (const [id, value] of Object.entries(parsed.guardrails)) {
        if (ids.has(id) && typeof value === "boolean") guardrails[id] = value;
      }
    }
    return {
      guardrails,
      policyVersions: asArray<PolicyVersion>(parsed.policyVersions).filter(
        (v) => isRecord(v) && typeof v.id === "string",
      ),
      integrations: asMap(parsed.integrations),
      apiCredentials: asArray<ApiCredential>(parsed.apiCredentials).filter(
        (c) => isRecord(c) && typeof c.id === "string",
      ),
      revokedApiCredentialIds: asArray<string>(parsed.revokedApiCredentialIds).filter(
        (id) => typeof id === "string",
      ),
      announcements: asArray<Announcement>(parsed.announcements).filter(
        (a) => isRecord(a) && typeof a.id === "string",
      ),
      userPatches: asMap(parsed.userPatches),
      invitedUsers: asArray<PlatformUser>(parsed.invitedUsers).filter(
        (u) => isRecord(u) && typeof u.id === "string",
      ),
      cataloguePatches: asMap(parsed.cataloguePatches),
      catalogueRevisions: asArray<CatalogueRevision>(parsed.catalogueRevisions).filter(
        (r) => isRecord(r) && typeof r.id === "string",
      ),
      competencyPatches: asMap(parsed.competencyPatches),
      expectationPatches: asMap(parsed.expectationPatches),
      mappingPatches: asMap(parsed.mappingPatches),
      onboardingPatches: asMap(parsed.onboardingPatches),
      newOnboardings: asArray<EntityOnboarding>(parsed.newOnboardings).filter(
        (o) => isRecord(o) && typeof o.id === "string",
      ),
    };
  } catch {
    return EMPTY_STATE;
  }
}

function persist(state: ConsoleState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is a convenience; the session still works without it.
  }
}

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function timeOfDay(): string {
  return `Today, ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

let idCounter = 0;
const nextId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
};

/** Bumps a `v2.4`-style version string by one minor. */
function bumpVersion(version: string): string {
  const match = /^v?(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return `${version}.1`;
  return `v${match[1]}.${Number(match[2]) + 1}`;
}

/** Next federal policy-set version, from the newest recorded one. */
function nextPolicyVersion(versions: PolicyVersion[]): string {
  return bumpVersion(versions[0]?.version ?? "v3.0");
}

// ---------------------------------------------------------------------------
// Audience sizing
// ---------------------------------------------------------------------------

/**
 * Structural estimate of how many people hold a role inside one entity. The
 * seeded user directory only names a handful of people per entity, so audience
 * sizing uses the entity's workforce rather than pretending the directory is
 * complete.
 */
const ROLE_HEADCOUNT: Record<string, (employees: number) => number> = {
  "Entity Admin": () => 2,
  "Department Manager": (employees) => Math.max(1, Math.round(employees / 45)),
  "Content Author": () => 3,
};

export type ConsoleActionOptions = { by?: string; note?: string };

export type NewApiCredential = { credential: ApiCredential; /** Shown once, never stored. */ secret: string };

export type AnnouncementDraft = {
  title: string;
  body: string;
  kind: AnnouncementKind;
  channels: AnnouncementChannel[];
  audience: AnnouncementAudience;
  status?: Announcement["status"];
  scheduledFor?: string;
  by?: string;
  /**
   * Explicit recipient count, for a message aimed at named individuals rather
   * than an audience segment — a coach nudge to one learner, for instance.
   */
  recipients?: number;
};

export type OnboardingDraft = {
  name: string;
  shortName: string;
  sector: string;
  employees: number;
  quotaM: number;
  admins?: EntityAdminInvite[];
  note?: string;
  by?: string;
};

export type UserInvite = {
  name: string;
  email: string;
  roleLabel: string;
  ministryId?: string;
  departmentId?: string;
  by?: string;
};

export type FahrConsoleValue = {
  // Governance.
  /** Guardrail id -> enforced right now. */
  guardrails: Record<string, boolean>;
  /** Guardrails currently enforced and currently relaxed, with their effects. */
  guardrailBehaviour: { enforced: GuardrailEffect[]; relaxed: GuardrailEffect[] };
  policyVersions: PolicyVersion[];
  /** True when the live set differs from the newest recorded version. */
  policyDrift: boolean;
  setGuardrail: (id: string, enabled: boolean, options?: ConsoleActionOptions) => void;
  publishPolicyVersion: (options?: ConsoleActionOptions & { summary?: string }) => void;

  // Integrations.
  integrations: Integration[];
  apiCredentials: ApiCredential[];
  syncIntegration: (id: string, options?: ConsoleActionOptions) => void;
  setIntegrationStatus: (
    id: string,
    status: IntegrationStatus,
    options?: ConsoleActionOptions & { statusNote?: string },
  ) => void;
  createApiCredential: (input: { label: string; scopes: string[]; owner?: string }) => NewApiCredential | null;
  revokeApiCredential: (id: string, options?: ConsoleActionOptions) => void;

  // Users.
  users: PlatformUser[];
  setUserStatus: (userId: string, status: PlatformUser["status"], options?: ConsoleActionOptions) => void;
  inviteUser: (invite: UserInvite) => string | null;

  // Framework and catalogue.
  competencies: Competency[];
  expectationFor: (competencyId: string, levelId: string) => string;
  mappedContentIds: (competencyId: string) => string[];
  catalogue: ContentItem[];
  catalogueRevisions: CatalogueRevision[];
  updateCompetency: (
    competencyId: string,
    patch: { label?: string; description?: string },
    options?: ConsoleActionOptions,
  ) => void;
  setExpectation: (competencyId: string, levelId: string, text: string, options?: ConsoleActionOptions) => void;
  setContentMapping: (competencyId: string, contentIds: string[], options?: ConsoleActionOptions) => void;
  setCatalogueStatus: (
    contentId: string,
    status: ContentItem["status"],
    options?: ConsoleActionOptions,
  ) => void;
  publishCatalogueVersion: (contentId: string, options?: ConsoleActionOptions) => void;

  // Communications.
  announcements: Announcement[];
  /** Recipients an audience resolves to, from the entity workforce figures. */
  estimateRecipients: (audience: AnnouncementAudience) => number;
  sendAnnouncement: (draft: AnnouncementDraft) => string;

  // Entity onboarding.
  onboardings: EntityOnboarding[];
  startOnboarding: (draft: OnboardingDraft) => string;
  advanceOnboarding: (id: string, options?: ConsoleActionOptions) => void;
  addOnboardingAdmin: (id: string, admin: EntityAdminInvite, options?: ConsoleActionOptions) => void;

  /** Drops every console change taken this session. */
  resetConsole: () => void;
};

const FahrConsoleContext = createContext<FahrConsoleValue | null>(null);

export function FahrConsoleProvider({ children }: { children: React.ReactNode }) {
  const { ministries, recordAudit } = useFederalData();
  const [state, setStateRaw] = useState<ConsoleState>(readStored);

  const update = useCallback((patch: (prev: ConsoleState) => ConsoleState) => {
    setStateRaw((prev) => {
      const next = patch(prev);
      persist(next);
      return next;
    });
  }, []);

  // --- Governance ----------------------------------------------------------

  const guardrails = useMemo<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        GOVERNANCE_POLICIES.map((policy) => [policy.id, state.guardrails[policy.id] ?? policy.enabled]),
      ),
    [state.guardrails],
  );

  const guardrailBehaviour = useMemo(() => {
    const enforced = GUARDRAIL_EFFECTS.filter((effect) => guardrails[effect.id]);
    const relaxed = GUARDRAIL_EFFECTS.filter((effect) => !guardrails[effect.id]);
    return { enforced, relaxed };
  }, [guardrails]);

  const policyVersions = useMemo(
    () => [...state.policyVersions, ...POLICY_VERSIONS],
    [state.policyVersions],
  );

  const policyDrift = useMemo(() => {
    const latest = policyVersions[0];
    if (!latest) return false;
    const live = GOVERNANCE_POLICIES.filter((p) => guardrails[p.id])
      .map((p) => p.id)
      .sort();
    const recorded = [...latest.enabledIds].sort();
    return live.join("|") !== recorded.join("|");
  }, [policyVersions, guardrails]);

  const setGuardrail = useCallback(
    (id: string, enabled: boolean, options?: ConsoleActionOptions) => {
      const policy = GOVERNANCE_POLICIES.find((p) => p.id === id);
      if (!policy) return;
      const effect = GUARDRAIL_EFFECT_BY_ID[id];
      update((prev) => ({ ...prev, guardrails: { ...prev.guardrails, [id]: enabled } }));
      recordAudit({
        actor: options?.by ?? "FAHR Governance Officer",
        agent: "Human decision",
        action: enabled
          ? `Enforced guardrail: ${policy.label}`
          : `Relaxed guardrail: ${policy.label} — ${effect?.whenOff ?? "platform behaviour changed"}`,
        risk: enabled ? "Low" : (effect?.offRisk ?? "Medium"),
        status: enabled ? "Enforced" : "Relaxed",
      });
    },
    [recordAudit, update],
  );

  const publishPolicyVersion = useCallback(
    (options?: ConsoleActionOptions & { summary?: string }) => {
      const enabledIds = GOVERNANCE_POLICIES.filter((p) => guardrails[p.id]).map((p) => p.id);
      const relaxed = GOVERNANCE_POLICIES.length - enabledIds.length;
      const version = nextPolicyVersion(policyVersions);
      const summary =
        options?.summary ??
        (relaxed === 0
          ? "All six federal guardrails enforced."
          : `${enabledIds.length} of ${GOVERNANCE_POLICIES.length} guardrails enforced; ${relaxed} relaxed by federal decision.`);
      update((prev) => ({
        ...prev,
        policyVersions: [
          {
            id: nextId("pv"),
            version,
            recordedOn: today(),
            by: options?.by ?? "FAHR Governance Officer",
            summary,
            enabledIds,
            note: options?.note,
          },
          ...prev.policyVersions,
        ],
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Governance Officer",
        agent: "Human decision",
        action: `Published federal AI policy set ${version} (${enabledIds.length} of ${GOVERNANCE_POLICIES.length} guardrails enforced)`,
        risk: relaxed > 0 ? "Medium" : "Low",
        status: "Applied",
      });
    },
    [guardrails, policyVersions, recordAudit, update],
  );

  // --- Integrations --------------------------------------------------------

  const integrations = useMemo<Integration[]>(
    () =>
      INTEGRATIONS.map((integration) => {
        const patch = state.integrations[integration.id];
        if (!patch) return integration;
        return {
          ...integration,
          status: patch.status ?? integration.status,
          lastSync: patch.lastSync ?? integration.lastSync,
          statusNote: "statusNote" in patch ? patch.statusNote : integration.statusNote,
        };
      }),
    [state.integrations],
  );

  const apiCredentials = useMemo<ApiCredential[]>(
    () =>
      [...state.apiCredentials, ...API_CREDENTIALS].map((credential) =>
        state.revokedApiCredentialIds.includes(credential.id)
          ? { ...credential, status: "Revoked" as const }
          : credential,
      ),
    [state.apiCredentials, state.revokedApiCredentialIds],
  );

  const syncIntegration = useCallback(
    (id: string, options?: ConsoleActionOptions) => {
      const integration = INTEGRATIONS.find((i) => i.id === id);
      if (!integration) return;
      update((prev) => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          [id]: { ...prev.integrations[id], status: "Connected", lastSync: timeOfDay(), statusNote: undefined },
        },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: AGENTS.analytics,
        action: `Ran a connection test and sync for ${integration.name}`,
        risk: "Low",
        status: "Connected",
      });
    },
    [recordAudit, update],
  );

  const setIntegrationStatus = useCallback(
    (id: string, status: IntegrationStatus, options?: ConsoleActionOptions & { statusNote?: string }) => {
      const integration = INTEGRATIONS.find((i) => i.id === id);
      if (!integration) return;
      update((prev) => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          [id]: {
            ...prev.integrations[id],
            status,
            statusNote: options?.statusNote,
            lastSync: status === "Not connected" ? "—" : (prev.integrations[id]?.lastSync ?? integration.lastSync),
          },
        },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `${status === "Not connected" ? "Disconnected" : "Set"} ${integration.name} integration${
          status === "Not connected" ? "" : ` to ${status.toLowerCase()}`
        }`,
        risk: status === "Not connected" ? "Medium" : "Low",
        status,
      });
    },
    [recordAudit, update],
  );

  const createApiCredential = useCallback(
    (input: { label: string; scopes: string[]; owner?: string }): NewApiCredential | null => {
      const label = input.label.trim();
      if (!label || input.scopes.length === 0) return null;
      const random = Math.random().toString(36).slice(2, 6);
      const prefix = `fahr_live_${random}`;
      const credential: ApiCredential = {
        id: nextId("key"),
        label,
        scopes: input.scopes,
        prefix,
        createdOn: today(),
        lastUsed: "Never",
        status: "Active",
        owner: input.owner ?? "FAHR Programme Team",
      };
      update((prev) => ({ ...prev, apiCredentials: [credential, ...prev.apiCredentials] }));
      recordAudit({
        actor: input.owner ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `Issued API credential "${label}" (${input.scopes.join(", ")})`,
        risk: input.scopes.some((s) => s.endsWith(":write")) ? "Medium" : "Low",
        status: "Issued",
      });
      // The full secret exists only in this return value — never in storage.
      return { credential, secret: `${prefix}_${Math.random().toString(36).slice(2, 12)}` };
    },
    [recordAudit, update],
  );

  const revokeApiCredential = useCallback(
    (id: string, options?: ConsoleActionOptions) => {
      const credential = [...state.apiCredentials, ...API_CREDENTIALS].find((c) => c.id === id);
      if (!credential) return;
      update((prev) => ({
        ...prev,
        revokedApiCredentialIds: Array.from(new Set([...prev.revokedApiCredentialIds, id])),
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Governance Officer",
        agent: "Human decision",
        action: `Revoked API credential "${credential.label}"`,
        risk: "Medium",
        status: "Revoked",
      });
    },
    [recordAudit, state.apiCredentials, update],
  );

  // --- Users ---------------------------------------------------------------

  const users = useMemo<PlatformUser[]>(
    () =>
      [...state.invitedUsers, ...PLATFORM_USERS].map((user) => {
        const patch = state.userPatches[user.id];
        if (!patch) return user;
        return { ...user, roleLabel: patch.roleLabel ?? user.roleLabel, status: patch.status ?? user.status };
      }),
    [state.invitedUsers, state.userPatches],
  );

  const setUserStatus = useCallback(
    (userId: string, status: PlatformUser["status"], options?: ConsoleActionOptions) => {
      const user = [...state.invitedUsers, ...PLATFORM_USERS].find((u) => u.id === userId);
      if (!user) return;
      update((prev) => ({
        ...prev,
        userPatches: { ...prev.userPatches, [userId]: { ...prev.userPatches[userId], status } },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `${status === "Suspended" ? "Suspended" : "Reactivated"} account: ${user.name}`,
        risk: status === "Suspended" ? "Medium" : "Low",
        status,
        ministryId: user.ministryId,
      });
    },
    [recordAudit, state.invitedUsers, update],
  );

  const inviteUser = useCallback(
    (invite: UserInvite) => {
      const name = invite.name.trim();
      const email = invite.email.trim();
      if (!name || !email) return null;
      const id = nextId("u");
      update((prev) => ({
        ...prev,
        invitedUsers: [
          {
            id,
            name,
            email,
            roleLabel: invite.roleLabel,
            ministryId: invite.ministryId,
            departmentId: invite.departmentId,
            status: "Invited",
            lastActive: "—",
          },
          ...prev.invitedUsers,
        ],
      }));
      recordAudit({
        actor: invite.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `Invited ${name} as ${invite.roleLabel}`,
        risk: "Low",
        status: "Invited",
        ministryId: invite.ministryId,
      });
      return id;
    },
    [recordAudit, update],
  );

  // --- Framework and catalogue --------------------------------------------

  const competencies = useMemo<Competency[]>(
    () =>
      COMPETENCIES.map((competency) => {
        const patch = state.competencyPatches[competency.id];
        if (!patch) return competency;
        return {
          ...competency,
          label: patch.label ?? competency.label,
          description: patch.description ?? competency.description,
        };
      }),
    [state.competencyPatches],
  );

  const catalogue = useMemo<ContentItem[]>(
    () =>
      CONTENT_ITEMS.map((item) => {
        const patch = state.cataloguePatches[item.id];
        if (!patch) return item;
        return {
          ...item,
          status: patch.status ?? item.status,
          version: patch.version ?? item.version,
          updatedOn: patch.updatedOn ?? item.updatedOn,
        };
      }),
    [state.cataloguePatches],
  );

  const catalogueRevisions = useMemo(
    () => [...state.catalogueRevisions, ...CATALOGUE_REVISIONS],
    [state.catalogueRevisions],
  );

  const expectationFor = useCallback(
    (competencyId: string, levelId: string) =>
      state.expectationPatches[competencyId]?.[levelId] ??
      COMPETENCY_EXPECTATIONS[competencyId]?.[levelId] ??
      "Not yet defined for this level.",
    [state.expectationPatches],
  );

  const mappedContentIds = useCallback(
    (competencyId: string) => {
      const override = state.mappingPatches[competencyId];
      if (override) return override;
      const rule = PERSONALISATION_RULE_BY_COMPETENCY[competencyId];
      const tagged = CONTENT_ITEMS.filter((item) => item.competencyId === competencyId).map((item) => item.id);
      return Array.from(new Set([...(rule?.contentIds ?? []), ...tagged]));
    },
    [state.mappingPatches],
  );

  const updateCompetency = useCallback(
    (competencyId: string, patch: { label?: string; description?: string }, options?: ConsoleActionOptions) => {
      const competency = COMPETENCIES.find((c) => c.id === competencyId);
      if (!competency) return;
      update((prev) => ({
        ...prev,
        competencyPatches: {
          ...prev.competencyPatches,
          [competencyId]: { ...prev.competencyPatches[competencyId], ...patch },
        },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Capability Office",
        agent: "Human decision",
        action: `Updated competency definition: ${patch.label ?? competency.label}`,
        risk: "Low",
        status: "Applied",
      });
    },
    [recordAudit, update],
  );

  const setExpectation = useCallback(
    (competencyId: string, levelId: string, text: string, options?: ConsoleActionOptions) => {
      const competency = COMPETENCIES.find((c) => c.id === competencyId);
      const level = CAPABILITY_LEVELS.find((l) => l.id === levelId);
      if (!competency || !level || !text.trim()) return;
      update((prev) => ({
        ...prev,
        expectationPatches: {
          ...prev.expectationPatches,
          [competencyId]: { ...prev.expectationPatches[competencyId], [levelId]: text.trim() },
        },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Capability Office",
        agent: "Human decision",
        action: `Rewrote the ${level.label} expectation for ${competency.label}`,
        risk: "Low",
        status: "Applied",
      });
    },
    [recordAudit, update],
  );

  const setContentMapping = useCallback(
    (competencyId: string, contentIds: string[], options?: ConsoleActionOptions) => {
      const competency = COMPETENCIES.find((c) => c.id === competencyId);
      if (!competency) return;
      update((prev) => ({
        ...prev,
        mappingPatches: { ...prev.mappingPatches, [competencyId]: contentIds },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Capability Office",
        agent: AGENTS.capability,
        action: `Remapped ${competency.label} to ${contentIds.length} catalogue item${contentIds.length === 1 ? "" : "s"} — personalised pathways rebuild from the new mapping`,
        risk: "Low",
        status: "Applied",
      });
    },
    [recordAudit, update],
  );

  const setCatalogueStatus = useCallback(
    (contentId: string, status: ContentItem["status"], options?: ConsoleActionOptions) => {
      const item = CONTENT_ITEMS.find((c) => c.id === contentId);
      if (!item) return;
      const version = state.cataloguePatches[contentId]?.version ?? item.version;
      update((prev) => ({
        ...prev,
        cataloguePatches: {
          ...prev.cataloguePatches,
          [contentId]: { ...prev.cataloguePatches[contentId], status, updatedOn: today() },
        },
        catalogueRevisions: [
          {
            id: nextId("rev"),
            contentId,
            contentTitle: item.title,
            version,
            status,
            on: today(),
            by: options?.by ?? "FAHR Programme Team",
            note: options?.note,
          },
          ...prev.catalogueRevisions,
        ],
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `${status === "Published" ? "Published" : `Moved to ${status.toLowerCase()}`}: ${item.title} ${version}`,
        risk: "Low",
        status,
      });
    },
    [recordAudit, state.cataloguePatches, update],
  );

  const publishCatalogueVersion = useCallback(
    (contentId: string, options?: ConsoleActionOptions) => {
      const item = CONTENT_ITEMS.find((c) => c.id === contentId);
      if (!item) return;
      const current = state.cataloguePatches[contentId]?.version ?? item.version;
      const version = bumpVersion(current);
      update((prev) => ({
        ...prev,
        cataloguePatches: {
          ...prev.cataloguePatches,
          [contentId]: { ...prev.cataloguePatches[contentId], version, status: "Published", updatedOn: today() },
        },
        catalogueRevisions: [
          {
            id: nextId("rev"),
            contentId,
            contentTitle: item.title,
            version,
            status: "Published",
            on: today(),
            by: options?.by ?? "FAHR Programme Team",
            note: options?.note ?? `Published ${version} to every entity.`,
          },
          ...prev.catalogueRevisions,
        ],
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: AGENTS.content,
        action: `Published ${item.title} ${version} to the federal catalogue`,
        risk: "Low",
        status: "Published",
      });
    },
    [recordAudit, state.cataloguePatches, update],
  );

  // --- Communications -----------------------------------------------------

  const announcements = useMemo(
    () => [...state.announcements, ...ANNOUNCEMENTS],
    [state.announcements],
  );

  const estimateRecipients = useCallback(
    (audience: AnnouncementAudience) => {
      const scope = audience.entityIds.length
        ? ministries.filter((m) => audience.entityIds.includes(m.id))
        : ministries;
      const roles = audience.roleLabels.length ? audience.roleLabels : ["Federal Employee"];
      let total = 0;
      for (const ministry of scope) {
        for (const role of roles) {
          if (role === "Federal Employee") {
            if (audience.levelIds.length === 0) {
              total += ministry.activeLearners;
            } else {
              const rows = ladderRows([ministry]);
              total += rows
                .filter((row) => audience.levelIds.includes(row.levelId))
                .reduce((sum, row) => sum + row.learners, 0);
            }
          } else if (ROLE_HEADCOUNT[role]) {
            total += ROLE_HEADCOUNT[role](ministry.employees);
          }
        }
      }
      // Federal roles are not per-entity: count the directory instead.
      for (const role of roles) {
        if (role.startsWith("FAHR") || role === "Federal Leadership") {
          total += users.filter((u) => u.roleLabel === role).length;
        }
      }
      return total;
    },
    [ministries, users],
  );

  const sendAnnouncement = useCallback(
    (draft: AnnouncementDraft) => {
      const id = nextId("an");
      const recipients = draft.recipients ?? estimateRecipients(draft.audience);
      const status = draft.status ?? "Sent";
      update((prev) => ({
        ...prev,
        announcements: [
          {
            id,
            title: draft.title.trim(),
            body: draft.body.trim(),
            kind: draft.kind,
            channels: draft.channels,
            audience: draft.audience,
            recipients,
            status,
            sentOn: status === "Scheduled" ? (draft.scheduledFor ?? today()) : today(),
            sentBy: draft.by ?? "FAHR Programme Team",
            ...(status === "Sent" ? { opened: 0, acted: 0 } : {}),
          },
          ...prev.announcements,
        ],
      }));
      recordAudit({
        actor: draft.by ?? "FAHR Programme Team",
        agent: draft.kind === "Coach nudge" ? AGENTS.learning : "Human decision",
        action: `${status === "Scheduled" ? "Scheduled" : "Sent"} ${draft.kind.toLowerCase()} "${draft.title.trim()}" to ${recipients.toLocaleString()} recipient${recipients === 1 ? "" : "s"}`,
        risk: "Low",
        status,
        ministryId: draft.audience.entityIds.length === 1 ? draft.audience.entityIds[0] : undefined,
      });
      return id;
    },
    [estimateRecipients, recordAudit, update],
  );

  // --- Entity onboarding --------------------------------------------------

  const onboardings = useMemo<EntityOnboarding[]>(
    () =>
      [...state.newOnboardings, ...ENTITY_ONBOARDINGS].map((onboarding) => {
        const patch = state.onboardingPatches[onboarding.id];
        return patch ? { ...onboarding, ...patch } : onboarding;
      }),
    [state.newOnboardings, state.onboardingPatches],
  );

  const startOnboarding = useCallback(
    (draft: OnboardingDraft) => {
      const id = nextId("onb");
      const admins = draft.admins?.filter((a) => a.name.trim() && a.email.trim()) ?? [];
      update((prev) => ({
        ...prev,
        newOnboardings: [
          {
            id,
            name: draft.name.trim(),
            shortName: draft.shortName.trim() || draft.name.trim().split(" ").slice(-1)[0],
            sector: draft.sector,
            employees: draft.employees,
            quotaM: draft.quotaM,
            admins,
            stage: admins.length > 0 ? "admins" : "details",
            requestedOn: today(),
            note: draft.note,
          },
          ...prev.newOnboardings,
        ],
      }));
      recordAudit({
        actor: draft.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `Started onboarding for ${draft.name.trim()} (${draft.employees.toLocaleString()} employees, ${draft.quotaM}M token quota)`,
        risk: "Low",
        status: "In progress",
      });
      return id;
    },
    [recordAudit, update],
  );

  const advanceOnboarding = useCallback(
    (id: string, options?: ConsoleActionOptions) => {
      const onboarding = [...state.newOnboardings, ...ENTITY_ONBOARDINGS].find((o) => o.id === id);
      if (!onboarding) return;
      const current = state.onboardingPatches[id]?.stage ?? onboarding.stage;
      const index = ONBOARDING_STAGE_ORDER.indexOf(current);
      const next = ONBOARDING_STAGE_ORDER[Math.min(index + 1, ONBOARDING_STAGE_ORDER.length - 1)];
      if (next === current) return;
      update((prev) => ({
        ...prev,
        onboardingPatches: { ...prev.onboardingPatches, [id]: { ...prev.onboardingPatches[id], stage: next } },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action:
          next === "live"
            ? `${onboarding.name} is live on the programme — its figures join the next reporting cycle`
            : `Advanced ${onboarding.name} onboarding to ${next}`,
        risk: "Low",
        status: next === "live" ? "Live" : "In progress",
      });
    },
    [recordAudit, state.newOnboardings, state.onboardingPatches, update],
  );

  const addOnboardingAdmin = useCallback(
    (id: string, admin: EntityAdminInvite, options?: ConsoleActionOptions) => {
      const onboarding = [...state.newOnboardings, ...ENTITY_ONBOARDINGS].find((o) => o.id === id);
      if (!onboarding || !admin.name.trim() || !admin.email.trim()) return;
      const existing = state.onboardingPatches[id]?.admins ?? onboarding.admins;
      const admins = [...existing, { name: admin.name.trim(), email: admin.email.trim() }];
      const stage = state.onboardingPatches[id]?.stage ?? onboarding.stage;
      update((prev) => ({
        ...prev,
        onboardingPatches: {
          ...prev.onboardingPatches,
          [id]: { ...prev.onboardingPatches[id], admins, stage: stage === "details" ? "admins" : stage },
        },
      }));
      recordAudit({
        actor: options?.by ?? "FAHR Programme Team",
        agent: "Human decision",
        action: `Invited ${admin.name.trim()} as entity administrator for ${onboarding.name}`,
        risk: "Low",
        status: "Invited",
      });
    },
    [recordAudit, state.newOnboardings, state.onboardingPatches, update],
  );

  const resetConsole = useCallback(() => update(() => EMPTY_STATE), [update]);

  const value = useMemo<FahrConsoleValue>(
    () => ({
      guardrails,
      guardrailBehaviour,
      policyVersions,
      policyDrift,
      setGuardrail,
      publishPolicyVersion,
      integrations,
      apiCredentials,
      syncIntegration,
      setIntegrationStatus,
      createApiCredential,
      revokeApiCredential,
      users,
      setUserStatus,
      inviteUser,
      competencies,
      expectationFor,
      mappedContentIds,
      catalogue,
      catalogueRevisions,
      updateCompetency,
      setExpectation,
      setContentMapping,
      setCatalogueStatus,
      publishCatalogueVersion,
      announcements,
      estimateRecipients,
      sendAnnouncement,
      onboardings,
      startOnboarding,
      advanceOnboarding,
      addOnboardingAdmin,
      resetConsole,
    }),
    [
      guardrails,
      guardrailBehaviour,
      policyVersions,
      policyDrift,
      setGuardrail,
      publishPolicyVersion,
      integrations,
      apiCredentials,
      syncIntegration,
      setIntegrationStatus,
      createApiCredential,
      revokeApiCredential,
      users,
      setUserStatus,
      inviteUser,
      competencies,
      expectationFor,
      mappedContentIds,
      catalogue,
      catalogueRevisions,
      updateCompetency,
      setExpectation,
      setContentMapping,
      setCatalogueStatus,
      publishCatalogueVersion,
      announcements,
      estimateRecipients,
      sendAnnouncement,
      onboardings,
      startOnboarding,
      advanceOnboarding,
      addOnboardingAdmin,
      resetConsole,
    ],
  );

  return <FahrConsoleContext.Provider value={value}>{children}</FahrConsoleContext.Provider>;
}

export function useFahrConsole(): FahrConsoleValue {
  const ctx = useContext(FahrConsoleContext);
  if (!ctx) throw new Error("useFahrConsole must be used inside FahrConsoleProvider");
  return ctx;
}
