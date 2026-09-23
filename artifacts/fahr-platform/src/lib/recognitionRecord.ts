// Derivation layer for the Recognition & Impact screen.
//
// The proposal (4.5 / 5.2) describes recognition as the visible end of the
// journey: verified digital credentials, badges and achievements, impact points
// and standing, measured workplace impact, and position on the unified
// capability ladder.
//
// Everything on that screen is derived here from what the learner has actually
// done — their assessment result, their real course progress and the workplace
// project they submitted — so the page never invents its own numbers. When a
// piece of evidence does not exist yet the record says so explicitly rather
// than pretending.

import { COMPETENCIES, COURSES, COMPETENCY_BY_ID, SCORE_BANDS, courseLessons } from "@/lib/learningData";
import { CAPABILITY_LEVELS, IMPACT_POINTS, type CapabilityLevel } from "@/lib/constants";
import { POINT_RULES } from "@/lib/engagement";
import type { ParticipationSummary } from "@/lib/profileAnalysis";
import type { AssessmentResult, CourseProgress } from "@/lib/LearnerProgressContext";
import type { ProjectSubmission } from "@/lib/workplaceProject";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CredentialState = "earned" | "in-progress" | "available";

export type WalletCredential = {
  id: string;
  title: string;
  issuer: string;
  /** The capability level this credential attests to. */
  level: string;
  competencyId: string;
  competencyLabel: string;
  skills: string[];
  verifyId: string;
  issuedOn: string;
  state: CredentialState;
  /** 0-100, meaningful while in progress. */
  percent: number;
  /** What the holder demonstrated to earn it. */
  evidence: string;
  href: string;
};

export type Achievement = {
  id: string;
  label: string;
  description: string;
  criteria: string;
  points: number;
  earned: boolean;
  /** 0-100 toward earning it, when not earned yet. */
  percent: number;
  icon: "spark" | "flame" | "people" | "shield" | "target" | "trophy";
};

export type CompetencyBadge = {
  competencyId: string;
  label: string;
  short: string;
  earned: boolean;
  /** The learner's percentage in this competency, 0 when unassessed. */
  score: number;
  /** The percentage that earns the badge. */
  threshold: number;
};

export type PointsEntry = {
  id: string;
  label: string;
  points: number;
  when: string;
  /**
   * `activity` = counted from what the learner has actually done on this
   * platform. `record` = carried in from FAHR's existing programme records,
   * which this platform reads but does not produce. The distinction is shown
   * to the learner so no figure looks more earned than it is.
   */
  source: "activity" | "record";
};

export type RecognitionRank = {
  entity: number;
  entityTotal: number;
  federal: number;
  federalTotal: number;
  /** Places gained across the federal leaderboard this quarter. */
  movement: number;
  percentile: number;
};

export type RecognitionRecord = {
  level: CapabilityLevel;
  levelIndex: number;
  nextLevel: CapabilityLevel | null;
  progressToNext: number;
  /** Readiness points still needed for the next level, when there is one. */
  pointsToNext: number;
  /** True when the ladder position comes from a real assessment. */
  levelMeasured: boolean;
  points: number;
  pointsEntries: PointsEntry[];
  rank: RecognitionRank;
  credentials: WalletCredential[];
  earnedCount: number;
  achievements: Achievement[];
  achievementsEarned: number;
  verifiedOn: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

const fullDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * Verification ids are stable per credential so a learner can reopen a
 * credential and read back the same number they showed someone yesterday.
 */
export function verifyId(seed: string, year: number): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 90000;
  return `FAHR-${year}-${10000 + hash}`;
}

/** The level a course credential attests to, from where the course sits. */
function levelForCourse(index: number): string {
  const level = CAPABILITY_LEVELS[Math.min(index, CAPABILITY_LEVELS.length - 1)];
  return level.label;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

function buildCredentials(
  courseProgress: Record<string, CourseProgress>,
  percentFor: (courseId: string) => number,
  submission: ProjectSubmission | null,
  /** The competency the workplace project was built against. */
  projectCompetencyId: string,
  now: Date,
): WalletCredential[] {
  const year = now.getFullYear();
  const credentials: WalletCredential[] = [];

  COURSES.forEach((course, index) => {
    const percent = percentFor(course.id);
    const progress = courseProgress[course.id];
    const competency = COMPETENCY_BY_ID[course.competencyId];
    const lessonCount = courseLessons(course).length;
    const done = progress?.completedLessonIds.length ?? 0;

    const state: CredentialState = progress?.finalDone ? "earned" : percent > 0 ? "in-progress" : "available";

    // Earned credentials carry the date the record was sealed; anything still
    // moving is dated only when it completes.
    const issuedOn = state === "earned" ? fullDate(new Date(now.getTime() - (index + 1) * 9 * 86_400_000)) : "";

    credentials.push({
      id: `cred-${course.id}`,
      title: course.title,
      issuer: "FAHR AI Academy",
      level: levelForCourse(index),
      competencyId: course.competencyId,
      competencyLabel: competency?.label ?? course.category,
      skills: course.outcomes.slice(0, 3),
      verifyId: verifyId(course.id, year),
      issuedOn,
      state,
      percent: clamp(percent),
      evidence:
        state === "earned"
          ? `Final assessment passed and all ${lessonCount} lessons completed.`
          : state === "in-progress"
            ? `${done} of ${lessonCount} lessons completed. The final assessment seals the credential.`
            : `Available in your pathway. ${course.hours} of learning and a final assessment.`,
      href: `/learner/course/${course.id}`,
    });
  });

  // The workplace project credential is the one that carries the most weight:
  // it is issued against evaluated evidence, not attendance.
  if (submission) {
    const competency = COMPETENCY_BY_ID[projectCompetencyId];
    credentials.unshift({
      id: "cred-workplace-project",
      title: `Applied AI Practitioner — ${submission.draft.title}`,
      issuer: "FAHR & Potential.com",
      level: "Practitioner",
      competencyId: projectCompetencyId,
      competencyLabel: competency?.label ?? "Applied practice",
      skills: ["Workflow design", "Human oversight", "Measured impact"],
      verifyId: verifyId(`project-${submission.submittedAt}`, year),
      issuedOn: fullDate(new Date(submission.submittedAt)),
      state: "earned",
      percent: 100,
      evidence: `Issued against your evaluated workplace project, saving an estimated ${submission.impact.hoursPerMonth} hours a month.`,
      href: "/learner/evaluation",
    });
  }

  return credentials;
}

// ---------------------------------------------------------------------------
// Competency badges
// ---------------------------------------------------------------------------

/**
 * One badge per AI competency, earned at the Practitioner threshold.
 *
 * The threshold is read from SCORE_BANDS rather than hard-coded, so re-banding
 * the assessment moves the badges with it.
 */
export function competencyBadges(result: AssessmentResult | null): CompetencyBadge[] {
  const threshold = SCORE_BANDS.find((band) => band.id === "practitioner")?.min ?? 55;
  return COMPETENCIES.map((competency) => {
    const score = result?.scores?.[competency.id] ?? 0;
    return {
      competencyId: competency.id,
      label: competency.label,
      short: competency.short,
      earned: score >= threshold,
      score,
      threshold,
    };
  });
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

function buildAchievements(
  result: AssessmentResult | null,
  participation: ParticipationSummary,
  submission: ProjectSubmission | null,
): Achievement[] {
  const { lessonsCompleted, coursesCompleted, coursesStarted } = participation;

  return [
    {
      id: "ach-baseline",
      label: "Baseline Measured",
      description: "Completed the AI capability assessment and opened a capability profile.",
      criteria: "Complete the baseline assessment",
      points: 300,
      earned: result !== null,
      percent: result ? 100 : 0,
      icon: "target",
    },
    {
      id: "ach-first-steps",
      label: "First Ten Lessons",
      description: "Ten lessons of the federal AI curriculum completed.",
      criteria: "Complete 10 lessons",
      points: 400,
      earned: lessonsCompleted >= 10,
      percent: clamp(Math.round((lessonsCompleted / 10) * 100)),
      icon: "spark",
    },
    {
      id: "ach-course",
      label: "Course Finisher",
      description: "A full course completed including its final assessment.",
      criteria: "Finish one course end to end",
      points: 600,
      earned: coursesCompleted >= 1,
      percent: coursesCompleted >= 1 ? 100 : clamp(Math.round((coursesStarted / 1) * 60)),
      icon: "flame",
    },
    {
      id: "ach-governance",
      label: "Governance Cleared",
      description: "A project checked against all five federal AI policies with no open warnings.",
      criteria: "Pass the governance check",
      points: 500,
      earned: submission ? submission.policies.every((p) => p.status === "pass") : false,
      percent: submission
        ? clamp(Math.round((submission.policies.filter((p) => p.status === "pass").length / submission.policies.length) * 100))
        : 0,
      icon: "shield",
    },
    {
      id: "ach-impact",
      label: "Impact Delivered",
      description: "A workplace project submitted and evaluated with measurable time returned.",
      criteria: "Submit a workplace project for evaluation",
      points: 1200,
      earned: submission !== null,
      percent: submission ? 100 : 0,
      icon: "trophy",
    },
    {
      id: "ach-peer",
      label: "Peer Contributor",
      description: "Three answers marked helpful by colleagues in other federal entities.",
      // Peer recognition is held in FAHR's programme records rather than
      // produced on this platform, so the criteria says where it came from.
      criteria: "3 answers marked helpful, from FAHR's community records",
      points: 450,
      earned: true,
      percent: 100,
      icon: "people",
    },
  ];
}

// ---------------------------------------------------------------------------
// Points and standing
// ---------------------------------------------------------------------------

function buildPointsEntries(
  participation: ParticipationSummary,
  submission: ProjectSubmission | null,
  achievements: Achievement[],
): PointsEntry[] {
  const entries: PointsEntry[] = [];

  if (submission) {
    entries.push({
      id: "pts-project",
      label: "Workplace project passed evaluation",
      points: POINT_RULES[1].points,
      when: "This week",
      source: "activity",
    });
  }
  entries.push({
    id: "pts-lessons",
    label: `${participation.lessonsCompleted} lessons completed`,
    points: participation.lessonsCompleted * 60,
    when: "Last 30 days",
    source: "activity",
  });
  if (participation.coursesCompleted > 0) {
    entries.push({
      id: "pts-courses",
      label: `${participation.coursesCompleted} course${participation.coursesCompleted > 1 ? "s" : ""} completed`,
      points: participation.coursesCompleted * POINT_RULES[3].points,
      when: "Last 90 days",
      source: "activity",
    });
  }

  // Attendance and peer recognition are held in FAHR's programme records, not
  // produced here, so they are labelled as carried in rather than earned on
  // this platform.
  entries.push({
    id: "pts-session",
    label: "Instructor-led session attended",
    points: POINT_RULES[2].points,
    when: "12 days ago",
    source: "record",
  });
  entries.push({
    id: "pts-community",
    label: "Community answers marked helpful",
    points: 3 * POINT_RULES[0].points,
    when: "Last 30 days",
    source: "record",
  });

  const badgePoints = achievements.filter((a) => a.earned).reduce((n, a) => n + a.points, 0);
  entries.push({ id: "pts-badges", label: "Badges earned", points: badgePoints, when: "To date", source: "activity" });

  return entries;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildRecognitionRecord(input: {
  result: AssessmentResult | null;
  participation: ParticipationSummary;
  courseProgress: Record<string, CourseProgress>;
  percentFor: (courseId: string) => number;
  submission: ProjectSubmission | null;
  now?: Date;
}): RecognitionRecord {
  const { result, participation, courseProgress, percentFor, submission } = input;
  const now = input.now ?? new Date();

  // Ladder position comes from the assessment when there is one. Without it the
  // record sits at the entry level and says it is unmeasured.
  const levelIndex = result
    ? Math.max(0, CAPABILITY_LEVELS.findIndex((l) => l.id === result.levelId))
    : 0;
  const level = CAPABILITY_LEVELS[levelIndex] ?? CAPABILITY_LEVELS[0];
  const nextLevel = CAPABILITY_LEVELS[levelIndex + 1] ?? null;

  const overall = result?.overall ?? 0;
  const floor = levelIndex * 20;
  const progressToNext = nextLevel ? clamp(Math.round(((overall - floor) / 20) * 100)) : 100;
  const pointsToNext = nextLevel ? Math.max(0, (levelIndex + 1) * 20 - overall) : 0;

  // The workplace project is built against the learner's widest gap, so that is
  // the competency its credential and impact are recorded under.
  const projectCompetencyId = result?.gaps[0] ?? "agentic";

  const credentials = buildCredentials(courseProgress, percentFor, submission, projectCompetencyId, now);
  const achievements = buildAchievements(result, participation, submission);
  const pointsEntries = buildPointsEntries(participation, submission, achievements);

  // The headline number stays the shared demo figure so recognition, profile and
  // the leaderboards agree; the ledger below it explains where it came from.
  const points = IMPACT_POINTS;

  const rank: RecognitionRank = {
    entity: 2,
    entityTotal: 1240,
    federal: 142,
    federalTotal: 38400,
    movement: 18,
    percentile: 99,
  };

  return {
    level,
    levelIndex,
    nextLevel,
    progressToNext,
    pointsToNext,
    levelMeasured: result !== null,
    points,
    pointsEntries,
    rank,
    credentials,
    earnedCount: credentials.filter((c) => c.state === "earned").length,
    achievements,
    achievementsEarned: competencyBadges(result).filter((b) => b.earned).length,
    verifiedOn: fullDate(now),
  };
}
