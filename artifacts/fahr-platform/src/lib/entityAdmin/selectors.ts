// Everything the entity admin console derives.
//
// Same rule as the federal spine: no screen adds up its own figures. Cohort
// rosters, capability gaps, engagement, completion, assessment outcomes and
// certification all come from here, so the dashboard, the cohort screens and
// the reporting screen cannot disagree with each other or with FAHR.

import { CAPABILITY_LEVELS, type CapabilityLevel } from "@/lib/constants";
import { COMPETENCIES, type Competency } from "@/lib/learningData";
import {
  distribute,
  normaliseReadiness,
  type Cohort,
  type Credential,
  type Department,
  type Ministry,
  type Person,
  type ScheduledSession,
} from "@/lib/federal/model";
import {
  CAPABILITY_DISTRIBUTION,
  NATIONAL_TARGET,
  PEOPLE,
} from "@/lib/federal/seed";
import {
  DEPARTMENT_BY_ID,
  FEDERAL,
  departmentsOf,
  levelForScore,
  peopleOf,
  statusForSignals,
} from "@/lib/federal/selectors";
import { EVENT_ATTENDANCE_RATE, EVENT_META } from "./seed";
import type {
  AssessmentOutcome,
  CertificationState,
  CohortMember,
  EntityEvent,
  EventFormat,
  EventRegistration,
} from "./model";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Deterministic PRNG so a generated roster never changes between renders. */
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
  "Ahmed", "Latifa", "Obaid", "Reem", "Tariq", "Amna", "Majid", "Sara",
  "Faisal", "Hind", "Salem", "Alia", "Nasser", "Shamma", "Ibrahim", "Maha",
];
const FAMILY_NAMES = [
  "Al Marzooqi", "Al Zaabi", "Al Qubaisi", "Al Rashidi", "Al Ameri", "Al Balushi",
  "Al Hammadi", "Al Kaabi", "Al Mansoori", "Al Jaberi",
];
const GENERIC_ROLES = [
  "Programme Officer", "Service Specialist", "Data Coordinator", "Licensing Officer",
  "Operations Officer", "Clinical Coordinator", "Communications Officer", "Planning Analyst",
];

const lastActiveLabel = (days: number): string =>
  days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;

const daysSinceLabel = (label: string): number => {
  if (/min|hour|today/i.test(label)) return 0;
  if (/yesterday/i.test(label)) return 1;
  const match = label.match(/(\d+)\s*day/i);
  return match ? Number(match[1]) : 12;
};

// ---------------------------------------------------------------------------
// Cohort rosters
// ---------------------------------------------------------------------------

const outcomeFor = (score: number, progress: number): AssessmentOutcome => {
  if (progress < 25) return "Awaiting assessment";
  return score >= 55 ? "Passed" : "Retake needed";
};

const certificationFor = (
  progress: number,
  outcome: AssessmentOutcome,
  certified: boolean,
): CertificationState => {
  if (certified) return "Certified";
  if (progress >= 90 && outcome === "Passed") return "Ready to certify";
  if (progress <= 2) return "Not started";
  return "In progress";
};

function memberFromPerson(person: Person, certifiedIds: Set<string>): CohortMember {
  const outcome = outcomeFor(person.assessmentScore, person.pathwayProgress);
  return {
    id: person.id,
    name: person.name,
    role: person.role,
    departmentId: person.departmentId,
    levelId: person.levelId,
    pathwayProgress: person.pathwayProgress,
    assessmentScore: person.assessmentScore,
    assessmentOutcome: outcome,
    certification: certificationFor(person.pathwayProgress, outcome, certifiedIds.has(person.id)),
    lastActive: person.lastActive,
    status: person.status,
  };
}

/** How many named members a cohort roster shows before it is a sample. */
export const ROSTER_SAMPLE_SIZE = 12;

/**
 * The people in a cohort. Authored members come first; the rest of the sample
 * is generated around the cohort's own progress figure so the roster reconciles
 * with the cohort row the admin clicked to get here.
 */
export function cohortRoster(
  cohort: Cohort,
  people: Person[],
  credentials: Credential[],
): CohortMember[] {
  const certifiedIds = new Set(credentials.map((c) => c.personId));
  const authored = people
    .filter((p) => p.cohortId === cohort.id)
    .map((person) => memberFromPerson(person, certifiedIds));

  const target = Math.min(cohort.learners, ROSTER_SAMPLE_SIZE);
  if (authored.length >= target) return authored;

  const random = seededRandom(cohort.id);
  const department = cohort.departmentId ? DEPARTMENT_BY_ID[cohort.departmentId] : undefined;
  const generated: CohortMember[] = Array.from({ length: target - authored.length }, (_, i) => {
    const name = `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${
      FAMILY_NAMES[Math.floor(random() * FAMILY_NAMES.length)]
    }`;
    const progress = clamp(Math.round(cohort.progress + (random() * 30 - 15)), 0, 100);
    const score = clamp(Math.round((department?.readiness ?? 62) + (random() * 24 - 12)), 20, 99);
    const days = Math.floor(random() * (cohort.status === "Active" ? 9 : 16));
    const outcome = outcomeFor(score, progress);
    return {
      id: `${cohort.id}-m${i + 1}`,
      name,
      role: GENERIC_ROLES[Math.floor(random() * GENERIC_ROLES.length)],
      departmentId: cohort.departmentId,
      levelId: levelForScore(score).id,
      pathwayProgress: progress,
      assessmentScore: score,
      assessmentOutcome: outcome,
      certification: certificationFor(progress, outcome, false),
      lastActive: lastActiveLabel(days),
      status: statusForSignals(progress, days),
      synthetic: true,
    };
  });

  return [...authored, ...generated];
}

export type CohortSummary = {
  cohort: Cohort;
  members: CohortMember[];
  /** Members in the sample who cleared their assessment. */
  passed: number;
  retakes: number;
  awaiting: number;
  certified: number;
  readyToCertify: number;
  atRisk: number;
  averageScore: number;
  /** Learners the cohort's progress figure implies have finished. */
  completed: number;
};

export function cohortSummary(
  cohort: Cohort,
  people: Person[],
  credentials: Credential[],
): CohortSummary {
  const members = cohortRoster(cohort, people, credentials);
  const scored = members.filter((m) => m.assessmentOutcome !== "Awaiting assessment");
  const share = (count: number) =>
    members.length === 0 ? 0 : Math.round((count / members.length) * cohort.learners);
  return {
    cohort,
    members,
    passed: members.filter((m) => m.assessmentOutcome === "Passed").length,
    retakes: members.filter((m) => m.assessmentOutcome === "Retake needed").length,
    awaiting: members.filter((m) => m.assessmentOutcome === "Awaiting assessment").length,
    certified: members.filter((m) => m.certification === "Certified").length,
    readyToCertify: members.filter((m) => m.certification === "Ready to certify").length,
    atRisk: share(members.filter((m) => m.status === "at-risk").length),
    averageScore:
      scored.length === 0
        ? 0
        : Math.round(scored.reduce((sum, m) => sum + m.assessmentScore, 0) / scored.length),
    completed: Math.round((cohort.learners * cohort.progress) / 100),
  };
}

// ---------------------------------------------------------------------------
// Capability and gaps
// ---------------------------------------------------------------------------

export type EntityCapabilityBand = {
  level: CapabilityLevel;
  count: number;
  percentage: number;
};

/**
 * The entity's learners across the capability ladder. The national shape is
 * tilted by how far the entity sits from the national readiness index, so a
 * stronger entity leans towards the top of the ladder. Counts sum exactly to
 * the entity's active learners.
 */
export function entityCapabilityBands(ministry: Ministry): EntityCapabilityBand[] {
  const tilt = (ministry.readiness - FEDERAL.readiness) / 100;
  const weights = CAPABILITY_LEVELS.map((level, index) => {
    const nationalShare = (CAPABILITY_DISTRIBUTION[level.id] ?? 1) / FEDERAL.activeLearners;
    const centre = (CAPABILITY_LEVELS.length - 1) / 2;
    return Math.max(0.001, nationalShare * (1 + tilt * (index - centre) * 1.6));
  });
  const counts = distribute(ministry.activeLearners, weights);
  return CAPABILITY_LEVELS.map((level, index) => ({
    level,
    count: counts[index],
    percentage: Math.round((counts[index] / ministry.activeLearners) * 100),
  }));
}

/**
 * Per-competency offsets from the entity's overall readiness. Authored once so
 * every gap view — dashboard, reports, department drill-down — agrees.
 */
const COMPETENCY_OFFSETS: Record<string, number> = {
  literacy: 12,
  prompting: 4,
  analytics: -6,
  agentic: -11,
  governance: 1,
};

/** Extra penalty applied to whichever competency the entity names as its gap. */
const TOP_GAP_PENALTY = 7;

export type CompetencyGapRow = {
  competency: Competency;
  /** Average capability score across the entity, 0-100. */
  score: number;
  target: number;
  /** Points below target; 0 when the competency is at or above it. */
  gap: number;
  /** Learners below the practitioner threshold on this competency. */
  learnersBelow: number;
  isTopGap: boolean;
};

function competencyScores(readiness: number, topGapCompetencyId: string): number[] {
  const offsets = COMPETENCIES.map(
    (c) => (COMPETENCY_OFFSETS[c.id] ?? 0) - (c.id === topGapCompetencyId ? TOP_GAP_PENALTY : 0),
  );
  return normaliseReadiness(readiness, COMPETENCIES.map(() => 1), offsets);
}

/** The entity's capability gaps, biggest first. */
export function entityCompetencyGaps(ministry: Ministry): CompetencyGapRow[] {
  const target = NATIONAL_TARGET.readiness;
  const scores = competencyScores(ministry.readiness, ministry.topGapCompetencyId);
  return COMPETENCIES.map((competency, index) => {
    const score = scores[index];
    const shortfall = clamp((target - score) / target, 0, 1);
    return {
      competency,
      score,
      target,
      gap: Math.max(0, target - score),
      learnersBelow: Math.round(ministry.activeLearners * clamp(shortfall * 2.1, 0.04, 0.72)),
      isTopGap: competency.id === ministry.topGapCompetencyId,
    };
  }).sort((a, b) => b.gap - a.gap);
}

export type DepartmentGapRow = {
  department: Department;
  /** competencyId -> average score. */
  scores: Record<string, number>;
  /** The department's own weakest competency. */
  weakestCompetencyId: string;
};

export function departmentGapRows(ministry: Ministry): DepartmentGapRow[] {
  return departmentsOf(ministry.id).map((department) => {
    const values = competencyScores(department.readiness, ministry.topGapCompetencyId);
    const scores = Object.fromEntries(COMPETENCIES.map((c, i) => [c.id, values[i]]));
    const weakest = COMPETENCIES.reduce((worst, c) =>
      scores[c.id] < scores[worst.id] ? c : worst,
    COMPETENCIES[0]);
    return { department, scores, weakestCompetencyId: weakest.id };
  });
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export type EngagementRow = {
  department: Department;
  employees: number;
  activeLearners: number;
  /** Share of the department enrolled and active. */
  coverage: number;
  /** Learners active in the last seven days. */
  activeThisWeek: number;
  atRisk: number;
  averageProgress: number;
};

export function engagementRows(ministryId: string, cohorts: Cohort[]): EngagementRow[] {
  return departmentsOf(ministryId).map((department) => {
    const departmentCohorts = cohorts.filter((c) => c.departmentId === department.id);
    const averageProgress =
      departmentCohorts.length > 0
        ? Math.round(
            departmentCohorts.reduce((sum, c) => sum + c.progress * c.learners, 0) /
              Math.max(1, departmentCohorts.reduce((sum, c) => sum + c.learners, 0)),
          )
        : Math.round(department.readiness * 0.7);
    const engagementRate = clamp(department.readiness / 100 + 0.12, 0.35, 0.95);
    const activeThisWeek = Math.round(department.activeLearners * engagementRate);
    return {
      department,
      employees: department.employees,
      activeLearners: department.activeLearners,
      coverage: Math.round((department.activeLearners / department.employees) * 100),
      activeThisWeek,
      atRisk: Math.max(0, department.activeLearners - activeThisWeek),
      averageProgress,
    };
  });
}

export type CompletionRow = {
  cohort: Cohort;
  department?: Department;
  enrolled: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
};

export function completionRows(cohorts: Cohort[]): CompletionRow[] {
  return cohorts.map((cohort) => {
    const completed = Math.round((cohort.learners * cohort.progress) / 100);
    const notStarted =
      cohort.status === "Planning"
        ? cohort.learners
        : Math.round(cohort.learners * (cohort.status === "Onboarding" ? 0.35 : 0.06));
    return {
      cohort,
      department: cohort.departmentId ? DEPARTMENT_BY_ID[cohort.departmentId] : undefined,
      enrolled: cohort.learners,
      completed,
      inProgress: Math.max(0, cohort.learners - completed - notStarted),
      notStarted,
      completionRate: cohort.progress,
    };
  });
}

export type AssessmentRow = {
  cohort: Cohort;
  assessed: number;
  averageScore: number;
  passRate: number;
  retakes: number;
  awaiting: number;
};

export function assessmentRows(
  cohorts: Cohort[],
  people: Person[],
  credentials: Credential[],
): AssessmentRow[] {
  return cohorts.map((cohort) => {
    const summary = cohortSummary(cohort, people, credentials);
    const sample = Math.max(1, summary.members.length);
    const assessed = Math.round((cohort.learners * (sample - summary.awaiting)) / sample);
    const passed = Math.round((cohort.learners * summary.passed) / sample);
    return {
      cohort,
      assessed,
      averageScore: summary.averageScore,
      passRate: assessed === 0 ? 0 : Math.round((passed / assessed) * 100),
      retakes: Math.round((cohort.learners * summary.retakes) / sample),
      awaiting: cohort.learners - assessed,
    };
  });
}

export type CertificationRow = {
  level: CapabilityLevel;
  issued: number;
  share: number;
};

/**
 * Credentials issued across the ladder. The entity's authored total is the
 * anchor; anything issued during the session is added on top.
 */
export function certificationRows(
  ministry: Ministry,
  credentials: Credential[],
): CertificationRow[] {
  const sessionIssued = credentials.filter((c) => c.ministryId === ministry.id);
  // Weighted towards the middle of the ladder — most certificates are earned at
  // practitioner and advanced level.
  const weights = [0.14, 0.28, 0.34, 0.18, 0.06];
  const counts = distribute(ministry.credentialsIssued, weights);
  const byLevel = Object.fromEntries(CAPABILITY_LEVELS.map((l, i) => [l.id, counts[i]]));
  for (const credential of sessionIssued) {
    if (credential.id.startsWith("cr-")) continue; // authored, already in the total
    byLevel[credential.levelId] = (byLevel[credential.levelId] ?? 0) + 1;
  }
  const total = Object.values(byLevel).reduce((a, b) => a + b, 0);
  return CAPABILITY_LEVELS.map((level) => ({
    level,
    issued: byLevel[level.id] ?? 0,
    share: total === 0 ? 0 : Math.round(((byLevel[level.id] ?? 0) / total) * 100),
  }));
}

/** Credential total including anything issued during the session. */
export function credentialTotal(ministry: Ministry, credentials: Credential[]): number {
  const extra = credentials.filter(
    (c) => c.ministryId === ministry.id && !c.id.startsWith("cr-"),
  ).length;
  return ministry.credentialsIssued + extra;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const FORMAT_FROM_MODE: Record<ScheduledSession["mode"], EventFormat> = {
  Virtual: "Instructor-led session",
  "In person": "In person",
  Hybrid: "Hybrid",
};

const statusFromSession = (session: ScheduledSession): EntityEvent["status"] =>
  session.status === "Closed" ? "Cancelled" : (session.status as EntityEvent["status"]);

/** A shared scheduled session, enriched into the entity's event record. */
export function eventFromSession(session: ScheduledSession): EntityEvent {
  const meta = EVENT_META[session.id];
  return {
    id: session.id,
    title: session.title,
    summary: meta?.summary ?? "Entity learning session.",
    format: meta?.format ?? FORMAT_FROM_MODE[session.mode],
    facilitator: meta?.facilitator ?? session.host,
    date: session.date,
    time: session.time,
    location: meta?.location ?? (session.mode === "In person" ? "MOHAP Head Office" : "Microsoft Teams"),
    seats: session.seats,
    registered: session.registered,
    audienceLabel: meta?.audienceLabel ?? "All employees",
    competencyId: meta?.competencyId,
    status: statusFromSession(session),
  };
}

/**
 * The registration list for an event. Named registrants come from the entity
 * roster, the rest of the sample is generated, and attendance is only present
 * once the session has run.
 */
export function eventRegistrations(event: EntityEvent, sample = 10): EventRegistration[] {
  const random = seededRandom(`${event.id}-reg`);
  const attendanceRate = EVENT_ATTENDANCE_RATE[event.id];
  const size = Math.min(event.registered, sample);
  const roster = PEOPLE.filter((p) => p.ministryId === "mohap");
  return Array.from({ length: size }, (_, i) => {
    const person = roster[i];
    const name = person
      ? person.name
      : `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${
          FAMILY_NAMES[Math.floor(random() * FAMILY_NAMES.length)]
        }`;
    const departmentLabel = person?.departmentId
      ? DEPARTMENT_BY_ID[person.departmentId]?.name ?? "—"
      : event.audienceLabel;
    return {
      id: `${event.id}-r${i + 1}`,
      name,
      departmentLabel,
      registeredOn: `${clamp(2 + Math.floor(random() * 26), 1, 28)} July 2026`,
      attended:
        event.status === "Completed" && attendanceRate !== undefined
          ? random() < attendanceRate
          : undefined,
    };
  });
}

/** Attendance for a completed event, as a count and a rate. */
export function eventAttendance(event: EntityEvent): { attended: number; rate: number } | null {
  const rate = EVENT_ATTENDANCE_RATE[event.id];
  if (event.status !== "Completed" || rate === undefined) return null;
  const attended = Math.round(event.registered * rate);
  return { attended, rate: Math.round(rate * 100) };
}

// ---------------------------------------------------------------------------
// Drill-downs
// ---------------------------------------------------------------------------

export type DepartmentRosterRow = {
  person: Person;
  daysSinceActive: number;
  certified: boolean;
};

/** A department's people, with the signals the admin needs in the table. */
export function departmentRoster(departmentId: string, credentials: Credential[]): DepartmentRosterRow[] {
  const certified = new Set(credentials.map((c) => c.personId));
  return peopleOf(departmentId).map((person) => ({
    person,
    daysSinceActive: daysSinceLabel(person.lastActive),
    certified: certified.has(person.id),
  }));
}

export { daysSinceLabel };
