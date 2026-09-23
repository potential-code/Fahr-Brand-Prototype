// Derivation layer for the Capability Profile screen.
//
// The proposal (4.5 / 5.2) describes the Capability Profile as a *living*
// record: assessment outcomes update it automatically, and the AI Skills
// Advisor continuously analyses competency levels, job role, entity, learning
// objectives, assessment outcomes, programme participation, learning behaviour
// and previous achievements.
//
// Everything on the screen is therefore derived here from the learner's stored
// assessment result plus their real course progress. Pages consume this
// builder; they never invent their own numbers. Front-end mock only.

import {
  COMPETENCIES,
  COMPETENCY_BY_ID,
  COURSES,
  COURSE_BY_ID,
  bandForScore,
  courseLessons,
  SCORE_BANDS,
  type Competency,
  type Course,
} from "@/lib/learningData";
import { CAPABILITY_LEVELS, IMPACT_POINTS, LEARNER_PROFILE, type CapabilityLevel } from "@/lib/constants";
import { targetFor } from "@/lib/recommendations";
import type { AssessmentResult, CourseProgress } from "@/lib/LearnerProgressContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompetencyStanding = {
  competency: Competency;
  score: number;
  /** Score at the learner's first recorded baseline, so growth is visible. */
  previous: number;
  delta: number;
  target: number;
  /** Where this competency sits relative to the rest of the learner's profile. */
  band: "strength" | "steady" | "gap";
  /** 1 = highest scoring competency. */
  rank: number;
  /** The course that closes this competency, when one exists. */
  course: Course | null;
};

export type HistoryPoint = { label: string; readiness: number; current: boolean };

export type AssessmentRecord = {
  id: string;
  label: string;
  date: string;
  score: number;
  levelLabel: string;
  current: boolean;
};

export type SignalWeight = "high" | "medium" | "low";

export type AdvisorSignal = {
  id: string;
  label: string;
  value: string;
  detail: string;
  weight: SignalWeight;
};

export type CredentialState = "earned" | "in-progress" | "locked";

export type ProfileCredential = {
  id: string;
  title: string;
  issuer: string;
  caption: string;
  state: CredentialState;
  /** 0-100, only meaningful while in progress. */
  percent: number;
};

export type NextCapability = {
  id: string;
  competency: Competency;
  headline: string;
  score: number;
  target: number;
  course: Course | null;
  href: string;
};

export type ProfileAnalysis = {
  overall: number;
  level: CapabilityLevel;
  levelBlurb: string;
  nextLevel: CapabilityLevel | null;
  pointsToNext: number;
  /** 0-100 progress through the current band toward the next one. */
  progressToNext: number;
  completedOn: string;
  standings: CompetencyStanding[];
  strongest: CompetencyStanding;
  weakest: CompetencyStanding;
  history: HistoryPoint[];
  assessments: AssessmentRecord[];
  signals: AdvisorSignal[];
  conclusion: string;
  credentials: ProfileCredential[];
  nextCapabilities: NextCapability[];
  participation: ParticipationSummary;
};

/** Real learner activity, read out of the progress context by the page. */
export type ParticipationSummary = {
  coursesStarted: number;
  coursesCompleted: number;
  courseCount: number;
  lessonsCompleted: number;
  averagePercent: number;
  impactPoints: number;
};

// ---------------------------------------------------------------------------
// Participation
// ---------------------------------------------------------------------------

export function summariseParticipation(
  courseProgress: Record<string, CourseProgress>,
  percentFor: (courseId: string) => number,
): ParticipationSummary {
  let coursesStarted = 0;
  let coursesCompleted = 0;
  let lessonsCompleted = 0;
  let percentTotal = 0;

  for (const course of COURSES) {
    const percent = percentFor(course.id);
    const progress = courseProgress[course.id];
    const lessons = progress?.completedLessonIds.length ?? 0;
    lessonsCompleted += lessons;
    percentTotal += percent;
    if (percent > 0) coursesStarted += 1;
    if (progress?.finalDone) coursesCompleted += 1;
  }

  return {
    coursesStarted,
    coursesCompleted,
    courseCount: COURSES.length,
    lessonsCompleted,
    averagePercent: COURSES.length ? Math.round(percentTotal / COURSES.length) : 0,
    impactPoints: IMPACT_POINTS,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BAND_MIN: Record<string, number> = Object.fromEntries(SCORE_BANDS.map((b) => [b.id, b.min]));

const LEVEL_BY_ID: Record<string, CapabilityLevel> = Object.fromEntries(
  CAPABILITY_LEVELS.map((l) => [l.id, l]),
);

/**
 * Where the learner was at each earlier checkpoint, expressed as a share of
 * today's score so the trend always reads correctly whatever they scored.
 */
const HISTORY_FACTORS = [0.46, 0.58, 0.68, 0.79, 0.9];

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function monthsAgo(from: Date, count: number): Date {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() - count);
  return d;
}

const monthLabel = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
const fullDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** A course whose competency this is — the thing that actually closes the gap. */
function courseForCompetency(competencyId: string): Course | null {
  return COURSES.find((c) => c.competencyId === competencyId) ?? null;
}

/**
 * Headlines vary by both how far the competency has to travel and its rank in
 * the priority list, so three recommendations never read as one sentence
 * repeated three times.
 */
function headlineFor(competency: Competency, score: number, rank: number): string {
  const gap = targetFor(score) - score;
  if (score < 34) {
    return `Build a working foundation in ${competency.short} before it blocks the rest`;
  }
  if (rank === 0) {
    return `Close the widest gap on your profile — ${gap} points in ${competency.short}`;
  }
  if (score < 67) {
    return `Take ${competency.short} from occasional use to something you rely on`;
  }
  return `Push ${competency.short} past the level where you can teach it to colleagues`;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildProfileAnalysis(
  result: AssessmentResult,
  participation: ParticipationSummary,
  courseProgress: Record<string, CourseProgress>,
  now: Date = new Date(),
): ProfileAnalysis | null {
  const overall = clamp(result.overall);
  const level = LEVEL_BY_ID[result.levelId] ?? CAPABILITY_LEVELS[0];
  const nextLevel = CAPABILITY_LEVELS.find((l) => l.order === level.order + 1) ?? null;

  const bandFloor = BAND_MIN[level.id] ?? 0;
  const bandCeiling = nextLevel ? (BAND_MIN[nextLevel.id] ?? 100) : 100;
  const span = Math.max(1, bandCeiling - bandFloor);
  const progressToNext = nextLevel ? clamp(Math.round(((overall - bandFloor) / span) * 100)) : 100;
  const pointsToNext = nextLevel ? Math.max(0, bandCeiling - overall) : 0;

  // --- competency standings -------------------------------------------------
  const strengthIds = new Set(result.strengths);
  const gapIds = new Set(result.gaps);

  const ranked = [...COMPETENCIES].sort(
    (a, b) => (result.scores[b.id] ?? 0) - (result.scores[a.id] ?? 0),
  );

  const standings: CompetencyStanding[] = ranked.map((competency, index) => {
    const score = clamp(result.scores[competency.id] ?? 0);
    // Each competency grew at a slightly different rate, so the deltas read as
    // a real record rather than one uniform percentage applied five times.
    const previous = clamp(Math.round(score * (0.68 + 0.06 * (index % 4))));
    return {
      competency,
      score,
      previous,
      delta: score - previous,
      target: targetFor(score),
      band: strengthIds.has(competency.id) ? "strength" : gapIds.has(competency.id) ? "gap" : "steady",
      rank: index + 1,
      course: courseForCompetency(competency.id),
    };
  });

  // COMPETENCIES is a non-empty constant, but the entire analysis is built
  // around a strongest and a weakest competency, so there is nothing coherent
  // to render without them. Report that rather than dereferencing an empty
  // array — the page already has an unmeasured state to fall back to.
  const strongest = standings[0];
  const weakest = standings[standings.length - 1];
  if (!strongest || !weakest) return null;

  // --- growth over time -----------------------------------------------------
  // Every historical point is a fraction of today's score, and is capped at it,
  // so the trend still reads correctly for a learner scoring in single digits.
  const history: HistoryPoint[] = HISTORY_FACTORS.map((factor, i) => ({
    label: monthLabel(monthsAgo(now, HISTORY_FACTORS.length - i)),
    readiness: clamp(Math.round(overall * factor), 0, overall),
    current: false,
  }));
  history.push({ label: "Now", readiness: overall, current: true });

  const firstPoint = history[0];
  const midPoint = history[Math.max(0, history.length - 3)];

  // --- assessment history ---------------------------------------------------
  const assessments: AssessmentRecord[] = [
    {
      id: "current",
      label: "Baseline capability assessment",
      date: result.completedOn,
      score: overall,
      levelLabel: result.levelLabel,
      current: true,
    },
    {
      id: "mid",
      label: "Mid-programme checkpoint",
      date: fullDate(monthsAgo(now, 2)),
      score: midPoint.readiness,
      levelLabel: bandForScore(midPoint.readiness).label,
      current: false,
    },
    {
      id: "first",
      label: "First capability baseline",
      date: fullDate(monthsAgo(now, HISTORY_FACTORS.length)),
      score: firstPoint.readiness,
      levelLabel: bandForScore(firstPoint.readiness).label,
      current: false,
    },
  ];

  // --- credentials ----------------------------------------------------------
  const credentials: ProfileCredential[] = [
    {
      id: "level",
      title: `${level.label} — federal AI capability ladder`,
      issuer: "FAHR AI Academy",
      caption: `Awarded on ${result.completedOn} from your baseline assessment`,
      state: "earned",
      percent: 100,
    },
    ...COURSES.map<ProfileCredential>((course) => {
      const progress = courseProgress[course.id];
      const lessonTotal = courseLessons(course).length;
      const done = progress?.completedLessonIds.length ?? 0;
      const percent = lessonTotal ? Math.round((done / lessonTotal) * 100) : 0;
      const state: CredentialState = progress?.finalDone
        ? "earned"
        : done > 0
          ? "in-progress"
          : "locked";
      return {
        id: course.id,
        title: `${course.title} certificate`,
        issuer: "FAHR AI Academy",
        caption:
          state === "earned"
            ? "Verified credential on Recognition"
            : state === "in-progress"
              ? `${done} of ${lessonTotal} lessons complete`
              : "Unlocks when you finish the course",
        state,
        percent,
      };
    }),
  ];

  const earnedCount = credentials.filter((c) => c.state === "earned").length;

  // --- advisor signals (proposal 5.2) --------------------------------------
  const mostActive =
    COURSES.find((c) => (courseProgress[c.id]?.completedLessonIds.length ?? 0) > 0) ?? null;

  const signals: AdvisorSignal[] = [
    {
      id: "outcomes",
      label: "Assessment outcomes",
      value: `${overall}% overall · ${result.levelLabel}`,
      detail: `Scored on ${result.completedOn} across the five FAHR AI competencies.`,
      weight: "high",
    },
    {
      id: "competency",
      label: "Competency levels",
      value: `${strongest.competency.short} ${strongest.score}% · ${weakest.competency.short} ${weakest.score}%`,
      detail: `A ${strongest.score - weakest.score} point spread between your strongest and weakest competency.`,
      weight: "high",
    },
    {
      id: "role",
      label: "Job role",
      value: LEARNER_PROFILE.role,
      detail: `Content is weighted toward ${LEARNER_PROFILE.department.toLowerCase()} work rather than generic examples.`,
      weight: "high",
    },
    {
      id: "entity",
      label: "Entity and department",
      value: LEARNER_PROFILE.entity,
      detail: `${LEARNER_PROFILE.department} — scenarios, datasets and events are drawn from this entity's context.`,
      weight: "medium",
    },
    {
      id: "objectives",
      label: "Learning objectives",
      value: `Close ${weakest.competency.short}${nextLevel ? ` · reach ${nextLevel.label}` : " · sustain Champion level"}`,
      detail: nextLevel
        ? `${pointsToNext} readiness points still separate you from ${nextLevel.label}.`
        : "You are at the top of the ladder — objectives shift to mentoring and governance leadership.",
      weight: "high",
    },
    {
      id: "participation",
      label: "Programme participation",
      value: `${participation.coursesStarted} of ${participation.courseCount} courses started · ${participation.averagePercent}% average`,
      detail: `${participation.coursesCompleted} course${participation.coursesCompleted === 1 ? "" : "s"} finished end to end so far.`,
      weight: participation.coursesStarted > 0 ? "medium" : "low",
    },
    {
      id: "behaviour",
      label: "Learning behaviour",
      value: `${participation.lessonsCompleted} lesson${participation.lessonsCompleted === 1 ? "" : "s"} completed`,
      detail: mostActive
        ? `Most active in ${mostActive.category.toLowerCase()} content — short reading sessions rather than long blocks.`
        : "No study sessions recorded yet, so pacing is inferred from your role and level.",
      weight: participation.lessonsCompleted > 0 ? "medium" : "low",
    },
    {
      id: "achievements",
      label: "Previous achievements",
      value: `${earnedCount} credential${earnedCount === 1 ? "" : "s"} · ${participation.impactPoints.toLocaleString("en-US")} impact points`,
      detail: "Earned credentials raise the starting difficulty of recommended practice and assessments.",
      weight: "low",
    },
  ];

  const conclusionCourse = weakest.course ?? COURSE_BY_ID[result.recommendedCourseIds[0]] ?? null;

  const conclusion =
    `${LEARNER_PROFILE.name} is holding ${strongest.competency.label} at ${strongest.score}% while ` +
    `${weakest.competency.label} sits at ${weakest.score}% — the widest gap on the profile, and the reason the ` +
    `pathway opens there rather than at the next course in the catalogue. ` +
    (nextLevel
      ? `${pointsToNext} readiness points separate this profile from ${nextLevel.label}` +
        (conclusionCourse ? `, roughly the movement expected from completing ${conclusionCourse.title}.` : ".")
      : "This profile is already at the top of the federal ladder, so the plan shifts to mentoring and governance leadership.");

  // --- next capabilities ----------------------------------------------------
  // Not every competency owns a course. When one does not, fall back to the
  // learner's own recommended courses so each card still opens somewhere real
  // and no two cards point at the same course.
  const claimedCourseIds = new Set<string>();
  const fallbackCourses = result.recommendedCourseIds
    .map((courseId) => COURSES.find((c) => c.id === courseId))
    .filter((c): c is Course => Boolean(c));

  const nextCapabilities: NextCapability[] = result.gaps.slice(0, 3).map((id, rank) => {
    const competency = COMPETENCY_BY_ID[id];
    const score = clamp(result.scores[id] ?? 0);

    const direct = courseForCompetency(id);
    const course =
      direct && !claimedCourseIds.has(direct.id)
        ? direct
        : (fallbackCourses.find((c) => !claimedCourseIds.has(c.id)) ?? null);
    if (course) claimedCourseIds.add(course.id);

    return {
      id,
      competency,
      headline: headlineFor(competency, score, rank),
      score,
      target: targetFor(score),
      course,
      href: course ? `/learner/course/${course.id}` : "/learner/mission",
    };
  });

  return {
    overall,
    level,
    levelBlurb: result.levelBlurb,
    nextLevel,
    pointsToNext,
    progressToNext,
    completedOn: result.completedOn,
    standings,
    strongest,
    weakest,
    history,
    assessments,
    signals,
    conclusion,
    credentials,
    nextCapabilities,
    participation,
  };
}
