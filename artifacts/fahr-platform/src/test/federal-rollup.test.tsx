// Rendered roll-up consistency: what the screens display must agree with the
// shared federal spine and with each other.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderScreen, numberFrom } from "./providers";
import LeadershipDashboard from "@/pages/LeadershipDashboard";
import FAHRDashboard from "@/pages/FAHRDashboard";
import MinistryDashboard from "@/pages/MinistryDashboard";
import { CAPABILITY_BANDS, FEDERAL, MINISTRIES, MINISTRY_BY_ID, FOCUS, departmentsOf } from "@/lib/federal";

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("federal roll-up as rendered", () => {
  it("leadership headlines match the federal totals", () => {
    renderScreen(<LeadershipDashboard />, "/leadership");

    expect(numberFrom(screen.getByTestId("text-total-learners").textContent)).toBe(FEDERAL.activeLearners);
    // KPI order: readiness, coverage, champions, value, on-track, compliance.
    expect(numberFrom(screen.getByTestId("kpi-0").textContent)).toBe(FEDERAL.readiness);
    expect(numberFrom(screen.getByTestId("kpi-1").textContent)).toBe(FEDERAL.coverage);
    expect(screen.getByTestId("kpi-4").textContent).toBe(
      `${FEDERAL.ministriesOnTrack}/${FEDERAL.ministriesTotal}`,
    );
  });

  it("the capability ladder shown to leadership accounts for every active learner", () => {
    renderScreen(<LeadershipDashboard />, "/leadership");

    const bandTotal = CAPABILITY_BANDS.reduce((total, band) => total + band.count, 0);
    expect(bandTotal).toBe(FEDERAL.activeLearners);

    let rendered = 0;
    for (const band of CAPABILITY_BANDS) {
      const row = screen.getByTestId(`band-${band.level.id}`);
      rendered += numberFrom(within(row).getByText(band.count.toLocaleString()).textContent);
    }
    expect(rendered).toBe(FEDERAL.activeLearners);
  });

  it("the FAHR ministry table sums to the federal KPIs above it", () => {
    renderScreen(<FAHRDashboard />, "/fahr");

    let learners = 0;
    let twins = 0;
    let projects = 0;
    for (const ministry of MINISTRIES) {
      const row = screen.getByTestId(`row-ministry-${ministry.id}`);
      const cells = within(row).getAllByRole("cell");
      learners += numberFrom(cells[2].textContent);
      twins += numberFrom(cells[3].textContent);
      projects += numberFrom(cells[4].textContent);
    }

    expect(learners).toBe(FEDERAL.activeLearners);
    expect(twins).toBe(FEDERAL.twins);
    expect(projects).toBe(FEDERAL.projectsSubmitted);

    expect(numberFrom(screen.getByTestId("kpi-fahr-1").textContent)).toBe(FEDERAL.activeLearners);
    expect(numberFrom(screen.getByTestId("kpi-fahr-3").textContent)).toBe(FEDERAL.twins);
    expect(numberFrom(screen.getByTestId("kpi-fahr-4").textContent)).toBe(FEDERAL.projectsSubmitted);
  });

  it("the entity department table sums to its own ministry headline", () => {
    renderScreen(<MinistryDashboard />, "/ministry");

    const ministry = MINISTRY_BY_ID[FOCUS.ministryId];
    let employees = 0;
    let twins = 0;
    for (const department of departmentsOf(FOCUS.ministryId)) {
      const row = screen.getByTestId(`row-department-${department.id}`);
      const cells = within(row).getAllByRole("cell");
      employees += numberFrom(cells[1].textContent);
      twins += numberFrom(cells[3].textContent);
    }

    expect(employees).toBe(ministry.employees);
    expect(twins).toBe(ministry.twins);
    // The same figures headline the entity KPI band.
    expect(screen.getByText(ministry.employees.toLocaleString())).toBeTruthy();
  });
});
