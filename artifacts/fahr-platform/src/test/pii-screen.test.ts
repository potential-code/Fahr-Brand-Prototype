// The twin's headline governance claim is that personal data never reaches the
// model. A screen that misses a plain phone number cannot support that claim —
// and one that flags a budget figure is worse than useless in a demo.
import { describe, it, expect } from "vitest";
import { screenForPii } from "@/lib/piiScreen";

describe("screenForPii catches personal data", () => {
  it("catches a UAE mobile number in any common format", () => {
    for (const number of ["0501234567", "+971 50 123 4567", "00971501234567", "050 123 4567"]) {
      const screen = screenForPii(`Call me on ${number} tomorrow`);
      expect(screen.hit, number).toBe(true);
      expect(screen.findings.some((f) => f.kind === "phone"), number).toBe(true);
    }
  });

  it("catches an Emirates ID with or without separators", () => {
    expect(screenForPii("784-1987-1234567-1").hit).toBe(true);
    expect(screenForPii("784198712345671").hit).toBe(true);
  });

  it("catches an email address and an AE IBAN", () => {
    expect(screenForPii("write to aisha.almansoori@fahr.gov.ae").findings[0].kind).toBe("email");
    expect(screenForPii("AE070331234567890123456").findings[0].kind).toBe("iban");
  });

  it("catches a name only when the sentence introduces one", () => {
    const introduced = screenForPii("My name is Aisha Al Mansoori and I work in communications");
    expect(introduced.findings.some((f) => f.kind === "name")).toBe(true);
  });

  it("keeps the existing keyword list working", () => {
    expect(screenForPii("summarise this patient's medical record").hit).toBe(true);
  });

  it("redacts every finding by label", () => {
    const screen = screenForPii("My name is Aisha Al Mansoori, call 0501234567");
    expect(screen.redacted).toContain("[full name]");
    expect(screen.redacted).toContain("[phone number]");
    expect(screen.redacted).not.toContain("0501234567");
    expect(screen.redacted).not.toContain("Aisha");
  });
});

describe("screenForPii does not cry wolf", () => {
  it("a budget figure is not a phone number", () => {
    expect(screenForPii("The campaign budget was 4500000 dirhams").hit).toBe(false);
  });

  it("an entity name is not a person", () => {
    expect(screenForPii("Draft a note for the Ministry of Health and Prevention").hit).toBe(false);
  });

  it("a year is not a date of birth", () => {
    expect(screenForPii("Our 2026 plan is ready").hit).toBe(false);
  });

  it("an empty prompt is clean", () => {
    const screen = screenForPii("");
    expect(screen.hit).toBe(false);
    expect(screen.findings).toEqual([]);
    expect(screen.redacted).toBe("");
  });
});
