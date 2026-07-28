// Everything derived from the seed: department rows, ministry roll-ups, federal
// totals, capability bands and the drill-down rosters.
//
// No screen should ever add up figures itself — read them from here so the
// manager, entity, FAHR and leadership views cannot disagree.

import { CAPABILITY_LEVELS, type CapabilityLevel } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID, type Competency } from "@/lib/learningData";
import {
  distribute,
  normaliseReadiness,
  riskForReadiness,
  type Cohort,
  type Department,
  type LearnerStatus,
  type Ministry,
  type Person,
  type Submission,
  type SubmissionState,
} from "./model";
import {
  CAPABILITY_DISTRIBUTION,
  COHORTS,
  DEPARTMENT_SEEDS,
  GAP_TRENDS,
  MINISTRIES,
  PEOPLE,
} from "./seed";

export const MINISTRY_BY_ID: Record<string, Ministry> = Object.fromEntries(
  MINISTRIES.map((m) => [m.id, m]),
);

/** Department rows generated from each ministry's authored headline figures. */
function buildDepartments(): Department[] {
  const out: Department[] = [];
  for (const ministry of MINISTRIES) {
    const seeds = DEPARTMENT_SEEDS[ministry.id] ?? [];
    if (seeds.length === 0) continue;
    const employees = distribute(ministry.employees, seeds.map((s) => s.employeeWeight));
    const learners = distribute(ministry.activeLearners, seeds.map((s) => s.learnerWeight));
    const twins = distribute(ministry.twins, seeds.map((s) => s.learnerWeight));
    const projects = distribute(ministry.projectsSubmitted, seeds.map((s) => s.learnerWeight));
    const hours = distribute(ministry.hoursSavedPerMonth, seeds.map((s) => s.learnerWeight));
    const readiness = normaliseReadiness(
      ministry.readiness,
      employees,
      seeds.map((s) => s.readinessOffset),
    );
    seeds.forEach((seed, i) => {
      out.push({
        id: `${ministry.id}-${seed.id}`,
        ministryId: ministry.id,
        name: seed.name,
        employees: employees[i],
        activeLearners: Math.min(learners[i], employees[i]),
        readiness: readiness[i],
        twins: twins[i],
        projects: projects[i],
        hoursSavedPerMonth: hours[i],
        risk: riskForReadiness(readiness[i]),
      });
    });
  }
  return out;
}

export const DEPARTMENTS: Department[] = buildDepartments();

export const DEPARTMENT_BY_ID: Record<string, Department> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d]),
);

export const departmentsOf = (ministryId: string): Department[] =>
  DEPARTMENTS.filter((d) => d.ministryId === ministryId);

export const cohortsOf = (ministryId: string): Cohort[] =>
  COHORTS.filter((c) => c.ministryId === ministryId);

export const COHORT_BY_ID: Record<string, Cohort> = Object.fromEntries(COHORTS.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Roll-ups
// ---------------------------------------------------------------------------

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export type FederalTotals = {
  employees: number;
  activeLearners: number;
  /** Employee-weighted national readiness index. */
  readiness: number;
  twins: number;
  projectsSubmitted: number;
  valueCreatedAedM: number;
  hoursSavedPerMonth: number;
  credentialsIssued: number;
  ministriesTotal: number;
  /** Entities at or above the on-track readiness threshold. */
  ministriesOnTrack: number;
  /** Share of targeted federal employees who are active learners. */
  coverage: number;
};

/** An entity is "on track" at or above this readiness index. */
export const ON_TRACK_READINESS = 65;

export const FEDERAL: FederalTotals = (() => {
  const employees = sum(MINISTRIES.map((m) => m.employees));
  const activeLearners = sum(MINISTRIES.map((m) => m.activeLearners));
  return {
    employees,
    activeLearners,
    readiness: Math.round(sum(MINISTRIES.map((m) => m.readiness * m.employees)) / employees),
    twins: sum(MINISTRIES.map((m) => m.twins)),
    projectsSubmitted: sum(MINISTRIES.map((m) => m.projectsSubmitted)),
    valueCreatedAedM: Math.round(sum(MINISTRIES.map((m) => m.valueCreatedAedM)) * 10) / 10,
    hoursSavedPerMonth: sum(MINISTRIES.map((m) => m.hoursSavedPerMonth)),
    credentialsIssued: sum(MINISTRIES.map((m) => m.credentialsIssued)),
    ministriesTotal: MINISTRIES.length,
    ministriesOnTrack: MINISTRIES.filter((m) => m.readiness >= ON_TRACK_READINESS).length,
    coverage: Math.round((activeLearners / employees) * 100),
  };
})();

/** Ministry figures with the department roll-up alongside, for drill-downs. */
export function ministryRollup(ministryId: string) {
  const ministry = MINISTRY_BY_ID[ministryId];
  if (!ministry) return null;
  const departments = departmentsOf(ministryId);
  return {
    ministry,
    departments,
    cohorts: cohortsOf(ministryId),
    /** Departments at or below the medium-risk band. */
    departmentsAtRisk: departments.filter((d) => d.risk !== "Low").length,
    coverage: Math.round((ministry.activeLearners / ministry.employees) * 100),
    tokenUtilisation: Math.round((ministry.tokensUsedM / ministry.tokenQuotaM) * 100),
  };
}

export type CapabilityBand = {
  level: CapabilityLevel;
  count: number;
  percentage: number;
};

/** National capability ladder distribution; counts sum to active learners. */
export const CAPABILITY_BANDS: CapabilityBand[] = CAPABILITY_LEVELS.map((level) => {
  const count = CAPABILITY_DISTRIBUTION[level.id] ?? 0;
  return { level, count, percentage: Math.round((count / FEDERAL.activeLearners) * 100) };
});

export type NationalGap = {
  competency: Competency;
  /** Entities naming this competency as their biggest gap. */
  ministries: number;
  trend: "rising" | "stable" | "declining";
};

/** National capability gaps, ranked by how many entities report them. */
export function nationalGaps(): NationalGap[] {
  return COMPETENCIES.map((competency) => ({
    competency,
    ministries: MINISTRIES.filter((m) => m.topGapCompetencyId === competency.id).length,
    trend: GAP_TRENDS[competency.id] ?? "stable",
  }))
    .filter((g) => g.ministries > 0)
    .sort((a, b) => b.ministries - a.ministries);
}

export const competencyLabel = (id: string): string => COMPETENCY_BY_ID[id]?.label ?? id;

export const LEVEL_BY_ID: Record<string, CapabilityLevel> = Object.fromEntries(
  CAPABILITY_LEVELS.map((l) => [l.id, l]),
);

/** Capability level a baseline score places someone at. */
export function levelForScore(score: number): CapabilityLevel {
  if (score >= 85) return LEVEL_BY_ID.champion;
  if (score >= 70) return LEVEL_BY_ID.advanced;
  if (score >= 55) return LEVEL_BY_ID.practitioner;
  if (score >= 35) return LEVEL_BY_ID.emerging;
  return LEVEL_BY_ID.aware;
}

/** Engagement status from real signals rather than an authored label. */
export function statusForSignals(pathwayProgress: number, daysSinceActive: number): LearnerStatus {
  if (daysSinceActive >= 10) return "at-risk";
  if (pathwayProgress >= 90) return "excelling";
  if (pathwayProgress < 50 && daysSinceActive >= 2) return "needs-attention";
  return "on-track";
}

// ---------------------------------------------------------------------------
// Rosters
// ---------------------------------------------------------------------------

/** Deterministic PRNG so a synthesised roster never changes between renders. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Mansour", "Shaikha", "Abdullah", "Moza", "Rashid", "Salama", "Hamdan", "Wadeema",
  "Jassim", "Aisha", "Sultan", "Maryam", "Saif", "Nouf", "Hamad", "Dana",
];
const FAMILY_NAMES = [
  "Al Suwaidi", "Al Nuaimi", "Al Mazrouei", "Al Shamsi", "Al Hosani", "Al Dhaheri",
  "Al Muhairi", "Al Ketbi", "Al Falasi", "Al Blooshi",
];
const GENERIC_ROLES = [
  "Programme Officer", "Service Specialist", "Data Coordinator", "Policy Analyst",
  "Operations Officer", "Digital Services Lead", "Communications Officer", "Planning Analyst",
];

/**
 * A department without an authored roster still has to open to something —
 * stakeholders drill in from any ministry, and an empty table reads as broken.
 * The synthesised people are consistent with the department's readiness index.
 */
function synthesiseRoster(department: Department): Person[] {
  const random = seededRandom(department.id);
  const size = Math.min(6, Math.max(3, Math.round(department.activeLearners / 120) || 3));
  const cohort = COHORTS.find((c) => c.departmentId === department.id);
  return Array.from({ length: size }, (_, i) => {
    const name = `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${
      FAMILY_NAMES[Math.floor(random() * FAMILY_NAMES.length)]
    }`;
    // Scores sit around the department readiness so the drill-down reconciles
    // with the chart the stakeholder clicked to get here.
    const score = Math.max(20, Math.min(99, Math.round(department.readiness + (random() * 26 - 13))));
    const progress = Math.max(5, Math.min(99, Math.round(score * 0.9 + (random() * 16 - 8))));
    const daysSinceActive = Math.floor(random() * 14);
    return {
      id: `${department.id}-syn-${i + 1}`,
      name,
      role: GENERIC_ROLES[Math.floor(random() * GENERIC_ROLES.length)],
      ministryId: department.ministryId,
      departmentId: department.id,
      cohortId: cohort?.id,
      levelId: levelForScore(score).id,
      pathwayProgress: progress,
      assessmentScore: score,
      lastActive: daysSinceActive === 0 ? "Today" : daysSinceActive === 1 ? "Yesterday" : `${daysSinceActive} days ago`,
      status: statusForSignals(progress, daysSinceActive),
    } satisfies Person;
  });
}

const SYNTHETIC_CACHE = new Map<string, Person[]>();

/** Everyone in a department: the authored roster, or a synthesised one. */
export function peopleOf(departmentId: string): Person[] {
  const authored = PEOPLE.filter((p) => p.departmentId === departmentId);
  if (authored.length > 0) return authored;
  const department = DEPARTMENT_BY_ID[departmentId];
  if (!department) return [];
  if (!SYNTHETIC_CACHE.has(departmentId)) {
    SYNTHETIC_CACHE.set(departmentId, synthesiseRoster(department));
  }
  return SYNTHETIC_CACHE.get(departmentId) ?? [];
}

/** Everyone in a ministry that the demo can name. */
export const peopleOfMinistry = (ministryId: string): Person[] =>
  PEOPLE.filter((p) => p.ministryId === ministryId);

export const PERSON_BY_ID: Record<string, Person> = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// Submission queues
// ---------------------------------------------------------------------------

/** Which state each role is waiting on. */
export const QUEUE_STATE: Record<"manager" | "ministry" | "fahr", SubmissionState> = {
  manager: "awaiting_manager",
  ministry: "awaiting_entity",
  fahr: "escalated",
};

export const SUBMISSION_STATE_LABEL: Record<SubmissionState, string> = {
  awaiting_manager: "Awaiting sign-off",
  revision_requested: "Revision requested",
  awaiting_entity: "Awaiting entity endorsement",
  endorsed: "Endorsed",
  escalated: "Escalated to FAHR",
  deployed: "Deployed",
};

export function filterSubmissions(
  submissions: Submission[],
  filters: { ministryId?: string; departmentId?: string; personId?: string; state?: SubmissionState },
): Submission[] {
  return submissions.filter(
    (s) =>
      (!filters.ministryId || s.ministryId === filters.ministryId) &&
      (!filters.departmentId || s.departmentId === filters.departmentId) &&
      (!filters.personId || s.personId === filters.personId) &&
      (!filters.state || s.state === filters.state),
  );
}
