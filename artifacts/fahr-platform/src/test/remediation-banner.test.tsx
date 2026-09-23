// The remediation banner keeps the same headline/body pattern in both its
// states, but only the headline used to switch on `complete` — the body
// paragraph stayed the incomplete-state instruction ("Complete them and the
// final assessment reopens") even once the units were actually done. That
// guaranteed the demo's last frame on this banner would contradict itself:
// "Revision complete" above a sentence telling the learner to go do the
// revision. This test renders the completed branch and checks the body does
// not tell the learner to do something the headline just said is finished.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RemediationBanner } from "@/components/learning/RemediationBanner";

describe("RemediationBanner — complete branch", () => {
  it("reads as a closed loop rather than an instruction to do what is already done", () => {
    render(
      <RemediationBanner competencyShort="Governance" correct={1} total={3} unitCount={2} complete={true} />,
    );

    const banner = screen.getByTestId("remediation-banner");
    const body = banner.textContent ?? "";

    expect(body).toContain("Revision complete");
    // The bug: the body told the learner to do the revision that the
    // headline just said was already complete.
    expect(body).not.toContain("Complete them and the final assessment reopens");
    expect(body).not.toContain("units covering it have been added");
  });

  it("still tells the incomplete-branch instruction when the revision is not done", () => {
    render(
      <RemediationBanner competencyShort="Governance" correct={1} total={3} unitCount={2} complete={false} />,
    );

    const banner = screen.getByTestId("remediation-banner");
    const body = banner.textContent ?? "";

    expect(body).toContain("Complete them and the final assessment reopens");
  });
});
