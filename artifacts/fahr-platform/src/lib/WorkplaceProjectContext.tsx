import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFederalData, type ProjectSubmissionInput } from "@/lib/FederalDataContext";
import { learnerProject } from "@/lib/federal/journey";
import type { Submission } from "@/lib/federal/model";
import {
  defaultDraft,
  filled,
  warningCount,
  type ImpactEstimate,
  type PolicyResult,
  type ProjectDraft,
  type ProjectSubmission,
} from "@/lib/workplaceProject";

type Ctx = {
  draft: ProjectDraft;
  /** Replaces the draft only while the learner has not edited it themselves. */
  seedDraft: (draft: ProjectDraft) => void;
  updateDraft: (patch: Partial<ProjectDraft>) => void;
  /** The brief as last submitted. The evaluation screen scores it. */
  submission: ProjectSubmission | null;
  /** The same project as the manager, entity, FAHR and leadership see it. */
  project: Submission | undefined;
  /** True while the learner is revising a returned project. */
  editing: boolean;
  /** Submits the brief, or resubmits it once returned, with an optional reply to the reviewer. */
  submit: (impact: ImpactEstimate, policies: PolicyResult[], note?: string) => ProjectSubmission;
  /** Opens a returned project for revision. Does nothing while it is in review. */
  reopen: () => void;
};

const WorkplaceProjectContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "fahr.workplace.v1";

type Stored = { draft: ProjectDraft; pristine: boolean; submission: ProjectSubmission | null; editing: boolean };

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (!parsed || typeof parsed !== "object" || !parsed.draft || typeof parsed.draft.title !== "string") return null;
    return {
      draft: { ...defaultDraft(), ...parsed.draft },
      pristine: parsed.pristine === true,
      submission: parsed.submission && parsed.submission.draft ? parsed.submission : null,
      editing: parsed.editing === true,
    };
  } catch {
    return null;
  }
}

/** What the manager, entity, FAHR and leadership see of the learner's brief. */
function toSubmissionInput(draft: ProjectDraft, impact: ImpactEstimate, policies: PolicyResult[]): ProjectSubmissionInput {
  const measures = filled(draft.measures);
  return {
    title: draft.title.trim() || "Untitled workplace project",
    description: draft.challenge.trim() || draft.solution.trim(),
    metrics: measures.length
      ? measures.join(" · ")
      : `Expected to return ${impact.hoursPerMonth} hours a month.`,
    hoursSavedPerMonth: impact.hoursPerMonth,
    impact: impact.band === "High" ? "High" : impact.band === "Solid" ? "Medium" : "Low",
    governanceStatus: warningCount(policies) === 0 ? "Compliant" : "Needs Review",
    competencyIds: ["agentic", "governance"],
    brief: {
      challenge: draft.challenge.trim(),
      solution: draft.solution.trim(),
      humanCheckpoint: draft.humanCheckpoint,
      outcomes: filled(draft.outcomes),
      measures,
      sensitivity: draft.sensitivity,
      disclosure: draft.disclosure,
      hoursPerWeek: draft.hoursPerWeek,
      peopleAffected: draft.peopleAffected,
      automationPct: draft.automationPct,
      policies: policies.map((p) => ({ policy: p.policy, status: p.status, detail: p.detail })),
    },
  };
}

/**
 * The learner's workplace project. The brief they build lives here; the moment
 * they submit, it becomes a project in the federal store, and from then on
 * every dashboard — the learner's included — reads its status from there.
 * Kept in session storage so a reload mid-demo keeps the draft.
 */
export function WorkplaceProjectProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(readStored);
  const [draft, setDraft] = useState<ProjectDraft>(() => initial?.draft ?? defaultDraft());
  // Until the learner types something, the project screen is free to reseed the
  // draft from their assessment result.
  const [pristine, setPristine] = useState(initial?.pristine ?? true);
  const [submission, setSubmission] = useState<ProjectSubmission | null>(initial?.submission ?? null);
  const [editing, setEditing] = useState(initial?.editing ?? false);

  const { submissions, focus, submitProject } = useFederalData();
  const project = useMemo(() => learnerProject(submissions, focus.learnerId), [submissions, focus.learnerId]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, pristine, submission, editing }));
    } catch {
      // Storage is a convenience; the demo still works without it.
    }
  }, [draft, pristine, submission, editing]);

  const seedDraft = useCallback(
    (next: ProjectDraft) => {
      if (pristine) setDraft(next);
    },
    [pristine],
  );

  const updateDraft = useCallback((patch: Partial<ProjectDraft>) => {
    setPristine(false);
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const submit = useCallback(
    (impact: ImpactEstimate, policies: PolicyResult[], note?: string) => {
      const next: ProjectSubmission = { draft, impact, policies, submittedAt: new Date().toISOString() };
      submitProject(toSubmissionInput(draft, impact, policies), { note: note?.trim() || undefined });
      setSubmission(next);
      setEditing(false);
      return next;
    },
    [draft, submitProject],
  );

  const reopen = useCallback(() => {
    if (project?.state === "revision_requested") setEditing(true);
  }, [project?.state]);

  const value = useMemo(
    () => ({ draft, seedDraft, updateDraft, submission, project, editing, submit, reopen }),
    [draft, seedDraft, updateDraft, submission, project, editing, submit, reopen],
  );

  return <WorkplaceProjectContext.Provider value={value}>{children}</WorkplaceProjectContext.Provider>;
}

export function useWorkplaceProject(): Ctx {
  const ctx = useContext(WorkplaceProjectContext);
  if (!ctx) throw new Error("useWorkplaceProject must be used inside WorkplaceProjectProvider");
  return ctx;
}
