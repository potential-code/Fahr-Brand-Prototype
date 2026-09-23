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

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

describe("the twin reaches the Workplace Project", () => {
  it("sends the learner back to the Lab when no twin exists yet", () => {
    // The demo normally seeds an approved project so Recognition and
    // Evaluation are never empty; this test wants the builder's empty state,
    // so it starts from an explicitly empty project instead.
    renderScreen(<AgenticAILabProject />, "/learner/lab/project", { seedProject: false });

    expect(screen.getByTestId("twin-handoff-empty")).toBeTruthy();
    expect(screen.getByTestId("link-build-twin")).toBeTruthy();
    expect(screen.queryByTestId("twin-handoff")).toBeNull();
  });
});

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
