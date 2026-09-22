// A quiz has to be able to report a failure, not just silently refuse to
// advance — the remediation simulation is driven by the failing attempt.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepQuiz } from "@/components/learning/StepQuiz";
import type { QuizQuestion } from "@/lib/learningData";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "Pick the second option.",
    options: ["Wrong", "Right"],
    correctIndex: 1,
    explanation: "Right was correct because it was listed second.",
  },
];

describe("StepQuiz attempt reporting", () => {
  it("reports the score on a failing attempt", () => {
    const onAttempt = vi.fn();
    render(
      <StepQuiz
        questions={QUESTIONS}
        passMark={1}
        submitLabel="Continue"
        passNote="Well done."
        failNote="Not yet."
        onAttempt={onAttempt}
        onPass={() => {}}
      />,
    );

    fireEvent.click(screen.getByText("Wrong"));
    fireEvent.click(screen.getByTestId("button-check-answer"));
    fireEvent.click(screen.getByTestId("button-next-question"));

    expect(onAttempt).toHaveBeenCalledWith(0, 1);
    expect(screen.getByText("Not yet.")).toBeTruthy();
  });
});
