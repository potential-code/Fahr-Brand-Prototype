// Workplace project domain model.
//
// The proposal (4.5) treats the workplace project as the point where learning
// is applied to real work, and the evaluation as the point where it is
// certified. Everything a learner sees on those two screens is derived here:
// the staged brief they build, the AI Practice Partner's drafts, the
// governance verdict, the live impact estimate, the readiness score and — on
// the far side — the evaluation dimensions that score what they submitted.
//
// Front-end mock content only: no AI calls, no persistence.

import { AGENTS, LEARNER_PROFILE } from "@/lib/constants";
import type { ProjectIdea } from "@/lib/recommendations";
import type { Competency } from "@/lib/learningData";
import { assessTwin, type TwinProfile } from "@/lib/digitalTwin";

// ---------------------------------------------------------------------------
// The draft
// ---------------------------------------------------------------------------

export type DataSensitivity = "public" | "internal" | "personal";

export const SENSITIVITY_LABEL: Record<DataSensitivity, string> = {
  public: "Published / open data",
  internal: "Internal government data",
  personal: "Contains personal data",
};

export type ProjectDraft = {
  title: string;
  challenge: string;
  solution: string;
  /** Expected outcomes, one per line in the UI. Blank entries are ignored. */
  outcomes: string[];
  /** Measurement plan, one measure per line. Blank entries are ignored. */
  measures: string[];
  /** Who reviews the assistant's output before it is used. "" = not chosen. */
  humanCheckpoint: string;
  sensitivity: DataSensitivity;
  /** Will AI-assisted outputs be labelled as such? */
  disclosure: boolean;
  /** Hours one person spends on this task each week today. */
  hoursPerWeek: number;
  /** How many people in the department do this task. */
  peopleAffected: number;
  /** Share of the task the assistant carries, 0-100. */
  automationPct: number;
};

export const HUMAN_CHECKPOINTS = [
  "Section head reviews before release",
  "Communications lead signs off each output",
  "Two-person review for anything public-facing",
  "Data owner approves the source before each run",
] as const;

/**
 * The starting draft. Seeded from the learner's recommended project when they
 * have taken the assessment, so the project they build is the one their own
 * results asked for.
 */
export function defaultDraft(project?: (ProjectIdea & { competency: Competency }) | null): ProjectDraft {
  if (project) {
    return {
      title: project.title,
      challenge: "",
      solution: "",
      outcomes: [project.outcome, "", ""],
      measures: ["", "", ""],
      humanCheckpoint: "",
      sensitivity: "internal",
      disclosure: true,
      hoursPerWeek: 6,
      peopleAffected: 8,
      automationPct: 55,
    };
  }

  return {
    title: "AI-assisted public health campaign brief generator",
    challenge: "",
    solution: "",
    outcomes: ["", "", ""],
    measures: ["", "", ""],
    humanCheckpoint: "",
    sensitivity: "internal",
    disclosure: true,
    hoursPerWeek: 6,
    peopleAffected: 8,
    automationPct: 55,
  };
}

export const filled = (lines: string[]): string[] => lines.map((l) => l.trim()).filter(Boolean);

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

export type StageId = "challenge" | "solution" | "outcomes" | "measurement" | "review";

export type Stage = {
  id: StageId;
  label: string;
  question: string;
  guidance: string;
};

export const STAGES: Stage[] = [
  {
    id: "challenge",
    label: "Define the challenge",
    question: "Which real piece of your work is this project going to fix?",
    guidance:
      "Name the task, who does it today and what it costs the team. Evaluators score this on how specific it is — a named recurring task beats a general ambition.",
  },
  {
    id: "solution",
    label: "Design the AI solution",
    question: "How does AI carry the work, and where does a human stay in charge?",
    guidance:
      "Describe the steps the assistant runs, the data it reads and the point at which a person reviews its output. The human checkpoint is what makes this deployable inside a federal entity.",
  },
  {
    id: "outcomes",
    label: "Set expected outcomes",
    question: "What will be true in three months that is not true today?",
    guidance:
      "Three outcomes is the minimum. Keep them observable — something a colleague could confirm without taking your word for it.",
  },
  {
    id: "measurement",
    label: "Plan the measurement",
    question: "How will you prove it worked?",
    guidance:
      "Each outcome needs a measure with a baseline. Your entity reports these figures into the federal impact register, so they have to be countable.",
  },
  {
    id: "review",
    label: "Govern and submit",
    question: "Does it clear the guardrails?",
    guidance:
      "The governance check runs your brief against the federal AI policies. Clear every warning, confirm the impact estimate, then submit for evaluation.",
  },
];

export const stageIndex = (id: StageId): number => STAGES.findIndex((s) => s.id === id);

// ---------------------------------------------------------------------------
// AI Practice Partner — drafts and improvement passes
// ---------------------------------------------------------------------------

const ENTITY = LEARNER_PROFILE.entity;
const DEPARTMENT = LEARNER_PROFILE.department;

export type Suggestion = {
  /** The text that lands in the field when the learner accepts it. */
  text: string;
  /** What the Practice Partner says it did, shown above the draft. */
  rationale: string;
};

/** A drafted answer for one stage, written from the learner's own project. */
export function suggestFor(stage: StageId, draft: ProjectDraft): Suggestion | null {
  const subject = draft.title.trim() || "this project";

  switch (stage) {
    case "challenge":
      return {
        rationale: `Drafted from your project title and your role in ${DEPARTMENT}, ${ENTITY}. Edit the numbers to match what you actually see.`,
        text:
          `Every campaign we run starts with a brief that ${draft.peopleAffected} people in ${DEPARTMENT} assemble by hand. ` +
          `It takes roughly ${draft.hoursPerWeek} hours a week of back-and-forth between communications, content and the technical team, ` +
          `and the same audience and messaging decisions get re-argued each time. ` +
          `The delay pushes campaign launches back by days, and the briefs that come out are inconsistent enough that approvals bounce.`,
      };
    case "solution":
      return {
        rationale: `A multi-step design with the human checkpoint written in — the part evaluators look for first.`,
        text:
          `An assistant that turns an approved campaign objective into a complete draft brief: it pulls the audience segments from our own performance data, ` +
          `proposes content angles, drafts Arabic and English messaging against the approved tone guide, and produces the reporting template. ` +
          `It never publishes. Each brief goes to the named reviewer, who accepts, edits or rejects it, and the accepted version is what feeds the campaign. ` +
          `Rejected drafts are logged with the reason so the instructions improve over time.`,
      };
    case "outcomes":
      return {
        rationale: `Three observable outcomes sized to ${subject}.`,
        text: [
          `Brief preparation drops from ${draft.hoursPerWeek} hours a week to under two`,
          `Every campaign launches with an Arabic and English brief from the same source`,
          `Approval cycles shorten because reviewers receive a consistent structure each time`,
        ].join("\n"),
      };
    case "measurement":
      return {
        rationale: `Each measure has a baseline you can take this week, before anything is built.`,
        text: [
          `Hours per brief, measured against the current manual baseline`,
          `Number of briefs produced and accepted without rework`,
          `Days from objective to approved brief, before and after`,
        ].join("\n"),
      };
    default:
      return null;
  }
}

export type ImprovementPass = {
  before: string;
  after: string;
  /** What the pass added, in the order it added it. */
  additions: string[];
  note: string;
};

/**
 * The improvement pass: the Practice Partner reads what the learner wrote and
 * adds only the things that are genuinely missing, so the before/after diff is
 * different every time depending on what they already covered.
 */
export function improveSolution(text: string): ImprovementPass {
  const lower = text.toLowerCase();
  const additions: string[] = [];

  const has = (...needles: string[]) => needles.some((n) => lower.includes(n));

  if (!has("review", "sign off", "signs off", "approve", "human"))
    additions.push("A named human reviewer accepts or rejects every output before it is used.");
  if (!has("feedback", "improve over time", "learns", "logged"))
    additions.push("Rejected drafts are logged with the reason, and the instructions are revised monthly from that log.");
  if (!has("fails", "fallback", "unavailable", "manual route"))
    additions.push("If the assistant is unavailable the manual route stays open, so no campaign is blocked by it.");
  if (!has("source", "data", "record"))
    additions.push("Every output records which data sources it drew on, so the trail can be audited.");

  const trimmed = text.trim();
  const after = additions.length
    ? `${trimmed}${trimmed && !/[.!?]$/.test(trimmed) ? "." : ""} ${additions.join(" ")}`
    : trimmed;

  return {
    before: trimmed,
    after,
    additions,
    note: additions.length
      ? `${AGENTS.practice} added ${additions.length} thing${additions.length > 1 ? "s" : ""} evaluators look for and left the rest of your wording alone.`
      : `${AGENTS.practice} found nothing to add — your design already covers oversight, fallback and the improvement loop.`,
  };
}

// ---------------------------------------------------------------------------
// Governance
// ---------------------------------------------------------------------------

export type PolicyStatus = "pass" | "warn";

export type PolicyResult = {
  id: string;
  policy: string;
  reference: string;
  status: PolicyStatus;
  detail: string;
  /** What to do about it — only present on a warning. */
  remediation?: string;
  /** A one-click fix the check can apply to the draft, where one exists. */
  fix?: { label: string; patch: Partial<ProjectDraft> };
};

/** Runs the draft against the federal AI guardrails. Pure — safe to call on every keystroke. */
export function evaluatePolicies(draft: ProjectDraft): PolicyResult[] {
  const text = `${draft.challenge} ${draft.solution}`.toLowerCase();
  const measures = filled(draft.measures);
  const outcomes = filled(draft.outcomes);
  const anonymised = /anonym|aggregat|pseudonym|de-identif|consent/.test(text);

  return [
    {
      id: "data",
      policy: "Data classification and privacy",
      reference: "Federal AI Policy 3.1",
      ...(draft.sensitivity === "personal" && !anonymised
        ? {
            status: "warn" as const,
            detail: "The project is classified as containing personal data, and the brief does not say how that data is protected.",
            remediation:
              "Either reclassify the data as internal, or state in your solution how records are anonymised or aggregated before the assistant reads them.",
            fix: { label: "Reclassify as internal data", patch: { sensitivity: "internal" as DataSensitivity } },
          }
        : {
            status: "pass" as const,
            detail:
              draft.sensitivity === "personal"
                ? "Personal data is declared and the brief describes how it is protected before processing."
                : `Data classified as ${SENSITIVITY_LABEL[draft.sensitivity].toLowerCase()}. No personal-data handling declared.`,
          }),
    },
    {
      id: "human",
      policy: "Human oversight",
      reference: "Federal AI Policy 4.2",
      ...(draft.humanCheckpoint
        ? {
            status: "pass" as const,
            detail: `Oversight point recorded: ${draft.humanCheckpoint.toLowerCase()}.`,
          }
        : {
            status: "warn" as const,
            detail: "No human checkpoint is recorded. Nothing in the brief says who is accountable for what the assistant produces.",
            remediation: "Name the review point in the Design stage. Every AI-assisted output inside a federal entity needs an accountable reviewer.",
            fix: { label: "Add section-head review", patch: { humanCheckpoint: HUMAN_CHECKPOINTS[0] } },
          }),
    },
    {
      id: "disclosure",
      policy: "Transparency and disclosure",
      reference: "Federal AI Policy 4.5",
      ...(draft.disclosure
        ? { status: "pass" as const, detail: "AI-assisted outputs will be labelled, so colleagues know what they are reviewing." }
        : {
            status: "warn" as const,
            detail: "AI-assisted outputs are not labelled as such.",
            remediation: "Commit to labelling outputs the assistant drafted. Undisclosed AI content cannot be cleared for public-facing use.",
            fix: { label: "Commit to labelling outputs", patch: { disclosure: true } },
          }),
    },
    {
      id: "value",
      policy: "Measurable public value",
      reference: "Federal AI Policy 2.3",
      ...(measures.length >= 2
        ? { status: "pass" as const, detail: `${measures.length} measures recorded, each with a baseline to compare against.` }
        : {
            status: "warn" as const,
            detail: "Fewer than two measures are recorded, so the benefit cannot be verified after deployment.",
            remediation: "Add measures in the Measurement stage. Your entity reports these into the federal impact register.",
          }),
    },
    {
      id: "accountability",
      policy: "Records and accountability",
      reference: "Federal AI Policy 5.1",
      ...(outcomes.length >= 1 && draft.challenge.trim().length >= 60
        ? { status: "pass" as const, detail: "Scope, intended outcome and accountable owner are documented in the brief." }
        : {
            status: "warn" as const,
            detail: "The brief is too thin to form a record: the challenge or the intended outcome is missing.",
            remediation: "Complete the Challenge and Outcomes stages. The brief itself is the governance record for this project.",
          }),
    },
  ];
}

export const warningCount = (policies: PolicyResult[]): number => policies.filter((p) => p.status === "warn").length;

// ---------------------------------------------------------------------------
// Impact estimate
// ---------------------------------------------------------------------------

export type ImpactEstimate = {
  hoursPerMonth: number;
  hoursPerYear: number;
  workingDaysReturned: number;
  cycleReductionPct: number;
  band: "Emerging" | "Solid" | "High";
  bandNote: string;
};

const WEEKS_PER_MONTH = 4.33;
const WORKING_DAY_HOURS = 7.5;

export function estimateImpact(draft: ProjectDraft): ImpactEstimate {
  const hoursPerMonth = Math.round(draft.hoursPerWeek * WEEKS_PER_MONTH * draft.peopleAffected * (draft.automationPct / 100));
  const hoursPerYear = hoursPerMonth * 12;
  const workingDaysReturned = Math.round(hoursPerYear / WORKING_DAY_HOURS);
  const cycleReductionPct = Math.round(draft.automationPct * 0.6);

  const band: ImpactEstimate["band"] = hoursPerMonth >= 80 ? "High" : hoursPerMonth >= 25 ? "Solid" : "Emerging";

  const bandNote =
    band === "High"
      ? "Above the threshold your entity reports to the federal impact register."
      : band === "Solid"
        ? "A departmental-scale saving. Worth reporting at entity level."
        : "A team-scale saving. Consider whether more of the task can be carried, or more colleagues covered.";

  return { hoursPerMonth, hoursPerYear, workingDaysReturned, cycleReductionPct, band, bandNote };
}

// ---------------------------------------------------------------------------
// Readiness
// ---------------------------------------------------------------------------

export type ReadinessItem = {
  id: string;
  label: string;
  hint: string;
  stage: StageId;
  weight: number;
  done: boolean;
};

export type Readiness = {
  items: ReadinessItem[];
  percent: number;
  submittable: boolean;
  /** The first thing still standing between the learner and submission. */
  nextUp: ReadinessItem | null;
};

export function assessReadiness(draft: ProjectDraft, policies: PolicyResult[], governanceRun: boolean): Readiness {
  const outcomes = filled(draft.outcomes);
  const measures = filled(draft.measures);

  const items: ReadinessItem[] = [
    {
      id: "title",
      label: "The project has a title",
      hint: "Something a colleague would recognise",
      stage: "challenge",
      weight: 5,
      done: draft.title.trim().length >= 8,
    },
    {
      id: "challenge",
      label: "The challenge is described in your own words",
      hint: "At least a short paragraph naming the task and its cost",
      stage: "challenge",
      weight: 20,
      done: draft.challenge.trim().length >= 120,
    },
    {
      id: "solution",
      label: "The AI solution is designed",
      hint: "The steps the assistant runs and where a person reviews it",
      stage: "solution",
      weight: 20,
      done: draft.solution.trim().length >= 160,
    },
    {
      id: "checkpoint",
      label: "A human checkpoint is named",
      hint: "Who accepts or rejects the assistant's output",
      stage: "solution",
      weight: 10,
      done: draft.humanCheckpoint !== "",
    },
    {
      id: "outcomes",
      label: "Three expected outcomes",
      hint: "Observable in three months",
      stage: "outcomes",
      weight: 15,
      done: outcomes.length >= 3,
    },
    {
      id: "measures",
      label: "Three measures with baselines",
      hint: "How each outcome gets proved",
      stage: "measurement",
      weight: 15,
      done: measures.length >= 3,
    },
    {
      id: "governance",
      label: "Governance check passed",
      hint: "Run the check and clear every warning",
      stage: "review",
      weight: 15,
      done: governanceRun && warningCount(policies) === 0,
    },
  ];

  const percent = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);

  return {
    items,
    percent,
    submittable: items.every((i) => i.done),
    nextUp: items.find((i) => !i.done) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Submission and evaluation
// ---------------------------------------------------------------------------

export type ProjectSubmission = {
  draft: ProjectDraft;
  impact: ImpactEstimate;
  policies: PolicyResult[];
  /** ISO date string of the submission. */
  submittedAt: string;
};

/**
 * A complete, already-scored submission for the demo. The evaluation screen is
 * reachable from the sidebar without building anything first, so it needs a
 * worked example when nothing was submitted this session.
 */
export function demoSubmission(project?: (ProjectIdea & { competency: Competency }) | null): ProjectSubmission {
  const base = defaultDraft(project);
  const draft: ProjectDraft = {
    ...base,
    challenge: suggestFor("challenge", base)?.text ?? "",
    solution: suggestFor("solution", base)?.text ?? "",
    outcomes: (suggestFor("outcomes", base)?.text ?? "").split("\n"),
    measures: (suggestFor("measurement", base)?.text ?? "").split("\n"),
    humanCheckpoint: HUMAN_CHECKPOINTS[0],
  };

  return {
    draft,
    impact: estimateImpact(draft),
    policies: evaluatePolicies(draft),
    submittedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  };
}

export type EvaluationDimension = {
  id: string;
  label: string;
  value: number;
  summary: string;
  /** Why it scored what it scored, quoting the learner's own brief. */
  evidence: string[];
  assessedBy: string;
};

export type Evaluation = {
  dimensions: EvaluationDimension[];
  overall: number;
  points: number;
  verdict: string;
};

const clamp = (n: number, min = 45, max = 99) => Math.max(min, Math.min(max, Math.round(n)));

const quote = (text: string, max = 110): string => {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
};

/**
 * Scores a submission. Every dimension is computed from what the learner
 * actually wrote, so two different projects are evaluated differently.
 */
export function evaluateSubmission(
  submission: ProjectSubmission,
  twin?: TwinProfile,
): Evaluation {
  const { draft, impact, policies } = submission;
  const outcomes = filled(draft.outcomes);
  const measures = filled(draft.measures);
  const solution = draft.solution.toLowerCase();
  const warnings = warningCount(policies);

  const impactBonus = impact.band === "High" ? 18 : impact.band === "Solid" ? 10 : 2;
  const application = clamp(
    64 + impactBonus + Math.min(10, Math.floor(draft.challenge.trim().length / 90)) + (draft.humanCheckpoint ? 4 : 0),
  );

  const innovationSignals = ["multi-step", "steps", "feedback", "logged", "learns", "arabic", "template", "segment", "agent"].filter((s) =>
    solution.includes(s),
  ).length;
  const innovation = clamp(58 + innovationSignals * 5 + Math.min(8, Math.floor(draft.solution.trim().length / 160)));

  const overAutomated = draft.automationPct > 85;
  const feasibility = clamp(
    58 + measures.length * 7 + (draft.humanCheckpoint ? 8 : 0) + (outcomes.length >= 3 ? 6 : 0) - (overAutomated ? 12 : 0),
  );

  const governance = clamp(100 - warnings * 14, 40, 100);

  const dimensions: EvaluationDimension[] = [
    {
      id: "application",
      label: "Practical application",
      value: application,
      summary: "How firmly the project is attached to real, recurring work.",
      assessedBy: AGENTS.assessment,
      evidence: [
        `You named a task carried by ${draft.peopleAffected} colleagues taking ${draft.hoursPerWeek} hours each per week.`,
        `Your challenge statement opens: "${quote(draft.challenge || "Not provided")}"`,
        `The estimate returns ${impact.hoursPerMonth} hours a month — a ${impact.band.toLowerCase()} impact project.`,
      ],
    },
    {
      id: "innovation",
      label: "Innovation",
      value: innovation,
      summary: "Whether the design goes beyond single-prompt use of AI.",
      assessedBy: AGENTS.assessment,
      evidence: [
        innovationSignals >= 4
          ? "The design chains several steps together rather than treating AI as a one-shot drafting tool."
          : "The design uses AI for a contained task. Chaining more of the workflow would raise this score.",
        `Solution described in ${draft.solution.trim().split(/\s+/).filter(Boolean).length} words.`,
        solution.includes("feedback") || solution.includes("logged")
          ? "An improvement loop is built in, which is what separates a pilot from a one-off."
          : "No improvement loop is described, so the assistant will not get better after launch.",
      ],
    },
    {
      id: "feasibility",
      label: "Feasibility",
      value: feasibility,
      summary: "Whether this can actually be run inside the entity as described.",
      assessedBy: AGENTS.analytics,
      evidence: [
        draft.humanCheckpoint
          ? `Oversight is workable: ${draft.humanCheckpoint.toLowerCase()}.`
          : "No oversight point is named, which would block deployment.",
        `${measures.length} measure${measures.length === 1 ? "" : "s"} recorded, so progress can be tracked from week one.`,
        overAutomated
          ? `At ${draft.automationPct}% automation the human review becomes a rubber stamp. Consider carrying less of the task.`
          : `${draft.automationPct}% of the task carried by the assistant is a realistic first deployment.`,
      ],
    },
    {
      id: "governance",
      label: "Governance compliance",
      value: governance,
      summary: "The project against the federal AI guardrails.",
      assessedBy: `${AGENTS.assessment} · FAHR Governance and Audit`,
      evidence: [
        warnings === 0
          ? `All ${policies.length} policy checks passed at submission.`
          : `${warnings} of ${policies.length} policy checks were still flagged at submission.`,
        `Data classification: ${SENSITIVITY_LABEL[draft.sensitivity].toLowerCase()}.`,
        draft.disclosure ? "AI-assisted outputs will be labelled." : "AI-assisted outputs are not labelled.",
      ],
    },
  ];

  // The twin the learner built in the Lab is assessed alongside the project it
  // was built for — including the federal guardrails it always operates
  // under, both of which are permanently enforced rather than left on.
  if (twin && twin.trainedAt) {
    const assessed = assessTwin(twin);
    dimensions.push({
      id: "twin",
      label: "Digital twin governance",
      value: assessed.value,
      summary: assessed.summary,
      assessedBy: AGENTS.assessment,
      evidence: assessed.evidence,
    });
  }

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.value, 0) / dimensions.length);
  const points = Math.round((overall * 5) / 10) * 10;

  const verdict =
    overall >= 88
      ? "Approved for pilot. This is ready to run in the department as written."
      : overall >= 75
        ? "Approved with notes. Strengthen the flagged dimension before you scale beyond your own team."
        : "Approved for a limited trial. Return with measured results before wider rollout.";

  return { dimensions, overall, points, verdict };
}

// ---------------------------------------------------------------------------
// The human review thread
// ---------------------------------------------------------------------------

export type ReviewMessage = {
  id: string;
  author: string;
  initials: string;
  role: string;
  /** The learner's own messages sit on the other side of the thread. */
  side: "learner" | "reviewer";
  when: string;
  body: string;
  decision?: "approved";
};

export function reviewThread(submission: ProjectSubmission, evaluation: Evaluation): ReviewMessage[] {
  const weakest = [...evaluation.dimensions].sort((a, b) => a.value - b.value)[0];
  const measures = filled(submission.draft.measures);

  return [
    {
      id: "r1",
      author: LEARNER_PROFILE.name,
      initials: "AM",
      role: LEARNER_PROFILE.role,
      side: "learner",
      when: "On submission",
      body: `Submitting "${submission.draft.title}". The estimate is ${submission.impact.hoursPerMonth} hours a month back to the team, measured on ${measures.length || "the recorded"} baselines.`,
    },
    {
      id: "r2",
      author: "Fatima Al Suwaidi",
      initials: "FA",
      role: "Ministry Innovation Lead",
      side: "reviewer",
      when: "Two days later",
      body: `Read it over the weekend. This targets the bottleneck I hear about most, and the oversight point is the right one. One question before I sign: ${weakest.label.toLowerCase()} scored ${weakest.value}. How would you handle it in the first month?`,
    },
    {
      id: "r3",
      author: LEARNER_PROFILE.name,
      initials: "AM",
      role: LEARNER_PROFILE.role,
      side: "learner",
      when: "Same day",
      body: `I would keep the first month deliberately narrow — one campaign type, the named reviewer on every output, and a weekly look at what was rejected and why. If the rejection rate holds under a fifth, we widen it.`,
    },
    {
      id: "r4",
      author: "Fatima Al Suwaidi",
      initials: "FA",
      role: "Ministry Innovation Lead",
      side: "reviewer",
      when: "Today",
      decision: "approved",
      body: `That is exactly the answer I wanted. Approved for immediate pilot within the communications team. I have asked the section head to hold the review slot, and I want the first month's figures at the entity review.`,
    },
  ];
}
