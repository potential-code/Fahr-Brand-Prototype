// The "why assigned" note has to name the agent that actually assigned the
// step — a Content Agent reading must not claim the Learning Agent.
import React from "react";
import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderScreen } from "./providers";
import { PathwayActivityDialog } from "@/components/pathway/PathwayActivityDialog";
import { buildPathway } from "@/lib/pathway";
import { AGENTS } from "@/lib/constants";

const result = {
  overall: 42,
  levelId: "emerging",
  levelLabel: "Emerging Practitioner",
  levelBlurb: "",
  scores: { prompting: 65, analytics: 45, agentic: 40, governance: 35, literacy: 25 },
  strengths: ["prompting", "analytics"],
  gaps: ["literacy", "governance", "agentic"],
  recommendedCourseIds: ["ai-foundations", "ai-governance", "prompt-engineering"],
  completedOn: "27 September 2026",
};

describe("why an activity was assigned", () => {
  it("names the agent that assigned each step", () => {
    const steps = buildPathway(result).filter((item) => !item.courseId);
    const reading = steps.find((item) => item.agent === AGENTS.content);
    expect(reading).toBeTruthy();

    renderScreen(<PathwayActivityDialog item={reading!} onClose={() => {}} onComplete={() => {}} isComplete={false} />);
    const note = screen.getByTestId("activity-coach-note");
    expect(within(note).getByText(`Why your ${AGENTS.content} assigned this`)).toBeTruthy();
    expect(note.textContent).not.toContain(AGENTS.learning);
  });
});
