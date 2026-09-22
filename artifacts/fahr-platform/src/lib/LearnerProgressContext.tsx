import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  ASSESSMENT_QUESTIONS,
  COMPETENCIES,
  COMPETENCY_BY_ID,
  COURSES,
  COURSE_BY_ID,
  bandForScore,
  courseLessons,
  courseStepCount,
} from "@/lib/learningData";

export type AssessmentResult = {
  overall: number;
  levelId: string;
  levelLabel: string;
  levelBlurb: string;
  /** competencyId -> 0-100 */
  scores: Record<string, number>;
  strengths: string[];
  gaps: string[];
  /** Course ids ordered by how much the learner needs them. */
  recommendedCourseIds: string[];
  completedOn: string;
};

export type CourseProgress = {
  completedLessonIds: string[];
  pretestDone: boolean;
  finalDone: boolean;
};

export type Remediation = {
  /** The competency the low post-assessment identified as weakest. */
  competencyId: string;
  /** Score on the attempt that opened it, for the banner to quote. */
  lastScore: number;
  addedAt: string;
};

type State = {
  answers: Record<string, number>;
  result: AssessmentResult | null;
  courseProgress: Record<string, CourseProgress>;
  /** Pathway activities (everything that is not a catalogue course) completed. */
  completedActivityIds: string[];
  /** True once the role-play has caused the pathway to insert its extra module. */
  adaptiveUnlocked: boolean;
  /** Courses where a low post-assessment opened a revision group, keyed by course id. */
  remediation: Record<string, Remediation | undefined>;
};

type Ctx = State & {
  setAnswer: (questionId: string, optionIndex: number) => void;
  completeAssessment: () => AssessmentResult;
  resetAssessment: () => void;
  getCourseProgress: (courseId: string) => CourseProgress;
  getCoursePercent: (courseId: string) => number;
  toggleLessonComplete: (courseId: string, lessonId: string) => void;
  setPretestDone: (courseId: string) => void;
  setFinalDone: (courseId: string) => void;
  /** Idempotent: completing the same activity twice changes nothing. */
  completeActivity: (activityId: string) => void;
  unlockAdaptiveItem: () => void;
  /** Record a low post-assessment and open the revision units for that course. */
  openRemediation: (courseId: string, competencyId: string, lastScore: number) => void;
  /** True when a course has remediation open and both revision units are complete. */
  revisionDone: (courseId: string) => boolean;
};

const STORAGE_KEY = "fahr.learner.progress.v1";

const EMPTY_COURSE: CourseProgress = { completedLessonIds: [], pretestDone: false, finalDone: false };

/** Seeded so the demo opens with one course already part-way through. */
const SEED_COURSE_PROGRESS: Record<string, CourseProgress> = {
  "ai-foundations": { completedLessonIds: ["l1", "l2", "l3"], pretestDone: false, finalDone: false },
};

const INITIAL_STATE: State = {
  answers: {},
  result: null,
  courseProgress: SEED_COURSE_PROGRESS,
  completedActivityIds: [],
  adaptiveUnlocked: false,
  remediation: {},
};

function readStored(): State {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return INITIAL_STATE;
    return {
      answers: sanitizeAnswers(parsed.answers),
      result: sanitizeResult(parsed.result),
      courseProgress: sanitizeCourseProgress(parsed.courseProgress),
      completedActivityIds: sanitizeActivityIds(parsed.completedActivityIds),
      adaptiveUnlocked: parsed.adaptiveUnlocked === true,
      remediation: sanitizeRemediation(parsed.remediation),
    };
  } catch {
    return INITIAL_STATE;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Activity ids are authored strings rather than a fixed catalogue, so the guard
 * is shape-only: strings, deduplicated, and capped so a corrupted store cannot
 * grow without bound.
 */
function sanitizeActivityIds(v: unknown): string[] {
  if (!isStringArray(v)) return [];
  return Array.from(new Set(v.filter((id) => id.length > 0 && id.length <= 64))).slice(0, 64);
}

/** Keep only answers that name a real question and a real option index. */
function sanitizeAnswers(v: unknown): Record<string, number> {
  if (!isRecord(v)) return {};
  const out: Record<string, number> = {};
  for (const q of ASSESSMENT_QUESTIONS) {
    const idx = v[q.id];
    if (typeof idx === "number" && Number.isInteger(idx) && idx >= 0 && idx < q.options.length) {
      out[q.id] = idx;
    }
  }
  return out;
}

/**
 * A stored result is only usable if it still matches the current competency
 * and course catalogue — otherwise the report would index into missing data.
 */
function sanitizeResult(v: unknown): AssessmentResult | null {
  if (!isRecord(v)) return null;
  const { overall, levelId, levelLabel, levelBlurb, completedOn, scores, strengths, gaps, recommendedCourseIds } = v;
  if (typeof overall !== "number" || !Number.isFinite(overall)) return null;
  if (typeof levelId !== "string" || typeof levelLabel !== "string") return null;
  if (typeof levelBlurb !== "string" || typeof completedOn !== "string") return null;
  if (!isRecord(scores)) return null;
  if (!isStringArray(strengths) || !isStringArray(gaps) || !isStringArray(recommendedCourseIds)) return null;

  const validStrengths = strengths.filter((id) => id in COMPETENCY_BY_ID);
  const validGaps = gaps.filter((id) => id in COMPETENCY_BY_ID);
  const validCourses = recommendedCourseIds.filter((id) => id in COURSE_BY_ID);
  if (validGaps.length === 0 || validStrengths.length === 0 || validCourses.length === 0) return null;

  const safeScores: Record<string, number> = {};
  for (const c of COMPETENCIES) {
    const s = scores[c.id];
    safeScores[c.id] = typeof s === "number" && Number.isFinite(s) ? Math.max(0, Math.min(100, Math.round(s))) : 0;
  }

  return {
    overall: Math.max(0, Math.min(100, Math.round(overall))),
    levelId,
    levelLabel,
    levelBlurb,
    completedOn,
    scores: safeScores,
    strengths: validStrengths,
    gaps: validGaps,
    recommendedCourseIds: validCourses,
  };
}

function sanitizeCourseProgress(v: unknown): Record<string, CourseProgress> {
  if (!isRecord(v)) return SEED_COURSE_PROGRESS;
  const out: Record<string, CourseProgress> = {};
  for (const [courseId, raw] of Object.entries(v)) {
    const course = COURSE_BY_ID[courseId];
    if (!course || !isRecord(raw)) continue;
    const lessonIds = new Set(
      [...courseLessons(course), ...course.revisionUnits].map((l) => l.id),
    );
    out[courseId] = {
      completedLessonIds: isStringArray(raw.completedLessonIds)
        ? raw.completedLessonIds.filter((id) => lessonIds.has(id))
        : [],
      pretestDone: raw.pretestDone === true,
      finalDone: raw.finalDone === true,
    };
  }
  return out;
}

/**
 * Keep only entries for courses that still exist, with the shape a
 * `Remediation` requires — otherwise a stale or corrupted store could open a
 * revision group for a course the current catalogue does not have.
 */
function sanitizeRemediation(v: unknown): Record<string, Remediation | undefined> {
  if (!isRecord(v)) return {};
  const out: Record<string, Remediation | undefined> = {};
  for (const [courseId, raw] of Object.entries(v)) {
    if (!(courseId in COURSE_BY_ID) || !isRecord(raw)) continue;
    const { competencyId, lastScore, addedAt } = raw;
    if (typeof competencyId !== "string" || !(competencyId in COMPETENCY_BY_ID)) continue;
    if (typeof lastScore !== "number" || !Number.isFinite(lastScore)) continue;
    if (typeof addedAt !== "string") continue;
    out[courseId] = { competencyId, lastScore: Math.max(0, Math.min(100, Math.round(lastScore))), addedAt };
  }
  return out;
}

function writeStored(state: State) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the demo still works in memory */
  }
}

const LearnerProgressContext = createContext<Ctx | null>(null);

export function LearnerProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<State>(readStored);

  /** Single write path so session storage never drifts from React state. */
  const update = useCallback((patch: (prev: State) => State) => {
    setStateRaw((prev) => {
      const next = patch(prev);
      writeStored(next);
      return next;
    });
  }, []);

  const setAnswer = useCallback(
    (questionId: string, optionIndex: number) =>
      update((prev) => ({ ...prev, answers: { ...prev.answers, [questionId]: optionIndex } })),
    [update],
  );

  const scoreAnswers = useCallback((answers: Record<string, number>): AssessmentResult => {
    // Per-competency score: mean of the chosen option scores, normalised to 0-100.
    const buckets: Record<string, number[]> = {};
    for (const q of ASSESSMENT_QUESTIONS) {
      const idx = answers[q.id];
      const score = idx === undefined ? 0 : q.options[idx].score;
      (buckets[q.competencyId] ??= []).push(score);
    }

    const scores: Record<string, number> = {};
    for (const c of COMPETENCIES) {
      const vals = buckets[c.id] ?? [0];
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      scores[c.id] = Math.round((mean / 3) * 100);
    }

    const overall = Math.round(COMPETENCIES.reduce((sum, c) => sum + scores[c.id], 0) / COMPETENCIES.length);
    const band = bandForScore(overall);

    const ranked = [...COMPETENCIES].sort((a, b) => scores[b.id] - scores[a.id]);

    return {
      overall,
      levelId: band.id,
      levelLabel: band.label,
      levelBlurb: band.blurb,
      scores,
      strengths: ranked.slice(0, 2).map((c) => c.id),
      gaps: ranked.slice(-3).reverse().map((c) => c.id),
      // Every course is recommended; the weakest mapped competency comes first.
      recommendedCourseIds: [...COURSES]
        .sort((a, b) => (scores[a.competencyId] ?? 0) - (scores[b.competencyId] ?? 0))
        .map((c) => c.id),
      completedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    };
  }, []);

  const completeAssessment = useCallback((): AssessmentResult => {
    const computed = scoreAnswers(state.answers);
    update((prev) => ({ ...prev, result: computed }));
    return computed;
  }, [scoreAnswers, state.answers, update]);

  // Retaking rebuilds the whole pathway, so activity completion and the
  // adaptive insertion go with the old result rather than surviving it.
  const resetAssessment = useCallback(
    () =>
      update((prev) => ({
        ...prev,
        answers: {},
        result: null,
        completedActivityIds: [],
        adaptiveUnlocked: false,
      })),
    [update],
  );

  const completeActivity = useCallback(
    (activityId: string) =>
      update((prev) =>
        prev.completedActivityIds.includes(activityId)
          ? prev
          : { ...prev, completedActivityIds: [...prev.completedActivityIds, activityId] },
      ),
    [update],
  );

  const unlockAdaptiveItem = useCallback(
    () => update((prev) => (prev.adaptiveUnlocked ? prev : { ...prev, adaptiveUnlocked: true })),
    [update],
  );

  const openRemediation = useCallback(
    (courseId: string, competencyId: string, lastScore: number) =>
      update((prev) =>
        prev.remediation[courseId]
          ? prev
          : {
              ...prev,
              remediation: {
                ...prev.remediation,
                [courseId]: { competencyId, lastScore, addedAt: new Date().toISOString() },
              },
            },
      ),
    [update],
  );

  const getCourseProgress = useCallback(
    (courseId: string) => state.courseProgress[courseId] ?? EMPTY_COURSE,
    [state.courseProgress],
  );

  const getCoursePercent = useCallback(
    (courseId: string) => {
      const course = COURSE_BY_ID[courseId];
      if (!course) return 0;
      const p = state.courseProgress[courseId] ?? EMPTY_COURSE;
      const done = p.completedLessonIds.length + (p.finalDone ? 1 : 0);
      return Math.min(100, Math.round((done / courseStepCount(course)) * 100));
    },
    [state.courseProgress],
  );

  const revisionDone = useCallback(
    (courseId: string) => {
      if (!state.remediation[courseId]) return false;
      const course = COURSE_BY_ID[courseId];
      if (!course) return false;
      const done = getCourseProgress(courseId).completedLessonIds;
      return course.revisionUnits.every((unit) => done.includes(unit.id));
    },
    [state.remediation, getCourseProgress],
  );

  const updateCourse = useCallback(
    (courseId: string, patch: (p: CourseProgress) => CourseProgress) =>
      update((prev) => ({
        ...prev,
        courseProgress: {
          ...prev.courseProgress,
          [courseId]: patch(prev.courseProgress[courseId] ?? EMPTY_COURSE),
        },
      })),
    [update],
  );

  const toggleLessonComplete = useCallback(
    (courseId: string, lessonId: string) =>
      updateCourse(courseId, (p) => ({
        ...p,
        completedLessonIds: p.completedLessonIds.includes(lessonId)
          ? p.completedLessonIds.filter((id) => id !== lessonId)
          : [...p.completedLessonIds, lessonId],
      })),
    [updateCourse],
  );

  const setPretestDone = useCallback(
    (courseId: string) => updateCourse(courseId, (p) => ({ ...p, pretestDone: true })),
    [updateCourse],
  );

  const setFinalDone = useCallback(
    (courseId: string) => updateCourse(courseId, (p) => ({ ...p, finalDone: true })),
    [updateCourse],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setAnswer,
      completeAssessment,
      resetAssessment,
      getCourseProgress,
      getCoursePercent,
      toggleLessonComplete,
      setPretestDone,
      setFinalDone,
      completeActivity,
      unlockAdaptiveItem,
      openRemediation,
      revisionDone,
    }),
    [
      state,
      setAnswer,
      completeAssessment,
      resetAssessment,
      getCourseProgress,
      getCoursePercent,
      toggleLessonComplete,
      setPretestDone,
      setFinalDone,
      completeActivity,
      unlockAdaptiveItem,
      openRemediation,
      revisionDone,
    ],
  );

  return <LearnerProgressContext.Provider value={value}>{children}</LearnerProgressContext.Provider>;
}

export function useLearnerProgress(): Ctx {
  const ctx = useContext(LearnerProgressContext);
  if (!ctx) throw new Error("useLearnerProgress must be used inside LearnerProgressProvider");
  return ctx;
}
