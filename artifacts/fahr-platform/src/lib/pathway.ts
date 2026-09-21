// The Personalised Learning Pathway: one ordered journey of mixed activity
// formats, derived from the learner's baseline assessment.
//
// The proposal (4.3) describes the pathway as a single ordered structure
// carrying self-paced courses, instructor-led virtual sessions, microlearning,
// downloadable resources, practical assignments and targeted assessments, each
// assigned by competency and assessment outcome. Everything here therefore
// comes out of the recommendation builder — pages consume this, they never
// invent their own activity pool.
//
// Front-end mock content only — no backend.

import { AGENTS, LEARNER_PROFILE } from "@/lib/constants";
import {
  COMPETENCY_BY_ID,
  COURSES,
  COURSE_BY_ID,
  type Competency,
  type Course,
  type QuizQuestion,
} from "@/lib/learningData";
import { buildRecommendations } from "@/lib/recommendations";
import type { AssessmentResult } from "@/lib/LearnerProgressContext";

export type PathwayFormat =
  | "course"
  | "microlearning"
  | "virtual-session"
  | "practical-assignment"
  | "simulation"
  | "lab"
  | "workplace-project"
  | "assessment";

/** Human label shown on every pathway item, so the mix of formats is explicit. */
export const FORMAT_LABEL: Record<PathwayFormat, string> = {
  course: "Self-paced course",
  microlearning: "Microlearning",
  "virtual-session": "Virtual session",
  "practical-assignment": "Practical assignment",
  simulation: "Scenario simulation",
  lab: "Agentic AI Lab",
  "workplace-project": "Workplace project",
  assessment: "Targeted assessment",
};

export type RoleplayOption = {
  label: string;
  reply: string;
  /** Whether the choice reflects responsible practice. */
  good: boolean;
};

export type Roleplay = {
  opening: string;
  options: RoleplayOption[];
};

export type PathwayItem = {
  id: string;
  format: PathwayFormat;
  title: string;
  description: string;
  duration: string;
  competency: Competency;
  /** The named agent that assigned this item. */
  agent: string;
  /**
   * Why this item was assigned to this learner. Required, so no activity can
   * ever open without the coach explaining its presence.
   */
  coachNote: string;
  /** Present when the item is a catalogue course. */
  courseId?: string;
  /** Present when the item opens a different screen rather than an activity. */
  href?: string;
  hrefLabel?: string;
  /** Secondary line — a date, a host, a seat count. */
  meta?: string;
  /** Reading body for microlearning items. */
  body?: string[];
  /** The three points a reading item should leave the learner holding. */
  takeaways?: string[];
  /** Instruction list for assignments, lab work and projects. */
  steps?: string[];
  /** A ready-to-use instruction the learner can copy into their AI assistant. */
  samplePrompt?: string;
  /** Turns on the mock submission box, with this as its guidance line. */
  submissionPrompt?: string;
  /** Running order for a live session. */
  agenda?: string[];
  /** Who runs a live session, and where. */
  host?: string;
  venue?: string;
  /** Knowledge check that closes a microlearning item. */
  questions?: QuizQuestion[];
  roleplay?: Roleplay;
  /** True for items inserted after the pathway adapted mid-flight. */
  adaptive?: boolean;
};

export type ItemStatus = "completed" | "in-progress" | "recommended" | "available" | "locked";

/**
 * Gating rule for the pathway, kept pure so the page never has to reason about
 * it: courses stay open at any time, and the activities between them unlock in
 * order — the first incomplete one is in progress, the next is recommended,
 * everything after that is locked.
 */
export function derivePathwayStatuses(
  items: PathwayItem[],
  coursePercents: Record<string, number>,
  completedActivityIds: string[],
): ItemStatus[] {
  let incompleteActivities = 0;
  return items.map((item) => {
    if (item.courseId) {
      const percent = coursePercents[item.courseId] ?? 0;
      if (percent === 100) return "completed";
      return percent > 0 ? "in-progress" : "available";
    }
    if (completedActivityIds.includes(item.id)) return "completed";
    const status: ItemStatus =
      incompleteActivities === 0 ? "in-progress" : incompleteActivities === 1 ? "recommended" : "locked";
    incompleteActivities += 1;
    return status;
  });
}

const ROLEPLAYS: Record<string, Roleplay> = {
  literacy: {
    opening:
      "A colleague forwards an AI-drafted answer to a resident that quotes a federal circular by number. They want to send it in ten minutes. What do you tell them?",
    options: [
      {
        label: "Send it — the circular number makes it verifiable.",
        reply:
          "A reference number is exactly the kind of detail a model invents convincingly. Nothing has been verified yet. The safer instruction is to check the number against the official source first, even under time pressure.",
        good: false,
      },
      {
        label: "Hold it until the circular number is checked against the official source.",
        reply:
          "That is the right call. You separated fluency from accuracy and protected the entity from publishing a plausible-sounding fabrication. Scenario passed.",
        good: true,
      },
    ],
  },
  prompting: {
    opening:
      "Your director needs a 120-word notice for residents in an hour. Your first AI draft came back generic and off-tone. How do you instruct me next?",
    options: [
      {
        label: "\"Make it better and more official.\"",
        reply:
          "That gives me nothing to act on, so you will get another guess. Diagnose the miss first: was it missing context, a missing constraint, or the wrong format? Then correct that one thing.",
        good: false,
      },
      {
        label: "\"Rewrite in 120 words, formal and reassuring, using only the approved facts below, and follow this example.\"",
        reply:
          "Excellent. Role, constraint, approved source and a reference example in one pass — that is a one-iteration correction rather than five. Scenario passed.",
        good: true,
      },
    ],
  },
  analytics: {
    opening:
      "Leadership has seen your campaign reach figures and asks the obvious question: did it actually work? What do you want me to pull?",
    options: [
      {
        label: "Total impressions and the best-performing post.",
        reply:
          "That answers how many people saw it, not whether anything changed. Leadership will ask again. Point me at the service action the campaign asked residents to take.",
        good: false,
      },
      {
        label: "The change in the service action we asked residents to take, checked against the source system.",
        reply:
          "That is the measure that answers the question, and verifying it against the source system means you can defend the number in the room. Scenario passed.",
        good: true,
      },
    ],
  },
  agentic: {
    opening:
      "Your team spends two days a month compiling the same performance report. You have me for a week. What do you want me to build?",
    options: [
      {
        label: "Proofread the finished report each month.",
        reply:
          "That saves minutes on a two-day task. The repetition is the signal: this is a multi-step task that repeats, which is exactly when it is worth building an assistant rather than an edit pass.",
        good: false,
      },
      {
        label: "An assistant that gathers the data, drafts the narrative and flags anomalies for human review.",
        reply:
          "Right scope. Plan, tools, and a human checkpoint at the point where a mistake would matter. That is an agentic workflow rather than a prompt. Scenario passed.",
        good: true,
      },
    ],
  },
  governance: {
    opening:
      "A rumour about a public health programme is spreading and communications want a rapid response. What do you instruct me to draft?",
    options: [
      {
        label: "A tweet denying the rumour immediately.",
        reply:
          "Without approved talking points we risk publishing something we then have to correct. The stronger move is an internal holding statement, escalated to policy, before anything goes public.",
        good: false,
      },
      {
        label: "A holding statement built from approved policy, flagged for human review.",
        reply:
          "That matches federal responsible-AI expectations: approved sources, a named human accountable, and no unreviewed output in public. Scenario passed.",
        good: true,
      },
    ],
  },
};

function roleplayFor(competencyId: string): Roleplay {
  return ROLEPLAYS[competencyId] ?? ROLEPLAYS.governance;
}

/**
 * Checks for the two competencies the course catalogue does not yet cover —
 * microlearning is how those gaps are addressed, so they need their own
 * questions rather than borrowing a course's.
 */
const MICRO_CHECKS: Record<string, QuizQuestion[]> = {
  analytics: [
    {
      id: "mc-an-1",
      question: "A campaign reached 400,000 residents. What does that number tell you on its own?",
      options: [
        "That the campaign succeeded",
        "How many people were exposed to it, and nothing about what changed",
        "That the message was understood",
        "That the service is performing well",
      ],
      correctIndex: 1,
      explanation:
        "Reach is an exposure measure. It says how many people could have seen something, not whether behaviour, satisfaction or service load moved. Leadership decisions need the second kind of number.",
    },
    {
      id: "mc-an-2",
      question: "An AI summary of your service data reports a 12% improvement. What is your first move?",
      options: [
        "Put it in the report — the model read the whole dataset",
        "Round it down to be safe",
        "Trace the figure back to the source system before it leaves your desk",
        "Ask the model how confident it is",
      ],
      correctIndex: 2,
      explanation:
        "A model's confidence is not evidence, and rounding hides the problem rather than solving it. Any number you are willing to put in front of leadership must be traceable to the system it came from.",
    },
  ],
  agentic: [
    {
      id: "mc-ag-1",
      question: "Which task is the strongest candidate for an agentic workflow rather than a single prompt?",
      options: [
        "Rewriting one paragraph in a formal tone",
        "Translating a short notice",
        "A monthly report that pulls data from three systems, drafts a narrative and flags anomalies",
        "Checking a document for typos",
      ],
      correctIndex: 2,
      explanation:
        "Agentic workflows earn their setup cost when a task is multi-step, uses several sources and repeats. A single rewrite or translation is a one-shot prompt.",
    },
    {
      id: "mc-ag-2",
      question: "Where does the human checkpoint belong in an agentic workflow?",
      options: [
        "At the very start, before the agent runs",
        "At the point where a mistake would reach a resident or a decision-maker",
        "Nowhere — the agent is autonomous by definition",
        "After the output has been published, as a review",
      ],
      correctIndex: 1,
      explanation:
        "Autonomy is scoped, not absolute. The checkpoint goes where the consequence is — immediately before output leaves the entity — because a review after publication is a correction, not a control.",
    },
  ],
};

/**
 * A short knowledge check for a microlearning item, taken from the catalogue
 * course that teaches the same competency so the questions stay real, and
 * falling back to purpose-written questions where no course covers it.
 */
function checkQuestionsFor(competencyId: string): QuizQuestion[] {
  const course = COURSES.find((c) => c.competencyId === competencyId);
  if (course) return course.pretest.questions.slice(0, 2);
  return MICRO_CHECKS[competencyId] ?? [];
}

/** The three points a reading item should leave the learner holding onto. */
const TAKEAWAYS: Record<string, string[]> = {
  literacy: [
    "Fluent output and correct output are different things — the model optimises for the first.",
    "Reference numbers, dates and quoted policy are the details most likely to be invented.",
    "Before you forward anything, name the source you checked it against.",
  ],
  prompting: [
    "A weak result is usually a missing constraint, not a weak model.",
    "Role, context, approved facts, constraint and output format turn a request into a brief.",
    "Correct one thing per iteration, so you learn which instruction actually moved the output.",
  ],
  analytics: [
    "Reach tells you who was exposed; only an outcome measure tells you whether anything changed.",
    "Any AI-derived figure must be traceable to the system it came from before it leaves your desk.",
    "State the comparison as well as the number — a percentage with no baseline answers nothing.",
  ],
  agentic: [
    "Automation earns its setup cost when a task is multi-step, multi-source and repeats.",
    "Every assistant needs a plan, its tools, a human checkpoint and a feedback route.",
    "Put the checkpoint where the consequence is, immediately before output leaves the entity.",
  ],
  governance: [
    "Classify the data before you choose the tool, not after.",
    "A named accountable human is part of the output, not an afterthought.",
    "Record the oversight decision — it is what makes the work defensible a month later.",
  ],
};

/** A concrete instruction the learner can copy straight into their assistant. */
const SAMPLE_PROMPTS: Record<string, string> = {
  literacy:
    "You are reviewing an AI-drafted summary of a federal circular. List every factual claim it makes — reference numbers, dates, entity names and obligations — as a checklist, and mark which ones cannot be confirmed from the text I give you. Do not add any new facts.",
  prompting:
    "Act as a federal government communications officer. Rewrite the notice below in 120 words, formal and reassuring, in both English and Arabic, using only the approved facts I provide. Keep the service name exactly as written. Return the two versions side by side.",
  analytics:
    "Using only the export below, compare the two audience segments on the service action we asked residents to take. Show the baseline, the change, and the period covered. For every figure, state which column it came from, and flag anything you had to infer.",
  agentic:
    "Break our monthly performance report into a sequence of steps. For each step state the input, the tool or system needed, the output, and whether a human must confirm it before the next step runs. Mark the single step where a mistake would reach a decision-maker.",
  governance:
    "Review the draft below as a governance officer. Identify the data classification involved, any personal data exposure, the federal responsible-AI expectations that apply, and the human sign-off required before this can be published. Do not rewrite the draft.",
};

/** A running order for a live session, specific to the capability it targets. */
function agendaFor(competency: Competency): string[] {
  return [
    `What good ${competency.short} practice looks like inside a federal entity`,
    `Facilitator walkthrough: ${competency.description}`,
    "Bring-your-own-task clinic — you work on your own material, live",
    "Common failure modes, and the check that catches each one",
    "What to practise in the week after, and how it is evidenced",
  ];
}

/**
 * Guaranteed panel content. Any item without a reading body, step list,
 * role-play or knowledge check still opens with something substantive to read,
 * so the pathway can never surface an empty activity.
 */
export function activityOutline(item: PathwayItem): string[] {
  return [
    item.description,
    `This item builds ${item.competency.label}. ${item.competency.description}`,
    `Allow ${item.duration}. Completing it records evidence against your Capability Profile and unlocks the next step in your pathway.`,
  ];
}

function courseItem(course: Course, index: number): PathwayItem {
  return {
    id: `pw-course-${course.id}`,
    format: "course",
    title: course.title,
    description: course.summary,
    duration: `${course.hours} · ${course.moduleCount} modules`,
    competency: COMPETENCY_BY_ID[course.competencyId],
    agent: AGENTS.content,
    courseId: course.id,
    href: `/learner/course/${course.id}`,
    hrefLabel: index === 0 ? "Continue the course" : "Open the course",
    coachNote:
      index === 0
        ? `This is the first course in your pathway because ${COMPETENCY_BY_ID[course.competencyId].label} is where your assessment showed the largest gain available.`
        : `Assigned after your earlier courses: it builds ${COMPETENCY_BY_ID[course.competencyId].label}, one of the priorities from your assessment.`,
  };
}

/**
 * Builds the ordered pathway. Courses, microlearning, a virtual session, a
 * scenario simulation, lab work, the workplace project and the targeted
 * re-check are interleaved so the sequence reads as one journey.
 */
export function buildPathway(
  result: AssessmentResult,
  answers: Record<string, number> = {},
): PathwayItem[] {
  const plan = buildRecommendations(result, answers);
  const courses = result.recommendedCourseIds
    .map((id) => COURSE_BY_ID[id])
    .filter((c): c is Course => Boolean(c));

  const items: PathwayItem[] = [];

  if (courses[0]) items.push(courseItem(courses[0], 0));

  const micro = plan.resources[0];
  if (micro) {
    items.push({
      id: "pw-micro",
      format: "microlearning",
      title: micro.title,
      description: micro.summary,
      duration: micro.readTime,
      competency: micro.competency,
      agent: AGENTS.content,
      meta: micro.kind,
      coachNote: `You scored ${result.scores[micro.competency.id] ?? 0}% on ${micro.competency.label}, your first priority. This is the shortest read that moves it, which is why it sits before anything longer.`,
      body: [
        micro.summary,
        `In federal work the risk is rarely that AI produces nothing usable — it is that it produces something usable-looking. ${micro.competency.description}`,
        `Read this in one sitting, hold onto the three points below, then answer the two questions at the end. Both correct completes the item and unlocks the next step in your pathway.`,
      ],
      takeaways: TAKEAWAYS[micro.competency.id] ?? TAKEAWAYS.governance,
      questions: checkQuestionsFor(micro.competency.id),
    });
  }

  const practice = plan.practice[0];
  if (practice) {
    items.push({
      id: "pw-practice",
      format: "practical-assignment",
      title: practice.title,
      description: practice.scenario,
      duration: practice.duration,
      competency: practice.competency,
      agent: AGENTS.practice,
      meta: practice.format,
      coachNote: `Reading alone will not move ${practice.competency.short}. This assignment makes you do it once on your own material, which is what the re-check later tests.`,
      steps: [
        "Choose a real task from your own week — not a hypothetical one.",
        practice.scenario,
        "Run the sample instruction below, then correct it once so it fits your entity's tone and approved facts.",
        "Record what AI produced, what you changed, and how long the review took.",
        "Submit the result: it becomes evidence in your Capability Profile.",
      ],
      samplePrompt: SAMPLE_PROMPTS[practice.competency.id] ?? SAMPLE_PROMPTS.governance,
      submissionPrompt:
        "Paste what you produced, what you changed from the AI's first attempt, and roughly how long the review took.",
    });
  }

  if (courses[1]) items.push(courseItem(courses[1], 1));

  const event = plan.events[0];
  if (event) {
    items.push({
      id: "pw-session",
      format: "virtual-session",
      title: event.title,
      description: `Live session hosted by ${event.host}, targeted at your ${event.competency.short} gap. ${event.seatsNote}.`,
      duration: event.format,
      competency: event.competency,
      agent: AGENTS.coaching,
      meta: event.dateLabel,
      host: event.host,
      venue: event.format,
      coachNote: `Your ${event.competency.short} gap is the one most helped by asking questions live. This session is the earliest one in the federal calendar that covers it.`,
      agenda: agendaFor(event.competency),
      steps: [
        "Reserve your seat — the pathway holds the slot until the day before.",
        "Bring one piece of your own work to use during the session.",
        "Attendance is recorded against your pathway automatically.",
      ],
    });
  }

  const simulationCompetency = plan.practice[1]?.competency ?? plan.priorities[0].competency;
  items.push({
    id: "pw-simulation",
    format: "simulation",
    title: `Scenario: ${simulationCompetency.short} under pressure`,
    description: `A role-play with your ${AGENTS.practice}. Your choices are scored against federal responsible-AI expectations.`,
    duration: "15 min",
    competency: simulationCompetency,
    agent: AGENTS.practice,
    meta: "Role-play assessment",
    coachNote: `Your answers showed you know the rule for ${simulationCompetency.short}. This checks whether you still apply it under a deadline, which is where federal teams usually slip.`,
    roleplay: roleplayFor(simulationCompetency.id),
  });

  if (courses[2]) items.push(courseItem(courses[2], 2));

  items.push({
    id: "pw-lab",
    format: "lab",
    title: "Configure your AI Digital Twin",
    description: `Build an assistant that carries your role knowledge, tone and governance guardrails, then test it on a real request from ${LEARNER_PROFILE.department}.`,
    duration: "45 min",
    competency: COMPETENCY_BY_ID.agentic,
    agent: AGENTS.practice,
    href: "/learner/lab/twin",
    hrefLabel: "Open the Agentic AI Lab",
    coachNote: `Every federal learner builds a twin, but yours is configured around ${LEARNER_PROFILE.department}: it is where the governance habits from your reading become settings you have to choose.`,
    steps: [
      "Define your twin's knowledge sources.",
      "Set its tone and its guardrails.",
      "Run a test response and review what it got wrong.",
    ],
  });

  items.push({
    id: "pw-project",
    format: "workplace-project",
    title: plan.project.title,
    description: plan.project.brief,
    duration: "2 weeks",
    competency: plan.project.competency,
    agent: AGENTS.practice,
    href: "/learner/lab/project",
    hrefLabel: "Open my Workplace Project",
    meta: plan.project.outcome,
    coachNote: `Chosen because ${plan.project.competency.label} is your first priority. This is the item your line manager signs off, so it is the one that turns your learning into recorded impact.`,
    steps: [
      "Describe the problem and the AI solution you applied.",
      "State the expected time or quality gain.",
      "Submit for evaluation and line manager confirmation.",
    ],
    submissionPrompt:
      "Sketch the problem and the AI solution you have in mind. Your full submission and evidence are completed in the Agentic AI Lab.",
  });

  items.push({
    id: "pw-recheck",
    format: "assessment",
    title: plan.nextAssessment.title,
    description: plan.nextAssessment.note,
    duration: `${plan.nextAssessment.questionCount} questions`,
    competency: plan.nextAssessment.competencies[0],
    agent: AGENTS.capability,
    href: "/learner/assessment",
    hrefLabel: "Open the re-check",
    meta: `Scheduled for ${plan.nextAssessment.dueLabel}`,
    coachNote: `Only the ${plan.nextAssessment.competencies.length} capabilities you were weakest in are re-tested. Your ${result.levelLabel} banding set the ${plan.nextAssessment.weeks}-week interval, and it shortens if you finish the pathway sooner.`,
    steps: [
      `Re-tested: ${plan.nextAssessment.competencies.map((c) => c.short).join(", ")}.`,
      `${plan.nextAssessment.questionCount} scenario questions, in the same format as your baseline.`,
      "Your Capability Profile and capability level update automatically once it is scored.",
    ],
  });

  return items;
}

/**
 * The module the pathway inserts after the simulation, when the learner's
 * choices expose a second gap. Kept separate from `buildPathway` so the
 * adaptive moment is an event rather than part of the initial plan.
 */
export function buildAdaptiveItem(result: AssessmentResult): PathwayItem {
  const competency = COMPETENCY_BY_ID[result.gaps[1] ?? result.gaps[0]];
  return {
    id: "pw-adaptive",
    format: "microlearning",
    title: `Stakeholder alignment when AI drafts the message`,
    description: `Added after your role-play: you moved fast, but skipped the step where colleagues are brought with you. Ten minutes on holding the ${competency.short} line while others are still catching up.`,
    duration: "10 min",
    competency,
    agent: AGENTS.learning,
    adaptive: true,
    meta: "Added by your pathway",
    coachNote: `This was not in your original pathway. Your role-play answers were sound but solitary, so your ${AGENTS.learning} inserted ten minutes on carrying colleagues with you before you reach the workplace project.`,
    takeaways: [
      "Name the accountable human before AI-assisted work leaves your desk.",
      "One written line explaining why the AI route was appropriate is enough — but it has to exist.",
      "Store that line with the output, so whoever inherits it can defend it without you.",
    ],
    body: [
      "In the role-play you reached a defensible answer quickly. What you did not do was bring anyone with you — no holding note to your director, no flag to the policy team, no record of the decision for the people who inherit it.",
      "In federal work the alignment step is not administrative overhead. It is what makes an AI-assisted decision survive scrutiny a month later, when the person answering the question is not you.",
      `Applied to ${competency.label}: name the accountable human before the output leaves your desk, write the one line that explains why the AI-assisted route was appropriate, and store it with the output.`,
    ],
    questions: checkQuestionsFor(competency.id),
  };
}
