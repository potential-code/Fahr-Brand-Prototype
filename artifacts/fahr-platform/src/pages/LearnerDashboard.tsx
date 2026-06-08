import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/LanguageContext";
import {
  Bot,
  Target,
  Zap,
  Clock,
  ArrowRight,
  MessageSquare,
  Mic,
  User,
  RotateCcw,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  FlaskConical,
  TrendingUp,
  Play,
  ClipboardCheck,
  Lightbulb,
  Building2,
} from "lucide-react";
import { useLocation } from "wouter";

type LabelPair = { en: string; ar: string };

type VideoItem = { title: LabelPair; duration: string; gradient: string };
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
    en: "Welcome Aisha. To personalise your development mission, I will ask a few quick questions. What does your role focus on day to day?",
    ar: "مرحباً عائشة. لتخصيص مهمة التطوير الخاصة بك، سأطرح بعض الأسئلة السريعة. ما الذي يركز عليه دورك يومياً؟",
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
        gradient: "from-primary to-secondary",
      },
      {
        title: {
          en: "Writing Effective Prompts for Campaign Briefs",
          ar: "كتابة أوامر فعّالة لموجزات الحملات",
        },
        duration: "4:48",
        gradient: "from-secondary to-accent",
      },
      {
        title: {
          en: "Measuring Outcomes, Not Just Reach",
          ar: "قياس النتائج، وليس مجرد الوصول",
        },
        duration: "5:30",
        gradient: "from-accent to-primary",
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
    en: "Based on this, I have generated your personalised Development Mission. We will close the gaps through applied, outcome-based blocks.",
    ar: "بناءً على ذلك، أنشأت مهمة التطوير المخصصة لك. سنغلق الفجوات من خلال وحدات تطبيقية قائمة على النتائج.",
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
      en: "Ship a Campaign Brief Generator as your Outcome Project",
      ar: "إطلاق مولّد موجز الحملات كمشروع نتائجك",
    },
    icon: "outcome",
    status: "next",
  },
  {
    kind: "agent",
    en: "Complete these blocks and apply them at work. I estimate this mission can save your team about 42 hours per month.",
    ar: "أكملي هذه الوحدات وطبّقيها في العمل. أقدّر أن هذه المهمة يمكن أن توفر لفريقك حوالي 42 ساعة شهرياً.",
  },
];

const blockIcon = (icon: "learn" | "simulate" | "outcome") => {
  if (icon === "learn") return BookOpen;
  if (icon === "simulate") return FlaskConical;
  return TrendingUp;
};

function AgentChatDemo() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(1);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible >= SCRIPT.length) {
      setTyping(false);
      return;
    }
    const next = SCRIPT[visible];
    const delay = next.kind === "user" ? 900 : 1500;
    setTyping(next.kind === "agent" || next.kind === "gap" || next.kind === "block");
    const timer = setTimeout(() => {
      setVisible((v) => v + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible, typing]);

  const replay = () => {
    setVisible(1);
    setTyping(true);
  };

  const finished = visible >= SCRIPT.length;

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 p-6 flex flex-col gap-4 overflow-auto min-h-[460px] max-h-[560px] scroll-smooth"
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
                      <p className="text-xs font-medium text-accent-foreground mb-2">
                        {language === "ar" ? "فجوات يجب سدها" : "Gaps to close"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.gaps.map((s) => (
                          <span
                            key={s.en}
                            className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent-foreground border border-accent/30"
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
                        <div
                          className={`relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br ${v.gradient} flex items-center justify-center`}
                        >
                          <div className="absolute inset-0 bg-black/10" />
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform z-10">
                            <Play className="w-5 h-5 text-primary ms-0.5" fill="currentColor" />
                          </div>
                          <span className="absolute bottom-1.5 end-1.5 text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded">
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
                <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
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
    </Card>
  );
}

function VoicePane({ language }: { language: "en" | "ar" }) {
  return (
    <Card className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/30 min-h-[460px]">
      <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center relative mb-8">
        <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
        <div className="absolute inset-4 rounded-full border border-primary/40 animate-ping" style={{ animationDelay: "200ms" }}></div>
        <Mic className="w-12 h-12 text-primary" />
      </div>
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">
        {language === "ar" ? "وضع الصوت نشط – محاكاة" : "Voice mode active – simulated"}
      </p>
      <div className="text-center max-w-lg">
        <p className="text-xl font-medium leading-relaxed">
          {language === "ar"
            ? "«عائشة، أقوى مجالاتك هو استراتيجية المحتوى. دعينا نسد فجوة التحليلات ونبني مولّد موجز الحملات معاً.»"
            : "\"Aisha, your strongest area is content strategy. Let's close your analytics gap and build a Campaign Brief Generator together.\""}
        </p>
      </div>
    </Card>
  );
}

function AvatarPane({ language }: { language: "en" | "ar" }) {
  return (
    <Card className="h-full flex flex-col items-center justify-center p-8 overflow-hidden relative bg-slate-900 border-none min-h-[460px]">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-slate-900 to-slate-900"></div>
      <div className="w-64 h-64 relative z-10 mb-8">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[40%] animate-[spin_10s_linear_infinite] opacity-50 blur-xl"></div>
        <div className="absolute inset-2 bg-gradient-to-tr from-white/20 to-transparent rounded-[30%] backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <Bot className="w-24 h-24 text-white drop-shadow-lg" />
        </div>
      </div>
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl max-w-md text-center text-white">
        <p className="text-lg">
          {language === "ar"
            ? "«سأرشدك خطوة بخطوة من تحديد فجواتك إلى تحقيق أثر تطبيقي قابل للقياس.»"
            : "\"I will guide you step by step from identifying your gaps to delivering applied, measurable impact.\""}
        </p>
      </div>
    </Card>
  );
}

export default function LearnerDashboard() {
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Quote */}
        <div className="bg-muted p-4 rounded-xl text-center italic text-muted-foreground">
          {language === "ar"
            ? "«الذكاء الاصطناعي ليس طبقة ميزات، بل هو نظام التشغيل لرحلة التعلم.»"
            : "\"AI is not a feature layer. It is the operating system of the learning journey.\""}
        </div>

        {/* AI Capability Agent Demo */}
        <Card className="border-primary/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-md shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary leading-tight">
                    {language === "ar" ? "وكيل القدرات الذكي" : "AI Capability Agent"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar"
                      ? "محادثة مباشرة لتحديد الفجوات وبناء مهمتك"
                      : "Live diagnostic — identifying your gaps and building your mission"}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full self-start sm:self-center">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {language === "ar" ? "عرض توضيحي" : "Interactive demo"}
              </span>
            </div>

            <Tabs defaultValue="chat" className="flex flex-col">
              <TabsList className="grid w-full grid-cols-3 max-w-md mb-5">
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 me-2" /> {language === "ar" ? "محادثة" : "Text Chat"}
                </TabsTrigger>
                <TabsTrigger value="voice">
                  <Mic className="w-4 h-4 me-2" /> {language === "ar" ? "صوت" : "Voice"}
                </TabsTrigger>
                <TabsTrigger value="avatar">
                  <User className="w-4 h-4 me-2" /> {language === "ar" ? "أفاتار" : "Avatar"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="m-0">
                <AgentChatDemo />
              </TabsContent>
              <TabsContent value="voice" className="m-0">
                <VoicePane language={language} />
              </TabsContent>
              <TabsContent value="avatar" className="m-0">
                <AvatarPane language={language} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setLocation("/learner/mission")} className="gap-2">
                {language === "ar" ? "افتح مهمة التطوير" : "Open full Development Mission"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Capability Profile + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Capability Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Learner</p>
                <p className="font-semibold">Aisha Al Mansoori</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-sm">Marketing Specialist</p>
                <p className="text-xs text-muted-foreground">Ministry of Health and Prevention</p>
                <p className="text-xs text-muted-foreground">Communications and Public Awareness</p>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">AI Readiness Score</p>
                  <span className="font-bold text-primary">62%</span>
                </div>
                <Progress value={62} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">Level: Emerging Practitioner</p>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setLocation("/learner/mission")}>
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">48%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Mission Progress</p>
                  <p className="font-semibold line-clamp-1">AI-Powered Campaigns</p>
                </div>
                <Button variant="ghost" className="w-full justify-between mt-4 p-0 h-auto hover:bg-transparent text-primary">
                  {t("btn.start")} <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setLocation("/learner/lab/twin")}>
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Bot className="w-5 h-5 text-secondary" />
                    <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded-full">70%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">AI Digital Twin</p>
                  <p className="font-semibold">Configured</p>
                </div>
                <Button variant="ghost" className="w-full justify-between mt-4 p-0 h-auto hover:bg-transparent text-secondary">
                  {t("btn.twin")} <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setLocation("/learner/lab/project")}>
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="text-xs font-medium bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">In Progress</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Outcome Project</p>
                  <p className="font-semibold line-clamp-1">Campaign Brief Generator</p>
                </div>
                <Button variant="ghost" className="w-full justify-between mt-4 p-0 h-auto hover:bg-transparent text-accent-foreground">
                  {t("btn.submit")} <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Clock className="w-5 h-5 opacity-80" />
                  </div>
                  <p className="text-sm opacity-80">Estimated Impact</p>
                  <p className="text-2xl font-bold">
                    42 <span className="text-base font-normal">hrs saved/mo</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
