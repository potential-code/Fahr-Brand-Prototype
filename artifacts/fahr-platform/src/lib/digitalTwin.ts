// The Agentic AI Lab — Stage 1 Digital Twin.
//
// Everything the twin "knows" comes from what the learner types during the
// interview, and everything it refuses to do comes from the guardrails they
// leave switched on. There is no model behind this: `answer()` matches the
// question against the learner's own words and composes a reply that quotes
// them back. That is deliberate — a demo has to be repeatable in a room with
// no network, and a reply that cites the task the client just typed reads as
// far more intelligent than a generic one.

import { screenForPii } from "@/lib/piiScreen";

export type LabelPair = { en: string; ar: string };

export type TwinFieldId = "role" | "tasks" | "briefs" | "tone" | "knowledge";

/** The five things the interview captures, in the order it asks for them. */
export const TWIN_FIELDS: TwinFieldId[] = ["role", "tasks", "briefs", "tone", "knowledge"];

export type GuardrailId =
  | "humanReview"
  | "noPersonalData"
  | "approvedKnowledgeOnly"
  | "auditTrail";

export type Guardrail = {
  id: GuardrailId;
  label: LabelPair;
  /** What the guardrail does while it is on. */
  on: LabelPair;
  /** What the learner is accepting by switching it off. */
  off: LabelPair;
  /** Federal policy this mirrors in the FAHR governance console. */
  policy: LabelPair;
};

export const GUARDRAILS: Guardrail[] = [
  {
    id: "humanReview",
    label: { en: "Human review required", ar: "مراجعة بشرية إلزامية" },
    on: {
      en: "Anything the twin drafts goes to your department manager before it reaches a resident.",
      ar: "كل ما يصيغه التوأم يُرسل إلى مدير إدارتك قبل وصوله إلى المتعامل.",
    },
    off: {
      en: "The twin publishes directly. No named person approves the output.",
      ar: "ينشر التوأم مباشرة. لا يوجد شخص مسؤول يعتمد المخرجات.",
    },
    policy: {
      en: "Federal policy — human-in-the-loop for high-risk actions",
      ar: "سياسة اتحادية — تدخل بشري في الإجراءات عالية المخاطر",
    },
  },
  {
    id: "noPersonalData",
    label: { en: "No sensitive personal data", ar: "لا بيانات شخصية حساسة" },
    on: {
      en: "Prompts are screened for personal data before they reach the model.",
      ar: "تُفحص الطلبات بحثًا عن بيانات شخصية قبل وصولها إلى النموذج.",
    },
    off: {
      en: "Personal data reaches the model unscreened — a PDPL exposure.",
      ar: "تصل البيانات الشخصية إلى النموذج دون فحص — مخالفة لقانون حماية البيانات.",
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
    off: {
      en: "The twin answers from general knowledge with nothing to cite.",
      ar: "يجيب التوأم من معرفة عامة دون مصدر يمكن الاستناد إليه.",
    },
    policy: {
      en: "Entity policy — approved knowledge sources only",
      ar: "سياسة الجهة — مصادر المعرفة المعتمدة فقط",
    },
  },
  {
    id: "auditTrail",
    label: { en: "Full audit trail", ar: "سجل تدقيق كامل" },
    on: {
      en: "Every exchange is recorded with a reference the governance console can retrieve.",
      ar: "تُسجل كل محادثة برقم مرجعي يمكن لوحدة الحوكمة الرجوع إليه.",
    },
    off: {
      en: "Nothing is recorded. There is no evidence of what the twin was asked.",
      ar: "لا يُسجل شيء. لا يوجد دليل على ما طُلب من التوأم.",
    },
    policy: {
      en: "Federal policy — immutable audit trail",
      ar: "سياسة اتحادية — سجل تدقيق غير قابل للتعديل",
    },
  },
];

/**
 * A rule the learner wrote themselves.
 *
 * The four federal guardrails are enforced in code — they change what
 * `answer()` does. A custom rule is a declared constraint instead: the twin
 * states it is operating under it, and it counts toward the governance score,
 * but the platform cannot enforce arbitrary prose. Worth having anyway,
 * because "my twin never quotes a price" is exactly the kind of local rule an
 * entity wants to capture.
 */
export type CustomGuardrail = {
  id: string;
  label: string;
  enabled: boolean;
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
      humanReview: true,
      noPersonalData: true,
      approvedKnowledgeOnly: true,
      auditTrail: true,
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

/** Every rule in force, federal and learner-authored. */
export function activeGuardrailCount(profile: TwinProfile): number {
  const federal = GUARDRAILS.filter((guardrail) => profile.guardrails[guardrail.id]).length;
  return federal + profile.customGuardrails.filter((rule) => rule.enabled).length;
}

export function totalGuardrailCount(profile: TwinProfile): number {
  return GUARDRAILS.length + profile.customGuardrails.length;
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
      en: "e.g. I run public health awareness campaigns for the Ministry",
      ar: "مثال: أدير حملات التوعية الصحية في الوزارة",
    },
    suggestions: [
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
      en: "e.g. Drafting campaign briefs every Sunday",
      ar: "مثال: صياغة موجزات الحملات كل يوم أحد",
    },
    suggestions: [
      { en: "Drafting campaign briefs", ar: "صياغة موجزات الحملات" },
      { en: "Writing social media copy", ar: "كتابة محتوى وسائل التواصل" },
      { en: "Summarising audience sentiment reports", ar: "تلخيص تقارير انطباعات الجمهور" },
      { en: "Preparing weekly performance reports", ar: "إعداد تقارير الأداء الأسبوعية" },
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
      { en: "FAHR official tone guide", ar: "دليل النبرة الرسمي للهيئة" },
      { en: "Ministry health policies 2026", ar: "سياسات الوزارة الصحية ٢٠٢٦" },
      { en: "Past campaign performance data", ar: "بيانات أداء الحملات السابقة" },
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

  const active = GUARDRAILS.filter((g) => profile.guardrails[g.id]);
  lines.push(
    isAr
      ? `تم تطبيق ${active.length} من ${GUARDRAILS.length} ضوابط حوكمة`
      : `Applied ${active.length} of ${GUARDRAILS.length} governance guardrails`,
  );

  const own = profile.customGuardrails.filter((rule) => rule.enabled);
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

export type TwinReply = {
  status: ReplyStatus;
  text: string;
  /** The learner's own tasks and sources this answer leaned on. */
  citations: string[];
  notes: GuardrailNote[];
  /** Audit reference, when the audit trail is on. */
  auditRef: string | null;
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
 * the prompt first, then check scope, then answer, then decide who sees the
 * output. Each guardrail that is switched off changes the outcome visibly
 * rather than silently — that is what makes the toggles worth demonstrating.
 */
export function answer(profile: TwinProfile, question: string, isAr: boolean): TwinReply {
  const notes: GuardrailNote[] = [];
  const guardrails = profile.guardrails;
  const auditRef = guardrails.auditTrail
    ? `AUD-${Math.abs(hash(question)).toString(36).slice(0, 6).toUpperCase()}`
    : null;

  if (!guardrails.auditTrail) {
    notes.push({
      id: "auditTrail",
      kind: "breach",
      text: isAr
        ? "لم تُسجَّل هذه المحادثة. لا يوجد دليل على ما طُلب."
        : "This exchange was not recorded. There is no evidence of what was asked.",
    });
  }

  // 1 — Screen the prompt for personal data.
  // Pattern-based screening (lib/piiScreen.ts, Task 12) replaced the old
  // keyword-only mentionsPersonalData() check here. Task 15 will attach the
  // richer pii findings/redaction to the blocked reply payload; for now this
  // only swaps the predicate so the guardrail keeps working end to end.
  if (screenForPii(question).hit) {
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
        auditRef,
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
        auditRef,
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
  if (primary) {
    text = isAr
      ? `أعددت هذا كـ«${primary}»، بالنبرة التي وصفتها: ${tone}.\n\nمسودة جاهزة للمراجعة، مبنية على صيغتك المعتادة ومحاذاة مع ${profile.knowledge[0] ?? "مصادرك المعتمدة"}.`
      : `I have drafted this as "${primary}", in the voice you described: ${tone}.\n\nReady for your review, built on your usual format and checked against ${profile.knowledge[0] ?? "your approved sources"}.`;
  } else {
    text = isAr
      ? `إليك مسودة عامة بالنبرة التي وصفتها: ${tone}. لا يوجد مصدر معتمد أستند إليه هنا.`
      : `Here is a general draft in the voice you described: ${tone}. I have no approved source to stand this on.`;
  }

  // 4 — Decide who sees the output.
  if (guardrails.humanReview) {
    text += isAr
      ? "\n\nأرسلتها إلى مديرة إدارتك مريم الزعابي للاعتماد قبل النشر."
      : "\n\nI have routed it to your department manager, Mariam Al Zaabi, for approval before it goes out.";
    notes.push({
      id: "humanReview",
      kind: "held",
      text: isAr
        ? "بانتظار اعتماد بشري — لم يصل شيء إلى المتعامل بعد."
        : "Pending human approval — nothing has reached a resident yet.",
    });
  } else {
    text += isAr
      ? "\n\nنُشرت مباشرة. لم يعتمدها أحد."
      : "\n\nPublished directly. Nobody approved it.";
    notes.push({
      id: "humanReview",
      kind: "breach",
      text: isAr
        ? "خرجت المسودة دون اعتماد بشري. لا يوجد اسم مسؤول عنها."
        : "The draft went out with no human approval. No named person stands behind it.",
    });
  }

  for (const rule of profile.customGuardrails.filter((entry) => entry.enabled)) {
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
    auditRef,
  };
}

/** Stable per-question audit reference, so replaying the demo looks consistent. */
function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index);
    result |= 0;
  }
  return result;
}

/**
 * Questions offered as one-tap chips in the test chat. The first two land
 * inside any twin the interview produced; the last two are the ones worth
 * demonstrating, because they show the guardrails refusing.
 */
export function suggestedQuestions(profile: TwinProfile, isAr: boolean): string[] {
  const firstTask = profile.tasks[0];
  const questions: string[] = [];

  if (firstTask) {
    questions.push(isAr ? `ابدأ في: ${firstTask}` : `Make a start on: ${firstTask}`);
  }
  if (profile.knowledge[0]) {
    questions.push(
      isAr
        ? `ما الذي يقوله ${profile.knowledge[0]} عن هذا؟`
        : `What does ${profile.knowledge[0]} say about this?`,
    );
  }

  questions.push(
    isAr
      ? "أعطني السجل الطبي لهذا المريض وملخص تشخيصه"
      : "Pull up this patient's medical record and summarise the diagnosis",
  );
  questions.push(
    isAr ? "ما توقعات الميزانية الاتحادية للعام القادم؟" : "What is next year's federal budget forecast?",
  );

  return questions;
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
 * Guardrails carry real weight here: a twin that answers well but had its
 * human review or personal-data screen switched off is not a twin a federal
 * entity can deploy, and the score has to say so. This is what closes the loop
 * on the Lab — the switches the learner flipped follow them to evaluation.
 */
export function assessTwin(profile: TwinProfile): TwinAssessment {
  const captured = capturedFields(profile);
  const relaxed = GUARDRAILS.filter((guardrail) => !profile.guardrails[guardrail.id]);
  const ownRules = profile.customGuardrails.filter((rule) => rule.enabled);

  // Description carries 55, training 15, governance the remaining 30.
  const described = Math.round((captured.length / TWIN_FIELDS.length) * 55);
  const trained = profile.trainedAt ? 15 : 0;
  const governance = Math.round(((GUARDRAILS.length - relaxed.length) / GUARDRAILS.length) * 30);
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
    relaxed.length === 0
      ? `All ${GUARDRAILS.length} governance guardrails were left in place.`
      : `${relaxed.length} of ${GUARDRAILS.length} guardrails were switched off: ${relaxed
          .map((guardrail) => guardrail.label.en.toLowerCase())
          .join(", ")}. This would not pass entity review as configured.`,
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
    summary: "The digital twin the learner built, and the guardrails they left on it.",
    evidence,
  };
}
