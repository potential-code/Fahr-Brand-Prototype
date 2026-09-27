// Every figure on a dashboard has to be one a client could ask about and get a
// straight answer: no money estimates, no spec codes, no metric nobody can
// trace, and totals that add up to the entity figures they summarise.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderScreen } from "./providers";
import { FEDERAL, MINISTRIES, CAPABILITY_DISTRIBUTION, SUBMISSIONS, INTEGRATIONS, COURSERA_CATALOGUE } from "@/lib/federal";
import LeadershipDashboard from "@/pages/LeadershipDashboard";
import LeadershipOutcomes from "@/pages/LeadershipOutcomes";
import LeadershipBriefings from "@/pages/LeadershipBriefings";
import LeadershipMinistries from "@/pages/LeadershipMinistries";
import FAHRDashboard from "@/pages/FAHRDashboard";
import FAHRReports from "@/pages/FAHRReports";
import FAHRIntegrations from "@/pages/FAHRIntegrations";
import MinistryDashboard from "@/pages/MinistryDashboard";
import MinistryPortfolio from "@/pages/MinistryPortfolio";
import ManagerDashboard from "@/pages/ManagerDashboard";
import ManagerReports from "@/pages/ManagerReports";
import TeamRecognition from "@/pages/TeamRecognition";
import LearnerDashboard from "@/pages/LearnerDashboard";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

describe("national figures add up", () => {
  it("sums the entity figures", () => {
    expect(FEDERAL.projectsSubmitted).toBe(sum(MINISTRIES.map((m) => m.projectsSubmitted)));
    expect(FEDERAL.projectsLive).toBe(sum(MINISTRIES.map((m) => m.projectsLive)));
    expect(FEDERAL.hoursSavedPerMonth).toBe(sum(MINISTRIES.map((m) => m.hoursSavedPerMonth)));
    expect(sum(Object.values(CAPABILITY_DISTRIBUTION))).toBe(FEDERAL.activeLearners);
  });

  it("counts only projects that exist", () => {
    for (const m of MINISTRIES) {
      expect(m.projectsSubmitted).toBe(SUBMISSIONS.filter((s) => s.ministryId === m.id).length);
    }
    expect(FEDERAL.projectsSubmitted).toBe(SUBMISSIONS.length);
    expect(INTEGRATIONS.find((i) => i.id === "coursera")?.records).toBe(COURSERA_CATALOGUE.length);
  });

  it("stays at an early-rollout scale", () => {
    for (const m of MINISTRIES) {
      expect(m.projectsLive).toBeLessThanOrEqual(m.projectsSubmitted);
      expect(m.twins).toBeLessThan(m.activeLearners * 0.15);
    }
    expect(CAPABILITY_DISTRIBUTION.champion / FEDERAL.activeLearners).toBeLessThan(0.02);
  });
});

const SCREENS: [string, React.ReactElement, string][] = [
  ["Leadership dashboard", <LeadershipDashboard />, "/leadership"],
  ["Leadership outcomes", <LeadershipOutcomes />, "/leadership/outcomes"],
  ["Leadership briefings", <LeadershipBriefings />, "/leadership/briefings"],
  ["Leadership ministries", <LeadershipMinistries />, "/leadership/ministries"],
  ["FAHR dashboard", <FAHRDashboard />, "/fahr"],
  ["FAHR reports", <FAHRReports />, "/fahr/reports"],
  ["FAHR integrations", <FAHRIntegrations />, "/fahr/integrations"],
  ["Entity dashboard", <MinistryDashboard />, "/ministry"],
  ["Entity portfolio", <MinistryPortfolio />, "/ministry/portfolio"],
  ["Manager dashboard", <ManagerDashboard />, "/manager"],
  ["Manager reports", <ManagerReports />, "/manager/reports"],
  ["Team recognition", <TeamRecognition />, "/manager/recognition"],
  ["Learner dashboard", <LearnerDashboard />, "/learner"],
];

describe("no untraceable figures on any dashboard", () => {
  it.each(SCREENS)("%s shows no money, spec codes or learning hours", (_name, ui, path) => {
    const { container } = renderScreen(ui, path);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\bAED\b/);
    expect(text).not.toContain("§");
    expect(text).not.toMatch(/learning hours|pathway completions/i);
  });
});
