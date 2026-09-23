// Badges are now one per AI competency, earned at the Practitioner threshold,
// and read from the learner's real assessment rather than a separate counter.
import { describe, it, expect } from "vitest";
import { competencyBadges } from "@/lib/recognitionRecord";
import { COMPETENCIES, SCORE_BANDS } from "@/lib/learningData";

const PRACTITIONER = SCORE_BANDS.find((band) => band.id === "practitioner")!.min;

function resultWith(scores: Record<string, number>) {
  return {
    overall: 50,
    levelId: "emerging",
    levelLabel: "Emerging Practitioner",
    levelBlurb: "",
    completedOn: "2026-09-01T00:00:00.000Z",
    scores,
    strengths: [],
    gaps: [],
    recommendedCourseIds: [],
  } as any;
}

describe("competencyBadges", () => {
  it("returns one badge per competency", () => {
    expect(competencyBadges(resultWith({}))).toHaveLength(COMPETENCIES.length);
  });

  it("earns a badge at the Practitioner threshold and not below it", () => {
    const badges = competencyBadges(
      resultWith({ governance: PRACTITIONER, literacy: PRACTITIONER - 1 }),
    );
    expect(badges.find((b) => b.competencyId === "governance")!.earned).toBe(true);
    expect(badges.find((b) => b.competencyId === "literacy")!.earned).toBe(false);
  });

  it("reports the threshold it used, so the UI need not know it", () => {
    expect(competencyBadges(resultWith({}))[0].threshold).toBe(PRACTITIONER);
  });

  it("locks everything when there is no assessment result", () => {
    expect(competencyBadges(null).every((b) => !b.earned)).toBe(true);
  });
});
