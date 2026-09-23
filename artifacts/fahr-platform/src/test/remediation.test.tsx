// A low post-assessment has to visibly change the course: two revision units
// appear and the final assessment closes until they are done.
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LearnerProgressProvider, useLearnerProgress } from "@/lib/LearnerProgressContext";
import { COURSE_BY_ID } from "@/lib/learningData";

const COURSE_ID = "ai-governance";

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
