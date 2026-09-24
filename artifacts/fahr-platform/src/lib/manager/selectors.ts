// Team-level derivation for the department manager portal.
//
// The manager aggregates its own people and nothing else. Every figure it is
// compared against — the department readiness index, the entity's per-competency
// profile, the entity's hours saved — is read from the shared derived roll-ups,
// never re-summed here. Screens call into this module rather than adding numbers
// up themselves, so Team Dashboard, Team Members, Team Reports and Team
// Recognition state the same thing.

import { CAPABILITY_LEVELS, IMPACT_POINTS, type CapabilityLevel } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID, type Competency } from "@/lib/learningData";
import {
  COHORT_BY_ID,
  DEPARTMENT_BY_ID,
  LEVEL_BY_ID,
  MINISTRY_BY_ID,
  ON_TRACK_READINESS,
  levelForScore,
  type Credential,
  type Department,
  type LearnerStatus,
  type Ministry,
  type Person,
  type Submission,
  type SubmissionState,
} from "@/lib/federal";
import type { AssessmentOutcome, CertificationState } from "@/lib/entityAdmin/model";
import { certificationFor, daysSinceLabel, outcomeFor } from "@/lib/entityAdmin/selectors";

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// ---------------------------------------------------------------------------
// Proficiency bands — tied to the capability ladder thresholds
// ---------------------------------------------------------------------------

/** A score below this is a development priority: not yet Practitioner. */
export const PRACTITIONER_THRESHOLD = 55;
/** Advanced on the ladder. */
export const ADVANCED_THRESHOLD = 70;
/** Champion on the ladder. */
export const CHAMPION_THRESHOLD = 85;

export type ProficiencyBand = "priority" | "building" | "proficient" | "leading";

/**
 * Where a competency score sits. The thresholds are the ladder's own, so a cell
 * in the heatmap and the level on a capability profile always agree.
 *
 * A weak score is a development priority, never an error — the palette that
 * renders these bands weights them, it does not warn.
 */
export function bandForScore(score: number): ProficiencyBand {
  if (score >= CHAMPION_THRESHOLD) return "leading";
  if (score >= ADVANCED_THRESHOLD) return "proficient";
  if (score >= PRACTITIONER_THRESHOLD) return "building";
  return "priority";
}

export const BAND_LABEL: Record<ProficiencyBand, string> = {
  leading: `Leading (${CHAMPION_THRESHOLD}+)`,
  proficient: `Proficient (${ADVANCED_THRESHOLD}–${CHAMPION_THRESHOLD - 1})`,
  building: `Building (${PRACTITIONER_THRESHOLD}–${ADVANCED_THRESHOLD - 1})`,
  priority: `Priority gap (below ${PRACTITIONER_THRESHOLD})`,
};

// ---------------------------------------------------------------------------
// The team's competency picture
// ---------------------------------------------------------------------------

/**
 * One person's score on one competency. A detailed profile is used where the
 * person has one — including the demo learner, whose live assessment overlays
 * the seed — otherwise the overall baseline stands in for every competency.
 */
export function competencyScoreFor(person: Person, competencyId: string): number {
  return person.competencyScores?.[competencyId] ?? person.assessmentScore;
}

export type TeamMemberScores = {
  person: Person;
  /** competencyId -> 0-100. */
  scores: Record<string, number>;
  /** Mean across the five framework competencies. */
  average: number;
  weakestCompetencyId: string;
  /** Competencies the person's profile names as development priorities. */
  gapIds: string[];
  daysSinceActive: number;
  level: CapabilityLevel;
};

/** Every direct report as a row of per-competency scores. */
export function teamCompetencyMatrix(team: Person[]): TeamMemberScores[] {
  return team.map((person) => {
    const scores = Object.fromEntries(
      COMPETENCIES.map((c) => [c.id, competencyScoreFor(person, c.id)]),
    );
    const weakest = COMPETENCIES.reduce(
      (worst, c) => (scores[c.id] < scores[worst.id] ? c : worst),
      COMPETENCIES[0],
    );
    const average = mean(COMPETENCIES.map((c) => scores[c.id]));
    return {
      person,
      scores,
      average,
      weakestCompetencyId: weakest.id,
      gapIds: person.gapCompetencyIds ?? [],
      daysSinceActive: daysSinceLabel(person.lastActive),
      level: LEVEL_BY_ID[person.levelId] ?? levelForScore(average),
    };
  });
}

export type TeamCompetencyColumn = {
  competency: Competency;
  /** Team average on this competency. */
  average: number;
  band: ProficiencyBand;
  /** Members below the Practitioner threshold. */
  below: number;
  /** Members whose profile names this competency as a development priority. */
  flaggedBy: number;
  /** The team's single largest gap. */
  isTopGap: boolean;
  /** The department's own average, from the entity's derived competency profile. */
  departmentAverage: number;
  vsDepartment: number;
};

/**
 * The team's competencies, weakest signals surfaced. The department comparison
 * comes from the entity's authored competency profile rather than a second
 * calculation over the same people.
 */
export function teamCompetencyColumns(
  rows: TeamMemberScores[],
  departmentId: string,
  departmentScores: Record<string, number>,
): TeamCompetencyColumn[] {
  const averages = COMPETENCIES.map((c) => mean(rows.map((r) => r.scores[c.id])));
  const lowest = Math.min(...averages);
  let topGapMarked = false;

  return COMPETENCIES.map((competency, index) => {
    const average = averages[index];
    const departmentAverage = departmentScores[competency.id] ?? 0;
    const isTopGap = rows.length > 0 && average === lowest && !topGapMarked;
    if (isTopGap) topGapMarked = true;
    return {
      competency,
      average,
      band: bandForScore(average),
      below: rows.filter((r) => r.scores[competency.id] < PRACTITIONER_THRESHOLD).length,
      flaggedBy: rows.filter((r) => r.gapIds.includes(competency.id)).length,
      isTopGap,
      departmentAverage,
      vsDepartment: average - departmentAverage,
    };
  });
}

/** The department's per-competency profile, read from the entity roll-up. */
export function departmentCompetencyScores(
  departmentGapScores: Record<string, number> | undefined,
): Record<string, number> {
  return departmentGapScores ?? Object.fromEntries(COMPETENCIES.map((c) => [c.id, 0]));
}

// ---------------------------------------------------------------------------
// Team against its department and its entity
// ---------------------------------------------------------------------------

export type TeamBenchmark = {
  /** The team's capability average, the figure compared against readiness. */
  teamReadiness: number;
  department: Department;
  ministry: Ministry;
  vsDepartment: number;
  vsMinistry: number;
  /** The federal on-track readiness threshold. */
  onTrack: number;
  teamOnTrack: boolean;
  aheadOfMinistry: boolean;
  aheadOfDepartment: boolean;
  /** Members whose own capability average sits below the on-track threshold. */
  membersBelowOnTrack: number;
  /** True when the team average is below the on-track threshold. */
  atRisk: boolean;
  /** A plain sentence a manager can repeat in a meeting. */
  headline: string;
};

export function teamBenchmark(
  rows: TeamMemberScores[],
  departmentId: string,
  ministryId: string,
): TeamBenchmark | null {
  const department = DEPARTMENT_BY_ID[departmentId];
  const ministry = MINISTRY_BY_ID[ministryId];
  if (!department || !ministry) return null;

  const teamReadiness = mean(rows.map((r) => r.average));
  const vsMinistry = teamReadiness - ministry.readiness;
  const vsDepartment = teamReadiness - department.readiness;
  const points = (n: number) => `${Math.abs(n)} ${Math.abs(n) === 1 ? "point" : "points"}`;

  return {
    teamReadiness,
    department,
    ministry,
    vsDepartment,
    vsMinistry,
    onTrack: ON_TRACK_READINESS,
    teamOnTrack: teamReadiness >= ON_TRACK_READINESS,
    aheadOfMinistry: vsMinistry >= 0,
    aheadOfDepartment: vsDepartment >= 0,
    membersBelowOnTrack: rows.filter((r) => r.average < ON_TRACK_READINESS).length,
    atRisk: teamReadiness < ON_TRACK_READINESS,
    headline:
      rows.length === 0
        ? `No assessed team members yet — ${ministry.shortName} averages ${ministry.readiness}.`
        : vsMinistry === 0
          ? `Level with the ${ministry.shortName} average of ${ministry.readiness}.`
          : `${points(vsMinistry)} ${vsMinistry > 0 ? "ahead of" : "behind"} the ${ministry.shortName} average of ${ministry.readiness}.`,
  };
}

// ---------------------------------------------------------------------------
// The roster
// ---------------------------------------------------------------------------

export type TeamRosterRow = {
  person: Person;
  cohortName: string;
  pathwayProgress: number;
  capabilityAverage: number;
  level: CapabilityLevel;
  lastActive: string;
  daysSinceActive: number;
  activeThisWeek: boolean;
  assessmentOutcome: AssessmentOutcome;
  certification: CertificationState;
  credentials: Credential[];
  status: LearnerStatus;
};

/** One roster row — also used by the team member detail page. */
export function teamRosterRow(person: Person, credentials: Credential[]): TeamRosterRow {
  const cohort = person.cohortId ? COHORT_BY_ID[person.cohortId] : undefined;
  const held = credentials.filter((c) => c.personId === person.id);
  const outcome = outcomeFor(person.assessmentScore, person.pathwayProgress);
  const days = daysSinceLabel(person.lastActive);
  return {
    person,
    cohortName: cohort?.name ?? "No cohort",
    pathwayProgress: person.pathwayProgress,
    capabilityAverage: mean(COMPETENCIES.map((c) => competencyScoreFor(person, c.id))),
    level: LEVEL_BY_ID[person.levelId] ?? levelForScore(person.assessmentScore),
    lastActive: person.lastActive,
    daysSinceActive: days,
    activeThisWeek: days <= 7,
    assessmentOutcome: outcome,
    certification: certificationFor(person.pathwayProgress, outcome, held.length > 0),
    credentials: held,
    status: person.status,
  };
}

export function teamRoster(team: Person[], credentials: Credential[]): TeamRosterRow[] {
  return team.map((person) => teamRosterRow(person, credentials));
}

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

export type TeamEngagement = {
  members: number;
  activeThisWeek: number;
  dormant: number;
  excelling: number;
  onTrack: number;
  needsAttention: number;
  atRisk: number;
  averageProgress: number;
  averageDaysSinceActive: number;
};

export function teamEngagement(roster: TeamRosterRow[]): TeamEngagement {
  const count = (status: LearnerStatus) => roster.filter((r) => r.status === status).length;
  return {
    members: roster.length,
    activeThisWeek: roster.filter((r) => r.activeThisWeek).length,
    dormant: roster.filter((r) => !r.activeThisWeek).length,
    excelling: count("excelling"),
    onTrack: count("on-track"),
    needsAttention: count("needs-attention"),
    atRisk: count("at-risk"),
    averageProgress: mean(roster.map((r) => r.pathwayProgress)),
    averageDaysSinceActive: mean(roster.map((r) => r.daysSinceActive)),
  };
}

// ---------------------------------------------------------------------------
// Competency development over time
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type CompetencyTrendPoint = {
  month: string;
  /** competencyId -> score at that month. */
  values: Record<string, number>;
  average: number;
  /** True before the team's pathway started: the line holds at the baseline. */
  beforeStart: boolean;
};

/**
 * The team's competency development across the reporting window.
 *
 * Both ends are measured: the team started at its mean baseline assessment and
 * stands today at its per-competency averages. Months in between are the curve
 * between the two, shaped by how much of the pathway the team has completed —
 * a team early in its pathway shows most of its growth recently. Nothing is
 * invented beyond that interpolation, so the line moves whenever a learner's
 * real figures move.
 */
export function teamCompetencyTrend(
  rows: TeamMemberScores[],
  columns: TeamCompetencyColumn[],
  options?: { months?: number; monthsElapsed?: number; averageProgress?: number },
): CompetencyTrendPoint[] {
  const months = options?.months ?? 6;
  const monthsElapsed = clamp(options?.monthsElapsed ?? months, 1, months);
  const baseline = mean(rows.map((r) => r.person.assessmentScore));
  const progress = clamp(options?.averageProgress ?? 50, 1, 100);
  // Low completion pushes the growth towards the recent months.
  const shape = 1 + (1 - progress / 100);

  const now = new Date(2026, 6, 1); // the demo present: July 2026
  return Array.from({ length: months }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const stepsFromStart = i - (months - monthsElapsed);
    const fraction =
      stepsFromStart <= 0
        ? 0
        : Math.pow(stepsFromStart / Math.max(1, monthsElapsed - 1), shape);
    const values = Object.fromEntries(
      columns.map((column) => [
        column.competency.id,
        Math.round(baseline + (column.average - baseline) * Math.min(1, fraction)),
      ]),
    );
    return {
      month: MONTH_NAMES[monthDate.getMonth()],
      values,
      average: mean(columns.map((c) => values[c.competency.id])),
      beforeStart: stepsFromStart <= 0,
    };
  });
}

/** Months the team's cohort has been running, for the trend window. */
export function monthsSinceCohortStart(startsOn: string | undefined, months = 6): number {
  if (!startsOn) return months;
  const match = startsOn.match(/([A-Za-z]+)\s+(\d{4})/);
  if (!match) return months;
  const monthIndex = MONTH_NAMES.findIndex((m) => match[1].toLowerCase().startsWith(m.toLowerCase()));
  if (monthIndex < 0) return months;
  const elapsed = (2026 - Number(match[2])) * 12 + (6 - monthIndex) + 1;
  return clamp(elapsed, 1, months);
}

// ---------------------------------------------------------------------------
// Assessment outcomes
// ---------------------------------------------------------------------------

export type AssessmentSpreadRow = {
  person: Person;
  /** Baseline assessment result. */
  baseline: number;
  /** Capability average today. */
  current: number;
  delta: number;
  outcome: AssessmentOutcome;
};

export function teamAssessmentSpread(rows: TeamMemberScores[]): AssessmentSpreadRow[] {
  return rows.map((row) => ({
    person: row.person,
    baseline: row.person.assessmentScore,
    current: row.average,
    delta: row.average - row.person.assessmentScore,
    outcome: outcomeFor(row.person.assessmentScore, row.person.pathwayProgress),
  }));
}

// ---------------------------------------------------------------------------
// Completion and certification
// ---------------------------------------------------------------------------

export const CERTIFICATION_STATES: CertificationState[] = [
  "Certified",
  "Ready to certify",
  "In progress",
  "Not started",
];

export type CertificationProgressRow = {
  state: CertificationState;
  count: number;
  share: number;
};

export function teamCertificationProgress(roster: TeamRosterRow[]): CertificationProgressRow[] {
  return CERTIFICATION_STATES.map((state) => {
    const count = roster.filter((r) => r.certification === state).length;
    return {
      state,
      count,
      share: roster.length === 0 ? 0 : Math.round((count / roster.length) * 100),
    };
  });
}

// ---------------------------------------------------------------------------
// Applied impact
// ---------------------------------------------------------------------------

/**
 * States a project has reached once the department manager has signed it off. Impact
 * is only counted from here, so a sign-off taken in the demo moves the figures.
 */
export const VALIDATED_STATES: SubmissionState[] = [
  "awaiting_entity",
  "endorsed",
  "escalated",
  "deployed",
];

export function teamValidatedSubmissions(teamSubmissions: Submission[]): Submission[] {
  return teamSubmissions.filter((s) => VALIDATED_STATES.includes(s.state));
}

export type ImpactCategoryRow = {
  competency: Competency;
  projects: number;
  hoursSavedPerMonth: number;
  valueAed: number;
};

/** Validated impact grouped by the competency each project is recorded under. */
export function teamImpactRows(validated: Submission[]): ImpactCategoryRow[] {
  return COMPETENCIES.map((competency) => {
    const matching = validated.filter((s) => (s.competencyIds[0] ?? "agentic") === competency.id);
    return {
      competency,
      projects: matching.length,
      hoursSavedPerMonth: matching.reduce((n, s) => n + s.hoursSavedPerMonth, 0),
      valueAed: matching.reduce((n, s) => n + s.estimatedValueAed, 0),
    };
  }).filter((row) => row.projects > 0);
}

export type TeamImpact = {
  projectsValidated: number;
  projectsDeployed: number;
  projectsAwaitingSignOff: number;
  hoursPerMonth: number;
  hoursPerYear: number;
  /** Working days returned to the team each year, at 8 hours a day. */
  workingDaysReturned: number;
  valueAed: number;
  categories: ImpactCategoryRow[];
};

export function teamImpact(teamSubmissions: Submission[]): TeamImpact {
  const validated = teamValidatedSubmissions(teamSubmissions);
  const hoursPerMonth = validated.reduce((n, s) => n + s.hoursSavedPerMonth, 0);
  return {
    projectsValidated: validated.length,
    projectsDeployed: validated.filter((s) => s.state === "deployed").length,
    projectsAwaitingSignOff: teamSubmissions.filter((s) => s.state === "awaiting_manager").length,
    hoursPerMonth,
    hoursPerYear: hoursPerMonth * 12,
    workingDaysReturned: Math.round((hoursPerMonth * 12) / 8),
    valueAed: validated.reduce((n, s) => n + s.estimatedValueAed, 0),
    categories: teamImpactRows(validated),
  };
}

// ---------------------------------------------------------------------------
// Recognition
// ---------------------------------------------------------------------------

export type TeamBadgeIcon = "target" | "spark" | "flame" | "shield" | "trophy" | "people";

export type TeamBadge = {
  id: string;
  label: string;
  description: string;
  criteria: string;
  icon: TeamBadgeIcon;
  earnedBy: Person[];
};

export type TeamRecognitionMember = {
  person: Person;
  level: CapabilityLevel;
  capabilityAverage: number;
  pathwayProgress: number;
  credentials: Credential[];
  validatedProjects: number;
  deployedProjects: number;
  hoursSavedPerMonth: number;
  valueAed: number;
  badgeCount: number;
  challengeEligible: boolean;
  /** Impact points, for the demo learner only — hers are the shared figure. */
  impactPoints?: number;
};

export type TeamStanding = {
  /** Hours returned per team member each month. */
  teamHoursPerPerson: number;
  /** The entity's hours saved per active learner, from its authored figures. */
  ministryHoursPerLearner: number;
  hoursRatio: number;
  teamCredentialsPerPerson: number;
  ministryCredentialsPerLearner: number;
  credentialRatio: number;
  aheadOnImpact: boolean;
  aheadOnCredentials: boolean;
  ministry: Ministry;
};

export type LadderStandingRow = {
  level: CapabilityLevel;
  count: number;
  share: number;
};

/** Projects an entity may enter into the federal AI capability challenge. */
export const CHALLENGE_ENTRY_LIMIT = 3;

export type TeamRecognitionSummary = {
  members: TeamRecognitionMember[];
  credentials: Credential[];
  badges: TeamBadge[];
  badgesEarned: number;
  ladder: LadderStandingRow[];
  /** The highest level anyone on the team has reached. */
  ladderLead: CapabilityLevel | null;
  /** Team average position on the ladder, as a level. */
  ladderAverage: CapabilityLevel | null;
  practitionersOrAbove: number;
  impact: TeamImpact;
  standing: TeamStanding | null;
  topContributors: TeamRecognitionMember[];
  challengeEntries: { submission: Submission; person: Person | undefined }[];
};

function buildBadges(
  team: Person[],
  roster: TeamRosterRow[],
  validatedByPerson: Map<string, Submission[]>,
): TeamBadge[] {
  const rowFor = (person: Person) => roster.find((r) => r.person.id === person.id);
  const earned = (predicate: (person: Person) => boolean) => team.filter(predicate);

  return [
    {
      id: "badge-baseline",
      label: "Baseline Measured",
      description: "Completed the baseline assessment and opened a Capability Profile.",
      criteria: "Complete the baseline assessment",
      icon: "target",
      earnedBy: earned((p) => p.assessmentScore > 0),
    },
    {
      id: "badge-halfway",
      label: "Pathway Momentum",
      description: "Half of the assigned Personalised Learning Pathway complete.",
      criteria: "Reach 50% pathway completion",
      icon: "spark",
      earnedBy: earned((p) => p.pathwayProgress >= 50),
    },
    {
      id: "badge-pathway",
      label: "Pathway Completed",
      description: "The assigned pathway finished end to end.",
      criteria: "Reach 90% pathway completion",
      icon: "flame",
      earnedBy: earned((p) => p.pathwayProgress >= 90),
    },
    {
      id: "badge-impact",
      label: "Impact Delivered",
      description: "A Workplace Project validated with measurable time returned.",
      criteria: "Have a workplace project signed off",
      icon: "trophy",
      earnedBy: earned((p) => (validatedByPerson.get(p.id)?.length ?? 0) > 0),
    },
    {
      id: "badge-credential",
      label: "Credentialed",
      description: "Holds a verifiable federal credential on the national register.",
      criteria: "Be issued a credential",
      icon: "shield",
      earnedBy: earned((p) => (rowFor(p)?.credentials.length ?? 0) > 0),
    },
    {
      id: "badge-practitioner",
      label: "Practitioner or Above",
      description: "Applies AI independently to deliver measurable work outcomes.",
      criteria: "Reach Practitioner on the capability ladder",
      icon: "people",
      earnedBy: earned((p) => (LEVEL_BY_ID[p.levelId]?.order ?? 0) >= 3),
    },
  ];
}

export function teamRecognition(input: {
  team: Person[];
  roster: TeamRosterRow[];
  matrix: TeamMemberScores[];
  teamSubmissions: Submission[];
  credentials: Credential[];
  ministryId: string;
}): TeamRecognitionSummary {
  const { team, roster, matrix, teamSubmissions, credentials, ministryId } = input;
  const ministry = MINISTRY_BY_ID[ministryId];
  const impact = teamImpact(teamSubmissions);
  const validated = teamValidatedSubmissions(teamSubmissions);

  const validatedByPerson = new Map<string, Submission[]>();
  for (const submission of validated) {
    validatedByPerson.set(submission.personId, [
      ...(validatedByPerson.get(submission.personId) ?? []),
      submission,
    ]);
  }

  const badges = buildBadges(team, roster, validatedByPerson);

  const members: TeamRecognitionMember[] = team.map((person) => {
    const row = roster.find((r) => r.person.id === person.id);
    const scores = matrix.find((m) => m.person.id === person.id);
    const own = validatedByPerson.get(person.id) ?? [];
    return {
      person,
      level: LEVEL_BY_ID[person.levelId] ?? levelForScore(person.assessmentScore),
      capabilityAverage: scores?.average ?? person.assessmentScore,
      pathwayProgress: person.pathwayProgress,
      credentials: row?.credentials ?? [],
      validatedProjects: own.length,
      deployedProjects: own.filter((s) => s.state === "deployed").length,
      hoursSavedPerMonth: own.reduce((n, s) => n + s.hoursSavedPerMonth, 0),
      valueAed: own.reduce((n, s) => n + s.estimatedValueAed, 0),
      badgeCount: badges.filter((b) => b.earnedBy.some((p) => p.id === person.id)).length,
      // Every entity may enter three projects: a validated, compliant,
      // high-impact project is what qualifies someone to be put forward.
      challengeEligible: own.some((s) => s.impact === "High" && s.governanceStatus === "Compliant"),
      impactPoints: person.live ? IMPACT_POINTS : undefined,
    };
  });

  const ladder: LadderStandingRow[] = CAPABILITY_LEVELS.map((level) => {
    const count = team.filter((p) => p.levelId === level.id).length;
    return {
      level,
      count,
      share: team.length === 0 ? 0 : Math.round((count / team.length) * 100),
    };
  });

  const highestOrder = Math.max(0, ...team.map((p) => LEVEL_BY_ID[p.levelId]?.order ?? 0));
  const averageOrder = mean(team.map((p) => (LEVEL_BY_ID[p.levelId]?.order ?? 1) * 10)) / 10;

  const teamCredentials = roster.flatMap((r) => r.credentials);
  const standing: TeamStanding | null = ministry
    ? (() => {
        const teamHoursPerPerson = team.length
          ? Math.round((impact.hoursPerMonth / team.length) * 10) / 10
          : 0;
        const ministryHoursPerLearner =
          Math.round((ministry.hoursSavedPerMonth / ministry.activeLearners) * 10) / 10;
        const teamCredentialsPerPerson = team.length
          ? Math.round((teamCredentials.length / team.length) * 100) / 100
          : 0;
        const ministryCredentialsPerLearner =
          Math.round((ministry.credentialsIssued / ministry.activeLearners) * 100) / 100;
        return {
          teamHoursPerPerson,
          ministryHoursPerLearner,
          hoursRatio: ministryHoursPerLearner
            ? Math.round((teamHoursPerPerson / ministryHoursPerLearner) * 10) / 10
            : 0,
          teamCredentialsPerPerson,
          ministryCredentialsPerLearner,
          credentialRatio: ministryCredentialsPerLearner
            ? Math.round((teamCredentialsPerPerson / ministryCredentialsPerLearner) * 10) / 10
            : 0,
          aheadOnImpact: teamHoursPerPerson >= ministryHoursPerLearner,
          aheadOnCredentials: teamCredentialsPerPerson >= ministryCredentialsPerLearner,
          ministry,
        };
      })()
    : null;

  return {
    members,
    credentials: teamCredentials,
    badges,
    badgesEarned: badges.filter((b) => b.earnedBy.length > 0).length,
    ladder,
    ladderLead: CAPABILITY_LEVELS.find((l) => l.order === highestOrder) ?? null,
    ladderAverage:
      team.length === 0
        ? null
        : CAPABILITY_LEVELS.find((l) => l.order === Math.round(averageOrder)) ?? null,
    practitionersOrAbove: team.filter((p) => (LEVEL_BY_ID[p.levelId]?.order ?? 0) >= 3).length,
    impact,
    standing,
    // Contribution is ranked on applied impact first, then on credentials and
    // capability — the platform has no second points scale for a whole team.
    topContributors: [...members]
      .sort(
        (a, b) =>
          b.hoursSavedPerMonth - a.hoursSavedPerMonth ||
          b.credentials.length - a.credentials.length ||
          b.capabilityAverage - a.capabilityAverage,
      )
      .filter((m) => m.hoursSavedPerMonth > 0 || m.credentials.length > 0 || m.badgeCount > 2)
      .slice(0, 3),
    challengeEntries: validated
      .filter((s) => s.impact === "High" && s.governanceStatus === "Compliant")
      .sort((a, b) => b.hoursSavedPerMonth - a.hoursSavedPerMonth)
      .slice(0, CHALLENGE_ENTRY_LIMIT)
      .map((submission) => ({
        submission,
        person: team.find((p) => p.id === submission.personId),
      })),
  };
}

export const competencyShort = (id: string): string => COMPETENCY_BY_ID[id]?.short ?? id;

// ---------------------------------------------------------------------------
// Recognition by AI competency
// ---------------------------------------------------------------------------

/**
 * A team member's standing on one competency. Someone at or above the
 * Practitioner threshold holds that competency's badge — the same rule the
 * learner's own Recognition page applies to itself, read across the team.
 */
export type CompetencyHolder = {
  person: Person;
  score: number;
  band: ProficiencyBand;
};

/** A credential, and the competency its validated project exercised. */
export type CompetencyCredential = {
  credential: Credential;
  person: Person | undefined;
};

export type CompetencyRecognitionRow = {
  competency: Competency;
  /** The team's mean score on this competency. */
  average: number;
  band: ProficiencyBand;
  /** Members holding the badge, strongest first. */
  badged: CompetencyHolder[];
  /** Members not yet at the threshold, closest first. */
  developing: CompetencyHolder[];
  /** Credentials issued against a project that exercised this competency. */
  credentials: CompetencyCredential[];
  teamSize: number;
};

export type TeamCompetencyRecognition = {
  rows: CompetencyRecognitionRow[];
  /** Badges held across every competency and every member. */
  badgesHeld: number;
  /** The most badges any one competency could reach: competencies × members. */
  badgesPossible: number;
  /**
   * Credentials on the register that carry no linked project, so they cannot be
   * attributed to a competency. Named rather than silently dropped.
   */
  unmappedCredentials: CompetencyCredential[];
};

/**
 * Credentials and badges arranged by AI competency rather than by person.
 *
 * A manager reading a flat list of certificates learns who has one; reading it
 * by competency tells them which AI capabilities the team is actually
 * certified in and where the holes are — the question the recognition surface
 * exists to answer.
 *
 * Badge membership uses PRACTITIONER_THRESHOLD, the same ladder threshold the
 * learner's own competency badges use, so a learner and their manager never
 * disagree about whether a badge is held. A credential is attributed through
 * its validated project's `competencyIds`; one project exercising two
 * competencies credits both.
 */
export function teamCompetencyRecognition(input: {
  matrix: TeamMemberScores[];
  credentials: Credential[];
  teamSubmissions: Submission[];
}): TeamCompetencyRecognition {
  const { matrix, credentials, teamSubmissions } = input;
  const submissionById = new Map(teamSubmissions.map((s) => [s.id, s]));
  const personById = new Map(matrix.map((r) => [r.person.id, r.person]));

  const mapped = new Set<string>();
  const credentialsFor = (competencyId: string): CompetencyCredential[] =>
    credentials.filter((credential) => {
      if (!credential.submissionId) return false;
      const submission = submissionById.get(credential.submissionId);
      if (!submission?.competencyIds.includes(competencyId)) return false;
      mapped.add(credential.id);
      return true;
    }).map((credential) => ({ credential, person: personById.get(credential.personId) }));

  const rows = COMPETENCIES.map((competency) => {
    const holders: CompetencyHolder[] = matrix.map((row) => {
      const score = row.scores[competency.id];
      return { person: row.person, score, band: bandForScore(score) };
    });
    return {
      competency,
      average: mean(holders.map((h) => h.score)),
      band: bandForScore(mean(holders.map((h) => h.score))),
      badged: holders
        .filter((h) => h.score >= PRACTITIONER_THRESHOLD)
        .sort((a, b) => b.score - a.score),
      developing: holders
        .filter((h) => h.score < PRACTITIONER_THRESHOLD)
        .sort((a, b) => b.score - a.score),
      credentials: credentialsFor(competency.id),
      teamSize: matrix.length,
    };
  });

  return {
    rows,
    badgesHeld: rows.reduce((total, row) => total + row.badged.length, 0),
    badgesPossible: COMPETENCIES.length * matrix.length,
    unmappedCredentials: credentials
      .filter((credential) => !mapped.has(credential.id))
      .map((credential) => ({ credential, person: personById.get(credential.personId) })),
  };
}
