// The Agentic AI Lab — Stage 1 Digital Twin.
//
// Everything the twin "knows" comes from what the learner types during the
// interview, and everything it refuses to do comes from the two federal
// guardrails that are always enforced (see `assessTwin` below — there is no
// user-reachable switch that turns either one off). There is no model behind
// this: `answer()` matches the question against the learner's own words and
// composes a reply that quotes
// them back. That is deliberate — a demo has to be repeatable in a room with
// no network, and a reply that cites the task the client just typed reads as
// far more intelligent than a generic one.

import { screenForPii, type PiiKind } from "@/lib/piiScreen";
import { DEMO_PROJECT, LEARNER_PROFILE } from "@/lib/constants";

export type LabelPair = { en: string; ar: string };

export type TwinFieldId = "role" | "tasks" | "briefs" | "tone" | "knowledge";

/** The five things the interview captures, in the order it asks for them. */
export const TWIN_FIELDS: TwinFieldId[] = ["role", "tasks", "briefs", "tone", "knowledge"];

export type GuardrailId = "noPersonalData" | "approvedKnowledgeOnly";

export type Guardrail = {
  id: GuardrailId;
  label: LabelPair;
  /** What the guardrail does — always, since neither can be switched off. */
  on: LabelPair;
  /** Federal policy this mirrors in the FAHR governance console. */
  policy: LabelPair;
};

export const GUARDRAILS: Guardrail[] = [
  {
    id: "noPersonalData",
    label: { en: "No sensitive personal data", ar: "لا بيانات شخصية حساسة" },
    on: {
      en: "Prompts are screened for personal data before they reach the model.",
      ar: "تُفحص الطلبات بحثًا عن بيانات شخصية قبل وصولها إلى النموذج.",
    },
    policy: {
      en: "Federal policy — block personal data from AI prompts",
      ar: "سياسة اتحادية — منع البيانات الشخصية في طلبات الذكاء الاصطناعي",
    },
  },
  {
    id: "approvedKnowledgeOnly",
    label: { en: "Approved knowledge only", ar: "المعرفة المعتمدة فقط" },
    on: {
      en: "The twin answers only from the sources you connected, and says so when it cannot.",
      ar: "يجيب التوأم من المصادر التي ربطتها فقط، ويوضح عندما لا يستطيع.",
    },
    policy: {
      en: "Entity policy — approved knowledge sources only",
      ar: "سياسة الجهة — مصادر المعرفة المعتمدة فقط",
    },
  },
];

/**
 * A rule the learner wrote themselves.
 *
 * The two federal guardrails are enforced in code — they change what
 * `answer()` does, and cannot be switched off. A custom rule is a declared
 * constraint instead: the twin states it is operating under it, and it
 * counts toward the governance score, but the platform cannot enforce
 * arbitrary prose. Worth having anyway, because "my twin never quotes a
 * price" is exactly the kind of local rule an entity wants to capture.
 *
 * A custom rule has no disabled state — the learner adds it or removes it.
 * There is no in-between switch, for the same reason the federal guardrails
 * no longer have one.
 */
export type CustomGuardrail = {
  id: string;
  label: string;
};

export type TwinProfile = {
  role: string;
  tasks: string[];
  briefs: string[];
  tone: string;
  knowledge: string[];
  guardrails: Record<GuardrailId, boolean>;
  /** Rules the learner added on top of the federal four. */
  customGuardrails: CustomGuardrail[];
  /** Set when the training run finishes. */
  trainedAt: string | null;
};

export function emptyProfile(): TwinProfile {
  return {
    role: "",
    tasks: [],
    briefs: [],
    tone: "",
    knowledge: [],
    guardrails: {
      noPersonalData: true,
      approvedKnowledgeOnly: true,
    },
    customGuardrails: [],
    trainedAt: null,
  };
}

/** A field counts as captured once the learner has put something in it. */
export function fieldValues(profile: TwinProfile, field: TwinFieldId): string[] {
  switch (field) {
    case "role":
      return profile.role ? [profile.role] : [];
    case "tone":
      return profile.tone ? [profile.tone] : [];
    case "tasks":
      return profile.tasks;
    case "briefs":
      return profile.briefs;
    case "knowledge":
      return profile.knowledge;
  }
}

export function isFieldCaptured(profile: TwinProfile, field: TwinFieldId): boolean {
  return fieldValues(profile, field).length > 0;
}

export function capturedFields(profile: TwinProfile): TwinFieldId[] {
  return TWIN_FIELDS.filter((field) => isFieldCaptured(profile, field));
}

/**
 * How ready the twin is to be put to work, as a percentage. The five interview
 * fields carry 80 points between them; the training run carries the last 20,
 * so a twin that was described but never trained never reads as complete.
 */
export function readiness(profile: TwinProfile): number {
  const captured = capturedFields(profile).length;
  const described = Math.round((captured / TWIN_FIELDS.length) * 80);
  return described + (profile.trainedAt ? 20 : 0);
}

export function isTrainable(profile: TwinProfile): boolean {
  // Role and at least one recurring task — enough for the twin to be about
  // something. The rest sharpens it.
  return Boolean(profile.role) && profile.tasks.length > 0;
}

// ---------------------------------------------------------------------------
// The interview
// ---------------------------------------------------------------------------

export type InterviewStep = {
  field: TwinFieldId;
  /** What the Capability Agent asks. */
  question: LabelPair;
  /** Why it is asking — shown under the question so the value is obvious. */
  why: LabelPair;
  placeholder: LabelPair;
  /** Tap-to-add answers, so a live demo never stalls on someone's typing. */
  suggestions: LabelPair[];
  /** Whether several answers can be collected for this field. */
  multi: boolean;
};

export const INTERVIEW: InterviewStep[] = [
  {
    field: "role",
    question: {
      en: "Before I can be useful to you — what is your role, in your own words?",
      ar: "قبل أن أكون مفيدًا لك — ما هو دورك، بكلماتك أنت؟",
    },
    why: {
      en: "Your role decides which of your entity's frameworks I map you against.",
      ar: "يحدد دورك الأطر المؤسسية التي أقارنك بها.",
    },
    placeholder: {
      en: "e.g. I run campaign reporting for the Communications and Public Awareness department",
      ar: "مثال: أتولى تقارير الحملات في إدارة الاتصال والتوعية المجتمعية",
    },
    // The first suggestion in every question tells the demo's one story: the
    // learner's real role, and the weekly performance report as their task.
    suggestions: [
      { en: LEARNER_PROFILE.role, ar: LEARNER_PROFILE.roleAr },
      {
        en: "Public health communications specialist",
        ar: "أخصائي اتصال في الصحة العامة",
      },
      { en: "Campaign and content lead", ar: "مسؤول الحملات والمحتوى" },
      { en: "Citizen engagement officer", ar: "مسؤول إشراك المتعاملين" },
    ],
    multi: false,
  },
  {
    field: "tasks",
    question: {
      en: "Walk me through a typical week. Which tasks come back again and again?",
      ar: "صف لي أسبوعًا معتادًا. ما المهام التي تتكرر باستمرار؟",
    },
    why: {
      en: "Recurring work is where a twin pays for itself. Each one becomes something I can take on.",
      ar: "العمل المتكرر هو ما يجعل التوأم مجديًا. كل مهمة تصبح شيئًا يمكنني تولّيه.",
    },
    placeholder: {
      en: "e.g. Preparing the weekly performance report every Monday",
      ar: "مثال: إعداد تقرير الأداء الأسبوعي كل يوم اثنين",
    },
    suggestions: [
      { en: DEMO_PROJECT.task, ar: DEMO_PROJECT.taskAr },
      { en: "Drafting campaign briefs", ar: "صياغة موجزات الحملات" },
      { en: "Writing social media copy", ar: "كتابة محتوى وسائل التواصل" },
      { en: "Summarising audience sentiment reports", ar: "تلخيص تقارير انطباعات الجمهور" },
      { en: "Answering resident enquiries", ar: "الرد على استفسارات المتعاملين" },
    ],
    multi: true,
  },
  {
    field: "briefs",
    question: {
      en: "Which of your own documents should I learn from?",
      ar: "ما المستندات الخاصة بك التي ينبغي أن أتعلم منها؟",
    },
    why: {
      en: "I learn your format from your past work, so my drafts arrive looking like yours.",
      ar: "أتعلم أسلوبك من أعمالك السابقة، لتصل مسوداتي بصيغتك أنت.",
    },
    placeholder: {
      en: "e.g. National Immunisation Week brief, 2025",
      ar: "مثال: موجز أسبوع التحصين الوطني ٢٠٢٥",
    },
    suggestions: [
      { en: "Past weekly performance reports", ar: "تقارير الأداء الأسبوعية السابقة" },
      { en: "National Immunisation Week brief", ar: "موجز أسبوع التحصين الوطني" },
      { en: "Ramadan wellbeing campaign deck", ar: "عرض حملة الصحة في رمضان" },
      { en: "Quarterly campaign performance report", ar: "تقرير أداء الحملات الربعي" },
    ],
    multi: true,
  },
  {
    field: "tone",
    question: {
      en: "How should you sound when you are at your best?",
      ar: "كيف ينبغي أن يبدو أسلوبك في أفضل حالاته؟",
    },
    why: {
      en: "This is the difference between a draft you send and a draft you rewrite.",
      ar: "هذا هو الفرق بين مسودة ترسلها ومسودة تعيد كتابتها.",
    },
    placeholder: {
      en: "e.g. Authoritative but reassuring, plain Arabic and English, no jargon",
      ar: "مثال: موثوق ومطمئن، بلغة عربية وإنجليزية واضحة، دون مصطلحات معقدة",
    },
    suggestions: [
      { en: "Clear, factual and leadership-ready", ar: "واضح وموضوعي وجاهز للعرض على القيادة" },
      {
        en: "Authoritative but reassuring, no jargon",
        ar: "موثوق ومطمئن، دون مصطلحات معقدة",
      },
      { en: "Warm, plain language, bilingual", ar: "ودود، لغة بسيطة، ثنائي اللغة" },
      { en: "Formal government register", ar: "أسلوب حكومي رسمي" },
    ],
    multi: false,
  },
  {
    field: "knowledge",
    question: {
      en: "Last one — which approved sources am I allowed to draw on?",
      ar: "سؤال أخير — ما المصادر المعتمدة التي يُسمح لي بالاعتماد عليها؟",
    },
    why: {
      en: "Anything outside this list, I will decline and tell you why.",
      ar: "أي شيء خارج هذه القائمة سأرفضه وأوضح السبب.",
    },
    placeholder: {
      en: "e.g. Ministry health policies 2026",
      ar: "مثال: سياسات الوزارة الصحية ٢٠٢٦",
    },
    suggestions: [
      { en: "Ministry campaign analytics dashboard", ar: "لوحة تحليلات الحملات في الوزارة" },
      { en: "FAHR official tone guide", ar: "دليل النبرة الرسمي للهيئة" },
      { en: "Ministry health policies 2026", ar: "سياسات الوزارة الصحية ٢٠٢٦" },
      { en: "Federal responsible-AI checklist", ar: "قائمة الذكاء الاصطناعي المسؤول الاتحادية" },
    ],
    multi: true,
  },
];

// ---------------------------------------------------------------------------
// The training run
// ---------------------------------------------------------------------------

/**
 * The training log, composed from what the learner actually entered. Quoting
 * their own words back is the whole point — a generic "training model…" line
 * would prove nothing.
 */
export function trainingLog(profile: TwinProfile, isAr: boolean): string[] {
  const lines: string[] = [];
  const list = (values: string[]) => values.join(isAr ? "، " : ", ");

  if (profile.role) {
    lines.push(isAr ? `تم استيعاب الدور: ${profile.role}` : `Role understood: ${profile.role}`);
  }
  if (profile.tasks.length > 0) {
    lines.push(
      isAr
        ? `تم تعلّم ${profile.tasks.length} مهام متكررة: ${list(profile.tasks)}`
        : `Learned ${profile.tasks.length} recurring ${profile.tasks.length === 1 ? "task" : "tasks"}: ${list(profile.tasks)}`,
    );
  }
  if (profile.briefs.length > 0) {
    lines.push(
      isAr
        ? `تم تحليل ${profile.briefs.length} من مستنداتك للأسلوب والبنية`
        : `Analysed ${profile.briefs.length} of your documents for format and structure`,
    );
  }
  if (profile.tone) {
    lines.push(isAr ? `تمت معايرة النبرة: ${profile.tone}` : `Tone calibrated: ${profile.tone}`);
  }
  if (profile.knowledge.length > 0) {
    lines.push(
      isAr
        ? `تم ربط ${profile.knowledge.length} مصادر معرفية معتمدة`
        : `Connected ${profile.knowledge.length} approved knowledge ${profile.knowledge.length === 1 ? "source" : "sources"}`,
    );
  }

  // Both federal guardrails are enforced in code and cannot be switched off,
  // so counting how many are "applied" is always the same number and reads
  // as noise — name them instead.
  const guardrailNames = GUARDRAILS.map((g) => (isAr ? g.label.ar : g.label.en));
  lines.push(
    isAr
      ? `تعمل تحت ضوابط الحوكمة الاتحادية: ${guardrailNames.join("، ")}`
      : `Operating under the federal governance guardrails: ${guardrailNames.join(", ")}`,
  );

  const own = profile.customGuardrails;
  if (own.length > 0) {
    lines.push(
      isAr
        ? `تم اعتماد ${own.length} من قواعدك الخاصة: ${own.map((r) => r.label).join("، ")}`
        : `Adopted ${own.length} of your own ${own.length === 1 ? "rule" : "rules"}: ${own.map((r) => r.label).join(", ")}`,
    );
  }

  return lines;
}

// ---------------------------------------------------------------------------
// The test chat
// ---------------------------------------------------------------------------

export type ReplyStatus = "ok" | "blocked" | "out-of-scope";

export type GuardrailNote = {
  /** A federal guardrail id, or a custom rule's id. */
  id: GuardrailId | string;
  /** `held` and `refused` are the guardrail working; `breach` is what its absence costs. */
  kind: "held" | "refused" | "breach";
  text: string;
};

/**
 * What a blocked reply is allowed to say about a PII finding. Deliberately
 * narrower than `PiiFinding` — it drops `match`, `start` and `end`, so the
 * raw captured substring (a real name, a real phone number) never crosses
 * into `TwinReply`, which lives in component state for the life of the test
 * chat session. The offsets and the raw match stay inside `piiScreen.ts`,
 * where redaction actually needs them.
 */
export type PiiFindingSummary = { kind: PiiKind; label: string };

export type TwinReply = {
  status: ReplyStatus;
  text: string;
  /** The learner's own tasks and sources this answer leaned on. */
  citations: string[];
  notes: GuardrailNote[];
  /** Set only when status is "blocked" — what the screen found and redacted. */
  pii?: { findings: PiiFindingSummary[]; redacted: string };
};

/** Trivial stop-word filter so scope matching keys off meaningful words. */
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "is", "are",
  "me", "my", "our", "you", "your", "with", "about", "draft", "write", "give",
  "can", "please", "how", "what", "why", "do", "does", "this", "that", "from",
  "من", "في", "على", "عن", "إلى", "هذا", "هذه", "ما", "هل", "لي", "لنا",
]);

function words(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Everything the learner told us, as a single pool to match questions against.
 * Each entry keeps its own label so a match can be cited by name.
 */
function knowledgePool(profile: TwinProfile): { label: string; terms: string[] }[] {
  return [
    ...profile.tasks.map((task) => ({ label: task, terms: words(task) })),
    ...profile.knowledge.map((source) => ({ label: source, terms: words(source) })),
    ...profile.briefs.map((brief) => ({ label: brief, terms: words(brief) })),
    ...(profile.role ? [{ label: profile.role, terms: words(profile.role) }] : []),
  ];
}

/** Which of the learner's own entries this question overlaps with. */
function matchScope(profile: TwinProfile, question: string): string[] {
  const asked = new Set(words(question));
  return knowledgePool(profile)
    .filter((entry) => entry.terms.some((term) => asked.has(term)))
    .map((entry) => entry.label);
}

/**
 * Compose the twin's answer.
 *
 * The order matters and mirrors how a real guarded assistant behaves: screen
 * the prompt first for personal data, then check it is in scope of what the
 * learner taught the twin, then answer. Both guardrails are enforced in code
 * and cannot be switched off — there is no user-reachable path that disables
 * either one, so a real government audience never sees federal policy turned
 * off on stage.
 */
export function answer(profile: TwinProfile, question: string, isAr: boolean): TwinReply {
  const notes: GuardrailNote[] = [];
  const guardrails = profile.guardrails;

  // 1 — Screen the prompt for personal data.
  // Pattern-based screening (lib/piiScreen.ts, Task 12) replaced the old
  // keyword-only mentionsPersonalData() check here. The blocked reply below
  // carries the screen's own findings and redaction (Task 15) so the test
  // chat can show exactly what was caught and discarded.
  const pii = screenForPii(question);
  if (pii.hit) {
    if (guardrails.noPersonalData) {
      return {
        status: "blocked",
        text: isAr
          ? "لا أستطيع معالجة هذا الطلب. يحتوي على بيانات شخصية، وقد أوقفه الفحص قبل وصوله إلى النموذج. أعد صياغة السؤال بصيغة مجمّعة وسأساعدك."
          : "I cannot process that. It contains personal data, and the screen stopped it before it reached the model. Ask me the same question in aggregate terms and I will help.",
        citations: [],
        notes: [
          ...notes,
          {
            id: "noPersonalData",
            kind: "refused",
            text: isAr
              ? "أوقف الضابط الطلب قبل وصوله إلى النموذج."
              : "The guardrail stopped the prompt before it reached the model.",
          },
        ],
        // Map to PiiFindingSummary — `pii.findings` still carries the raw
        // `match` text; only `kind` and `label` are allowed to cross into
        // TwinReply, which component state holds for the session.
        pii: {
          findings: pii.findings.map(({ kind, label }) => ({ kind, label })),
          redacted: pii.redacted,
        },
      };
    }

    notes.push({
      id: "noPersonalData",
      kind: "breach",
      text: isAr
        ? "وصلت بيانات شخصية إلى النموذج دون فحص. هذا ما كان الضابط سيمنعه."
        : "Personal data reached the model unscreened. This is exactly what the guardrail would have stopped.",
    });
  }

  // 2 — Check the question against what the learner taught us.
  const matched = matchScope(profile, question);

  if (matched.length === 0) {
    if (guardrails.approvedKnowledgeOnly) {
      return {
        status: "out-of-scope",
        text: isAr
          ? `هذا خارج المصادر التي ربطتها بي. ما أستطيع تغطيته اليوم: ${[...profile.tasks, ...profile.knowledge].slice(0, 3).join("، ") || "لا شيء بعد"}. أضف مصدرًا معتمدًا وسأتولى الأمر.`
          : `That sits outside the sources you connected me to. What I can cover today: ${[...profile.tasks, ...profile.knowledge].slice(0, 3).join(", ") || "nothing yet"}. Connect an approved source and I will take it on.`,
        citations: [],
        notes: [
          ...notes,
          {
            id: "approvedKnowledgeOnly",
            kind: "held",
            text: isAr
              ? "رفض التوأم الإجابة بدل تأليف إجابة بلا مصدر."
              : "The twin declined rather than inventing an answer it could not cite.",
          },
        ],
      };
    }

    notes.push({
      id: "approvedKnowledgeOnly",
      kind: "breach",
      text: isAr
        ? "أجاب التوأم من معرفة عامة. لا يوجد مصدر معتمد يدعم هذه الإجابة."
        : "The twin answered from general knowledge. No approved source backs this answer.",
    });
  }

  // 3 — Compose the draft, in the voice they described.
  const primary = matched[0];
  const tone = profile.tone || (isAr ? "أسلوبك المعتاد" : "your usual register");

  let text: string;
  if (primary && isDemoTask(primary)) {
    text = demoTaskReply(profile, question, tone, isAr);
  } else if (primary) {
    text = isAr
      ? `أعددت هذا كـ«${primary}»، بالنبرة التي وصفتها: ${tone}.\n\nمسودة جاهزة للمراجعة، مبنية على صيغتك المعتادة ومحاذاة مع ${profile.knowledge[0] ?? "مصادرك المعتمدة"}.`
      : `I have drafted this as "${primary}", in the voice you described: ${tone}.\n\nReady for your review, built on your usual format and checked against ${profile.knowledge[0] ?? "your approved sources"}.`;
  } else {
    text = isAr
      ? `إليك مسودة عامة بالنبرة التي وصفتها: ${tone}. لا يوجد مصدر معتمد أستند إليه هنا.`
      : `Here is a general draft in the voice you described: ${tone}. I have no approved source to stand this on.`;
  }

  for (const rule of profile.customGuardrails) {
    notes.push({
      id: rule.id,
      kind: "held",
      text: isAr ? `قاعدتك مطبّقة: ${rule.label}` : `Your rule applied: ${rule.label}`,
    });
  }

  return {
    status: "ok",
    text,
    citations: matched.slice(0, 3),
    notes,
  };
}

function isDemoTask(task: string): boolean {
  return task === DEMO_PROJECT.task || task === DEMO_PROJECT.taskAr;
}

/**
 * The twin on the demo's own task. Asked how it would approach the weekly
 * report it lays out the steps; asked for the report it drafts one, so the
 * client sees real work rather than a promise of it.
 */
function demoTaskReply(profile: TwinProfile, question: string, tone: string, isAr: boolean): string {
  const source = profile.knowledge[0] ?? (isAr ? "مصادرك المعتمدة" : "your approved sources");
  const format = profile.briefs[0] ?? (isAr ? "صيغتك المعتادة" : "your usual format");
  const approach = /approach|how\b|كيف/i.test(question);

  if (isAr) {
    return approach
      ? `هكذا سأتولى تقرير الأداء الأسبوعي، بالنبرة التي وصفتها: ${tone}.\n\n١. أسحب أرقام الأسبوع من ${source}.\n٢. أقارنها بالأسبوع السابق وأنبّه إلى أي رقم تغيّر بأكثر من ٢٠٪.\n٣. أصوغ الملخص على نمط ${format}.\n٤. أسلّمه لك لتتحقق من الأرقام وتعتمده قبل إرساله إلى مدير الإدارة.`
      : `مسودة تقرير الأداء لهذا الأسبوع، بالنبرة التي وصفتها: ${tone}.\n\nالعنوان الرئيسي: ارتفع وصول الحملات ١٢٪ عن الأسبوع الماضي، بفضل منشورات تطعيمات العودة إلى المدارس.\n• استقر التفاعل عند ٤٫١٪.\n• انخفضت استفسارات مركز الاتصال عن التطعيم ٨٪ بعد تحديث الأسئلة الشائعة.\n• رقم للتحقق: ارتفعت زيارات الموقع ٣١٪.\n\nجاهزة لمراجعتك، ومطابقة مع ${source}.`;
  }

  return approach
    ? `Here is how I would take on the weekly performance report, in the voice you described: ${tone}.\n\n1. Pull the week's figures from the ${source}.\n2. Compare them with last week and flag anything that moved by more than 20%.\n3. Draft the summary in the format of your ${format.charAt(0).toLowerCase() + format.slice(1)}.\n4. Hand it to you to check the figures and sign off before it goes to the department head.`
    : `This week's performance report, drafted in the voice you described: ${tone}.\n\nHeadline: campaign reach is up 12% on last week, driven by the back-to-school vaccination posts.\n• Engagement held steady at 4.1%.\n• Call-centre enquiries about vaccination fell 8% after the FAQ update.\n• One figure to check: website visits jumped 31%.\n\nReady for your review, checked against the ${source}.`;
}

/** The behaviour a suggested question exists to demonstrate. */
export type SuggestionKind = "grounded" | "out-of-scope" | "personal-data" | "draft";

export type SuggestedQuestion = {
  kind: SuggestionKind;
  /** What the chip reads. */
  label: string;
  /** What is actually sent when it is clicked. Usually the same as `label`. */
  prompt: string;
};

/**
 * Four one-tap chips in the test chat, one per behaviour worth demonstrating:
 * a grounded answer that cites a source, an honest refusal of an
 * out-of-scope question, the personal-data block, and a useful draft. The
 * first and last are derived from the learner's own twin where possible, so
 * the chips stay true if the interview answers change; both fall back to a
 * generic prompt when the learner has not described any recurring tasks yet.
 */
/** A made-up but well-formed UAE mobile for the personal-data chip. */
export const DEMO_MOBILE = "+971 50 418 2736";

export function suggestedQuestions(profile: TwinProfile, isAr: boolean): SuggestedQuestion[] {
  const task = (i: number) => profile.tasks[i];
  // Chip 4 prefers the learner's second task so it reads differently from
  // chip 1, but falls back to the first task rather than an unrelated
  // generic line — a generic fallback shares no words with the knowledge
  // pool `matchScope` checks against, so it would trip the
  // approvedKnowledgeOnly guardrail and return the out-of-scope refusal
  // instead of the useful answer this chip exists to demonstrate.
  const chip4Task = task(1) ?? task(0);
  return [
    // 1 — grounded: something the learner taught it, so the answer cites a source.
    {
      kind: "grounded",
      label: task(0)
        ? isAr
          ? `كيف أتعامل مع: ${task(0)}؟`
          : `How should I approach: ${task(0)}?`
        : isAr
          ? "ماذا يقول دليل النبرة الرسمي للهيئة؟"
          : "What does the FAHR tone guide say?",
      prompt: task(0)
        ? isAr
          ? `كيف أتعامل مع: ${task(0)}؟`
          : `How should I approach: ${task(0)}?`
        : isAr
          ? "ماذا يقول دليل النبرة الرسمي للهيئة؟"
          : "What does the FAHR tone guide say?",
    },
    // 2 — outside approved knowledge: the honest refusal.
    {
      kind: "out-of-scope",
      label: isAr
        ? "ما توقعات الميزانية الاتحادية للعام القادم؟"
        : "What is next year's federal budget forecast?",
      prompt: isAr
        ? "ما توقعات الميزانية الاتحادية للعام القادم؟"
        : "What is next year's federal budget forecast?",
    },
    // 3 — personal data: safe label, loaded prompt, so the block is one click.
    // The prompt carries the demo learner's own name and a realistic UAE mobile
    // so the screen visibly catches something believable.
    {
      kind: "personal-data",
      label: isAr ? "جرّب رسالة تحتوي بيانات شخصية" : "Try a message containing personal data",
      prompt: isAr
        ? `اسمي ${LEARNER_PROFILE.nameAr} ورقم هاتفي ${DEMO_MOBILE} — اكتب ردًا على المتعامل باسمي.`
        : `My name is ${LEARNER_PROFILE.name}, my mobile is ${DEMO_MOBILE} — draft a reply to the customer from me.`,
    },
    // 4 — real work: the twin being useful.
    {
      kind: "draft",
      label: chip4Task
        ? isAr
          ? `اكتب نسخة هذا الأسبوع من: ${chip4Task}`
          : `Draft this week's version of: ${chip4Task}`
        : isAr
          ? "اكتب تحديثًا من سطرين لمدير إدارتي"
          : "Draft a two-line update for my department manager",
      prompt: chip4Task
        ? isAr
          ? `اكتب نسخة هذا الأسبوع من: ${chip4Task}`
          : `Draft this week's version of: ${chip4Task}`
        : isAr
          ? "اكتب تحديثًا من سطرين لمدير إدارتي"
          : "Draft a two-line update for my department manager",
    },
  ];
}

// ---------------------------------------------------------------------------
// Hand-off to the Workplace Project
// ---------------------------------------------------------------------------

function lowerFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

/** "a Marketing Specialist", "an engagement officer". */
function withArticle(role: string): string {
  return `${/^[aeiou]/i.test(role) ? "an" : "a"} ${role}`;
}

/** A document the learner named, as it reads mid-sentence: "my past weekly…", "the National…". */
function documentPhrase(name: string): string {
  return /^past\s/i.test(name) ? `my ${lowerFirst(name)}` : `the ${name}`;
}

/**
 * The project title and challenge for one of the twin's recurring tasks, in
 * the learner's own words from the interview — so picking a task on the
 * project screen visibly turns the twin into the project.
 */
export function projectBriefFromTask(profile: TwinProfile, task: string): { title: string; challenge: string } {
  // A title-case job title ("Marketing Specialist") keeps its capitals; a
  // sentence-case one ("Campaign and content lead") reads lower mid-sentence.
  const given = profile.role || LEARNER_PROFILE.role;
  const role = /^(\p{Lu}\p{Ll}*\s?)+$/u.test(given) ? given : lowerFirst(given);
  const brief = profile.briefs[0];
  const source = profile.knowledge[0];

  // What the twin already does with it, from what the learner taught it.
  const twinDoes = [
    "My digital twin already drafts it",
    brief ? ` from ${documentPhrase(brief)}` : "",
    source ? `, checked against the ${source}` : "",
    profile.tone ? `, in the tone I set (${lowerFirst(profile.tone)})` : "",
    ".",
  ].join("");

  if (isDemoTask(task)) {
    return {
      title: DEMO_PROJECT.title,
      challenge: [
        `As ${withArticle(role)} in ${LEARNER_PROFILE.department}, I prepare the weekly performance report every Monday.`,
        "It takes me about six hours: pulling reach, engagement and enquiry figures from four separate dashboards, reconciling them in a spreadsheet and writing the summary for the department head.",
        "The figures rarely match between sources, the report lands on Tuesday afternoon instead of Monday morning, and there is no time left to explain what actually changed.",
        twinDoes,
        "This project puts it to work properly: the twin drafts, I check the figures and sign off, and the time saved is measured.",
      ].join(" "),
    };
  }

  return {
    title: `${task} with my AI Digital Twin`,
    challenge: [
      `As ${withArticle(role)} in ${LEARNER_PROFILE.department}, ${lowerFirst(task)} is recurring work that takes several hours every week, done by hand.`,
      twinDoes,
      "This project puts it to work properly: the twin drafts, I review and sign off, and the time saved is measured.",
    ].join(" "),
  };
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export type TwinAssessment = {
  value: number;
  summary: string;
  evidence: string[];
};

/**
 * Scores the twin the learner built, for the Assessment Agent.
 *
 * Governance no longer varies by configuration: both federal guardrails are
 * enforced in code and cannot be switched off, so there is nothing left for
 * a learner to relax and no penalty left to apply. Governance is therefore a
 * fixed share of the score — what still varies is how well the twin is
 * described, whether it was trained, and any rules the learner layered on
 * top of the federal two.
 */
export function assessTwin(profile: TwinProfile): TwinAssessment {
  const captured = capturedFields(profile);
  const ownRules = profile.customGuardrails;

  // Description carries 55, training 15, governance the remaining 30.
  const described = Math.round((captured.length / TWIN_FIELDS.length) * 55);
  const trained = profile.trainedAt ? 15 : 0;
  const governance = 30;
  const value = Math.max(35, described + trained + governance);

  const evidence: string[] = [];

  evidence.push(
    profile.tasks.length > 0
      ? `The twin was grounded in ${profile.tasks.length} recurring ${profile.tasks.length === 1 ? "task" : "tasks"}, starting with "${profile.tasks[0]}".`
      : "No recurring task was attached to the twin, so it is not yet anchored to real work.",
  );

  evidence.push(
    profile.knowledge.length > 0
      ? `${profile.knowledge.length} approved knowledge ${profile.knowledge.length === 1 ? "source" : "sources"} connected, so answers can be traced back to something citable.`
      : "No approved knowledge source is connected, so nothing the twin says can be traced.",
  );

  evidence.push(
    `Operates under FAHR's ${GUARDRAILS.length} enforced guardrails, always on: ${GUARDRAILS
      .map((guardrail) => guardrail.label.en.toLowerCase())
      .join(" and ")}.`,
  );

  if (ownRules.length > 0) {
    evidence.push(
      `The learner added ${ownRules.length} rule${ownRules.length === 1 ? "" : "s"} of their own: ${ownRules
        .map((rule) => rule.label)
        .join(", ")}.`,
    );
  }

  return {
    value,
    summary: "The digital twin the learner built, operating under FAHR's enforced guardrails.",
    evidence,
  };
}
