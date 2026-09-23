import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { AGENTS } from "@/lib/constants";
import { capturedFields, fieldValues, trainingLog, TWIN_FIELDS, type TwinFieldId } from "@/lib/digitalTwin";
import { TwinInterview } from "@/components/twin/TwinInterview";
import { TwinTestChat } from "@/components/twin/TwinTestChat";
import { GuardrailControls } from "@/components/twin/GuardrailControls";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  RotateCcw,
  UserCog,
  ListChecks,
  FileText,
  MessageSquareQuote,
  Database,
  FlaskConical,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type LabelPair = { en: string; ar: string };

type ColorKey = "blue" | "violet" | "teal" | "amber" | "cyan" | "emerald";

/** Canvas nodes map one-to-one onto the interview fields, plus the test node. */
type NodeId = TwinFieldId | "test";

type BuildStep = {
  id: NodeId;
  label: LabelPair;
  node: LabelPair;
  icon: LucideIcon;
  color: ColorKey;
  pos: { x: number; y: number };
};

const COLORS: Record<
  ColorKey,
  { chip: string; dot: string; iconText: string; iconBg: string; line: string; stepBar: string; stepText: string }
> = {
  blue: {
    chip: "bg-[hsl(var(--chart-1))]/10 border-[hsl(var(--chart-1))]/30 text-foreground",
    dot: "bg-[hsl(var(--chart-1))]",
    iconText: "text-[hsl(var(--chart-1))]",
    iconBg: "bg-[hsl(var(--chart-1))]/10 border-[hsl(var(--chart-1))]/20",
    line: "hsl(var(--chart-1))",
    stepBar: "bg-[hsl(var(--chart-1))]",
    stepText: "text-[hsl(var(--chart-1))]",
  },
  violet: {
    chip: "bg-[hsl(var(--chart-2))]/10 border-[hsl(var(--chart-2))]/30 text-foreground",
    dot: "bg-[hsl(var(--chart-2))]",
    iconText: "text-[hsl(var(--chart-2))]",
    iconBg: "bg-[hsl(var(--chart-2))]/10 border-[hsl(var(--chart-2))]/20",
    line: "hsl(var(--chart-2))",
    stepBar: "bg-[hsl(var(--chart-2))]",
    stepText: "text-[hsl(var(--chart-2))]",
  },
  teal: {
    chip: "bg-[hsl(var(--chart-3))]/10 border-[hsl(var(--chart-3))]/30 text-foreground",
    dot: "bg-[hsl(var(--chart-3))]",
    iconText: "text-[hsl(var(--chart-3))]",
    iconBg: "bg-[hsl(var(--chart-3))]/10 border-[hsl(var(--chart-3))]/20",
    line: "hsl(var(--chart-3))",
    stepBar: "bg-[hsl(var(--chart-3))]",
    stepText: "text-[hsl(var(--chart-3))]",
  },
  amber: {
    chip: "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/30 text-foreground",
    dot: "bg-[hsl(var(--primary))]",
    iconText: "text-[hsl(var(--primary))]",
    iconBg: "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/20",
    line: "hsl(var(--primary))",
    stepBar: "bg-[hsl(var(--primary))]",
    stepText: "text-[hsl(var(--primary))]",
  },
  cyan: {
    chip: "bg-[hsl(var(--chart-4))]/10 border-[hsl(var(--chart-4))]/30 text-foreground",
    dot: "bg-[hsl(var(--chart-4))]",
    iconText: "text-[hsl(var(--chart-4))]",
    iconBg: "bg-[hsl(var(--chart-4))]/10 border-[hsl(var(--chart-4))]/20",
    line: "hsl(var(--chart-4))",
    stepBar: "bg-[hsl(var(--chart-4))]",
    stepText: "text-[hsl(var(--chart-4))]",
  },
  emerald: {
    chip: "bg-green-500/10 border-green-500/30 text-foreground",
    dot: "bg-green-500",
    iconText: "text-green-600",
    iconBg: "bg-green-500/10 border-green-500/20",
    line: "hsl(142, 71%, 45%)",
    stepBar: "bg-green-500",
    stepText: "text-green-600",
  },
};

const STEPS: BuildStep[] = [
  {
    id: "role",
    label: { en: "Define role and responsibilities", ar: "تحديد الدور والمسؤوليات" },
    node: { en: "Role & Responsibilities", ar: "الدور والمسؤوليات" },
    icon: UserCog,
    color: "blue",
    pos: { x: 50, y: 10 },
  },
  {
    id: "tasks",
    label: { en: "Add recurring tasks", ar: "إضافة المهام المتكررة" },
    node: { en: "Recurring Tasks", ar: "المهام المتكررة" },
    icon: ListChecks,
    color: "violet",
    pos: { x: 78, y: 30 },
  },
  {
    id: "briefs",
    label: { en: "Learn from your documents", ar: "التعلّم من مستنداتك" },
    node: { en: "Your Documents", ar: "مستنداتك" },
    icon: FileText,
    color: "teal",
    pos: { x: 78, y: 70 },
  },
  {
    id: "tone",
    label: { en: "Define tone and communication guidelines", ar: "تحديد النبرة وإرشادات التواصل" },
    node: { en: "Tone & Voice", ar: "النبرة والأسلوب" },
    icon: MessageSquareQuote,
    color: "amber",
    pos: { x: 50, y: 90 },
  },
  {
    id: "knowledge",
    label: { en: "Connect knowledge sources", ar: "ربط مصادر المعرفة" },
    node: { en: "Knowledge Sources", ar: "مصادر المعرفة" },
    icon: Database,
    color: "cyan",
    pos: { x: 22, y: 70 },
  },
  {
    id: "test",
    label: { en: "Test the Digital Twin", ar: "اختبار التوأم الرقمي" },
    node: { en: "Validation & Test", ar: "التحقق والاختبار" },
    icon: FlaskConical,
    color: "emerald",
    pos: { x: 22, y: 30 },
  },
];

type Phase = "interview" | "training" | "live";

// Training run pacing. Long enough to read as real work, short enough that
// nobody is left watching a spinner in front of a client.
const SWEEP_MS = 300;
const LOG_MS = 260;
const FINISH_MS = 500;

export default function AgenticAILabTwin() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const isAr = language === "ar";

  const { profile, readiness, isTrainable, isLive, completeTraining, reset } = useDigitalTwin();

  const [phase, setPhase] = useState<Phase>(() => (profile.trainedAt ? "live" : "interview"));
  // How far the training sweep has travelled across the canvas.
  const [sweep, setSweep] = useState(0);
  const [logLines, setLogLines] = useState(0);
  const [hasTested, setHasTested] = useState(false);

  const captured = useMemo(() => new Set<NodeId>(capturedFields(profile)), [profile]);
  const log = useMemo(() => trainingLog(profile, isAr), [profile, isAr]);

  /** Which canvas nodes are lit. During training the sweep drives it. */
  const built = useMemo(() => {
    if (phase === "training") return new Set<NodeId>(STEPS.slice(0, sweep).map((step) => step.id));
    const ids = new Set<NodeId>(captured);
    if (hasTested) ids.add("test");
    return ids;
  }, [phase, sweep, captured, hasTested]);

  // The training sweep: nodes light up one by one, then the log fills in.
  useEffect(() => {
    if (phase !== "training") return;
    if (sweep >= STEPS.length) return;
    const timer = window.setTimeout(() => setSweep((current) => current + 1), SWEEP_MS);
    return () => window.clearTimeout(timer);
  }, [phase, sweep]);

  useEffect(() => {
    if (phase !== "training") return;
    if (sweep < STEPS.length) return;
    if (logLines >= log.length) {
      const finish = window.setTimeout(() => {
        completeTraining();
        setPhase("live");
      }, FINISH_MS);
      return () => window.clearTimeout(finish);
    }
    const timer = window.setTimeout(() => setLogLines((current) => current + 1), LOG_MS);
    return () => window.clearTimeout(timer);
  }, [phase, sweep, logLines, log.length, completeTraining]);

  const startTraining = () => {
    setSweep(0);
    setLogLines(0);
    setPhase("training");
  };

  const rebuild = () => {
    reset();
    setSweep(0);
    setLogLines(0);
    setHasTested(false);
    setPhase("interview");
  };

  const relaxed = Object.values(profile.guardrails).filter((on) => !on).length;

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
        <PageHeader
          tone="primary"
          title={isAr ? "المرحلة 1: ابنِ توأمك الرقمي الذكي" : "Stage 1: Build Your AI Digital Twin"}
          description={
            isAr
              ? "لا يعرف توأمك شيئًا حتى تخبره. أجب عن خمسة أسئلة عن عملك اليومي، ثم اختبره — سيستشهد بما علّمته إياه، ويرفض ما لم تعلّمه."
              : "Your twin knows nothing until you tell it. Answer five questions about your day-to-day work, then test it — it will cite what you taught it and decline what you did not."
          }
          actions={
            <>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 shrink-0"
                data-testid="badge-stage-1"
              >
                {isAr ? "متاح اليوم" : "Available today"}
              </Badge>
              {phase !== "interview" && (
                <Button variant="outline" size="sm" onClick={rebuild} className="shrink-0" data-testid="button-rebuild">
                  <RotateCcw className="w-4 h-4 me-2" />
                  {isAr ? "إعادة البناء" : "Rebuild"}
                </Button>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Build canvas */}
          <Card className="lg:col-span-3 border-primary/20 overflow-hidden relative">
            <CardContent className="p-0">
              <div className="relative w-full min-h-[520px] overflow-hidden bg-muted/20">
                {/* grid texture */}
                <div
                  className="absolute inset-0 opacity-60 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
                    backgroundSize: "26px 26px",
                  }}
                />

                {/* connecting lines */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {STEPS.map((step) => {
                    const on = built.has(step.id);
                    return (
                      <line
                        key={step.id}
                        x1="50"
                        y1="50"
                        x2={step.pos.x}
                        y2={step.pos.y}
                        stroke={on ? COLORS[step.color].line : "hsl(var(--border))"}
                        strokeOpacity={on ? 0.55 : 0.8}
                        strokeWidth={on ? 0.5 : 0.3}
                        vectorEffect="non-scaling-stroke"
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>

                {/* status badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border backdrop-blur-sm ${
                      isLive
                        ? relaxed > 0
                          ? "bg-destructive/10 border-destructive/40 text-destructive"
                          : "bg-green-500/15 border-green-400/40 text-green-700"
                        : "bg-background/80 border-border text-muted-foreground"
                    }`}
                    data-testid="twin-status"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLive ? (relaxed > 0 ? "bg-destructive" : "bg-green-500") : "bg-primary animate-pulse"
                      }`}
                    />
                    {isLive
                      ? relaxed > 0
                        ? isAr
                          ? "نشط — خارج السياسة"
                          : "Live — outside policy"
                        : isAr
                          ? "نشط ومحكوم"
                          : "Live & governed"
                      : phase === "training"
                        ? isAr
                          ? "جارٍ التدريب..."
                          : "Training..."
                        : isAr
                          ? "قيد البناء"
                          : "Being built"}
                  </span>
                </div>

                {/* readiness chip */}
                <div className="absolute top-4 right-4 z-20 text-xs font-semibold text-foreground bg-background/80 border border-border backdrop-blur-sm px-3 py-1.5 rounded-full" data-testid="twin-readiness">
                  {readiness}%
                </div>

                {/* capability nodes */}
                {STEPS.map((step) => {
                  const on = built.has(step.id);
                  const c = COLORS[step.color];
                  const Icon = step.icon;
                  // Multi-value nodes show how many entries they hold.
                  const count = step.id === "test" ? 0 : fieldValues(profile, step.id).length;
                  return (
                    <div
                      key={step.id}
                      className={`absolute z-10 transition-all duration-500 ${
                        on ? "opacity-100 scale-100" : "opacity-60 scale-90"
                      }`}
                      style={{
                        top: `${step.pos.y}%`,
                        left: `${step.pos.x}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border backdrop-blur-sm shadow-sm whitespace-nowrap ${
                          on ? c.chip : "bg-background/80 border-border text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            on ? c.iconBg : "bg-muted border-border"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${on ? c.iconText : "text-muted-foreground"}`} />
                        </span>
                        <span className="text-[11px] font-medium">{isAr ? step.node.ar : step.node.en}</span>
                        {count > 1 && on && (
                          <span className="text-[10px] font-semibold opacity-70">{count}</span>
                        )}
                        {on && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      </div>
                    </div>
                  );
                })}

                {/* central avatar */}
                <div
                  className="absolute z-10"
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                    {phase === "training" && (
                      <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
                    )}
                    <div
                      className="absolute -inset-4 rounded-full blur-2xl transition-opacity duration-700"
                      style={{
                        background:
                          "radial-gradient(circle, hsl(var(--primary)/0.2) 0%, hsl(var(--secondary)/0.1) 50%, transparent 70%)",
                        opacity: 0.25 + (readiness / 100) * 0.6,
                      }}
                    />
                    <div className="absolute inset-2 rounded-full border border-border bg-background/50 backdrop-blur-sm" />
                    <img
                      src={`${import.meta.env.BASE_URL}brand/agent-avatar.png`}
                      alt={isAr ? "التوأم الرقمي لعائشة" : "Aisha's AI Digital Twin"}
                      className={`relative w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-md transition-all duration-1000 ${
                        isLive ? "scale-105 saturate-110" : "grayscale-[20%] opacity-90"
                      }`}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-foreground font-semibold text-sm flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {isAr ? "توأم عائشة" : "Aisha Twin"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {built.size}/{STEPS.length} {isAr ? "وحدات مفعّلة" : "modules active"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview / training log / twin summary */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-5">
                {phase === "interview" && (
                  <>
                    <TwinInterview onComplete={startTraining} />
                    {isTrainable && (
                      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                        {isAr
                          ? "يمكنك التدريب الآن، أو الاستمرار — كل إجابة تجعل التوأم أدق."
                          : "You can train now, or keep going — every answer makes the twin sharper."}
                      </p>
                    )}
                  </>
                )}

                {phase === "training" && (
                  <div className="space-y-4" data-testid="twin-training">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <p className="font-semibold">{isAr ? "جارٍ تدريب التوأم" : "Training your twin"}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAr
                        ? "يستوعب التوأم ما وصفته للتو."
                        : "The twin is taking in what you just described."}
                    </p>
                    <div className="space-y-2 pt-2">
                      {log.slice(0, logLines).map((line) => (
                        <div
                          key={line}
                          className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                          data-testid="training-log-line"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{line}</span>
                        </div>
                      ))}
                      {logLines < log.length && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Circle className="w-4 h-4 shrink-0 animate-pulse" />
                          {isAr ? "..." : "…"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {phase === "live" && <TwinSummary isAr={isAr} />}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Guardrails and the test chat — the heart of the demonstration */}
        {phase === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="twin-live-panels">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {isAr ? "ضوابط الحوكمة" : "Governance guardrails"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "هذان الضابطان مطبّقان في الكود ولا يمكن إيقافهما. أضف قواعدك الخاصة أدناه."
                    : "These two are enforced in code and cannot be switched off. Add your own rules below."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <GuardrailControls />
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-primary" />
                  {isAr ? "اختبر توأمك" : "Test your twin"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? "يستند التوأم إلى ما علّمته إياه فقط."
                    : "The twin stands only on what you taught it."}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <TwinTestChat onAsked={() => setHasTested(true)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hand-off to the Outcome Project */}
        {phase === "live" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {isAr ? "توأمك جاهز — الخطوة التالية" : "Your twin is live — what comes next"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
                  {isAr
                    ? "استخدم توأمك الرقمي لتنفيذ مشروع تطبيقي حقيقي في إدارتك — وهو ما يخضع للتقييم والتقدير."
                    : "Put your twin to work on a real Workplace Project in your department. That is what gets evaluated and recognised."}
                </p>
              </div>
              <Button
                size="lg"
                className="shrink-0"
                onClick={() => setLocation("/learner/lab/project")}
                data-testid="button-continue-project"
              >
                {isAr ? "ابدأ مشروعك التطبيقي" : "Start your Workplace Project"}
                <ArrowRight className="ms-2 w-4 h-4 rtl:rotate-180" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

/** What the twin ended up knowing, in the learner's own words. */
function TwinSummary({ isAr }: { isAr: boolean }) {
  const { profile, readiness } = useDigitalTwin();

  const sections: { label: string; values: string[] }[] = [
    { label: isAr ? "الدور" : "Role", values: profile.role ? [profile.role] : [] },
    { label: isAr ? "المهام المتكررة" : "Recurring tasks", values: profile.tasks },
    { label: isAr ? "المستندات" : "Documents", values: profile.briefs },
    { label: isAr ? "النبرة" : "Tone", values: profile.tone ? [profile.tone] : [] },
    { label: isAr ? "مصادر المعرفة" : "Knowledge sources", values: profile.knowledge },
  ].filter((section) => section.values.length > 0);

  return (
    <div className="space-y-4" data-testid="twin-summary">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {isAr ? "توأم عائشة" : "Aisha Twin"}
            <Badge>{isAr ? "نشط" : "Live"}</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr ? `مبني بواسطة ${AGENTS.capability}` : `Built with the ${AGENTS.capability}`}
          </p>
        </div>
        <div className="text-end shrink-0">
          <p className="text-2xl font-bold text-primary leading-none">{readiness}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
            {isAr ? "الجاهزية" : "Ready"}
          </p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            {section.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {section.values.map((value) => (
              <Badge key={value} variant="outline" className="bg-background font-normal max-w-full">
                <span className="truncate">{value}</span>
              </Badge>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground pt-3 border-t border-border">
        {isAr
          ? "كل ما يظهر هنا جاء من إجاباتك. اختبر التوأم بالأسفل."
          : "Everything here came from your answers. Test it below."}
      </p>
    </div>
  );
}

/** Kept for the canvas legend — the interview fields, in order. */
export const TWIN_CANVAS_FIELDS = TWIN_FIELDS;
