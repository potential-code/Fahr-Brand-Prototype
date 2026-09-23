// A low post-assessment has to visibly change the course: two revision units
// appear and the final assessment closes until they are done.
import { describe, it, expect } from "vitest";
import { renderHook, act, screen, fireEvent } from "@testing-library/react";
import { LearnerProgressProvider, useLearnerProgress } from "@/lib/LearnerProgressContext";
import { COURSE_BY_ID, courseLessons } from "@/lib/learningData";
import { AGENTS } from "@/lib/constants";
import { renderScreen } from "./providers";
import CoursePlayer from "@/pages/CoursePlayer";

const COURSE_ID = "ai-governance";
const course = COURSE_BY_ID[COURSE_ID];

function useProgress() {
  return renderHook(() => useLearnerProgress(), { wrapper: LearnerProgressProvider });
}

describe("post-assessment remediation", () => {
  it("opens no revision by default", () => {
    const { result } = useProgress();
    expect(result.current.remediation[COURSE_ID]).toBeUndefined();
    expect(result.current.revisionDone(COURSE_ID)).toBe(false);
  });

  it("records the competency and the score that opened it", () => {
    const { result } = useProgress();
    act(() => result.current.openRemediation(COURSE_ID, "governance", 1));

    expect(result.current.remediation[COURSE_ID]).toMatchObject({
      competencyId: "governance",
      lastScore: 1,
    });
  });

  it("is idempotent — a second failure does not overwrite the first", () => {
    const { result } = useProgress();
    act(() => result.current.openRemediation(COURSE_ID, "governance", 1));
    const first = result.current.remediation[COURSE_ID];
    act(() => result.current.openRemediation(COURSE_ID, "governance", 0));

    expect(result.current.remediation[COURSE_ID]).toBe(first);
  });

  it("stays incomplete until every revision unit is done", () => {
    const { result } = useProgress();
    const units = COURSE_BY_ID[COURSE_ID].revisionUnits;
    expect(units).toHaveLength(2);

    act(() => result.current.openRemediation(COURSE_ID, "governance", 1));
    act(() => result.current.toggleLessonComplete(COURSE_ID, units[0].id));
    expect(result.current.revisionDone(COURSE_ID)).toBe(false);

    act(() => result.current.toggleLessonComplete(COURSE_ID, units[1].id));
    expect(result.current.revisionDone(COURSE_ID)).toBe(true);
  });
});

/**
 * Writes straight into the sessionStorage key `LearnerProgressContext`
 * reads on mount (`STORAGE_KEY` in `src/lib/LearnerProgressContext.tsx`,
 * not exported — keep this literal in sync with it). This is exactly what a
 * page reload with existing progress looks like, and it lets a page-level
 * test start a learner partway through a course without a slow, brittle
 * click-through of the pretest and every lesson.
 *
 * Deliberately writes the whole `State` shape (not a merge) so each call
 * fully replaces whatever an earlier test in this file left behind.
 */
function seedProgress(
  courseId: string,
  opts: {
    completedLessonIds: string[];
    pretestDone: boolean;
    remediation?: { competencyId: string; lastScore: number };
  },
) {
  const state = {
    answers: {},
    result: null,
    courseProgress: {
      [courseId]: {
        completedLessonIds: opts.completedLessonIds,
        pretestDone: opts.pretestDone,
        finalDone: false,
      },
    },
    completedActivityIds: [],
    adaptiveUnlocked: false,
    remediation: opts.remediation
      ? { [courseId]: { ...opts.remediation, addedAt: new Date().toISOString() } }
      : {},
  };
  window.sessionStorage.setItem("fahr.learner.progress.v1", JSON.stringify(state));
}

describe("CoursePlayer's remediation-lock panel", () => {
  it("shows the failing score, attributes it to the Content Agent, and opens the first revision unit — on a real failing attempt", async () => {
    window.sessionStorage.clear();
    // Pretest and every original lesson already done, no remediation yet:
    // the learner lands straight on the (unlocked) final assessment.
    seedProgress(COURSE_ID, {
      completedLessonIds: courseLessons(course).map((l) => l.id),
      pretestDone: true,
    });

    renderScreen(<CoursePlayer />, `/learner/course/${COURSE_ID}`);

    // Answer every question with its wrong option — a real failing attempt
    // driven through the same StepQuiz UI a learner uses, so this exercises
    // the exact onAttempt -> openRemediation -> re-render sequence the fix
    // targets, not a re-derivation of it. Each option button is awaited
    // because StepQuiz advances questions inside an AnimatePresence with
    // mode="wait", which mounts the next question only once the previous
    // one's exit animation settles.
    for (const q of course.finalAssessment.questions) {
      const wrongIndex = q.correctIndex === 0 ? 1 : 0;
      const option = await screen.findByTestId(`quiz-${q.id}-${wrongIndex}`);
      fireEvent.click(option);
      fireEvent.click(screen.getByTestId("button-check-answer"));
      fireEvent.click(screen.getByTestId("button-next-question"));
    }

    const panel = await screen.findByTestId("final-locked-remediation");
    const failingScore = 0; // every question above was answered wrong
    expect(panel.textContent).toContain(`${failingScore} of ${course.finalAssessment.questions.length}`);
    expect(panel.textContent).toContain(AGENTS.content);

    fireEvent.click(screen.getByTestId("button-start-revision"));

    // The content pane's own AnimatePresence (mode="wait") also delays the
    // new lesson's mount past the click, same reasoning as above — poll for
    // this specific heading rather than "any h2", which the outgoing locked
    // panel's own heading would satisfy immediately.
    const heading = await screen.findByRole("heading", {
      level: 2,
      name: course.revisionUnits[0].title,
    });
    expect(heading.textContent).toBe(course.revisionUnits[0].title);
  });

  it("does not show once the revision units are already complete", () => {
    window.sessionStorage.clear();
    seedProgress(COURSE_ID, {
      completedLessonIds: [
        ...courseLessons(course).map((l) => l.id),
        ...course.revisionUnits.map((l) => l.id),
      ],
      pretestDone: true,
      remediation: { competencyId: course.competencyId, lastScore: 1 },
    });

    renderScreen(<CoursePlayer />, `/learner/course/${COURSE_ID}`);

    expect(screen.queryByTestId("final-locked-remediation")).toBeNull();
    // The ordinary final assessment renders instead.
    expect(screen.getByTestId("quiz-step")).toBeTruthy();
  });
});
