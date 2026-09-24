import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useFederalData } from "@/lib/FederalDataContext";
import { AGENTS, LEARNER_PROFILE } from "@/lib/constants";
import {
  defaultDraft,
  demoSubmission,
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
  /** Set once the learner submits. The evaluation screen reads it. */
  submission: ProjectSubmission | null;
  submit: (impact: ImpactEstimate, policies: PolicyResult[]) => ProjectSubmission;
  /** Reopen a submitted project for editing — demo affordance only. */
  reopen: () => void;
};

const WorkplaceProjectContext = createContext<Ctx | undefined>(undefined);

/**
 * Holds the workplace project between the build screen and the evaluation
 * screen. In-memory for the demo: closing the tab starts a fresh draft.
 *
 * `seedSubmission` defaults to true so the demo opens on an approved project —
 * the certificate on Recognition and the score on Evaluation are on screen
 * from the first load, both reading the same worked example rather than a
 * second source of truth. Tests that need a genuinely empty project pass
 * `seedSubmission={false}`.
 */
export function WorkplaceProjectProvider({
  children,
  seedSubmission = true,
}: {
  children: React.ReactNode;
  seedSubmission?: boolean;
}) {
  const [draft, setDraft] = useState<ProjectDraft>(() => defaultDraft());
  // Until the learner types something, the project screen is free to reseed the
  // draft from their assessment result.
  const [pristine, setPristine] = useState(true);
  const [submission, setSubmission] = useState<ProjectSubmission | null>(() =>
    seedSubmission ? demoSubmission(null) : null,
  );

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

  const { recordAudit, focus } = useFederalData();

  const submit = useCallback(
    (impact: ImpactEstimate, policies: PolicyResult[]) => {
      const next: ProjectSubmission = { draft, impact, policies, submittedAt: new Date().toISOString() };
      setSubmission(next);
      recordAudit({
        actor: LEARNER_PROFILE.name,
        agent: AGENTS.capability,
        action: `Submitted workplace project "${draft.title || "Untitled project"}"`,
        risk: "Low",
        status: "Submitted",
        ministryId: focus.ministryId,
        detail: `Sent for department manager sign-off, estimating ${impact.hoursPerMonth} hours saved a month.`,
      });
      return next;
    },
    [draft, recordAudit, focus.ministryId],
  );

  const reopen = useCallback(() => setSubmission(null), []);

  const value = useMemo(
    () => ({ draft, seedDraft, updateDraft, submission, submit, reopen }),
    [draft, seedDraft, updateDraft, submission, submit, reopen],
  );

  return <WorkplaceProjectContext.Provider value={value}>{children}</WorkplaceProjectContext.Provider>;
}

export function useWorkplaceProject(): Ctx {
  const ctx = useContext(WorkplaceProjectContext);
  if (!ctx) throw new Error("useWorkplaceProject must be used inside WorkplaceProjectProvider");
  return ctx;
}
