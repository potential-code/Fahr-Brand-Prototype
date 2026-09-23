// Landing-page content for the platform's agents: the six specialised agents
// of the proposal, plus the Practice Partner.
//
// Names come from `AGENTS` in `@/lib/constants` and the analytics figures come
// from the federal data spine, so the marketing page can never quote a number
// the consoles disagree with.
//
// Every rendered string here is a translation key rather than a literal —
// `EcosystemSection` is the only consumer, and it resolves these through
// `useLanguage().t()` at render time. Two things stay genuinely dynamic
// through that indirection rather than being frozen into a key:
//   - `nameKey` always resolves to the literal `AGENTS[key]` value via
//     interpolation (`t(nameKey, { name: AGENTS[key] })`), never a translated
//     copy of the name baked into the `en`/`ar` blocks. That keeps the
//     landing page's agent names permanently in sync with `AGENTS`.
//   - `sample` is a function of `t`, not a string, because the analytics
//     agent's sample line quotes live figures (`FEDERAL.*`, `nationalGaps()`)
//     and has an optional trailing clause. Every other agent's `sample` is a
//     one-line static lookup; analytics builds its line from two keys
//     (`sample` + the optional `sampleGap`) so the trailing clause can be
//     translated as its own sentence rather than spliced mid-string.

import type React from "react";
import { BarChart3, Brain, ClipboardCheck, GraduationCap, LifeBuoy, Sparkles, Target } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import { FEDERAL, nationalGaps } from "@/lib/federal";

/**
 * The six stages of the learner journey, in order. These ids are stable
 * English identifiers used only for matching (`agent.stages.includes(stage)`)
 * and as React keys — they are never displayed. Display text comes from
 * `STAGE_LABEL_KEYS` below, resolved through `t()`.
 */
export const JOURNEY_STAGES = [
  "onboarding",
  "personalisedPathway",
  "experientialLearning",
  "buildTrain",
  "assessValidate",
  "recognitionImpact",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/** Translation key for each journey stage's display label. */
export const STAGE_LABEL_KEYS: Record<JourneyStage, string> = {
  onboarding: "landing.ecosystem.stages.onboarding",
  personalisedPathway: "landing.ecosystem.stages.personalisedPathway",
  experientialLearning: "landing.ecosystem.stages.experientialLearning",
  buildTrain: "landing.ecosystem.stages.buildTrain",
  assessValidate: "landing.ecosystem.stages.assessValidate",
  recognitionImpact: "landing.ecosystem.stages.recognitionImpact",
};

/** Matches `useLanguage().t` without importing the hook into a plain data module. */
type TFn = (key: string, params?: Record<string, string | number>) => string;

/** Matches `useLanguage().language`, kept local for the same reason as `TFn`. */
type Lang = "en" | "ar";

export type LandingAgent = {
  key: keyof typeof AGENTS;
  /** Always `t(nameKey, { name: AGENTS[key] })` — see the file banner. */
  nameKey: string;
  taglineKey: string;
  descriptionKey: string;
  /** Journey stages this agent is present in. */
  stages: JourneyStage[];
  /**
   * Resolves this agent's representative sample line for the current language.
   * `lang` is only needed by the analytics agent, whose line quotes a
   * competency name that lives on shared data rather than in a translation
   * key; the other resolvers ignore it.
   */
  sample: (t: TFn, lang: Lang) => string;
  /** Two concrete capabilities, kept short enough to scan. */
  capabilitiesKeys: [string, string];
  icon: React.ElementType;
  image: string;
  /** One of the six specialised agents, as opposed to a supporting agent. */
  specialised: boolean;
};

const topGap = nationalGaps()[0];

export const LANDING_AGENTS: LandingAgent[] = [
  {
    key: "capability",
    specialised: true,
    nameKey: "landing.agents.capability.name",
    taglineKey: "landing.agents.capability.tagline",
    descriptionKey: "landing.agents.capability.description",
    stages: ["onboarding", "personalisedPathway"],
    sample: (t) => t("landing.agents.capability.sample"),
    capabilitiesKeys: [
      "landing.agents.capability.capabilities.0",
      "landing.agents.capability.capabilities.1",
    ],
    icon: Target,
    image: "brand/landing/ecosystem-2.jpg",
  },
  {
    key: "learning",
    specialised: true,
    nameKey: "landing.agents.learning.name",
    taglineKey: "landing.agents.learning.tagline",
    descriptionKey: "landing.agents.learning.description",
    stages: ["onboarding", "personalisedPathway", "assessValidate"],
    sample: (t) => t("landing.agents.learning.sample"),
    capabilitiesKeys: [
      "landing.agents.learning.capabilities.0",
      "landing.agents.learning.capabilities.1",
    ],
    icon: GraduationCap,
    image: "brand/landing/ecosystem-agents.jpg",
  },
  {
    key: "assessment",
    specialised: true,
    nameKey: "landing.agents.assessment.name",
    taglineKey: "landing.agents.assessment.tagline",
    descriptionKey: "landing.agents.assessment.description",
    stages: ["assessValidate", "recognitionImpact"],
    sample: (t) => t("landing.agents.assessment.sample"),
    capabilitiesKeys: [
      "landing.agents.assessment.capabilities.0",
      "landing.agents.assessment.capabilities.1",
    ],
    icon: ClipboardCheck,
    image: "brand/landing/ecosystem-2.jpg",
  },
  {
    key: "content",
    specialised: true,
    nameKey: "landing.agents.content.name",
    taglineKey: "landing.agents.content.tagline",
    descriptionKey: "landing.agents.content.description",
    stages: ["personalisedPathway", "experientialLearning"],
    sample: (t) => t("landing.agents.content.sample"),
    capabilitiesKeys: [
      "landing.agents.content.capabilities.0",
      "landing.agents.content.capabilities.1",
    ],
    icon: Sparkles,
    image: "brand/landing/ecosystem-agents.jpg",
  },
  {
    key: "coaching",
    specialised: true,
    nameKey: "landing.agents.coaching.name",
    taglineKey: "landing.agents.coaching.tagline",
    descriptionKey: "landing.agents.coaching.description",
    stages: ["onboarding", "recognitionImpact"],
    sample: (t) => t("landing.agents.coaching.sample"),
    capabilitiesKeys: [
      "landing.agents.coaching.capabilities.0",
      "landing.agents.coaching.capabilities.1",
    ],
    icon: LifeBuoy,
    image: "brand/landing/ecosystem-3.jpg",
  },
  {
    key: "analytics",
    specialised: true,
    nameKey: "landing.agents.analytics.name",
    taglineKey: "landing.agents.analytics.tagline",
    descriptionKey: "landing.agents.analytics.description",
    stages: ["assessValidate", "recognitionImpact"],
    sample: (t, lang) => {
      const base = t("landing.agents.analytics.sample", {
        readiness: FEDERAL.readiness,
        onTrack: FEDERAL.ministriesOnTrack,
        total: FEDERAL.ministriesTotal,
      });
      if (!topGap) return base;
      // Which competency this is depends on live data (`nationalGaps()[0]`),
      // so it cannot be baked into a translation key. `shortAr` is optional on
      // `Competency`, hence the fall back to the English `short`.
      const competency =
        (lang === "ar" ? topGap.competency.shortAr : undefined) ?? topGap.competency.short;
      return `${base}${t("landing.agents.analytics.sampleGap", {
        ministries: topGap.ministries,
        competency,
      })}`;
    },
    capabilitiesKeys: [
      "landing.agents.analytics.capabilities.0",
      "landing.agents.analytics.capabilities.1",
    ],
    icon: BarChart3,
    image: "brand/landing/ecosystem-2.jpg",
  },
  {
    // Not currently rendered anywhere (EcosystemSection and HeroSection only
    // read `SPECIALISED_AGENTS`, filtered to `specialised: true`). Kept keyed
    // and structurally identical to the specialised agents so the type stays
    // uniform and this entry is ready to render without rework if that changes.
    key: "practice",
    specialised: false,
    nameKey: "landing.agents.practice.name",
    taglineKey: "landing.agents.practice.tagline",
    descriptionKey: "landing.agents.practice.description",
    stages: ["experientialLearning", "buildTrain"],
    sample: (t) => t("landing.agents.practice.sample"),
    capabilitiesKeys: [
      "landing.agents.practice.capabilities.0",
      "landing.agents.practice.capabilities.1",
    ],
    icon: Brain,
    image: "brand/landing/ecosystem-3.jpg",
  },
];

/** The six specialised agents of the proposal, without the supporting one. */
export const SPECIALISED_AGENTS = LANDING_AGENTS.filter((agent) => agent.specialised);
