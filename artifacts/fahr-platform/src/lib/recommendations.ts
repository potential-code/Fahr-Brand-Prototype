// Personalised recommendation engine for the AI Skills Advisor report.
//
// The proposal (5.2 / 5.4) says the platform recommends "learning activities,
// resources, coaching interactions, practical exercises, and assessments", and
// that personalisation includes refresher content, additional practice,
// targeted assessments, contextual coaching and just-in-time resources.
//
// Everything below is derived from the learner's own answers: which
// competencies came out weakest drives which priorities, activities, coaching
// topics, resources, events and workplace project are surfaced. Two learners
// with different answers get different plans.
//
// Front-end mock content only — no backend.

import {
  ASSESSMENT_QUESTIONS,
  COMPETENCY_BY_ID,
  type Competency,
} from "@/lib/learningData";
import type { AssessmentResult } from "@/lib/LearnerProgressContext";

// ---------------------------------------------------------------------------
// Content pools, keyed by the FAHR competency they close
// ---------------------------------------------------------------------------

export type PracticeActivity = {
  title: string;
  scenario: string;
  duration: string;
  format: string;
};

export type CoachingTopic = {
  focus: string;
  detail: string;
};

export type Resource = {
  title: string;
  kind: string;
  readTime: string;
  summary: string;
};

export type LiveSession = {
  title: string;
  host: string;
  format: string;
  /** Days from today — turned into a real date at render time. */
  inDays: number;
  seatsNote: string;
};

export type ProjectIdea = {
  title: string;
  brief: string;
  outcome: string;
};

const PRACTICE: Record<string, PracticeActivity> = {
  literacy: {
    title: "Fact-check an AI-drafted circular summary",
    scenario:
      "You are handed an AI summary of a federal circular that contains two invented reference numbers. Find them, correct the record, and note the check that would have caught them earlier.",
    duration: "20 min",
    format: "Guided exercise",
  },
  prompting: {
    title: "Rebuild a weak instruction into a structured brief",
    scenario:
      "Take a one-line request for a public notice and rewrite it with role, context, approved facts, constraints and output format. Compare both drafts side by side.",
    duration: "25 min",
    format: "Workplace scenario",
  },
  analytics: {
    title: "Interrogate a campaign performance dataset with AI",
    scenario:
      "Ask AI to compare audience segments in a service performance export, then verify its strongest claim against the source system before you would report it.",
    duration: "30 min",
    format: "Workplace scenario",
  },
  agentic: {
    title: "Design a two-step assistant for a recurring task",
    scenario:
      "Map a task your team repeats every month into steps, tools and human checkpoints, then run the first step with AI and record where review is mandatory.",
    duration: "30 min",
    format: "Lab exercise",
  },
  governance: {
    title: "Run a governance review on an AI-generated briefing",
    scenario:
      "Classify the data used, identify the privacy exposure, and record the human-in-the-loop decision before the briefing could leave your entity.",
    duration: "20 min",
    format: "Role-play review",
  },
};

const COACHING: Record<string, CoachingTopic> = {
  literacy: {
    focus: "Knowing when an AI answer is safe to use",
    detail:
      "Work through outputs from your own week and decide, each time, whether it is ready to send, ready to check, or not a job for AI at all.",
  },
  prompting: {
    focus: "Getting the output right in one iteration, not five",
    detail:
      "Bring a draft that came back wrong. The coach helps you diagnose whether the miss was context, constraint or format, and correct it in a single pass.",
  },
  analytics: {
    focus: "Separating reach from outcome when reporting upward",
    detail:
      "Rehearse the leadership question 'but did it work' against your real numbers, and build the answer AI can help you evidence.",
  },
  agentic: {
    focus: "Choosing which recurring task to automate first",
    detail:
      "Score your team's repeating work on frequency, reviewability and recoverability, and leave with one task worth building an assistant for.",
  },
  governance: {
    focus: "Applying federal AI policy without slowing delivery",
    detail:
      "Walk a real output through classification, privacy and human oversight so the controls become a habit rather than a blocker.",
  },
};

const MENTORING: Record<string, string> = {
  literacy: "Help a colleague run their first AI-assisted task end to end",
  prompting: "Run a short prompt clinic for your section",
  analytics: "Walk your team through reading an AI-assisted analysis critically",
  agentic: "Demonstrate your automation thinking to a neighbouring department",
  governance: "Coach a colleague through their first governance review",
};

const RESOURCES: Record<string, Resource[]> = {
  literacy: [
    {
      title: "The three ways AI fails in public service",
      kind: "Knowledge article",
      readTime: "6 min read",
      summary: "Fabrication, staleness and overreach — with the federal example that exposed each one.",
    },
    {
      title: "Is this task a candidate for AI?",
      kind: "Checklist",
      readTime: "3 min read",
      summary: "The frequency, reviewability and recoverability test, on one page.",
    },
  ],
  prompting: [
    {
      title: "Prompt patterns for government communications",
      kind: "Pattern library",
      readTime: "8 min read",
      summary: "Nine reusable structures for notices, briefings, summaries and replies to residents.",
    },
    {
      title: "Bilingual prompting: Arabic and English in one brief",
      kind: "Knowledge article",
      readTime: "5 min read",
      summary: "How to hold tone and terminology steady across both languages in a single instruction.",
    },
  ],
  analytics: [
    {
      title: "From impressions to outcomes: measuring what changed",
      kind: "Knowledge article",
      readTime: "7 min read",
      summary: "Choosing the one measure that answers whether a programme actually worked.",
    },
    {
      title: "Sanity-checking an AI data claim",
      kind: "Checklist",
      readTime: "4 min read",
      summary: "Four verifications to run before an AI-derived figure reaches a leadership deck.",
    },
  ],
  agentic: [
    {
      title: "Anatomy of an agentic workflow",
      kind: "Knowledge article",
      readTime: "9 min read",
      summary: "Plan, tool, checkpoint, feedback — the four parts every reusable assistant needs.",
    },
    {
      title: "Where to place human checkpoints",
      kind: "Reference",
      readTime: "5 min read",
      summary: "A decision table for what an assistant may finish and what a person must confirm.",
    },
  ],
  governance: [
    {
      title: "Federal AI governance essentials",
      kind: "Policy summary",
      readTime: "6 min read",
      summary: "Oversight, explainability and data handling expectations in plain language.",
    },
    {
      title: "Data classification quick reference",
      kind: "Reference",
      readTime: "3 min read",
      summary: "What may and may not be entered into an AI tool, by classification level.",
    },
  ],
};

/** Just-in-time reading the AI Content Assistant can offer for a competency. */
export function resourcesForCompetency(competencyId: string): Resource[] {
  return RESOURCES[competencyId] ?? [];
}

const EVENTS: Record<string, LiveSession> = {
  literacy: {
    title: "AI fundamentals clinic for federal teams",
    host: "FAHR AI Academy",
    format: "Virtual · 60 min",
    inDays: 6,
    seatsNote: "Open to all entities",
  },
  prompting: {
    title: "Prompt craft lab: live rewrite session",
    host: "FAHR AI Academy",
    format: "Virtual · 90 min",
    inDays: 11,
    seatsNote: "24 seats remaining",
  },
  analytics: {
    title: "Analytics with AI: federal service data walkthrough",
    host: "Ministry of Health and Prevention",
    format: "In person, Dubai · 2 hours",
    inDays: 17,
    seatsNote: "12 seats remaining",
  },
  agentic: {
    title: "Agentic AI Lab open session",
    host: "FAHR Programme Team",
    format: "Virtual · 2 hours",
    inDays: 9,
    seatsNote: "Bring a task to automate",
  },
  governance: {
    title: "Responsible AI governance briefing",
    host: "FAHR Governance Office",
    format: "Virtual · 45 min",
    inDays: 4,
    seatsNote: "Recorded for later viewing",
  },
};

const PROJECTS: Record<string, ProjectIdea> = {
  literacy: {
    title: "Publish an AI review checklist for your section",
    brief:
      "Turn the review habits from your courses into a one-page checklist your colleagues apply before any AI-assisted output leaves the section.",
    outcome: "A published checklist in use by your team, with adoption evidenced over one month",
  },
  prompting: {
    title: "Build a reusable prompt library for your team's recurring content",
    brief:
      "Capture the five pieces of content your team writes most often and turn each into a tested, reusable instruction with approved tone and constraints.",
    outcome: "Five tested prompts in shared use, with drafting time measured before and after",
  },
  analytics: {
    title: "Automate your monthly performance summary",
    brief:
      "Use AI to compile the data, draft the narrative and flag anomalies for your monthly report, keeping human sign-off on the final figures.",
    outcome: "A repeatable monthly summary with hours saved recorded against the manual baseline",
  },
  agentic: {
    title: "Ship an assistant for one recurring team deliverable",
    brief:
      "Design, build and hand over a multi-step assistant that carries one repeating deliverable forward with defined human checkpoints.",
    outcome: "A working assistant in departmental use, evaluated by AI and confirmed by your line manager",
  },
  governance: {
    title: "Document the governance trail for one AI-assisted output",
    brief:
      "Take a real AI-assisted output and produce the full trail: data classification, privacy check, oversight decision and accountable owner.",
    outcome: "A reusable governance record template adopted by your department",
  },
};

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

export type Priority = {
  competency: Competency;
  rank: number;
  score: number;
  target: number;
  headline: string;
  /** Quotes the learner's own weakest answer in this competency where available. */
  evidence: string | null;
};

export type CoachingSession = {
  id: string;
  focus: string;
  detail: string;
  competency: Competency;
  when: string;
  kind: "gap" | "strength";
};

export type ResourceCard = Resource & { competency: Competency };
export type PracticeCard = PracticeActivity & { competency: Competency };
export type EventCard = LiveSession & { competency: Competency; dateLabel: string };

export type NextAssessment = {
  title: string;
  weeks: number;
  dueLabel: string;
  questionCount: number;
  competencies: Competency[];
  note: string;
};

export type Recommendations = {
  priorities: Priority[];
  practice: PracticeCard[];
  coaching: CoachingSession[];
  nextAssessment: NextAssessment;
  resources: ResourceCard[];
  events: EventCard[];
  project: ProjectIdea & { competency: Competency };
};

/** Re-check cadence: the further behind a learner is, the sooner they are re-tested. */
const WEEKS_BY_LEVEL: Record<string, number> = {
  aware: 4,
  emerging: 5,
  practitioner: 6,
  advanced: 8,
  champion: 12,
};

const COACHING_CADENCE: Record<string, string[]> = {
  aware: ["This week", "In two weeks", "In four weeks"],
  emerging: ["This week", "In two weeks", "In five weeks"],
  practitioner: ["Next week", "In three weeks", "In six weeks"],
  advanced: ["In two weeks", "In five weeks", "In eight weeks"],
  champion: ["In three weeks", "In six weeks", "In ten weeks"],
};

function formatDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 86_400_000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function shorten(text: string, max = 96): string {
  const clean = text.replace(/^"|"$/g, "").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The weakest answer the learner gave inside a competency, quoted back so the
 * priority is visibly theirs rather than a generic recommendation.
 */
function weakestAnswer(competencyId: string, answers: Record<string, number>): string | null {
  const questions = ASSESSMENT_QUESTIONS.filter((q) => q.competencyId === competencyId);
  let worst: { scenario: string; label: string; score: number } | null = null;

  for (const q of questions) {
    const idx = answers[q.id];
    if (idx === undefined) continue;
    const option = q.options[idx];
    if (!option) continue;
    if (!worst || option.score < worst.score) {
      worst = { scenario: q.scenario, label: option.label, score: option.score };
    }
  }

  if (!worst || worst.score >= 3) return null;
  return `On "${worst.scenario}" you chose "${shorten(worst.label)}"`;
}

/** The realistic next target for a competency: +25 points, rounded to a clean 5. */
export function targetFor(score: number): number {
  return Math.min(100, Math.round((score + 25) / 5) * 5);
}

function headlineFor(competency: Competency, score: number): string {
  if (score < 34) return `Build a working foundation in ${competency.short}`;
  if (score < 67) return `Move ${competency.short} from occasional to dependable`;
  return `Turn ${competency.short} into something you can teach`;
}

/**
 * Builds the full recommendation set for a completed assessment.
 * `answers` is optional — without it the priorities simply lose their quoted evidence line.
 */
export function buildRecommendations(
  result: AssessmentResult,
  answers: Record<string, number> = {},
): Recommendations {
  const gapIds = result.gaps;
  const strengthId = result.strengths[0];
  const cadence = COACHING_CADENCE[result.levelId] ?? COACHING_CADENCE.practitioner;

  const priorities: Priority[] = gapIds.map((id, i) => {
    const competency = COMPETENCY_BY_ID[id];
    const score = result.scores[id] ?? 0;
    return {
      competency,
      rank: i + 1,
      score,
      target: targetFor(score),
      headline: headlineFor(competency, score),
      evidence: weakestAnswer(id, answers),
    };
  });

  const practice: PracticeCard[] = gapIds
    .map((id) => (PRACTICE[id] ? { ...PRACTICE[id], competency: COMPETENCY_BY_ID[id] } : null))
    .filter((x): x is PracticeCard => x !== null);

  const coaching: CoachingSession[] = [
    ...gapIds.slice(0, 2).map((id, i) => ({
      id: `coach-${id}`,
      ...COACHING[id],
      competency: COMPETENCY_BY_ID[id],
      when: cadence[i],
      kind: "gap" as const,
    })),
    {
      id: `coach-strength-${strengthId}`,
      focus: MENTORING[strengthId] ?? "Share what you already do well with your cohort",
      detail:
        `${COMPETENCY_BY_ID[strengthId].label} is your strongest area at ${result.scores[strengthId]}%. ` +
        "Teaching it consolidates it, and counts towards Recognition and Impact.",
      competency: COMPETENCY_BY_ID[strengthId],
      when: cadence[2],
      kind: "strength" as const,
    },
  ];

  const weeks = WEEKS_BY_LEVEL[result.levelId] ?? 6;
  const nextAssessment: NextAssessment = {
    title: `Targeted re-check: ${gapIds.map((id) => COMPETENCY_BY_ID[id].short).join(", ")}`,
    weeks,
    dueLabel: formatDate(weeks * 7),
    questionCount: gapIds.length * 3,
    competencies: gapIds.map((id) => COMPETENCY_BY_ID[id]),
    note:
      `Only the ${gapIds.length} competencies above are re-tested. ` +
      `Your ${result.levelLabel} banding sets the ${weeks}-week interval — it shortens if you finish your pathway sooner.`,
  };

  // Two resources for the priority gap, one for each remaining gap: the most
  // urgent competency gets the deepest support.
  const resources: ResourceCard[] = [
    ...(RESOURCES[gapIds[0]] ?? []).map((r) => ({ ...r, competency: COMPETENCY_BY_ID[gapIds[0]] })),
    ...gapIds.slice(1).flatMap((id) => {
      const first = (RESOURCES[id] ?? [])[0];
      return first ? [{ ...first, competency: COMPETENCY_BY_ID[id] }] : [];
    }),
  ];

  const events: EventCard[] = gapIds
    .map((id) =>
      EVENTS[id]
        ? { ...EVENTS[id], competency: COMPETENCY_BY_ID[id], dateLabel: formatDate(EVENTS[id].inDays) }
        : null,
    )
    .filter((x): x is EventCard => x !== null)
    .sort((a, b) => a.inDays - b.inDays);

  const projectSource = PROJECTS[gapIds[0]] ?? PROJECTS.agentic;
  const project = { ...projectSource, competency: COMPETENCY_BY_ID[gapIds[0]] };

  return { priorities, practice, coaching, nextAssessment, resources, events, project };
}
