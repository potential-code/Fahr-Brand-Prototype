// Baseline assessment, competency framework and course catalogue for the learner journey.
// Front-end mock data only — no backend.

export type Competency = {
  id: string;
  label: string;
  short: string;
  description: string;
};

/** FAHR AI capability framework used by the baseline assessment and the report. */
export const COMPETENCIES: Competency[] = [
  {
    id: "literacy",
    label: "AI Literacy & Fundamentals",
    short: "AI Literacy",
    description: "Understands what generative and agentic AI can and cannot do in a government context.",
  },
  {
    id: "prompting",
    label: "Prompt Engineering",
    short: "Prompting",
    description: "Writes structured, context-rich instructions that produce reliable, on-brand outputs.",
  },
  {
    id: "analytics",
    label: "AI-Assisted Analytics",
    short: "Analytics",
    description: "Uses AI to interpret service and campaign data and turn it into decisions.",
  },
  {
    id: "agentic",
    label: "Agentic AI & Automation",
    short: "Agentic AI",
    description: "Designs multi-step AI workflows and assistants that carry real work forward.",
  },
  {
    id: "governance",
    label: "AI Governance & Data Ethics",
    short: "Governance",
    description: "Applies federal policy, privacy and human-in-the-loop controls to every AI output.",
  },
];

export const COMPETENCY_BY_ID: Record<string, Competency> = Object.fromEntries(
  COMPETENCIES.map((c) => [c.id, c]),
);

export type AssessmentOption = {
  label: string;
  /** 0 = no capability, 3 = advanced capability */
  score: 0 | 1 | 2 | 3;
};

export type AssessmentQuestion = {
  id: string;
  competencyId: string;
  scenario: string;
  question: string;
  options: AssessmentOption[];
};

/** Scenario-based diagnostic, written for a UAE federal government context. */
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    competencyId: "literacy",
    scenario: "Getting started",
    question: "How often do you use generative AI tools in your day-to-day work at the entity?",
    options: [
      { label: "Rarely or never — I have read about them but not used them at work", score: 0 },
      { label: "Occasionally, for simple drafting such as emails or summaries", score: 1 },
      { label: "Most days, across several parts of my role", score: 2 },
      { label: "Daily, and I have configured assistants that colleagues also use", score: 3 },
    ],
  },
  {
    id: "q2",
    competencyId: "literacy",
    scenario: "Understanding the technology",
    question:
      "A colleague says an AI assistant 'looked up' a federal circular and quoted it. What is the most accurate response?",
    options: [
      { label: "If it quoted the circular, the quote must be accurate", score: 0 },
      { label: "AI is usually right, so a quick skim is enough", score: 1 },
      { label: "It may have generated plausible text — the citation must be checked against the source", score: 3 },
      { label: "AI tools cannot reference documents at all", score: 1 },
    ],
  },
  {
    id: "q3",
    competencyId: "prompting",
    scenario: "Briefing the assistant",
    question:
      "You need AI to draft a public awareness message. Which instruction is most likely to produce a usable first draft?",
    options: [
      { label: "\"Write something about the new service.\"", score: 0 },
      { label: "\"Write a short announcement about the new service.\"", score: 1 },
      { label: "\"Write a 120-word announcement for residents about the new service, formal and reassuring in tone.\"", score: 2 },
      {
        label:
          "\"Act as a government communications officer. Write a 120-word announcement for residents, formal and reassuring, using only the approved facts below, and list any assumptions you made.\"",
        score: 3,
      },
    ],
  },
  {
    id: "q4",
    competencyId: "prompting",
    scenario: "Improving the output",
    question: "The first draft is close but the tone is wrong. What do you normally do next?",
    options: [
      { label: "Rewrite the whole thing manually", score: 0 },
      { label: "Ask it to 'make it better' and hope for the best", score: 1 },
      { label: "Give a specific correction with an example of the tone I want", score: 2 },
      { label: "Give a specific correction, supply a reference example, and save the pattern for reuse", score: 3 },
    ],
  },
  {
    id: "q5",
    competencyId: "analytics",
    scenario: "Reading the numbers",
    question:
      "Your programme reports high reach but leadership asks whether it worked. Which measure best answers that question?",
    options: [
      { label: "Total impressions across channels", score: 0 },
      { label: "Number of items published", score: 0 },
      { label: "Engagement rate on the best-performing post", score: 1 },
      { label: "Change in the service action we asked residents to take", score: 3 },
    ],
  },
  {
    id: "q6",
    competencyId: "analytics",
    scenario: "Working with data",
    question: "How comfortable are you using AI to analyse a spreadsheet of service or programme performance data?",
    options: [
      { label: "I have never tried it", score: 0 },
      { label: "I can ask it to summarise a table", score: 1 },
      { label: "I can ask it to compare segments and explain trends, then sanity-check the result", score: 2 },
      { label: "I build repeatable analysis workflows and validate them against the source system", score: 3 },
    ],
  },
  {
    id: "q7",
    competencyId: "agentic",
    scenario: "Automating the work",
    question:
      "A recurring monthly report takes your team two days. What is the most capable use of AI you could realistically design?",
    options: [
      { label: "Ask AI to proofread the finished report", score: 0 },
      { label: "Ask AI to draft the narrative once the data is compiled", score: 1 },
      { label: "Use AI to compile the data, draft the narrative, and produce the summary in one guided flow", score: 2 },
      {
        label:
          "Build a reusable assistant that gathers the data, drafts the report, flags anomalies for human review, and improves from feedback",
        score: 3,
      },
    ],
  },
  {
    id: "q8",
    competencyId: "governance",
    scenario: "Staying compliant",
    question:
      "An AI-generated briefing contains figures drawn from an internal dataset. What must happen before it is shared externally?",
    options: [
      { label: "Nothing — the assistant is approved for internal data", score: 0 },
      { label: "Run it through a plagiarism checker", score: 0 },
      { label: "A colleague gives it a quick read", score: 1 },
      { label: "Human-in-the-loop review against the source data, plus a classification and privacy check", score: 3 },
    ],
  },
];

export type Level = { id: string; label: string; min: number; blurb: string };

/** Score bands mapped onto the shared capability ladder. */
export const SCORE_BANDS: Level[] = [
  {
    id: "champion",
    label: "Champion",
    min: 85,
    blurb: "You are ready to lead AI adoption and governance for your entity.",
  },
  {
    id: "advanced",
    label: "Advanced",
    min: 70,
    blurb: "You design agentic workflows independently and can mentor colleagues.",
  },
  {
    id: "practitioner",
    label: "Practitioner",
    min: 55,
    blurb: "You apply AI to deliver measurable work outcomes with limited guidance.",
  },
  {
    id: "emerging",
    label: "Emerging Practitioner",
    min: 35,
    blurb: "You apply AI to routine tasks and are ready to move into applied delivery.",
  },
  {
    id: "aware",
    label: "Aware",
    min: 0,
    blurb: "You understand the fundamentals and are ready to start applying them at work.",
  },
];

export function bandForScore(score: number): Level {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

// ---------------------------------------------------------------------------
// Course catalogue
// ---------------------------------------------------------------------------

export type LessonType = "reading" | "video" | "activity";

/**
 * Display labels for lesson kinds. One source of truth so the outline and the
 * lesson header can never disagree, and so the Arabic pass has somewhere to
 * hang a translation.
 */
export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  reading: "Reading",
  video: "Video",
  activity: "Activity",
};

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  duration: string;
  /** Paragraphs of lesson body copy. */
  body: string[];
  /** Optional key-points list rendered after the body. */
  points?: string[];
};

export type LessonGroup = {
  id: string;
  title: string;
  caption: string;
  lessons: Lesson[];
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Course = {
  id: string;
  title: string;
  category: string;
  duration: string;
  hours: string;
  moduleCount: number;
  competencyId: string;
  summary: string;
  description: string;
  image: string;
  outcomes: string[];
  groups: LessonGroup[];
  pretest: { title: string; intro: string; questions: QuizQuestion[] };
  finalAssessment: { title: string; intro: string; questions: QuizQuestion[] };
};

export const COURSES: Course[] = [
  {
    id: "ai-foundations",
    title: "AI Foundations for Federal Service",
    category: "Foundational",
    duration: "2 weeks",
    hours: "4 hours",
    moduleCount: 6,
    competencyId: "literacy",
    summary:
      "Build the shared vocabulary and judgement every federal employee needs before using AI on real work.",
    description:
      "Understand what generative and agentic AI actually do, where they fail, and how to judge when an AI output is safe to use in government service delivery.",
    image: "brand/learning/course-ai-foundations.jpg",
    outcomes: [
      "Explain how generative AI produces an answer, in plain language",
      "Recognise the three failure modes that matter most in public service",
      "Decide when an AI output is ready to use and when it is not",
    ],
    groups: [
      {
        id: "g1",
        title: "How the technology actually works",
        caption: "Foundations without the hype",
        lessons: [
          {
            id: "l1",
            title: "What a language model is doing",
            type: "reading",
            duration: "8 min",
            body: [
              "A language model does not look up answers. It predicts the most likely continuation of the text it has been given, one piece at a time, based on patterns learned from very large amounts of text.",
              "That single fact explains most of what follows in this course. It is why a model can write a fluent, well-structured circular summary in seconds, and also why it can invent a reference number that looks entirely convincing.",
            ],
            points: [
              "Fluency is not the same as accuracy",
              "The model has no memory of your entity unless you give it context",
              "Confidence in the wording tells you nothing about correctness",
            ],
          },
          {
            id: "l2",
            title: "Generative, retrieval and agentic AI",
            type: "reading",
            duration: "7 min",
            body: [
              "Generative AI writes. Retrieval-augmented AI writes using documents you supply, so it can cite real sources. Agentic AI goes further: it plans a sequence of steps, uses tools, and carries a task forward with checkpoints along the way.",
              "Most federal use cases start generative, become retrieval-based once source documents matter, and become agentic once the same multi-step task repeats every week.",
            ],
          },
          {
            id: "l3",
            title: "Where AI fails in public service",
            type: "video",
            duration: "6 min",
            body: [
              "Three failure modes cause almost every problem seen in government pilots: fabricated facts, silent staleness, and confident answers outside the model's competence.",
              "This session walks through a real example of each, drawn from federal communications and service-delivery work, and shows the check that would have caught it.",
            ],
            points: [
              "Fabrication: invented figures, citations or policy references",
              "Staleness: an answer that was true last year",
              "Overreach: legal, medical or financial advice the model is not qualified to give",
            ],
          },
        ],
      },
      {
        id: "g2",
        title: "Using AI on real work",
        caption: "From understanding to practice",
        lessons: [
          {
            id: "l4",
            title: "Choosing the right task for AI",
            type: "reading",
            duration: "9 min",
            body: [
              "The best first candidates share three traits: the task repeats, the output is reviewed by a person before it matters, and a mistake is recoverable. Drafting, summarising, reformatting and first-pass analysis all qualify.",
              "The worst first candidates are irreversible decisions about individuals — eligibility, discipline, entitlement. Those need a much heavier governance wrapper and are not where you start.",
            ],
          },
          {
            id: "l5",
            title: "Your review checklist",
            type: "activity",
            duration: "10 min",
            body: [
              "Before any AI-assisted output leaves your desk, run the same four checks every time. This lesson gives you the checklist and a worked example against a draft public notice.",
            ],
            points: [
              "Are all facts, figures and references verified against the source?",
              "Does the tone match our published voice?",
              "Has anything sensitive or personal been entered into the tool?",
              "Is it clear to a reader that a human is accountable for this?",
            ],
          },
          {
            id: "l6",
            title: "Building the habit",
            type: "reading",
            duration: "5 min",
            body: [
              "Capability comes from repetition, not from a single course. Pick one recurring task this week, run it through AI, and time both the drafting and the review.",
              "Log what you saved and what you had to correct. That log becomes the evidence base for your Personalised Learning Pathway and your Workplace Project.",
            ],
          },
        ],
      },
    ],
    pretest: {
      title: "Where are you starting?",
      intro:
        "A quick knowledge check on the ideas this course covers. See what you already know — your results help us tailor the depth of each lesson.",
      questions: [
        {
          id: "p1",
          question: "How does a generative AI model produce its answer?",
          options: [
            "It searches an approved government database",
            "It predicts likely text based on patterns it has learned",
            "It copies the closest matching document it has seen",
            "It applies a fixed set of policy rules",
          ],
          correctIndex: 1,
          explanation:
            "It predicts likely continuations. That is why output can be fluent and still factually wrong.",
        },
        {
          id: "p2",
          question: "An AI draft cites a federal circular by number. What should you do?",
          options: [
            "Publish it — cited material is verified material",
            "Remove the citation to be safe",
            "Verify the number against the official source before use",
            "Ask the model whether it is sure",
          ],
          correctIndex: 2,
          explanation: "Citations must be verified against the source. Models can generate plausible reference numbers.",
        },
        {
          id: "p3",
          question: "Which task is the safest first candidate for AI assistance?",
          options: [
            "Deciding an individual's service entitlement",
            "Drafting a routine internal summary that a person reviews",
            "Issuing a final legal interpretation",
            "Approving a budget variation",
          ],
          correctIndex: 1,
          explanation: "Repeating, reviewable, recoverable tasks are the right place to start.",
        },
        {
          id: "p4",
          question: "What best describes agentic AI?",
          options: [
            "AI that writes longer answers",
            "AI that plans and executes multi-step tasks using tools, with human checkpoints",
            "AI that runs without any oversight",
            "AI that only works with images",
          ],
          correctIndex: 1,
          explanation: "Agentic AI plans a sequence of steps and uses tools, with humans reviewing at defined points.",
        },
      ],
    },
    finalAssessment: {
      title: "Final assessment",
      intro: "Three questions to confirm you can apply the fundamentals. Passing unlocks your course certificate.",
      questions: [
        {
          id: "f1",
          question: "A summary produced by AI reads perfectly. What does that tell you about its accuracy?",
          options: [
            "It is very likely accurate",
            "Nothing — fluency and accuracy are independent",
            "It is accurate if it is short",
            "It is accurate if the tool is approved",
          ],
          correctIndex: 1,
          explanation: "Fluency is a property of the language model, not evidence of factual correctness.",
        },
        {
          id: "f2",
          question: "Which check belongs on every AI review checklist?",
          options: [
            "Word count",
            "Whether sensitive or personal data was entered into the tool",
            "Whether the output rhymes",
            "How fast the model responded",
          ],
          correctIndex: 1,
          explanation: "Data handling is a mandatory check under federal privacy expectations.",
        },
        {
          id: "f3",
          question: "When does a generative use case usually become an agentic one?",
          options: [
            "When the text gets longer",
            "When the same multi-step task repeats regularly",
            "When more people read the output",
            "When the budget increases",
          ],
          correctIndex: 1,
          explanation: "Repetition of a multi-step task is the signal to build a reusable assistant.",
        },
      ],
    },
  },
  {
    id: "prompt-craft",
    title: "Prompt Engineering for Public Service",
    category: "Technical",
    duration: "3 weeks",
    hours: "6 hours",
    moduleCount: 8,
    competencyId: "prompting",
    summary:
      "Turn vague requests into structured instructions that produce accurate, on-voice government content every time.",
    description:
      "A practical craft course: structure, context, constraints, examples and iteration — applied to briefings, public notices, policy summaries and bilingual communication.",
    image: "brand/learning/course-prompt-engineering.jpg",
    outcomes: [
      "Write instructions with role, task, context, constraints and format",
      "Correct a weak output in one targeted iteration instead of five",
      "Build a reusable prompt library for your team's recurring work",
    ],
    groups: [
      {
        id: "g1",
        title: "The anatomy of a good instruction",
        caption: "Structure before cleverness",
        lessons: [
          {
            id: "l1",
            title: "Role, task, context, constraints, format",
            type: "reading",
            duration: "8 min",
            body: [
              "Nearly every strong prompt contains the same five parts. Who the assistant should act as, what it must produce, what it needs to know, what it must not do, and exactly how the answer should be shaped.",
              "Missing any one of them is the single most common cause of a disappointing first draft.",
            ],
            points: [
              "Role: \"Act as a federal communications officer\"",
              "Task: \"Draft a 120-word notice\"",
              "Context: the approved facts, audience and channel",
              "Constraints: what to avoid, what must not be invented",
              "Format: length, structure, language, tone",
            ],
          },
          {
            id: "l2",
            title: "Giving context without giving away data",
            type: "reading",
            duration: "7 min",
            body: [
              "Context improves output quality more than any other single factor — but context is also where privacy incidents happen.",
              "This lesson covers how to summarise, anonymise and abstract source material so the assistant has what it needs without ever receiving identifiable personal data.",
            ],
          },
          {
            id: "l3",
            title: "Showing an example",
            type: "video",
            duration: "6 min",
            body: [
              "One good example of the output you want is usually worth three paragraphs of description. This session shows how to supply a reference sample and ask the assistant to match its structure and register.",
            ],
          },
          {
            id: "l4",
            title: "Writing constraints that hold",
            type: "reading",
            duration: "6 min",
            body: [
              "\"Be accurate\" is not a constraint. \"Use only the facts listed below and mark anything you had to assume\" is.",
              "Constraints work when they are checkable — when you can look at the output and immediately see whether the rule was followed.",
            ],
          },
        ],
      },
      {
        id: "g2",
        title: "Iteration and reuse",
        caption: "Getting to a usable draft faster",
        lessons: [
          {
            id: "l5",
            title: "The one-correction rule",
            type: "activity",
            duration: "10 min",
            body: [
              "When a draft is wrong, resist the urge to re-prompt from scratch. Name the specific gap, supply the missing input, and ask for a targeted revision.",
              "In this exercise you take a weak public notice through a single corrective iteration and compare the result against a full rewrite.",
            ],
          },
          {
            id: "l6",
            title: "Bilingual output that survives review",
            type: "reading",
            duration: "8 min",
            body: [
              "Asking for an Arabic version is not the same as asking for a translation. Government Arabic has its own register, and a literal translation of English marketing phrasing reads badly.",
              "Ask for an Arabic version written natively for the same audience and purpose, then have it reviewed by an Arabic-first colleague.",
            ],
          },
          {
            id: "l7",
            title: "Building your team prompt library",
            type: "activity",
            duration: "12 min",
            body: [
              "Any prompt you use twice should be saved. This lesson gives you a simple template for capturing a prompt, its intended use, its constraints and its known limitations.",
            ],
          },
          {
            id: "l8",
            title: "Knowing when to stop prompting",
            type: "reading",
            duration: "5 min",
            body: [
              "If three targeted iterations have not produced a usable draft, the task is usually mis-scoped, the context is missing, or it is simply a task better done by a person.",
              "Recognising that quickly is a capability in itself.",
            ],
          },
        ],
      },
    ],
    pretest: {
      title: "How do you brief an assistant today?",
      intro:
        "Four quick questions on instruction design. Your answers tune how much foundational material each lesson includes.",
      questions: [
        {
          id: "p1",
          question: "Which element is missing from: \"Write a 100-word notice about the new service, formal tone\"?",
          options: ["Format", "Task", "The approved facts to use as context", "Length"],
          correctIndex: 2,
          explanation: "Without supplied facts the assistant will fill the gap by inventing plausible detail.",
        },
        {
          id: "p2",
          question: "What is the most effective way to fix a draft with the wrong tone?",
          options: [
            "Ask it to 'make it better'",
            "Rewrite it yourself",
            "Name the problem and supply an example of the tone you want",
            "Run the same prompt again",
          ],
          correctIndex: 2,
          explanation: "Specific correction plus a reference example is the fastest route to a usable draft.",
        },
        {
          id: "p3",
          question: "Which is a checkable constraint?",
          options: [
            "\"Be professional\"",
            "\"Use only the five facts listed and flag any assumption\"",
            "\"Make it good\"",
            "\"Sound official\"",
          ],
          correctIndex: 1,
          explanation: "You can inspect the output and immediately verify whether the rule was followed.",
        },
        {
          id: "p4",
          question: "How should you request an Arabic version of a public notice?",
          options: [
            "Ask for a direct translation",
            "Ask for an Arabic version written natively for the same audience and purpose",
            "Translate it word by word yourself",
            "Publish the English version only",
          ],
          correctIndex: 1,
          explanation: "Literal translation produces the wrong register for government Arabic.",
        },
      ],
    },
    finalAssessment: {
      title: "Final assessment",
      intro: "Three questions to confirm your instruction design. Passing unlocks your course certificate.",
      questions: [
        {
          id: "f1",
          question: "Which five parts make up a well-structured instruction?",
          options: [
            "Role, task, context, constraints, format",
            "Length, tone, language, speed, cost",
            "Who, what, when, where, why",
            "Draft, review, edit, approve, publish",
          ],
          correctIndex: 0,
          explanation: "These five parts cover almost every reliable prompt pattern.",
        },
        {
          id: "f2",
          question: "How should sensitive source material be handled before it goes into a prompt?",
          options: [
            "Paste it in full for best accuracy",
            "Summarise and anonymise so no identifiable personal data is sent",
            "Send it as an attachment instead",
            "Ask the assistant to ignore the sensitive parts",
          ],
          correctIndex: 1,
          explanation: "Abstracting the context preserves quality without exposing personal data.",
        },
        {
          id: "f3",
          question: "After three targeted iterations the output is still unusable. What does that most likely mean?",
          options: [
            "The model is broken",
            "You need a longer prompt",
            "The task is mis-scoped, context is missing, or a person should do it",
            "You should switch tools",
          ],
          correctIndex: 2,
          explanation: "Repeated failure is a scoping signal, not a prompting signal.",
        },
      ],
    },
  },
  {
    id: "ai-governance",
    title: "AI Ethics & Governance in Government",
    category: "Governance",
    duration: "1 week",
    hours: "3 hours",
    moduleCount: 4,
    competencyId: "governance",
    summary:
      "Apply federal policy, privacy expectations and human accountability to every AI-assisted output you produce.",
    description:
      "The non-negotiables: data classification, human-in-the-loop review, transparency with the public, and keeping an audit trail that stands up to scrutiny.",
    image: "brand/learning/course-ai-governance.jpg",
    outcomes: [
      "Classify what may and may not be entered into an AI tool",
      "Apply proportionate human-in-the-loop review to any AI output",
      "Keep an audit trail that shows who was accountable for a decision",
    ],
    groups: [
      {
        id: "g1",
        title: "The federal guardrails",
        caption: "What the policy actually requires",
        lessons: [
          {
            id: "l1",
            title: "Data classification before anything else",
            type: "reading",
            duration: "9 min",
            body: [
              "Before a single word goes into an AI tool, one question decides everything: what classification is this material?",
              "Public and internal-general material is broadly usable. Confidential material requires an approved environment. Personal data about identifiable individuals requires an explicit legal basis and, in most cases, does not go into a general-purpose assistant at all.",
            ],
            points: [
              "Public — usable",
              "Internal — usable in approved tools",
              "Confidential — approved environments only",
              "Personal data — explicit basis required, default is no",
            ],
          },
          {
            id: "l2",
            title: "Proportionate human review",
            type: "reading",
            duration: "7 min",
            body: [
              "Human-in-the-loop is not one control, it is a scale. A social post needs a read-through. A briefing to leadership needs fact verification. A decision affecting an individual's entitlement needs a documented human decision-maker who could have decided otherwise.",
              "Matching the weight of the review to the consequence of the output is the whole skill.",
            ],
          },
        ],
      },
      {
        id: "g2",
        title: "Accountability in practice",
        caption: "Transparency and the audit trail",
        lessons: [
          {
            id: "l3",
            title: "Being transparent with the public",
            type: "video",
            duration: "6 min",
            body: [
              "Residents are entitled to know when they are interacting with an automated system and how to reach a person instead.",
              "This session covers where disclosure is required, how to phrase it without undermining confidence, and what the escalation path must look like.",
            ],
          },
          {
            id: "l4",
            title: "The audit trail that protects you",
            type: "activity",
            duration: "10 min",
            body: [
              "If an AI-assisted output is later challenged, three things must be reconstructable: what was asked, what was produced, and who approved it.",
              "In this exercise you build a lightweight record for one of your own recurring outputs.",
            ],
          },
        ],
      },
    ],
    pretest: {
      title: "How well do you know the guardrails?",
      intro: "Four questions on federal AI policy in practice. Your answers set the depth of each lesson.",
      questions: [
        {
          id: "p1",
          question: "What is the first question to ask before entering material into an AI tool?",
          options: [
            "Is the tool fast enough?",
            "What is the classification of this material?",
            "Will the output be long?",
            "Who else is using this tool?",
          ],
          correctIndex: 1,
          explanation: "Classification determines whether the material may be used at all, and in which environment.",
        },
        {
          id: "p2",
          question: "Human-in-the-loop review should be applied…",
          options: [
            "Identically to every output",
            "Only to public-facing content",
            "In proportion to the consequence of the output",
            "Only when leadership asks",
          ],
          correctIndex: 2,
          explanation: "The weight of the review should match the consequence of getting it wrong.",
        },
        {
          id: "p3",
          question: "When must residents be told they are dealing with an automated system?",
          options: [
            "Never — it undermines confidence",
            "Whenever they are interacting with it, along with a route to a person",
            "Only if they ask",
            "Only for financial services",
          ],
          correctIndex: 1,
          explanation: "Disclosure plus a human escalation path is the expected standard.",
        },
        {
          id: "p4",
          question: "Which three things must an audit trail reconstruct?",
          options: [
            "Cost, speed and volume",
            "What was asked, what was produced, who approved it",
            "Tool, version and licence",
            "Author, editor and designer",
          ],
          correctIndex: 1,
          explanation: "Those three answer the accountability question if an output is later challenged.",
        },
      ],
    },
    finalAssessment: {
      title: "Final assessment",
      intro: "Three questions to confirm you can apply the guardrails. Passing unlocks your course certificate.",
      questions: [
        {
          id: "f1",
          question: "Personal data about an identifiable resident should, by default, be…",
          options: [
            "Entered with a note asking the tool to be careful",
            "Kept out of general-purpose AI tools unless there is an explicit basis",
            "Anonymised only if the output is public",
            "Used freely inside the entity",
          ],
          correctIndex: 1,
          explanation: "The default position is no, unless an explicit legal basis and approved environment exist.",
        },
        {
          id: "f2",
          question: "A decision affecting an individual's entitlement requires…",
          options: [
            "A quick read-through",
            "A documented human decision-maker who could have decided otherwise",
            "Two AI opinions",
            "Publication of the prompt",
          ],
          correctIndex: 1,
          explanation: "Meaningful human decision-making is required where consequences fall on an individual.",
        },
        {
          id: "f3",
          question: "Why does an audit trail protect the employee as well as the entity?",
          options: [
            "It speeds up the work",
            "It shows what was asked, produced and approved if the output is challenged",
            "It reduces licensing cost",
            "It improves the model",
          ],
          correctIndex: 1,
          explanation: "Reconstructable accountability is the protection.",
        },
      ],
    },
  },
];

export const COURSE_BY_ID: Record<string, Course> = Object.fromEntries(COURSES.map((c) => [c.id, c]));

/** Neutral artwork used when a course has no image of its own. */
export const COURSE_IMAGE_FALLBACK = "brand/learning/course-default.jpg";

/** Resolves the artwork path for a course, falling back to the neutral image. */
export function courseImage(course: Pick<Course, "image"> | undefined | null): string {
  return course?.image || COURSE_IMAGE_FALLBACK;
}

/** Total steps used for course progress: every lesson plus the final assessment. */
export function courseStepCount(course: Course): number {
  return course.groups.reduce((n, g) => n + g.lessons.length, 0) + 1;
}

export function courseLessons(course: Course): Lesson[] {
  return course.groups.flatMap((g) => g.lessons);
}
