// Landing-page content for the platform's agents: the six specialised agents
// of the proposal, plus the Practice Partner.
//
// Names come from `AGENTS` in `@/lib/constants` and the analytics figures come
// from the federal data spine, so the marketing page can never quote a number
// the consoles disagree with.

import type React from "react";
import { BarChart3, Brain, ClipboardCheck, GraduationCap, LifeBuoy, Sparkles, Target } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import { FEDERAL, nationalGaps } from "@/lib/federal";

/** The six stages of the learner journey, in order. */
export const JOURNEY_STAGES = [
  "Onboarding",
  "Personalised pathway",
  "Experiential learning",
  "Build & train",
  "Assess & validate",
  "Recognition & impact",
] as const;

export type LandingAgent = {
  key: keyof typeof AGENTS;
  name: string;
  /** Four or five words describing the agent's job. */
  tagline: string;
  description: string;
  /** Journey stages this agent is present in. */
  stages: string[];
  /** A representative line of output, shown as the agent speaking. */
  sample: string;
  /** Two concrete capabilities, kept short enough to scan. */
  capabilities: [string, string];
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
    name: AGENTS.capability,
    tagline: "Maps role to capability",
    description:
      "Recommends the pathway that matches the federal role, the entity's priorities and the capability ladder.",
    stages: ["Onboarding", "Personalised pathway"],
    sample:
      "For a Marketing Specialist in a federal communications team, the fastest route to Practitioner is Prompting for Campaign Copy, then Data Summarisation, then Responsible AI Review.",
    capabilities: ["Role-aware pathways", "Aligned to the ladder"],
    icon: Target,
    image: "brand/landing/ecosystem-2.jpg",
  },
  {
    key: "learning",
    specialised: true,
    name: AGENTS.learning,
    tagline: "Guides the individual",
    description:
      "Interprets assessment outcomes and turns them into a weekly plan the employee can actually follow.",
    stages: ["Onboarding", "Personalised pathway", "Assess & validate"],
    sample:
      "Your baseline puts you at Emerging Practitioner. Prompt design is your strength; oversight of AI output is the gap. I have put a 20-minute human-in-the-loop module at the top of this week.",
    capabilities: ["Reads every assessment", "Replans as you progress"],
    icon: GraduationCap,
    image: "brand/landing/ecosystem-agents.jpg",
  },
  {
    key: "assessment",
    specialised: true,
    name: AGENTS.assessment,
    tagline: "Judges the outcome",
    description:
      "Scores demonstrated capability and the quality of delivered work, with the reasoning behind every mark.",
    stages: ["Assess & validate", "Recognition & impact"],
    sample:
      "Implementation quality 4/5: the workflow has a named approver and a fallback, but nothing measuring what it saved. Add that and this moves to Practitioner.",
    capabilities: ["Rubric with a reasoning trace", "Routes to human review"],
    icon: ClipboardCheck,
    image: "brand/landing/ecosystem-2.jpg",
  },
  {
    key: "content",
    specialised: true,
    name: AGENTS.content,
    tagline: "Builds the material",
    description:
      "Generates learning scenarios, cases and knowledge checks from the entity's own context, in Arabic and English.",
    stages: ["Personalised pathway", "Experiential learning"],
    sample:
      "Generated: a six-step case study built on your entity's public-awareness campaign, with an Arabic version, three discussion prompts and a knowledge check.",
    capabilities: ["Entity-specific cases", "Bilingual by default"],
    icon: Sparkles,
    image: "brand/landing/ecosystem-agents.jpg",
  },
  {
    key: "coaching",
    specialised: true,
    name: AGENTS.coaching,
    tagline: "Always on hand",
    description:
      "Navigates the platform, chases what is outstanding and answers questions in the flow of work.",
    stages: ["Onboarding", "Recognition & impact"],
    sample:
      "You have two workplace submissions waiting on your department manager and one credential ready to claim. Shall I open the validations, or your credential wallet?",
    capabilities: ["Context-aware answers", "Follows up for you"],
    icon: LifeBuoy,
    image: "brand/landing/ecosystem-3.jpg",
  },
  {
    key: "analytics",
    specialised: true,
    name: AGENTS.analytics,
    tagline: "Answers to leadership",
    description:
      "Rolls individual capability up to department, entity and federal level for managers, entity admins and leadership.",
    stages: ["Assess & validate", "Recognition & impact"],
    sample: `National readiness is at ${FEDERAL.readiness}, with ${FEDERAL.ministriesOnTrack} of ${FEDERAL.ministriesTotal} entities on track.${
      topGap
        ? ` ${topGap.ministries} entities name ${topGap.competency.short} as their biggest capability gap.`
        : ""
    }`,
    capabilities: ["Individual to federal roll-up", "Briefing-ready outputs"],
    icon: BarChart3,
    image: "brand/landing/ecosystem-2.jpg",
  },
  {
    key: "practice",
    specialised: false,
    name: AGENTS.practice,
    tagline: "Safe place to try",
    description:
      "Runs simulated workplace scenarios and digital twins so capability is practised before it is used on real work.",
    stages: ["Experiential learning", "Build & train"],
    sample:
      "Scenario: a resident disputes an AI-drafted reply from your department. Draft your response and I will score it against the federal responsible-AI checklist, line by line.",
    capabilities: ["Sandboxed scenarios", "Scored against policy"],
    icon: Brain,
    image: "brand/landing/ecosystem-3.jpg",
  },
];

/** The six specialised agents of the proposal, without the supporting one. */
export const SPECIALISED_AGENTS = LANDING_AGENTS.filter((agent) => agent.specialised);
