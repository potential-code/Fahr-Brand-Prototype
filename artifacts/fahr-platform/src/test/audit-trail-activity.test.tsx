// The audit trail records what people actually do on the platform — a learner
// creating a Digital Twin or submitting a workplace project lands in it live.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { act, cleanup, screen } from "@testing-library/react";
import { renderScreen } from "./providers";
import FAHRGovernance from "@/pages/FAHRGovernance";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { useFederalData } from "@/lib/FederalDataContext";
import { AUDIT_EVENTS } from "@/lib/federal";

let twin: ReturnType<typeof useDigitalTwin>;
let project: ReturnType<typeof useWorkplaceProject>;

function Driver() {
  twin = useDigitalTwin();
  project = useWorkplaceProject();
  const { auditEvents } = useFederalData();
  return <span data-testid="probe-audit">{auditEvents.map((e) => e.action).join("|")}</span>;
}

describe("audit trail activity", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("seeds a trail that covers the learner journey, not just admin decisions", () => {
    const actions = AUDIT_EVENTS.map((e) => e.action).join(" ");
    for (const needle of ["Digital Twin", "Submitted workplace project", "UAE PASS", "Completed the course", "baseline assessment"]) {
      expect(actions).toContain(needle);
    }
    // Every seeded entry says what happened in plain words.
    expect(AUDIT_EVENTS.every((e) => Boolean(e.detail))).toBe(true);
  });

  it("records creating a Digital Twin and submitting a project as they happen", () => {
    renderScreen(<Driver />, "/learner");

    act(() => twin.completeTraining());
    act(() => {
      project.submit(
        { hoursPerMonth: 12, daysPerYear: 18, valueAed: 50000 } as never,
        [],
      );
    });

    const trail = screen.getByTestId("probe-audit").textContent ?? "";
    expect(trail).toContain("Created an AI Digital Twin");
    expect(trail).toContain("Submitted workplace project");
  });

  it("shows the trail on the FAHR governance screen", () => {
    renderScreen(<FAHRGovernance />, "/fahr/governance");
    expect(screen.getAllByText(/Created an AI Digital Twin/).length).toBeGreaterThan(0);
  });
});
