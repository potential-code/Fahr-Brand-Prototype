// The manager surfaces have to read the same federal spine as every other role,
// and a sign-off taken in the demo has to move the figures a manager quotes.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen, numberFrom } from "./providers";
import ManagerDashboard from "@/pages/ManagerDashboard";
import ManagerReports from "@/pages/ManagerReports";
import TeamMembers from "@/pages/TeamMembers";
import { DEPARTMENT_BY_ID, FOCUS, MINISTRY_BY_ID, PEOPLE } from "@/lib/federal";
import { COMPETENCIES } from "@/lib/learningData";

/** The submission the demo learner has waiting on her line manager. */
const AISHA_SUBMISSION = "s1";

const directReports = PEOPLE.filter((p) => p.managerId === FOCUS.managerId);
const ministry = MINISTRY_BY_ID[FOCUS.ministryId];
const department = DEPARTMENT_BY_ID[FOCUS.departmentId];

describe("team gap heatmap and benchmark", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("gives every direct report a row and every competency a column", () => {
    renderScreen(<ManagerReports />, "/manager/reports");

    const heatmap = screen.getByTestId("card-gap-heatmap");
    for (const person of directReports) {
      const row = within(heatmap).getByTestId(`heatmap-row-${person.id}`);
      for (const competency of COMPETENCIES) {
        const cell = within(row).getByTestId(`heatmap-cell-${person.id}-${competency.id}`);
        const score = numberFrom(cell.textContent);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }

    // Exactly one column is called out as the team's biggest gap, and it is the
    // weakest column on the board.
    const badges = within(heatmap).getAllByTestId("badge-top-gap");
    expect(badges).toHaveLength(1);
    const averages = COMPETENCIES.map((competency) => ({
      id: competency.id,
      value: numberFrom(within(heatmap).getByTestId(`heatmap-average-${competency.id}`).textContent),
    }));
    const weakest = [...averages].sort((a, b) => a.value - b.value)[0];
    const flagged = COMPETENCIES.find((competency) =>
      within(heatmap)
        .getByTestId(`heatmap-summary-${competency.id}`)
        .contains(badges[0]),
    );
    expect(flagged?.id).toBe(weakest.id);
  });

  it("states the team against its own department and entity average", () => {
    // The dashboard carries the compact benchmark, with a bar per comparator.
    renderScreen(<ManagerDashboard />, "/manager");

    const teamReadiness = numberFrom(screen.getByTestId("benchmark-bar-team").textContent);
    expect(numberFrom(screen.getByTestId("benchmark-bar-department").textContent)).toBe(
      department.readiness,
    );
    expect(numberFrom(screen.getByTestId("benchmark-bar-ministry").textContent)).toBe(
      ministry.readiness,
    );

    // Team Reports states the same comparison in plain language, so the two
    // surfaces cannot disagree about who is ahead.
    cleanup();
    renderScreen(<ManagerReports />, "/manager/reports");
    const read = screen.getByTestId("text-benchmark-read").textContent ?? "";
    expect(read).toContain(String(ministry.readiness));
    expect(read).toContain(department.name);
    expect(read).toMatch(teamReadiness >= ministry.readiness ? /ahead of|Level with/ : /behind/);
  });
});

describe("team roster", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("carries pathway, activity and certification standing for each member", () => {
    renderScreen(<TeamMembers />, "/manager/team");

    for (const person of directReports) {
      const row = screen.getByTestId(`row-roster-${person.id}`);
      expect(row.textContent).toContain(person.name);
      expect(row.textContent).toContain(person.lastActive);
      // Certification standing is one of the three states the entity portal uses.
      expect(row.textContent).toMatch(/Certified|In progress|Not started/);
    }
  });
});

describe("a manager sign-off moves the team's impact and recognition", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("adds the validated project's hours and credential to the team totals", async () => {
    const user = userEvent.setup();
    renderScreen(<ManagerDashboard />, "/manager");

    const hoursBefore = numberFrom(screen.getByTestId("text-teaser-hours").textContent);
    const credentialsBefore = numberFrom(screen.getByTestId("text-teaser-credentials").textContent);
    const projectsBefore = numberFrom(screen.getByTestId("text-teaser-projects").textContent);

    await user.click(screen.getByTestId(`button-sign-off-${AISHA_SUBMISSION}`));

    expect(numberFrom(screen.getByTestId("text-teaser-hours").textContent)).toBeGreaterThan(
      hoursBefore,
    );
    expect(numberFrom(screen.getByTestId("text-teaser-credentials").textContent)).toBe(
      credentialsBefore + 1,
    );
    expect(numberFrom(screen.getByTestId("text-teaser-projects").textContent)).toBe(
      projectsBefore + 1,
    );
  });
});
