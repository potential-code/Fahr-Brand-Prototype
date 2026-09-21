// Text, voice and avatar are one agent through three channels. The thing that
// must hold is continuity: switching channel carries on the same conversation.
//
// The caption lays the whole line out from the start with the unspoken words
// dimmed, so `textContent` says nothing about progress — how far the agent has
// got is read from `data-spoken` instead.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen } from "./providers";
import { AdvisorPanel } from "@/components/dashboard/AdvisorPanel";

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

const transcript = () => screen.getByTestId("agent-transcript");
const spoken = () => Number(transcript().getAttribute("data-spoken"));

/** Waits until the agent has actually started speaking the current line. */
async function waitForSpeech(atLeast = 2) {
  await waitFor(() => expect(spoken()).toBeGreaterThanOrEqual(atLeast), { timeout: 4000 });
}

describe("the agent's three channels", () => {
  it("offers text, voice and avatar", () => {
    renderScreen(<AdvisorPanel />, "/learner");

    expect(screen.getByTestId("tab-advisor-chat")).toBeTruthy();
    expect(screen.getByTestId("tab-advisor-voice")).toBeTruthy();
    expect(screen.getByTestId("tab-advisor-avatar")).toBeTruthy();
  });

  it("voice speaks the line word by word rather than dumping it", async () => {
    const user = userEvent.setup();
    renderScreen(<AdvisorPanel />, "/learner");

    await user.click(screen.getByTestId("tab-advisor-voice"));
    expect(screen.getByTestId("advisor-voice-pane")).toBeTruthy();

    // The whole line is laid out immediately — that is what stops the caption
    // box reflowing — but only part of it has been spoken.
    const total = Number(transcript().getAttribute("data-total"));
    expect(total).toBeGreaterThan(5);
    expect(spoken()).toBeLessThan(total);

    await waitForSpeech();
    const early = spoken();
    await waitFor(() => expect(spoken()).toBeGreaterThan(early), { timeout: 4000 });
  }, 15000);

  it("switching channel continues the same line at the same point", async () => {
    const user = userEvent.setup();
    renderScreen(<AdvisorPanel />, "/learner");

    await user.click(screen.getByTestId("tab-advisor-voice"));
    await waitForSpeech();

    const lineInVoice = transcript().textContent ?? "";
    const positionInVoice = spoken();

    await user.click(screen.getByTestId("tab-advisor-avatar"));

    // Same line, and the playhead did not rewind to the opening word.
    expect(transcript().textContent).toBe(lineInVoice);
    expect(spoken()).toBeGreaterThanOrEqual(positionInVoice);
  }, 15000);

  it("holding the call stops the agent mid-line", async () => {
    const user = userEvent.setup();
    renderScreen(<AdvisorPanel />, "/learner");

    await user.click(screen.getByTestId("tab-advisor-voice"));
    await waitForSpeech();
    await user.click(screen.getByTestId("button-voice-toggle"));

    const held = spoken();
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(spoken()).toBe(held);

    // And resuming picks the line back up.
    await user.click(screen.getByTestId("button-voice-toggle"));
    await waitFor(() => expect(spoken()).toBeGreaterThan(held), { timeout: 4000 });
  }, 15000);
});
