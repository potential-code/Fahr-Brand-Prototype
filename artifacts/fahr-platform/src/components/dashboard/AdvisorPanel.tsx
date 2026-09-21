import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAgentConversation,
  type AgentConversation,
  type Utterance,
} from "./useAgentConversation";
import { useLanguage } from "@/lib/LanguageContext";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  MessageSquare,
  Mic,
  Pause,
  Phone,
  Play,
  PlayCircle,
  RotateCcw,
  TrendingUp,
  User,
  Video,
} from "lucide-react";
import { useLocation } from "wouter";
import { AGENTS } from "@/lib/constants";

const BASE = import.meta.env.BASE_URL;

type LabelPair = { en: string; ar: string };

type VideoItem = { title: LabelPair; duration: string; image: string };
type AssessmentOption = { label: LabelPair; correct?: boolean };

type ChatStep =
  | { kind: "agent"; en: string; ar: string }
  | { kind: "user"; en: string; ar: string }
  | { kind: "gap"; strengths: LabelPair[]; gaps: LabelPair[] }
  | { kind: "videos"; items: VideoItem[] }
  | {
      kind: "assessment";
      question: LabelPair;
      options: AssessmentOption[];
    }
  | {
      kind: "example";
      org: LabelPair;
      title: LabelPair;
      context: LabelPair;
      impact: LabelPair;
    }
  | {
      kind: "block";
      tag: LabelPair;
      title: LabelPair;
      icon: "learn" | "simulate" | "outcome";
      status: "done" | "active" | "next";
    };

const SCRIPT: ChatStep[] = [
  {
    kind: "agent",
    en: "Welcome Aisha. To personalise your learning pathway, I will ask a few quick questions. What does your role focus on day to day?",
    ar: "مرحباً عائشة. لتخصيص مسار التعلم الخاص بك، سأطرح بعض الأسئلة السريعة. ما الذي يركز عليه دورك يومياً؟",
  },
  {
    kind: "user",
    en: "I plan and run public health awareness campaigns for the Ministry.",
    ar: "أخطط وأدير حملات التوعية الصحية العامة للوزارة.",
  },
  {
    kind: "agent",
    en: "Got it. When you build a campaign, how confident are you using AI to analyse performance and audience data?",
    ar: "فهمت. عند بناء حملة، ما مدى ثقتك في استخدام الذكاء الاصطناعي لتحليل الأداء وبيانات الجمهور؟",
  },
  {
    kind: "user",
    en: "I am strong on content and messaging, but I rarely use AI for analytics.",
    ar: "أنا قوية في المحتوى والرسائل، لكنني نادراً ما أستخدم الذكاء الاصطناعي للتحليلات.",
  },
  {
    kind: "agent",
    en: "Thank you. And would you like to build a reusable AI assistant for your team's campaign work?",
    ar: "شكراً لك. وهل ترغبين في بناء مساعد ذكاء اصطناعي قابل لإعادة الاستخدام لعمل حملات فريقك؟",
  },
  {
    kind: "user",
    en: "Yes, that would save us a lot of repeated effort.",
    ar: "نعم، سيوفر ذلك علينا الكثير من الجهد المتكرر.",
  },
  {
    kind: "agent",
    en: "I have analysed your responses against the FAHR AI capability framework. Here is your skills gap.",
    ar: "لقد حللت إجاباتك مقارنة بإطار قدرات الذكاء الاصطناعي. إليك فجوة المهارات الخاصة بك.",
  },
  {
    kind: "gap",
    strengths: [
      { en: "Content Strategy", ar: "استراتيجية المحتوى" },
      { en: "Public Communication", ar: "التواصل العام" },
      { en: "Audience Empathy", ar: "تفهم الجمهور" },
    ],
    gaps: [
      { en: "AI-Assisted Analytics", ar: "تحليلات بمساعدة الذكاء الاصطناعي" },
      { en: "Prompt Engineering", ar: "هندسة الأوامر" },
      { en: "Outcome Measurement", ar: "قياس النتائج" },
    ],
  },
  {
    kind: "agent",
    en: "Let's start building your learning pathway. Watch these three short videos, chosen for a public health communications role.",
    ar: "لنبدأ ببناء مسار تعلمك. شاهدي هذه الفيديوهات القصيرة الثلاثة، المختارة لدور الاتصال في الصحة العامة.",
  },
  {
    kind: "videos",
    items: [
      {
        title: {
          en: "AI for Public Health Campaign Analytics",
          ar: "الذكاء الاصطناعي لتحليلات حملات الصحة العامة",
        },
        duration: "6:12",
        image: "brand/video-analytics.png",
      },
      {
        title: {
          en: "Writing Effective Prompts for Campaign Briefs",
          ar: "كتابة أوامر فعّالة لموجزات الحملات",
        },
        duration: "4:48",
        image: "brand/video-prompts.png",
      },
      {
        title: {
          en: "Measuring Outcomes, Not Just Reach",
          ar: "قياس النتائج، وليس مجرد الوصول",
        },
        duration: "5:30",
        image: "brand/video-outcomes.png",
      },
    ],
  },
  {
    kind: "agent",
    en: "Now a quick assessment to check what you took from the videos.",
    ar: "والآن تقييم سريع للتحقق مما استفدتِه من الفيديوهات.",
  },
  {
    kind: "assessment",
    question: {
      en: "Which metric best shows a public health campaign changed behaviour?",
      ar: "أي مقياس يُظهر بشكل أفضل أن حملة الصحة العامة غيّرت السلوك؟",
    },
    options: [
      { label: { en: "Total impressions", ar: "إجمالي مرات الظهور" } },
      {
        label: { en: "Increase in screening appointments booked", ar: "زيادة في مواعيد الفحص المحجوزة" },
        correct: true,
      },
      { label: { en: "Number of posts published", ar: "عدد المنشورات المنشورة" } },
    ],
  },
  {
    kind: "agent",
    en: "Well done. Here is a real-world example showing how this works in practice.",
    ar: "أحسنتِ. إليكِ مثالاً واقعياً يوضح كيف يعمل هذا عملياً.",
  },
  {
    kind: "example",
    org: { en: "Ministry of Health and Prevention", ar: "وزارة الصحة ووقاية المجتمع" },
    title: {
      en: "AI-optimised seasonal influenza awareness campaign",
      ar: "حملة توعية بالإنفلونزا الموسمية محسّنة بالذكاء الاصطناعي",
    },
    context: {
      en: "The team used AI to segment audiences and analyse channel performance daily, reallocating spend toward the messages driving real action.",
      ar: "استخدم الفريق الذكاء الاصطناعي لتقسيم الجمهور وتحليل أداء القنوات يومياً، وإعادة توجيه الإنفاق نحو الرسائل التي تحقق إجراءً فعلياً.",
    },
    impact: {
      en: "+38% screening appointments | 40% faster campaign turnaround",
      ar: "+38% مواعيد فحص | تنفيذ الحملة أسرع بنسبة 40%",
    },
  },
  {
    kind: "agent",
    en: "Based on this, I have generated your Personalised Learning Pathway. We will close the gaps through applied, outcome-based blocks.",
    ar: "بناءً على ذلك، أنشأت مسار التعلم الشخصي الخاص بك. سنغلق الفجوات من خلال وحدات تطبيقية قائمة على النتائج.",
  },
  {
    kind: "block",
    tag: { en: "LEARN", ar: "تعلّم" },
    title: {
      en: "Responsible AI for Government Communications",
      ar: "الذكاء الاصطناعي المسؤول للاتصال الحكومي",
    },
    icon: "learn",
    status: "done",
  },
  {
    kind: "block",
    tag: { en: "PRACTICE", ar: "تطبيق" },
    title: {
      en: "Generate a campaign brief with AI",
      ar: "إنشاء موجز حملة باستخدام الذكاء الاصطناعي",
    },
    icon: "simulate",
    status: "active",
  },
  {
    kind: "block",
    tag: { en: "SIMULATE", ar: "محاكاة" },
    title: {
      en: "AI-assisted campaign analytics in the Agentic Lab",
      ar: "تحليلات الحملات بمساعدة الذكاء الاصطناعي في المختبر الذكي",
    },
    icon: "simulate",
    status: "next",
  },
  {
    kind: "block",
    tag: { en: "OUTCOME", ar: "نتيجة" },
    title: {
      en: "Ship a Campaign Brief Generator as your Workplace Project",
      ar: "إطلاق مولّد موجز الحملات كمشروعك التطبيقي",
    },
    icon: "outcome",
    status: "next",
  },
  {
    kind: "agent",
    en: "Complete these blocks and apply them at work. I estimate this pathway can save your team about 42 hours per month.",
    ar: "أكملي هذه الوحدات وطبّقيها في العمل. أقدّر أن هذا المسار يمكن أن يوفر لفريقك حوالي 42 ساعة شهرياً.",
  },
];

/** The spoken line inside a script step, or null for the visual-only ones. */
function utteranceFor(step: ChatStep): Utterance | null {
  if (step.kind === "agent") return { speaker: "agent", text: step.en };
  if (step.kind === "user") return { speaker: "learner", text: step.en };
  return null;
}

const blockIcon = (icon: "learn" | "simulate" | "outcome") => {
  if (icon === "learn") return BookOpen;
  if (icon === "simulate") return FlaskConical;
  return TrendingUp;
};

function AgentChatDemo({ conversation }: { conversation: AgentConversation }) {
  const { language } = useLanguage();
  const { visible, typing, finished, replay } = conversation;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible, typing]);

  return (
    <div className="flex flex-col">
      <div
        ref={scrollRef}
        className="flex h-[460px] flex-col gap-4 overflow-y-auto scroll-smooth p-6"
      >
        {SCRIPT.slice(0, visible).map((step, i) => {
          if (step.kind === "user") {
            return (
              <div key={i} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                  {language === "ar" ? step.ar : step.en}
                </div>
              </div>
            );
          }
          if (step.kind === "agent") {
            return (
              <div key={i} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-2xl rounded-tl-sm max-w-[80%] text-sm text-foreground">
                  {language === "ar" ? step.ar : step.en}
                </div>
              </div>
            );
          }
          if (step.kind === "gap") {
            return (
              <div key={i} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 max-w-[90%] w-full shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    {language === "ar" ? "تحليل فجوة القدرات" : "Capability Gap Analysis"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-2">
                        {language === "ar" ? "نقاط القوة" : "Strengths"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.strengths.map((s) => (
                          <span
                            key={s.en}
                            className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"
                          >
                            {language === "ar" ? s.ar : s.en}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-accent mb-2">
                        {language === "ar" ? "فجوات يجب سدها" : "Gaps to close"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.gaps.map((s) => (
                          <span
                            key={s.en}
                            className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent border border-accent/30"
                          >
                            {language === "ar" ? s.ar : s.en}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          if (step.kind === "videos") {
            return (
              <div key={i} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 max-w-[90%] w-full shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    {language === "ar" ? "فيديوهات موصى بها" : "Recommended Videos"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {step.items.map((v) => (
                      <div key={v.title.en} className="group cursor-pointer">
                        <div className="relative aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                          <img
                            src={`${import.meta.env.BASE_URL}${v.image}`}
                            alt={language === "ar" ? v.title.ar : v.title.en}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform z-10">
                            <Play className="w-5 h-5 text-primary ms-0.5" fill="currentColor" />
                          </div>
                          <span className="absolute bottom-1.5 end-1.5 text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded z-10">
                            {v.duration}
                          </span>
                        </div>
                        <p className="text-xs font-medium mt-2 leading-snug line-clamp-2">
                          {language === "ar" ? v.title.ar : v.title.en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          if (step.kind === "assessment") {
            return (
              <div key={i} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 max-w-[90%] w-full shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    {language === "ar" ? "تقييم سريع" : "Quick Assessment"}
                  </p>
                  <p className="text-sm font-medium mb-3">{language === "ar" ? step.question.ar : step.question.en}</p>
                  <div className="space-y-2">
                    {step.options.map((o) => (
                      <div
                        key={o.label.en}
                        className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                          o.correct
                            ? "border-green-300 bg-green-50 text-green-800 font-medium"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            o.correct ? "border-green-500 bg-green-500" : "border-muted-foreground/40"
                          }`}
                        >
                          {o.correct && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                        {language === "ar" ? o.label.ar : o.label.en}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          if (step.kind === "example") {
            return (
              <div key={i} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm p-4 max-w-[90%] w-full border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {language === "ar" ? "مثال واقعي" : "Real-World Example"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {language === "ar" ? step.org.ar : step.org.en}
                  </div>
                  <p className="text-sm font-semibold mb-2">{language === "ar" ? step.title.ar : step.title.en}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {language === "ar" ? step.context.ar : step.context.en}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium text-primary bg-white/70 border border-primary/10 rounded-lg px-3 py-2">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    {language === "ar" ? step.impact.ar : step.impact.en}
                  </div>
                </div>
              </div>
            );
          }
          const Icon = blockIcon(step.icon);
          const statusStyles =
            step.status === "done"
              ? "border-green-200 bg-green-50/50"
              : step.status === "active"
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card";
          return (
            <div key={i} className="flex justify-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className={`rounded-2xl rounded-tl-sm p-3 max-w-[90%] w-full border ${statusStyles} flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? step.tag.ar : step.tag.en}
                  </p>
                  <p className="text-sm font-medium truncate">{language === "ar" ? step.title.ar : step.title.en}</p>
                </div>
                {step.status === "done" && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                {step.status === "active" && <PlayCircle className="w-5 h-5 text-primary shrink-0" />}
              </div>
            </div>
          );
        })}

        {typing && !finished && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border mt-auto flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={language === "ar" ? "اكتب رسالة... (محاكاة)" : "Type a message... (simulated)"}
            className="w-full pl-4 pr-10 py-3 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled
          />
        </div>
        {finished && (
          <Button variant="outline" size="sm" onClick={replay} className="shrink-0">
            <RotateCcw className="w-4 h-4 mr-2" />
            {language === "ar" ? "إعادة" : "Replay demo"}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Twelve bars whose heights follow a fixed pattern, so the waveform reads as
 *  speech rather than noise and looks identical on every replay. */
const WAVE_PATTERN = [0.35, 0.7, 0.45, 0.95, 0.6, 0.8, 0.4, 0.9, 0.55, 0.75, 0.3, 0.65];

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12" aria-hidden>
      {WAVE_PATTERN.map((height, index) => (
        <span
          key={index}
          className={`w-1.5 rounded-full transition-all duration-200 ${
            active ? "bg-primary" : "bg-muted-foreground/25"
          }`}
          style={{
            height: active ? `${height * 100}%` : "12%",
            animation: active ? `twin-wave 900ms ease-in-out ${index * 70}ms infinite alternate` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The line being spoken, as a caption track.
 *
 * The whole line is laid out from the start with the unspoken words dimmed,
 * rather than appended word by word. Appending reflows the box on every word —
 * the caption grows taller and, when centred, every word already on screen
 * shifts sideways. Laying the full line out once means nothing moves.
 */
function LiveTranscript({
  conversation,
  className = "",
}: {
  conversation: AgentConversation;
  className?: string;
}) {
  const { current, words, spokenCount, speaking } = conversation;
  if (!current) return null;

  return (
    <p
      className={className}
      data-testid="agent-transcript"
      // The caption always holds the whole line, so how far the agent has
      // actually got is only visible through these.
      data-spoken={spokenCount}
      data-total={words.length}
      data-speaker={current.speaker}
    >
      {current.speaker === "learner" && (
        <span className="text-xs uppercase tracking-wider opacity-60 me-2">You</span>
      )}
      {words.map((word, index) => (
        <span
          key={`${index}-${word}`}
          className={index < spokenCount ? "transition-opacity duration-200" : "opacity-25"}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
      {speaking && (
        <span className="ms-0.5 inline-block w-0.5 h-[1em] align-middle bg-current animate-pulse" />
      )}
    </p>
  );
}

function VoicePane({
  language,
  conversation,
}: {
  language: "en" | "ar";
  conversation: AgentConversation;
}) {
  const isAr = language === "ar";
  const { speaking, paused, setPaused, current, finished, replay } = conversation;
  const agentSpeaking = speaking && current?.speaker === "agent" && !paused;

  return (
    <div
      className="flex h-full min-h-[460px] flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-8"
      data-testid="advisor-voice-pane"
    >
      <div className="relative w-32 h-32 mb-6">
        {agentSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" />
            <div
              className="absolute -inset-2 rounded-full border border-primary/30 animate-ping"
              style={{ animationDelay: "200ms" }}
            />
          </>
        )}
        <img
          src={`${BASE}brand/aisha-avatar.png`}
          alt={isAr ? "وكيل القدرات" : AGENTS.capability}
          className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
        <span
          className={`absolute bottom-1 end-1 w-5 h-5 rounded-full border-2 border-white ${
            paused ? "bg-muted-foreground" : "bg-green-500"
          }`}
        />
      </div>

      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        {paused
          ? isAr ? "المكالمة متوقفة" : "Call on hold"
          : agentSpeaking
            ? isAr ? "يتحدث الآن" : "Speaking"
            : isAr ? "ينصت" : "Listening"}
      </p>

      <Waveform active={agentSpeaking} />

      <div className="flex items-center justify-center text-center w-full max-w-lg my-6 min-h-[7.5rem]">
        <LiveTranscript conversation={conversation} className="text-lg font-medium leading-relaxed" />
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="lg"
          className={`rounded-full gap-2 px-8 ${
            paused ? "bg-green-600 hover:bg-green-700 text-white" : ""
          }`}
          variant={paused ? "default" : "outline"}
          onClick={() => setPaused(!paused)}
          data-testid="button-voice-toggle"
        >
          {paused ? <Phone className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          {paused ? (isAr ? "استئناف" : "Resume") : isAr ? "إيقاف مؤقت" : "Hold"}
        </Button>
        {finished && (
          <Button size="lg" variant="ghost" className="rounded-full gap-2" onClick={replay}>
            <RotateCcw className="w-4 h-4" />
            {isAr ? "إعادة" : "Replay"}
          </Button>
        )}
      </div>
    </div>
  );
}

function AvatarPane({
  language,
  conversation,
}: {
  language: "en" | "ar";
  conversation: AgentConversation;
}) {
  const isAr = language === "ar";
  const { speaking, paused, setPaused, current, finished, replay } = conversation;
  const agentSpeaking = speaking && current?.speaker === "agent" && !paused;

  return (
    <div
      className="relative flex h-full min-h-[460px] flex-col items-center justify-center overflow-hidden bg-foreground p-8"
      data-testid="advisor-avatar-pane"
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-foreground to-foreground" />

      <div className="w-48 h-48 relative z-10 mb-6">
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[40%] blur-xl transition-opacity duration-500 ${
            agentSpeaking ? "opacity-70 animate-[spin_10s_linear_infinite]" : "opacity-30"
          }`}
        />
        <div
          className={`absolute inset-2 rounded-[30%] overflow-hidden border border-white/30 shadow-2xl transition-transform duration-300 ${
            agentSpeaking ? "scale-[1.03]" : "scale-100"
          }`}
        >
          <img
            src={`${BASE}brand/aisha-avatar.png`}
            alt={isAr ? "وكيل القدرات" : AGENTS.capability}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <span className="relative z-10 mb-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/70">
        <span
          className={`w-1.5 h-1.5 rounded-full ${agentSpeaking ? "bg-primary animate-pulse" : "bg-white/40"}`}
        />
        {paused
          ? isAr ? "متوقف" : "Paused"
          : agentSpeaking
            ? isAr ? "يتحدث" : "Speaking"
            : isAr ? "ينصت" : "Listening"}
      </span>

      {/* Captions, so the avatar channel is usable without sound. */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-full max-w-md text-center text-white mb-6 min-h-[8.5rem] flex items-center justify-center">
        <LiveTranscript conversation={conversation} className="text-base leading-relaxed" />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <Button size="lg" className="rounded-full gap-2 px-8" onClick={() => setPaused(!paused)} data-testid="button-avatar-toggle">
          {paused ? <Video className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          {paused ? (isAr ? "استئناف الجلسة" : "Resume session") : isAr ? "إيقاف مؤقت" : "Pause"}
        </Button>
        {finished && (
          <Button size="lg" variant="ghost" className="rounded-full gap-2 text-white hover:text-white hover:bg-white/10" onClick={replay}>
            <RotateCcw className="w-4 h-4" />
            {isAr ? "إعادة" : "Replay"}
          </Button>
        )}
      </div>
    </div>
  );
}

type Mode = "chat" | "voice" | "avatar";

/**
 * The Capability Agent surface on the learner dashboard: a chat window with a
 * branded agent header, text / voice / avatar modes and a collapse control.
 */
export function AdvisorPanel() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const conversation = useAgentConversation({
    script: SCRIPT,
    toUtterance: utteranceFor,
    delayFor: (step) => (step.kind === "user" ? 900 : 1500),
  });
  const reduceMotion = useReducedMotion();
  const isAr = language === "ar";

  const triggerClass =
    "text-xs text-white/80 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm";

  return (
    <Card className="overflow-hidden border-card-border" data-testid="card-advisor-panel">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <div className="bg-gradient-to-r from-primary to-secondary px-4 py-3.5 text-white sm:px-5">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={`${BASE}brand/agent-avatar.png`}
                alt=""
                aria-hidden="true"
                className="h-11 w-11 rounded-full bg-white/10 object-cover ring-2 ring-white/40"
              />
              <span className="absolute -bottom-0.5 end-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold sm:text-base">
                {isAr ? "المستشار الذكي للمهارات" : AGENTS.capability}
              </p>
              <p className="truncate text-[11px] text-white/80">
                {isAr
                  ? "تشخيص المهارات · إطار قدرات الذكاء الاصطناعي"
                  : "Skills diagnostics · FAHR AI capability framework"}
              </p>
            </div>

            <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {isAr ? "متصل" : "Online"}
            </span>

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="advisor-panel-body"
              data-testid="button-advisor-collapse"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "" : "-rotate-90 rtl:rotate-90"}`} />
              <span className="sr-only">
                {open
                  ? isAr
                    ? "طي المستشار"
                    : "Collapse advisor"
                  : isAr
                    ? "توسيع المستشار"
                    : "Expand advisor"}
              </span>
            </button>
          </div>

          <TabsList className="mt-3 grid w-full max-w-sm grid-cols-3 bg-white/15">
            <TabsTrigger value="chat" className={triggerClass} data-testid="tab-advisor-chat">
              <MessageSquare className="me-1.5 h-3.5 w-3.5" /> {isAr ? "محادثة" : "Chat"}
            </TabsTrigger>
            <TabsTrigger value="voice" className={triggerClass} data-testid="tab-advisor-voice">
              <Mic className="me-1.5 h-3.5 w-3.5" /> {isAr ? "صوت" : "Voice"}
            </TabsTrigger>
            <TabsTrigger value="avatar" className={triggerClass} data-testid="tab-advisor-avatar">
              <User className="me-1.5 h-3.5 w-3.5" /> {isAr ? "أفاتار" : "Avatar"}
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="advisor-body"
              id="advisor-panel-body"
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <TabsContent value="chat" className="m-0">
                <AgentChatDemo conversation={conversation} />
              </TabsContent>
              <TabsContent value="voice" className="m-0">
                <VoicePane language={language} conversation={conversation} />
              </TabsContent>
              <TabsContent value="avatar" className="m-0">
                <AvatarPane language={language} conversation={conversation} />
              </TabsContent>

              <div className="flex justify-end border-t border-border p-4">
                <Button onClick={() => setLocation("/learner/mission")} className="gap-2" data-testid="button-open-pathway">
                  {isAr ? "افتح مسار التعلم الكامل" : "Open full Learning Pathway"}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </Card>
  );
}
