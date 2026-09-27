// A finished pretest or final assessment has to still be there after a
// reload or a return visit — the score, and which questions were right.
import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, cleanup } from "@testing-library/react";
import { COURSE_BY_ID, courseLessons } from "@/lib/learningData";
import { renderScreen } from "./providers";
import CoursePlayer from "@/pages/CoursePlayer";

const COURSE_ID = "ai-governance";
const course = COURSE_BY_ID[COURSE_ID];

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

/** Answers every question, the first `right` of them correctly. */
async function answerAll(questions: typeof course.pretest.questions, right: number) {
  for (const [i, q] of questions.entries()) {
    const pick = i < right ? q.correctIndex : q.correctIndex === 0 ? 1 : 0;
    fireEvent.click(await screen.findByTestId(`quiz-${q.id}-${pick}`));
    fireEvent.click(screen.getByTestId("button-check-answer"));
    fireEvent.click(screen.getByTestId("button-next-question"));
  }
}

describe("saved course quiz results", () => {
  it("the pretest result survives a reload", async () => {
    renderScreen(<CoursePlayer />, `/learner/course/${COURSE_ID}`);
    const total = course.pretest.questions.length;
    await answerAll(course.pretest.questions, 2);
    expect((await screen.findByTestId("quiz-summary")).textContent).toContain(`2 of ${total} correct`);

    // Reload: the page opens on the pretest again, but on its result.
    cleanup();
    renderScreen(<CoursePlayer />, `/learner/course/${COURSE_ID}`);
    const summary = await screen.findByTestId("quiz-summary");
    expect(summary.textContent).toContain(`2 of ${total} correct`);
    expect(screen.queryByTestId("quiz-step")).toBeNull();
    expect(screen.getByTestId("outline-pretest").textContent).toContain(`Scored 2 of ${total}`);
  });

  it("the passed final assessment shows its score and review once the course is complete", async () => {
    const answers = course.finalAssessment.questions.map((q) => q.correctIndex);
    window.sessionStorage.setItem(
      "fahr.learner.progress.v1",
      JSON.stringify({
        answers: {},
        result: null,
        courseProgress: {
          [COURSE_ID]: {
            completedLessonIds: courseLessons(course).map((l) => l.id),
            pretestDone: true,
            finalDone: true,
            pretestAnswers: course.pretest.questions.map(() => 0),
            finalAnswers: answers,
          },
        },
        completedActivityIds: [],
        adaptiveUnlocked: false,
        remediation: {},
      }),
    );

    renderScreen(<CoursePlayer />, `/learner/course/${COURSE_ID}`);
    fireEvent.click(screen.getByTestId("outline-final"));

    const result = await screen.findByTestId("final-result");
    const total = course.finalAssessment.questions.length;
    expect(result.textContent).toContain(`${total} of ${total} correct`);
    expect(result.textContent).toContain("Knowledge check at the start");
    expect(screen.getByTestId("outline-final").textContent).toContain(`Passed · ${total} of ${total}`);
  });
});
