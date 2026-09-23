// The landing page's language toggle is the only thing in the app that
// switches language and text direction. This checks the toggle itself (it
// must flip `document.documentElement.dir`) and the route-keyed reset (leaving
// the landing page must always land back in English/LTR, no matter how the
// visitor got there).
import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, fireEvent } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { ResetLanguageOutsideLanding } from "@/App";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LanguageProvider } from "@/lib/LanguageContext";

beforeEach(() => {
  cleanup();
  document.documentElement.dir = "";
  document.documentElement.lang = "";
});

afterEach(() => {
  document.documentElement.dir = "";
  document.documentElement.lang = "";
});

describe("landing language toggle", () => {
  it("flips document.documentElement.dir between ltr and rtl", () => {
    const { hook } = memoryLocation({ path: "/", static: true });
    const { getByTestId } = render(
      <Router hook={hook}>
        <LanguageProvider>
          <LandingHeader onRegister={() => {}} />
        </LanguageProvider>
      </Router>,
    );

    // The provider sets the initial direction as soon as it mounts.
    expect(document.documentElement.dir).toBe("ltr");

    const toggle = getByTestId("button-language-toggle");

    act(() => {
      fireEvent.click(toggle);
    });
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");

    act(() => {
      fireEvent.click(toggle);
    });
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("leaving the landing route", () => {
  it("resets language and direction to English/LTR on navigation, not just on a click", () => {
    const { hook, navigate } = memoryLocation({ path: "/", record: true });
    const { getByTestId } = render(
      <Router hook={hook}>
        <LanguageProvider>
          <ResetLanguageOutsideLanding />
          <LandingHeader onRegister={() => {}} />
        </LanguageProvider>
      </Router>,
    );

    // Switch to Arabic on the landing page.
    act(() => {
      fireEvent.click(getByTestId("button-language-toggle"));
    });
    expect(document.documentElement.dir).toBe("rtl");

    // Navigate into the app — e.g. the Welcome page routing a visitor to their
    // portal after registration. No click on the toggle is involved.
    act(() => navigate("/learner"));

    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });

  it("stays English/LTR for a deep link that opens directly inside the app", () => {
    const { hook } = memoryLocation({ path: "/learner", static: true });
    render(
      <Router hook={hook}>
        <LanguageProvider>
          <ResetLanguageOutsideLanding />
        </LanguageProvider>
      </Router>,
    );

    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });

  it("resets on the back button just as it does on a forward navigation", () => {
    const { hook, navigate } = memoryLocation({ path: "/", record: true });
    const { getByTestId } = render(
      <Router hook={hook}>
        <LanguageProvider>
          <ResetLanguageOutsideLanding />
          <LandingHeader onRegister={() => {}} />
        </LanguageProvider>
      </Router>,
    );

    act(() => {
      fireEvent.click(getByTestId("button-language-toggle"));
    });
    expect(document.documentElement.dir).toBe("rtl");

    act(() => navigate("/learner"));
    expect(document.documentElement.dir).toBe("ltr");

    // Back to the landing route — still English, since the toggle was never
    // re-clicked; the reset does not "remember" the visitor's earlier choice.
    act(() => navigate("/"));
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });
});
