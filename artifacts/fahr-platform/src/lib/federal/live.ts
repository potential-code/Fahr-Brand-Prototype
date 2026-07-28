// Bridge from the learner journey to the federal spine.
//
// The demo is played as Aisha before anyone opens a manager or admin screen, so
// her row in those screens must show what she actually did — her real baseline
// result, her real gaps and her real course progress — not a seeded figure.

import { COURSES, COURSE_BY_ID, courseStepCount } from "@/lib/learningData";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import type { AssessmentResult } from "@/lib/LearnerProgressContext";

export type LiveCourseProgress = { courseId: string; title: string; percent: number };

export type LiveLearnerState = {
  /** False until the learner has completed the baseline assessment. */
  assessed: boolean;
  /** Overall baseline score, 0-100. */
  assessmentScore: number;
  levelId: string;
  levelLabel: string;
  /** competencyId -> 0-100, once assessed. */
  competencyScores?: Record<string, number>;
  gapCompetencyIds: string[];
  strengthCompetencyIds: string[];
  /**
   * Share of the assigned pathway completed, weighted by course length — the
   * same steps the learner ticks off in the course player.
   */
  pathwayProgress: number;
  activitiesCompleted: number;
  courses: LiveCourseProgress[];
  completedOn?: string;
};

/** Courses the learner is working through: her recommendations, or all of them. */
function pathwayCourseIds(result: AssessmentResult | null): string[] {
  const recommended = (result?.recommendedCourseIds ?? []).filter((id) => id in COURSE_BY_ID);
  return recommended.length > 0 ? recommended : COURSES.map((c) => c.id);
}

/**
 * Reads the live learner-journey state. Called with the learner progress
 * context so the derivation stays in one place instead of each admin screen
 * inventing its own definition of "progress".
 */
export function deriveLiveLearner(args: {
  result: AssessmentResult | null;
  courseProgress: Record<string, { completedLessonIds: string[]; pretestDone: boolean; finalDone: boolean }>;
  getCoursePercent: (courseId: string) => number;
}): LiveLearnerState {
  const { result, courseProgress, getCoursePercent } = args;
  const courseIds = pathwayCourseIds(result);

  const courses: LiveCourseProgress[] = courseIds.map((courseId) => ({
    courseId,
    title: COURSE_BY_ID[courseId]?.title ?? courseId,
    percent: getCoursePercent(courseId),
  }));

  // Weighted by course length so a short course cannot flatter the figure.
  const totalSteps = courseIds.reduce((sum, id) => {
    const course = COURSE_BY_ID[id];
    return sum + (course ? courseStepCount(course) : 0);
  }, 0);
  const doneSteps = courseIds.reduce((sum, id) => {
    const course = COURSE_BY_ID[id];
    if (!course) return sum;
    return sum + (getCoursePercent(id) / 100) * courseStepCount(course);
  }, 0);
  const pathwayProgress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const activitiesCompleted = COURSES.reduce((sum, course) => {
    const progress = courseProgress[course.id];
    if (!progress) return sum;
    return (
      sum + progress.completedLessonIds.length + (progress.pretestDone ? 1 : 0) + (progress.finalDone ? 1 : 0)
    );
  }, 0);

  if (!result) {
    return {
      assessed: false,
      assessmentScore: 0,
      levelId: CAPABILITY_LEVELS[0].id,
      levelLabel: "Not yet assessed",
      gapCompetencyIds: [],
      strengthCompetencyIds: [],
      pathwayProgress,
      activitiesCompleted,
      courses,
    };
  }

  return {
    assessed: true,
    assessmentScore: result.overall,
    levelId: result.levelId,
    levelLabel: result.levelLabel,
    competencyScores: result.scores,
    gapCompetencyIds: result.gaps,
    strengthCompetencyIds: result.strengths,
    pathwayProgress,
    activitiesCompleted,
    courses,
    completedOn: result.completedOn,
  };
}
