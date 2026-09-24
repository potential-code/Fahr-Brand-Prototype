// Recognition arranged by AI competency: which capabilities the team is
// certified in, not just who holds a certificate.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup } from "@testing-library/react";
import { renderScreen } from "./providers";
import TeamRecognition from "@/pages/TeamRecognition";
import { CREDENTIALS, FOCUS, PEOPLE, SUBMISSIONS } from "@/lib/federal";
import { COMPETENCIES } from "@/lib/learningData";
import {
  PRACTITIONER_THRESHOLD,
  competencyScoreFor,
  teamCompetencyMatrix,
  teamCompetencyRecognition,
} from "@/lib/manager/selectors";

/** The pill reads "N of M badged" — numberFrom would run the two together. */
function badgedCount(text: string | null): number {
  return Number(/^\s*(\d+)\s+of\b/.exec(text ?? "")?.[1] ?? NaN);
}

const directReports = PEOPLE.filter((p) => p.managerId === FOCUS.managerId);
const teamIds = new Set(directReports.map((p) => p.id));
const teamSubmissions = SUBMISSIONS.filter((s) => teamIds.has(s.personId));
const teamCredentials = CREDENTIALS.filter((c) => teamIds.has(c.personId));

describe("team recognition by competency", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("gives every framework competency a card with its badge coverage", () => {
    renderScreen(<TeamRecognition />, "/manager/recognition");

    const card = screen.getByTestId("card-competency-recognition");
    for (const competency of COMPETENCIES) {
      const row = within(card).getByTestId(`competency-recognition-${competency.id}`);
      expect(row.textContent).toContain(competency.label);

      // The coverage pill counts badge holders out of the whole team.
      const pill = within(card).getByTestId(`competency-badged-${competency.id}`);
      const held = badgedCount(pill.textContent);
      expect(pill.textContent).toContain(`of ${directReports.length} badged`);
      expect(held).toBeGreaterThanOrEqual(0);
      expect(held).toBeLessThanOrEqual(directReports.length);
    }
  });

  it("counts a badge exactly when the member is at the Practitioner threshold", () => {
    renderScreen(<TeamRecognition />, "/manager/recognition");

    const card = screen.getByTestId("card-competency-recognition");
    for (const competency of COMPETENCIES) {
      const expected = directReports.filter(
        (person) => competencyScoreFor(person, competency.id) >= PRACTITIONER_THRESHOLD,
      ).length;
      const pill = within(card).getByTestId(`competency-badged-${competency.id}`);
      expect(badgedCount(pill.textContent)).toBe(expected);
    }
  });

  it("attributes a credential to the competencies its validated project exercised", () => {
    const matrix = teamCompetencyMatrix(directReports);
    const byCompetency = teamCompetencyRecognition({
      matrix,
      credentials: teamCredentials,
      teamSubmissions,
    });

    for (const row of byCompetency.rows) {
      for (const { credential } of row.credentials) {
        const submission = teamSubmissions.find((s) => s.id === credential.submissionId);
        expect(submission?.competencyIds).toContain(row.competency.id);
      }
    }

    // Nothing is silently dropped: a credential is either attributed to at
    // least one competency or named as unattributable.
    const attributed = new Set(
      byCompetency.rows.flatMap((row) => row.credentials.map((c) => c.credential.id)),
    );
    const unmapped = new Set(byCompetency.unmappedCredentials.map((c) => c.credential.id));
    for (const credential of teamCredentials) {
      expect(attributed.has(credential.id) || unmapped.has(credential.id)).toBe(true);
    }
  });

  it("renders the credentials it attributes, and no longer shows the removed sections", () => {
    renderScreen(<TeamRecognition />, "/manager/recognition");

    const card = screen.getByTestId("card-competency-recognition");
    const matrix = teamCompetencyMatrix(directReports);
    const byCompetency = teamCompetencyRecognition({
      matrix,
      credentials: teamCredentials,
      teamSubmissions,
    });
    for (const row of byCompetency.rows) {
      for (const { credential } of row.credentials) {
        const line = within(card).getByTestId(
          `competency-credential-${row.competency.id}-${credential.id}`,
        );
        expect(line.textContent).toContain(credential.title);
        expect(line.textContent).toContain(credential.verificationCode);
      }
    }

    expect(screen.queryByTestId("card-applied-impact")).toBeNull();
    expect(screen.queryByTestId("card-ministry-standing")).toBeNull();
    expect(screen.queryByTestId("card-impact-challenge")).toBeNull();
  });
});
