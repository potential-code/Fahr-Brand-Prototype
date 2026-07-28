// Federal programme reporting.
//
// Every report row is *derived* from the authored entity figures — the same
// figures the dashboards headline — so a report can never contradict the screen
// the operator drilled down from. Period views scale the rolling-twelve-month
// figures by the period's authored share rather than inventing a second set of
// numbers, and the deployment rate comes from the live submission store so a
// decision taken in another role shows up in the impact report.

import type { Credential, Ministry, Submission } from "./model";
import { normaliseReadiness } from "./model";
import { CAPABILITY_DISTRIBUTION, GAP_TRENDS, MINISTRIES } from "./seed";
import { COMPETENCIES } from "@/lib/learningData";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { FEDERAL } from "./selectors";
import type { ReportPeriod } from "./fahrConsole";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Learning hours a single active learner records over a rolling year. */
const HOURS_PER_LEARNER_YEAR = 38;

/** Share of active learners at Practitioner or above, nationally. */
const NATIONAL_PRACTITIONER_SHARE =
  (CAPABILITY_DISTRIBUTION.practitioner + CAPABILITY_DISTRIBUTION.advanced + CAPABILITY_DISTRIBUTION.champion) /
  Object.values(CAPABILITY_DISTRIBUTION).reduce((a, b) => a + b, 0);

/** How credentials split across the ladder, from the national distribution. */
const CREDENTIAL_LEVEL_SHARES = (() => {
  const practitioner = CAPABILITY_DISTRIBUTION.practitioner;
  const advanced = CAPABILITY_DISTRIBUTION.advanced;
  const champion = CAPABILITY_DISTRIBUTION.champion;
  const total = practitioner + advanced + champion;
  return { practitioner: practitioner / total, advanced: advanced / total, champion: champion / total };
})();

/** Entities whose readiness sits above the national mean run ahead on the ladder. */
function practitionerShare(readiness: number): number {
  return clamp(NATIONAL_PRACTITIONER_SHARE + (readiness - FEDERAL.readiness) * 0.012, 0.05, 0.95);
}

const scaled = (value: number, share: number) => Math.round(value * share);

export type ReportScope = {
  /** Entities in scope; the caller filters, reporting only derives. */
  ministries: Ministry[];
  period: ReportPeriod;
};

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

export type EngagementRow = {
  ministryId: string;
  entity: string;
  short: string;
  employees: number;
  activeLearners: number;
  /** Share of the targeted workforce that is learning. */
  coverage: number;
  learningHours: number;
  pathwayCompletions: number;
  readiness: number;
};

export function engagementRows({ ministries, period }: ReportScope): EngagementRow[] {
  return ministries.map((m) => ({
    ministryId: m.id,
    entity: m.name,
    short: m.shortName,
    employees: m.employees,
    activeLearners: m.activeLearners,
    coverage: Math.round((m.activeLearners / m.employees) * 100),
    learningHours: scaled(m.activeLearners * HOURS_PER_LEARNER_YEAR, period.share),
    pathwayCompletions: scaled(m.activeLearners * (m.readiness / 100), period.share),
    readiness: m.readiness,
  }));
}

// ---------------------------------------------------------------------------
// Competency development
// ---------------------------------------------------------------------------

/** Fixed per-competency shape of the national capability profile. */
const COMPETENCY_OFFSETS: Record<string, number> = {
  literacy: 14,
  prompting: 6,
  analytics: -2,
  agentic: -12,
  governance: -6,
};

/**
 * An entity's score per competency. Offsets are normalised so the mean returns
 * the entity's authored readiness index, and the entity's own priority gap is
 * pushed down — the two facts the rest of the platform already states.
 */
export function competencyScores(ministry: Ministry): Record<string, number> {
  const ids = COMPETENCIES.map((c) => c.id);
  const offsets = ids.map(
    (id) => (COMPETENCY_OFFSETS[id] ?? 0) + (id === ministry.topGapCompetencyId ? -8 : 0),
  );
  const values = normaliseReadiness(
    ministry.readiness,
    ids.map(() => 1),
    offsets,
  );
  return Object.fromEntries(ids.map((id, i) => [id, values[i]]));
}

export type CompetencyRow = {
  competencyId: string;
  competency: string;
  /** Weighted mean score across the entities in scope. */
  score: number;
  learnersInDevelopment: number;
  entitiesReportingGap: number;
  trend: "rising" | "stable" | "declining";
};

export function competencyRows({ ministries, period }: ReportScope): CompetencyRow[] {
  const employees = ministries.reduce((a, m) => a + m.employees, 0) || 1;
  const perMinistry = ministries.map((m) => ({ ministry: m, scores: competencyScores(m) }));
  return COMPETENCIES.map((competency) => {
    const score = Math.round(
      perMinistry.reduce((sum, { ministry, scores }) => sum + scores[competency.id] * ministry.employees, 0) /
        employees,
    );
    const learnersInDevelopment = perMinistry.reduce(
      (sum, { ministry, scores }) =>
        sum + Math.round(ministry.activeLearners * ((100 - scores[competency.id]) / 100)),
      0,
    );
    return {
      competencyId: competency.id,
      competency: competency.label,
      score,
      learnersInDevelopment: scaled(learnersInDevelopment, Math.max(period.share, 0.35)),
      entitiesReportingGap: ministries.filter((m) => m.topGapCompetencyId === competency.id).length,
      trend: GAP_TRENDS[competency.id] ?? "stable",
    };
  }).sort((a, b) => a.score - b.score);
}

// ---------------------------------------------------------------------------
// Assessment outcomes
// ---------------------------------------------------------------------------

export type AssessmentRow = {
  ministryId: string;
  entity: string;
  short: string;
  assessmentsCompleted: number;
  averageBaseline: number;
  atPractitionerOrAbove: number;
  reassessments: number;
};

export function assessmentRows({ ministries, period }: ReportScope): AssessmentRow[] {
  return ministries.map((m) => {
    const completed = scaled(m.activeLearners, period.share);
    return {
      ministryId: m.id,
      entity: m.name,
      short: m.shortName,
      assessmentsCompleted: completed,
      averageBaseline: m.readiness,
      atPractitionerOrAbove: Math.round(completed * practitionerShare(m.readiness)),
      reassessments: Math.round(completed * 0.18),
    };
  });
}

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

export type CertificationRow = {
  ministryId: string;
  entity: string;
  short: string;
  issued: number;
  practitioner: number;
  advanced: number;
  champion: number;
  issuedThisPeriod: number;
  /** Rows in the live credential registry for this entity. */
  onRegister: number;
};

export function certificationRows(
  { ministries, period }: ReportScope,
  credentials: Credential[],
): CertificationRow[] {
  return ministries.map((m) => {
    const practitioner = Math.round(m.credentialsIssued * CREDENTIAL_LEVEL_SHARES.practitioner);
    const advanced = Math.round(m.credentialsIssued * CREDENTIAL_LEVEL_SHARES.advanced);
    return {
      ministryId: m.id,
      entity: m.name,
      short: m.shortName,
      issued: m.credentialsIssued,
      practitioner,
      advanced,
      champion: Math.max(0, m.credentialsIssued - practitioner - advanced),
      issuedThisPeriod: scaled(m.credentialsIssued, period.share),
      onRegister: credentials.filter((c) => c.ministryId === m.id).length,
    };
  });
}

// ---------------------------------------------------------------------------
// Project impact
// ---------------------------------------------------------------------------

export type ImpactRow = {
  ministryId: string;
  entity: string;
  short: string;
  projects: number;
  deployed: number;
  hoursSavedPerMonth: number;
  valueCreatedAedM: number;
  projectsThisPeriod: number;
};

/**
 * Share of projects that reach deployment, read from the live submission store
 * so a manager's or entity's decision this session moves the impact report.
 */
export function deploymentRate(submissions: Submission[]): number {
  if (submissions.length === 0) return 0;
  const deployed = submissions.filter((s) => s.state === "deployed" || s.state === "endorsed").length;
  return deployed / submissions.length;
}

export function impactRows({ ministries, period }: ReportScope, submissions: Submission[]): ImpactRow[] {
  const rate = deploymentRate(submissions);
  return ministries.map((m) => ({
    ministryId: m.id,
    entity: m.name,
    short: m.shortName,
    projects: m.projectsSubmitted,
    deployed: Math.round(m.projectsSubmitted * rate),
    hoursSavedPerMonth: m.hoursSavedPerMonth,
    valueCreatedAedM: Math.round(m.valueCreatedAedM * 10) / 10,
    projectsThisPeriod: scaled(m.projectsSubmitted, period.share),
  }));
}

// ---------------------------------------------------------------------------
// Capability ladder distribution, for the reporting charts
// ---------------------------------------------------------------------------

export type LadderRow = { levelId: string; label: string; learners: number; percentage: number };

/**
 * Ladder distribution for the entities in scope. Nationally it is the authored
 * distribution; for a subset it is that distribution shifted by the subset's
 * readiness against the national mean, and always sums back to its learners.
 */
export function ladderRows(ministries: Ministry[]): LadderRow[] {
  const learners = ministries.reduce((a, m) => a + m.activeLearners, 0);
  if (learners === 0) return CAPABILITY_LEVELS.map((l) => ({ levelId: l.id, label: l.label, learners: 0, percentage: 0 }));
  const employees = ministries.reduce((a, m) => a + m.employees, 0) || 1;
  const readiness = Math.round(ministries.reduce((a, m) => a + m.readiness * m.employees, 0) / employees);
  const shift = (readiness - FEDERAL.readiness) * 0.01;

  const weights = CAPABILITY_LEVELS.map((level) => {
    const base = CAPABILITY_DISTRIBUTION[level.id] ?? 0;
    // Above-average entities weight the top of the ladder, below-average the base.
    const tilt = 1 + shift * (level.order - 3);
    return Math.max(base * tilt, 1);
  });
  const weightTotal = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.round((w / weightTotal) * learners));
  // Largest-remainder correction so the column sums back to the learner total.
  const drift = learners - counts.reduce((a, b) => a + b, 0);
  if (drift !== 0) {
    const largest = counts.indexOf(Math.max(...counts));
    counts[largest] += drift;
  }
  return CAPABILITY_LEVELS.map((level, i) => ({
    levelId: level.id,
    label: level.label,
    learners: counts[i],
    percentage: Math.round((counts[i] / learners) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Report footnotes — how each report is derived, stated on screen and in print
// ---------------------------------------------------------------------------

export const REPORT_NOTES: Record<string, string> = {
  engagement:
    "Coverage is active learners against the entity's targeted workforce. Learning hours assume 38 recorded hours per active learner per year, scaled to the selected period.",
  competency:
    "Competency scores are the entity's readiness index reshaped by the national capability profile, with the entity's own priority gap weighted down. The weighted mean returns the readiness index.",
  assessment:
    "Every active learner completes a baseline assessment, so assessments completed scale with active learners. Average baseline is the entity's readiness index; the Practitioner share follows the national capability distribution adjusted for readiness.",
  certification:
    "Credentials split across the ladder in line with the national capability distribution. 'On register' counts rows in the live national credential registry, including any issued during this session.",
  impact:
    "The deployment rate is read from the live workplace-project store, so decisions taken in the manager and entity portals during this session move this report.",
};

/** Entities are the reporting unit; this is the national roll-up line. */
export function nationalLine(ministries: Ministry[]) {
  const employees = ministries.reduce((a, m) => a + m.employees, 0);
  const activeLearners = ministries.reduce((a, m) => a + m.activeLearners, 0);
  return {
    entities: ministries.length,
    ofEntities: MINISTRIES.length,
    employees,
    activeLearners,
    coverage: employees ? Math.round((activeLearners / employees) * 100) : 0,
    readiness: employees
      ? Math.round(ministries.reduce((a, m) => a + m.readiness * m.employees, 0) / employees)
      : 0,
    credentials: ministries.reduce((a, m) => a + m.credentialsIssued, 0),
    projects: ministries.reduce((a, m) => a + m.projectsSubmitted, 0),
    hoursSavedPerMonth: ministries.reduce((a, m) => a + m.hoursSavedPerMonth, 0),
    valueCreatedAedM: Math.round(ministries.reduce((a, m) => a + m.valueCreatedAedM, 0) * 10) / 10,
  };
}
