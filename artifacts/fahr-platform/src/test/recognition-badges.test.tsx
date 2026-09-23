// A whole-branch review found the Recognition surface had no rendered test at
// all: four tasks each wired their own "how many badges" number, and every
// review that looked at only one task's diff missed that the other three
// disagreed with it. These tests render the real screens and cross-check the
// numbers a learner would actually see, which is the only way this class of
// bug gets caught.
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderScreen, numberFrom } from "./providers";
import RecognitionAndImpact from "@/pages/RecognitionAndImpact";
import LearnerDashboard from "@/pages/LearnerDashboard";
import { earnedBadgeCount } from "@/lib/recognitionRecord";

describe("Recognition & Impact — certificate and badge numbers", () => {
  it("shows the certificate for the seeded, already-approved project", () => {
    window.sessionStorage.clear();
    renderScreen(<RecognitionAndImpact />, "/learner/recognition");

    expect(screen.getByTestId("certificate-face")).toBeTruthy();
    expect(screen.getByTestId("text-certificate-name").textContent).toBeTruthy();
    expect(screen.getByTestId("text-certificate-project").textContent).toBeTruthy();
  });

  it("agrees with itself, and with the dashboard tile, on how many badges are earned", () => {
    // The seeded demo state has no baseline assessment yet, so this is 0 —
    // but the test does not hard-code that. It reads the one function every
    // "badges" number on the platform is required to be derived from, and
    // checks every on-screen number against it instead.
    const expected = earnedBadgeCount(null);

    window.sessionStorage.clear();
    renderScreen(<RecognitionAndImpact />, "/learner/recognition");

    const heroBadges = numberFrom(screen.getByTestId("hero-stat-badges").textContent);
    expect(heroBadges).toBe(expected);

    const grid = screen.getByTestId("card-competency-badges");
    const gridMatch = (grid.textContent ?? "").match(/(\d+) of 5 earned/);
    expect(gridMatch).toBeTruthy();
    expect(Number(gridMatch![1])).toBe(expected);

    // The points ledger's "badges earned" row must count the same badges —
    // not the deleted achievement set it used to score.
    const ledger = screen.getByTestId("card-points-rank");
    expect(ledger.textContent ?? "").toMatch(new RegExp(`${expected} competency badges? earned`));

    renderScreen(<LearnerDashboard />, "/learner");
    const tile = screen.getByTestId("quicklink--learner-recognition");
    expect(tile.textContent).toContain(`${expected} badges`);
  });
});

describe("Recognition & Impact — courses completed", () => {
  it("reads 0 in the seeded demo state — the seeded credential is a workplace project, not a course", () => {
    window.sessionStorage.clear();
    renderScreen(<RecognitionAndImpact />, "/learner/recognition");

    const heroCredentials = numberFrom(screen.getByTestId("hero-stat-credentials").textContent);
    expect(heroCredentials).toBe(0);
  });

  it("reads 1 once a course's final assessment is actually passed", () => {
    window.sessionStorage.clear();
    // Same seeding shape and storage key as LearnerProgressContext's own
    // sessionStorage round-trip (see src/test/remediation.test.tsx) — this is
    // exactly what a page reload with a finished course looks like.
    window.sessionStorage.setItem(
      "fahr.learner.progress.v1",
      JSON.stringify({
        answers: {},
        result: null,
        courseProgress: {
          "ai-foundations": { completedLessonIds: [], pretestDone: true, finalDone: true },
        },
        completedActivityIds: [],
        adaptiveUnlocked: false,
        remediation: {},
      }),
    );

    renderScreen(<RecognitionAndImpact />, "/learner/recognition");

    const heroCredentials = numberFrom(screen.getByTestId("hero-stat-credentials").textContent);
    expect(heroCredentials).toBe(1);
  });
});
