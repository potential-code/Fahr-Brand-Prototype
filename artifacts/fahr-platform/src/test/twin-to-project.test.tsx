// The twin built in the Lab has to reach the Workplace Project, and the
// Coaching Agent belongs to the learner rather than to every console.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen } from "./providers";
import AgenticAILabProject from "@/pages/AgenticAILabProject";
import ManagerDashboard from "@/pages/ManagerDashboard";
import LearnerDashboard from "@/pages/LearnerDashboard";
import { INTERVIEW, answer, emptyProfile, suggestedQuestions } from "@/lib/digitalTwin";
import { defaultDraft, suggestFor } from "@/lib/workplaceProject";

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

describe("the twin reaches the Workplace Project", () => {
  it("sends the learner back to the Lab when no twin exists yet", () => {
    // The demo opens on a blank draft, so the builder shows its empty state.
    renderScreen(<AgenticAILabProject />, "/learner/lab/project");

    expect(screen.getByTestId("twin-handoff-empty")).toBeTruthy();
    expect(screen.getByTestId("link-build-twin")).toBeTruthy();
    expect(screen.queryByTestId("twin-handoff")).toBeNull();
  });

  it("picking a twin task writes the project title and challenge from the twin", async () => {
    storeTwin();
    const user = userEvent.setup();
    renderScreen(<AgenticAILabProject />, "/learner/lab/project");

    const [first, second] = within(screen.getByTestId("twin-handoff")).getAllByTestId("twin-task-option");
    await user.click(first);

    const title = screen.getByTestId("input-project-title") as HTMLInputElement;
    const challenge = screen.getByTestId("input-project-challenge") as HTMLTextAreaElement;
    // The demo task writes the demo project, in the learner's real role.
    expect(title.value).toBe("AI-assisted weekly performance report");
    expect(challenge.value).toContain("As a Marketing Specialist in Communications and Public Awareness");
    expect(challenge.value).toContain("I prepare the weekly performance report every Monday");
    expect(challenge.value).toContain("checked against the Ministry campaign analytics dashboard");
    expect(first.getAttribute("aria-pressed")).toBe("true");

    // Switching task rewrites twin-written text without asking.
    await user.click(second);
    expect(title.value).toBe("Drafting campaign briefs with my AI Digital Twin");
    expect(screen.queryByTestId("button-replace-with-twin")).toBeNull();
  });

  it("asks before replacing a challenge the learner wrote themselves", async () => {
    storeTwin();
    const user = userEvent.setup();
    renderScreen(<AgenticAILabProject />, "/learner/lab/project");

    const challenge = screen.getByTestId("input-project-challenge") as HTMLTextAreaElement;
    await user.type(challenge, "My own words");
    await user.click(within(screen.getByTestId("twin-handoff")).getAllByTestId("twin-task-option")[0]);

    await user.click(await screen.findByTestId("button-keep-own-words"));
    expect(challenge.value).toBe("My own words");

    await user.click(within(screen.getByTestId("twin-handoff")).getAllByTestId("twin-task-option")[0]);
    await user.click(await screen.findByTestId("button-replace-with-twin"));
    expect(challenge.value).toContain("I prepare the weekly performance report every Monday");
  });
});

/** A trained twin, saved the way the Lab saves it, so a reload keeps it. */
function storeTwin() {
  window.sessionStorage.setItem(
    "fahr.twin.v1",
    JSON.stringify({
      role: "Marketing Specialist",
      tasks: ["Preparing weekly performance reports", "Drafting campaign briefs"],
      briefs: ["Past weekly performance reports"],
      tone: "Clear, factual and leadership-ready",
      knowledge: ["Ministry campaign analytics dashboard"],
      customGuardrails: [],
      trainedAt: "2026-09-27T08:00:00.000Z",
    }),
  );
}

describe("the Coaching Agent is a learner surface", () => {
  it("is offered on the learner dashboard", () => {
    renderScreen(<LearnerDashboard />, "/learner");
    expect(screen.getByLabelText("Open Coaching Agent")).toBeTruthy();
  });

  it("is not offered on the manager console", () => {
    renderScreen(<ManagerDashboard />, "/manager");
    expect(screen.queryByLabelText("Open Coaching Agent")).toBeNull();
  });
});

describe("the demo tells one story: the weekly performance report", () => {
  it("the first suggestion in every interview question builds that twin", () => {
    const firsts = Object.fromEntries(INTERVIEW.map((step) => [step.field, step.suggestions[0].en]));
    expect(firsts).toEqual({
      role: "Marketing Specialist",
      tasks: "Preparing weekly performance reports",
      briefs: "Past weekly performance reports",
      tone: "Clear, factual and leadership-ready",
      knowledge: "Ministry campaign analytics dashboard",
    });
  });

  it("the twin drafts a real report, or lays out its approach, when asked about the task", () => {
    const profile = {
      ...emptyProfile(),
      role: "Marketing Specialist",
      tasks: ["Preparing weekly performance reports"],
      briefs: ["Past weekly performance reports"],
      tone: "Clear, factual and leadership-ready",
      knowledge: ["Ministry campaign analytics dashboard"],
    };
    const [grounded, , , draftChip] = suggestedQuestions(profile, false);

    const approach = answer(profile, grounded.prompt, false);
    expect(approach.status).toBe("ok");
    expect(approach.text).toContain("1. Pull the week's figures from the Ministry campaign analytics dashboard.");

    const report = answer(profile, draftChip.prompt, false);
    expect(report.text).toContain("Headline: campaign reach is up 12% on last week");
    expect(report.citations).toContain("Preparing weekly performance reports");
  });

  it("every Practice Partner draft is about the weekly report", () => {
    const draft = defaultDraft();
    expect(draft.title).toBe("AI-assisted weekly performance report");
    for (const stage of ["challenge", "solution", "outcomes", "measurement"] as const) {
      expect(suggestFor(stage, draft)?.text.toLowerCase()).toMatch(/report/);
      expect(suggestFor(stage, draft)?.text.toLowerCase()).not.toMatch(/campaign brief/);
    }
  });
});
