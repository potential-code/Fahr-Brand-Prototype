// The demo baseline always lands on the same realistic starting point,
// whatever is clicked, and the pathway opens on AI Foundations.
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LearnerProgressProvider, useLearnerProgress } from "@/lib/LearnerProgressContext";
import { ASSESSMENT_QUESTIONS } from "@/lib/learningData";

function completeWith(pick: (q: (typeof ASSESSMENT_QUESTIONS)[number]) => number) {
  window.sessionStorage.clear();
  const { result } = renderHook(() => useLearnerProgress(), { wrapper: LearnerProgressProvider });
  act(() => {
    for (const q of ASSESSMENT_QUESTIONS) result.current.setAnswer(q.id, pick(q));
  });
  let out!: ReturnType<typeof result.current.completeAssessment>;
  act(() => {
    out = result.current.completeAssessment();
  });
  return out;
}

const best = (q: (typeof ASSESSMENT_QUESTIONS)[number]) =>
  q.options.reduce((top, o, i) => (o.score > q.options[top].score ? i : top), 0);

describe("demo baseline", () => {
  it("answering every question perfectly still gives an Emerging Practitioner at 42%", () => {
    const result = completeWith(best);
    expect(result.levelLabel).toBe("Emerging Practitioner");
    expect(result.overall).toBe(42);
    expect(result.strengths[0]).toBe("prompting");
    expect(result.gaps[0]).toBe("governance");
  });

  it("gives the same result however the questions are answered", () => {
    expect(completeWith(() => 0)).toMatchObject({ overall: 42, levelId: "emerging" });
  });

  it("opens the pathway on AI Foundations, then weakest competency first", () => {
    const { recommendedCourseIds } = completeWith(best);
    expect(recommendedCourseIds[0]).toBe("ai-foundations");
    expect(recommendedCourseIds[1]).toBe("ai-governance");
  });
});
