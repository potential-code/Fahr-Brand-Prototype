// The analytics agent's sample line names the competency most entities report
// as their top gap. Which competency that is comes from live data
// (`nationalGaps()[0]`), so it cannot live in a translation key — it is read
// off the shared `COMPETENCIES` constant instead, in the current language.
//
// That constant is also read by the English app screens, so these tests exist
// mainly to pin the English path: if `labelAr`/`shortAr` were ever made
// required, or the `??` fallback reordered, English rendering would change and
// nothing else in the suite would notice.
import { describe, it, expect } from "vitest";
import { LANDING_AGENTS } from "@/components/landing/agents";
import { COMPETENCIES } from "@/lib/learningData";
import { nationalGaps } from "@/lib/federal";

const GAP_KEY = "landing.agents.analytics.sampleGap";

const analytics = LANDING_AGENTS.find((agent) => agent.key === "analytics")!;

/**
 * Stands in for `useLanguage().t`, recording the params each key was resolved
 * with. The assertions are on the value the resolver chose to pass, which is
 * the logic under test — not on any rendered string.
 */
function recordingT() {
  const seen: Record<string, Record<string, string | number>> = {};
  const t = (key: string, params?: Record<string, string | number>) => {
    if (params) seen[key] = params;
    return key;
  };
  return { t, seen };
}

describe("analytics agent sample line, per language", () => {
  it("has a top gap to name at all", () => {
    // Everything below assumes the optional trailing clause is reached.
    expect(nationalGaps()[0]).toBeDefined();
  });

  it("names the English competency in English", () => {
    const topGap = nationalGaps()[0];
    const { t, seen } = recordingT();
    analytics.sample(t, "en");
    expect(seen[GAP_KEY].competency).toBe(topGap.competency.short);
  });

  it("does not leak the Arabic form into the English line", () => {
    const topGap = nationalGaps()[0];
    const { t, seen } = recordingT();
    analytics.sample(t, "en");
    expect(topGap.competency.shortAr).toBeTruthy();
    expect(seen[GAP_KEY].competency).not.toBe(topGap.competency.shortAr);
  });

  it("prefers the Arabic short form in Arabic", () => {
    const topGap = nationalGaps()[0];
    const { t, seen } = recordingT();
    analytics.sample(t, "ar");
    expect(seen[GAP_KEY].competency).toBe(topGap.competency.shortAr);
  });

  it("falls back to the English short form when a competency has no Arabic", () => {
    // `shortAr` is optional, so a competency added later without it must
    // degrade to the English name rather than render `undefined`.
    // `nationalGaps()` hands back the live `COMPETENCIES` object, so this
    // removes the field from the real one and puts it back afterwards.
    const competency = nationalGaps()[0].competency;
    const saved = competency.shortAr;
    try {
      delete competency.shortAr;
      const { t, seen } = recordingT();
      analytics.sample(t, "ar");
      expect(seen[GAP_KEY].competency).toBe(competency.short);
      expect(seen[GAP_KEY].competency).not.toBeUndefined();
    } finally {
      competency.shortAr = saved;
    }
  });

  it("leaves the competency untouched after the fallback test", () => {
    expect(nationalGaps()[0].competency.shortAr).toBeTruthy();
  });
});

describe("COMPETENCIES Arabic coverage", () => {
  // The type permits absence; the product requires presence. Say so here.
  it("gives every competency a non-empty labelAr and shortAr", () => {
    for (const competency of COMPETENCIES) {
      expect(competency.labelAr, `labelAr missing for ${competency.id}`).toBeTruthy();
      expect(competency.shortAr, `shortAr missing for ${competency.id}`).toBeTruthy();
    }
  });

  it("keeps the English fields intact alongside them", () => {
    for (const competency of COMPETENCIES) {
      expect(competency.label).toBeTruthy();
      expect(competency.short).toBeTruthy();
      expect(competency.labelAr).not.toBe(competency.label);
    }
  });
});
