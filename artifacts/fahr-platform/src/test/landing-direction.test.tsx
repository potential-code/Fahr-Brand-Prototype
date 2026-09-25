// Landing motion that travels along the reading axis has to mirror in Arabic.
// Transforms are physical — `x: 40` moves right in both directions — so the
// primitives multiply their travel by `useInlineDirection()`. This pins that
// sign to the active language.
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { useInlineDirection } from "@/components/landing/motion";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";

function DirectionProbe() {
  const sign = useInlineDirection();
  const { setLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="sign">{sign}</span>
      <button type="button" data-testid="to-arabic" onClick={() => setLanguage("ar")}>
        ar
      </button>
    </div>
  );
}

beforeEach(() => {
  cleanup();
  document.documentElement.dir = "";
});

afterEach(() => {
  document.documentElement.dir = "";
});

describe("landing inline direction", () => {
  it("runs forwards in English and backwards in Arabic", () => {
    const { getByTestId } = render(
      <LanguageProvider>
        <DirectionProbe />
      </LanguageProvider>,
    );

    expect(getByTestId("sign").textContent).toBe("1");

    fireEvent.click(getByTestId("to-arabic"));

    expect(getByTestId("sign").textContent).toBe("-1");
    expect(document.documentElement.dir).toBe("rtl");
  });
});
