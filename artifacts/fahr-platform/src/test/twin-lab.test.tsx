// The Stage 1 Lab, driven the way it will be driven in front of a client:
// answer the interview, watch it train, then test what it learned.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen } from "./providers";
import AgenticAILabTwin from "@/pages/AgenticAILabTwin";

/** The training run is animated; give it room to finish on a loaded machine. */
const TRAINED = { timeout: 8000 };

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

/** Walks the five interview questions, taking the first suggestion each time. */
async function completeInterview(user: ReturnType<typeof userEvent.setup>) {
  for (let question = 0; question < 5; question += 1) {
    await user.click(screen.getAllByTestId("twin-interview-suggestion")[0]);
    await user.click(screen.getByTestId("button-interview-next"));
  }
}

/** Asks the twin something and waits for the reply to land. */
async function ask(user: ReturnType<typeof userEvent.setup>, node: HTMLElement) {
  const before = screen.queryAllByTestId(/^twin-reply-/).length;
  await user.click(node);
  await waitFor(() => {
    expect(screen.queryAllByTestId(/^twin-reply-/).length).toBeGreaterThan(before);
  });
}

describe("Agentic AI Lab — Stage 1", () => {
  it("opens on the interview, not on a finished twin", () => {
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    expect(screen.getByTestId("twin-interview")).toBeTruthy();
    expect(screen.getByTestId("twin-readiness").textContent).toBe("0%");
    expect(screen.queryByTestId("twin-live-panels")).toBeNull();
  });

  it("readiness climbs as soon as the learner answers", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    await user.click(screen.getAllByTestId("twin-interview-suggestion")[0]);
    expect(screen.getByTestId("twin-readiness").textContent).toBe("16%");
  });

  it("the learner's own words survive into the live twin", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    // A role nobody would find in the seed data, so a match proves it was kept.
    await user.type(screen.getByTestId("twin-interview-input"), "Emergency preparedness lead");
    await user.click(screen.getByTestId("button-interview-next"));

    for (let question = 0; question < 4; question += 1) {
      await user.click(screen.getAllByTestId("twin-interview-suggestion")[0]);
      await user.click(screen.getByTestId("button-interview-next"));
    }

    expect(screen.getByTestId("twin-training")).toBeTruthy();

    const summary = await screen.findByTestId("twin-summary", {}, TRAINED);
    expect(within(summary).getByText("Emergency preparedness lead")).toBeTruthy();
    expect(screen.getByTestId("twin-readiness").textContent).toBe("100%");
  }, 20000);

  it("the trained twin cites what it was taught, and refuses what it was not", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    await completeInterview(user);
    await screen.findByTestId("twin-summary", {}, TRAINED);

    const chat = screen.getByTestId("twin-test-chat");

    // The first chip is built from the learner's own first task.
    await ask(user, within(chat).getAllByTestId("twin-suggested-question")[0]);
    expect(screen.getByTestId("twin-reply-ok")).toBeTruthy();

    // The personal-data chip must be refused outright.
    const personalData = within(chat)
      .getAllByTestId("twin-suggested-question")
      .find((node) => (node.textContent ?? "").includes("medical record"));
    expect(personalData).toBeTruthy();

    await ask(user, personalData!);
    expect(screen.getByTestId("twin-reply-blocked")).toBeTruthy();
  }, 20000);

  it("switching a guardrail off changes the twin's behaviour and flags the breach", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    await completeInterview(user);
    await screen.findByTestId("twin-summary", {}, TRAINED);

    // Nothing to warn about while the twin is fully governed.
    expect(screen.queryByTestId("guardrail-warning")).toBeNull();
    expect(screen.getByTestId("twin-status").textContent).toContain("Live & governed");

    await user.click(screen.getByTestId("switch-humanReview"));

    expect(screen.getByTestId("guardrail-warning")).toBeTruthy();
    expect(screen.getByTestId("twin-status").textContent).toContain("outside policy");

    // The same question now publishes unreviewed, and the reply says so.
    const chat = screen.getByTestId("twin-test-chat");
    await ask(user, within(chat).getAllByTestId("twin-suggested-question")[0]);

    expect(screen.getAllByTestId("guardrail-note-breach").length).toBeGreaterThan(0);
  }, 20000);

  it("rebuilding clears the twin back to an empty interview", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    await completeInterview(user);
    await screen.findByTestId("twin-summary", {}, TRAINED);

    await user.click(screen.getByTestId("button-rebuild"));

    expect(screen.getByTestId("twin-interview")).toBeTruthy();
    expect(screen.getByTestId("twin-readiness").textContent).toBe("0%");
    expect(screen.queryByTestId("twin-summary")).toBeNull();
  }, 20000);

  it("the learner can add a rule of their own, and the twin states it", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    await completeInterview(user);
    await screen.findByTestId("twin-summary", {}, TRAINED);

    // Add a rule the platform has never heard of.
    await user.type(screen.getByTestId("input-custom-guardrail"), "Never quote a figure without a source");
    await user.click(screen.getByTestId("button-add-guardrail"));

    const custom = screen.getByTestId("custom-guardrails");
    expect(within(custom).getByText("Never quote a figure without a source")).toBeTruthy();

    // The twin repeats it back when it answers.
    const chat = screen.getByTestId("twin-test-chat");
    await ask(user, within(chat).getAllByTestId("twin-suggested-question")[0]);
    expect(screen.getByText(/Your rule applied: Never quote a figure/)).toBeTruthy();
  }, 20000);

  it("a learner's rule can be switched off and removed", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    await completeInterview(user);
    await screen.findByTestId("twin-summary", {}, TRAINED);

    await user.click(screen.getAllByTestId("suggested-guardrail")[0]);
    const rule = screen.getByTestId("custom-guardrails").querySelector("[data-testid^='custom-guardrail-']");
    expect(rule).toBeTruthy();

    const id = rule!.getAttribute("data-testid")!.replace("custom-guardrail-", "");
    await user.click(screen.getByTestId(`switch-${id}`));
    expect(screen.getByTestId("guardrail-warning")).toBeTruthy();

    await user.click(screen.getByTestId(`remove-${id}`));
    expect(screen.queryByTestId(`custom-guardrail-${id}`)).toBeNull();
  }, 20000);

  it("a dropped document is learned under its own filename", async () => {
    const user = userEvent.setup();
    renderScreen(<AgenticAILabTwin />, "/learner/lab/twin");

    // Role, then tasks, to reach the documents step.
    await user.click(screen.getAllByTestId("twin-interview-suggestion")[0]);
    await user.click(screen.getByTestId("button-interview-next"));
    await user.click(screen.getAllByTestId("twin-interview-suggestion")[0]);
    await user.click(screen.getByTestId("button-interview-next"));

    expect(screen.getByTestId("twin-document-dropzone")).toBeTruthy();

    const file = new File(["x"], "Ramadan-campaign-2026.pdf", { type: "application/pdf" });
    await user.upload(screen.getByTestId("twin-document-input") as HTMLInputElement, file);

    // It reads as ingestion first, then joins the twin under its filename.
    expect(screen.getByTestId("twin-document-parsing")).toBeTruthy();
    const answers = await screen.findByTestId("twin-interview-answers", {}, { timeout: 4000 });
    await waitFor(() =>
      expect(within(answers).getByText("Ramadan-campaign-2026.pdf")).toBeTruthy(),
    );
  }, 20000);
});
