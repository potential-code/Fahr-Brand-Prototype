// A decision taken in one role has to reach the others in the same session.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen, numberFrom } from "./providers";
import ManagerDashboard from "@/pages/ManagerDashboard";
import MinistryPortfolio from "@/pages/MinistryPortfolio";
import { useFederalData } from "@/lib/FederalDataContext";
import { FOCUS, SUBMISSION_STATE_LABEL } from "@/lib/federal";

/** The submission the demo learner has waiting on her line manager. */
const AISHA_SUBMISSION = "s1";

/** Reads store-derived values that no single screen renders on its own. */
function Probe() {
  const { notificationsFor, live, getPerson } = useFederalData();
  const aisha = getPerson(FOCUS.learnerId);
  return (
    <div>
      <span data-testid="probe-manager-notifications">
        {notificationsFor("manager").map((n) => n.id).join(",")}
      </span>
      <span data-testid="probe-ministry-notifications">
        {notificationsFor("ministry").map((n) => n.id).join(",")}
      </span>
      <span data-testid="probe-live-progress">{live.pathwayProgress}</span>
      <span data-testid="probe-aisha-progress">{aisha?.pathwayProgress}</span>
      <span data-testid="probe-aisha-score">{aisha?.assessmentScore}</span>
    </div>
  );
}

describe("manager sign-off reaches the entity portal", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("moves the project into the entity queue and hands the notification over", async () => {
    const user = userEvent.setup();
    renderScreen(
      <>
        <ManagerDashboard />
        <Probe />
      </>,
      "/manager",
    );

    // The manager starts with the learner's project among those awaiting sign-off.
    const pendingBefore = numberFrom(screen.getByTestId("badge-signoff-count").textContent);
    expect(pendingBefore).toBeGreaterThan(0);
    expect(screen.getByTestId(`button-sign-off-${AISHA_SUBMISSION}`)).toBeTruthy();
    const managerBefore = screen.getByTestId("probe-manager-notifications").textContent ?? "";
    const ministryBefore = screen.getByTestId("probe-ministry-notifications").textContent ?? "";
    expect(managerBefore).toContain(AISHA_SUBMISSION);
    expect(ministryBefore).not.toContain(`entity-${AISHA_SUBMISSION}`);

    await user.click(screen.getByTestId(`button-sign-off-${AISHA_SUBMISSION}`));

    // The manager's queue shrinks and the entity is notified instead.
    expect(numberFrom(screen.getByTestId("badge-signoff-count").textContent)).toBe(pendingBefore - 1);
    expect(screen.queryByTestId(`button-sign-off-${AISHA_SUBMISSION}`)).toBeNull();
    expect(screen.getByTestId("probe-manager-notifications").textContent ?? "").not.toContain(
      `manager-signoff-${AISHA_SUBMISSION}`,
    );
    expect(screen.getByTestId("probe-ministry-notifications").textContent ?? "").toContain(
      AISHA_SUBMISSION,
    );

    // A fresh mount of the entity portal — as happens when the demo switches
    // role — sees the manager's decision.
    cleanup();
    renderScreen(<MinistryPortfolio />, "/ministry/portfolio");

    expect(screen.getByTestId(`text-status-${AISHA_SUBMISSION}`).textContent).toContain(
      SUBMISSION_STATE_LABEL.awaiting_entity,
    );
    const card = screen.getByTestId(`card-project-${AISHA_SUBMISSION}`);
    expect(within(card).getByText(/Noura Al Kaabi|Awaiting entity endorsement/)).toBeTruthy();
  });

  it("requesting a revision sends it back rather than forward", async () => {
    const user = userEvent.setup();
    renderScreen(<ManagerDashboard />, "/manager");

    await user.click(screen.getByTestId(`button-request-revision-${AISHA_SUBMISSION}`));

    cleanup();
    renderScreen(<MinistryPortfolio />, "/ministry/portfolio");
    expect(screen.getByTestId(`text-status-${AISHA_SUBMISSION}`).textContent).toContain(
      SUBMISSION_STATE_LABEL.revision_requested,
    );
  });

  it("shows the manager the learner's live figures, not invented ones", () => {
    renderScreen(
      <>
        <ManagerDashboard />
        <Probe />
      </>,
      "/manager",
    );

    const live = numberFrom(screen.getByTestId("probe-live-progress").textContent);
    expect(numberFrom(screen.getByTestId("probe-aisha-progress").textContent)).toBe(live);
    expect(numberFrom(screen.getByTestId(`text-progress-${FOCUS.learnerId}`).textContent)).toBe(live);
  });
});
