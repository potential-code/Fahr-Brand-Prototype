import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LabelPair = { en: string; ar: string };

type ColorKey = "blue" | "violet" | "teal" | "amber" | "cyan" | "emerald";

type BuildStep = {
  id: string;
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
    label: { en: "Upload sample campaign briefs", ar: "رفع نماذج موجزات الحملات" },
    node: { en: "Campaign Briefs", ar: "موجزات الحملات" },
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

const KNOWLEDGE_AREAS: LabelPair[] = [
  { en: "Health awareness campaigns", ar: "حملات التوعية الصحية" },
  { en: "Citizen engagement", ar: "إشراك المواطنين" },
  { en: "Social media planning", ar: "تخطيط وسائل التواصل" },
  { en: "Campaign reporting", ar: "تقارير الحملات" },
  { en: "Responsible AI communication", ar: "التواصل المسؤول بالذكاء الاصطناعي" },
];

const GUARDRAILS: LabelPair[] = [
  { en: "Human review required", ar: "مراجعة بشرية إلزامية" },
  { en: "No sensitive personal data", ar: "لا بيانات شخصية حساسة" },
  { en: "Approved ministry knowledge only", ar: "معرفة الوزارة المعتمدة فقط" },
  { en: "Full audit trail enabled", ar: "سجل تدقيق كامل مفعّل" },
];

export default function AgenticAILabTwin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const isAr = language === "ar";
  
  // States
  const [active, setActive] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [showTrainDialog, setShowTrainDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showGovDialog, setShowGovDialog] = useState(false);

  // Form states
  const [trainStep, setTrainStep] = useState(0);

  const done = active >= STEPS.length;
  const progress = Math.round((active / STEPS.length) * 100);

  useEffect(() => {
    if (!isTraining) return;
    if (active >= STEPS.length) {
      setIsTraining(false);
      return;
    }
    const tid = setTimeout(() => setActive((a) => a + 1), 800);
    return () => clearTimeout(tid);
  }, [active, isTraining]);

  const replay = () => {
    setActive(0);
    setIsTraining(false);
  };

  const startTraining = () => {
    setShowTrainDialog(false);
    setIsTraining(true);
    if (active === 0) setActive(1);
  };

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-12">
        <PageHeader
          tone="primary"
          title={isAr ? "المرحلة 1: ابنِ توأمك الرقمي الذكي" : "Stage 1: Build Your AI Digital Twin"}
          description={
            isAr
              ? "يفهم التوأم الرقمي لعائشة عملها اليومي، ويلتقط السياق، ويتعلم سير عملها، ويدعمها كمساعد ذكي موثوق."
              : "Aisha's AI Digital Twin understands her day-to-day work, captures context, learns her workflows, and supports her as a trusted AI assistant."
          }
          actions={
            done && (
              <Button variant="outline" size="sm" onClick={replay} className="shrink-0">
                <RotateCcw className="w-4 h-4 me-2" />
                {isAr ? "إعادة البناء" : "Rebuild"}
              </Button>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Build Canvas */}
          <Card className="lg:col-span-3 border-primary/20 overflow-hidden relative">
            {!done && !isTraining && active === 0 && (
              <div className="absolute inset-0 z-30 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UserCog className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-foreground text-xl font-bold mb-2">Digital Twin Untrained</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Provide your role context and knowledge sources to initialize your personal AI assistant.</p>
                <Button size="lg" onClick={() => setShowTrainDialog(true)}>
                  Configure & Train Twin
                </Button>
              </div>
            )}
            <CardContent className="p-0">
              <div
                className="relative w-full min-h-[520px] overflow-hidden bg-muted/20"
              >
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
                  {STEPS.map((s, i) => {
                    const on = i < active;
                    return (
                      <line
                        key={s.id}
                        x1="50"
                        y1="50"
                        x2={s.pos.x}
                        y2={s.pos.y}
                        stroke={on ? COLORS[s.color].line : "hsl(var(--border))"}
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
                      done
                        ? "bg-green-500/15 border-green-400/40 text-green-700"
                        : "bg-background/80 border-border text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${done ? "bg-green-500" : "bg-primary animate-pulse"}`}
                    />
                    {done
                      ? isAr
                        ? "تكوين نشط"
                        : "Active Config"
                      : isAr
                        ? "جارٍ البناء..."
                        : "Building..."}
                  </span>
                </div>

                {/* progress chip */}
                <div className="absolute top-4 right-4 z-20 text-xs font-semibold text-foreground bg-background/80 border border-border backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {progress}%
                </div>

                {/* capability nodes */}
                {STEPS.map((s, i) => {
                  const built = i < active;
                  const building = i === active && !done;
                  const c = COLORS[s.color];
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.id}
                      className={`absolute z-10 transition-all duration-500 ${
                        built || building ? "opacity-100 scale-100" : "opacity-60 scale-90"
                      }`}
                      style={{
                        top: `${s.pos.y}%`,
                        left: `${s.pos.x}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border backdrop-blur-sm shadow-sm whitespace-nowrap ${
                          built || building ? c.chip : "bg-background/80 border-border text-muted-foreground"
                        } ${building ? "animate-pulse" : ""}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            built || building ? c.iconBg : "bg-muted border-border"
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${built || building ? c.iconText : "text-muted-foreground"}`} />
                        </span>
                        <span className="text-[11px] font-medium">{isAr ? s.node.ar : s.node.en}</span>
                        {built && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
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
                    <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
                    <div
                      className="absolute -inset-4 rounded-full blur-2xl transition-opacity duration-700"
                      style={{
                        background:
                          "radial-gradient(circle, hsl(var(--primary)/0.2) 0%, hsl(var(--secondary)/0.1) 50%, transparent 70%)",
                        opacity: 0.25 + (active / STEPS.length) * 0.6,
                      }}
                    />
                    <div className="absolute inset-2 rounded-full border border-border bg-background/50 backdrop-blur-sm" />
                    <img
                      src={`${import.meta.env.BASE_URL}brand/agent-avatar.png`}
                      alt={isAr ? "التوأم الرقمي لعائشة" : "Aisha's AI Digital Twin"}
                      className={`relative w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-md transition-all duration-1000 ${done ? 'scale-105 saturate-110' : 'grayscale-[20%] opacity-90'}`}
                    />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-foreground font-semibold text-sm flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      {isAr ? "توأم عائشة" : "Aisha Twin"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {active}/{STEPS.length} {isAr ? "وحدات مفعّلة" : "modules active"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Progress */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {isAr ? "تقدّم التكوين" : "Configuration Progress"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "تظهر كل وحدة على القماشة فور إعدادها."
                  : "Each module appears on the canvas as it is configured."}
              </p>
            </div>
            <div className="space-y-2.5">
              {STEPS.map((s, i) => {
                const built = i < active;
                const building = i === active && !done;
                const c = COLORS[s.color];
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                      building
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : built
                          ? "border-border bg-card"
                          : "border-dashed border-border bg-muted/30"
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${built || building ? c.iconBg : 'bg-muted border-border'}`}>
                      <Icon className={`w-4.5 h-4.5 ${built || building ? c.stepText : 'text-muted-foreground'}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${
                          building ? "font-semibold text-foreground" : built ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {isAr ? s.label.ar : s.label.en}
                      </p>
                      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${c.stepBar}`}
                          style={{ width: built ? "100%" : building ? "60%" : "0%" }}
                        />
                      </div>
                    </div>
                    {built ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : building ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
          <Button size="lg" className="flex-1" onClick={() => setShowTrainDialog(true)} disabled={done || isTraining}>
            <FlaskConical className="me-2 w-4 h-4" /> {isAr ? "درّب توأمي الرقمي" : "Train my Digital Twin"} 
          </Button>
          <Button size="lg" variant="outline" className="flex-1" disabled={!done} onClick={() => setShowTestDialog(true)}>
            <MessageSquareQuote className="me-2 w-4 h-4" /> {isAr ? "اختبار الاستجابة" : "Test response"}
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setShowGovDialog(true)}>
            <Shield className="me-2 w-4 h-4" /> {isAr ? "إعدادات الحوكمة" : "View governance settings"}
          </Button>
        </div>

        {/* Hand-off to the Workplace Project — the next stage of the journey */}
        {done && (
          <Card className="border-primary/30 bg-primary/5 mt-6">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isAr ? "توأمك جاهز — الخطوة التالية" : "Your twin is live — what comes next"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
                  {isAr
                    ? "استخدم توأمك الرقمي لتنفيذ مشروع تطبيقي حقيقي في إدارتك."
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
                <ArrowRight className="ms-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Twin profile — revealed on completion */}
        <Card
          className={`border-primary/20 overflow-hidden transition-all duration-500 ${
            done ? "opacity-100 max-h-[800px] mt-6" : "opacity-0 max-h-0 m-0 border-none"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {isAr ? "توأم عائشة" : "Aisha Twin"}
                  <Badge variant={done ? "default" : "secondary"}>
                    {done ? (isAr ? "تكوين نشط" : "Active Config") : isAr ? "قيد البناء" : "In Build"}
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  {isAr
                    ? "الغرض: دعم تخطيط حملات الصحة العامة وصياغة المحتوى وإعداد التقارير والتواصل مع الجهات المعنية."
                    : "Purpose: Support public health campaign planning, content drafting, reporting, and stakeholder communication."}
                </p>
              </div>
            </div>

            <h4 className="font-semibold mb-3 text-sm">{isAr ? "مجالات المعرفة" : "Knowledge Areas"}</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {KNOWLEDGE_AREAS.map((area) => (
                <Badge key={area.en} variant="outline" className="bg-background">
                  {isAr ? area.ar : area.en}
                </Badge>
              ))}
            </div>

            <div className="pt-5 border-t border-border">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
                {isAr ? "ضوابط الحوكمة النشطة" : "Active Governance Guardrails"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GUARDRAILS.map((g) => (
                  <div key={g.en} className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" /> {isAr ? g.ar : g.en}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Train Dialog */}
      <Dialog open={showTrainDialog} onOpenChange={setShowTrainDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Digital Twin</DialogTitle>
            <DialogDescription>Define the knowledge and instructions for your personalized AI assistant.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {trainStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Primary Role & Function</label>
                  <Input defaultValue="Public Health Communications Specialist" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Key Recurring Tasks</label>
                  <Textarea defaultValue="- Drafting campaign briefs&#10;- Generating social media copy&#10;- Summarizing audience sentiment reports" className="min-h-[100px]" />
                </div>
              </div>
            )}
            {trainStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tone & Style Guidelines</label>
                  <Input defaultValue="Authoritative but reassuring, empathetic, clear, avoid jargon" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Knowledge Sources</label>
                  <div className="p-3 border rounded-md bg-muted/50 space-y-2 text-sm">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> FAHR Official Tone Guide</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Ministry Health Policies 2024</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Past Campaign Performance Data</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {trainStep === 0 ? (
              <Button onClick={() => setTrainStep(1)}>Next Step</Button>
            ) : (
              <Button onClick={startTraining} className="bg-primary hover:bg-primary/90 text-white">Initialize Training Sequence</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Digital Twin Response</DialogTitle>
            <DialogDescription>Your twin is constrained by the knowledge and tone you defined.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[85%] self-end ml-auto text-sm">
              Draft a quick alert about the new flu vaccine availability.
            </div>
            <div className="bg-muted p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm flex gap-3">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                "Protect yourself and your loved ones. The seasonal flu vaccine is now available at all Ministry health centers. Book your appointment today via the official portal."
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                  Applied tone: Reassuring & clear. Referenced: Ministry Health Policies 2024.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTestDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Governance Dialog */}
      <Dialog open={showGovDialog} onOpenChange={setShowGovDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Governance Guardrails</DialogTitle>
            <DialogDescription>Mandatory settings enforced by FAHR policy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {GUARDRAILS.map((g) => (
              <div key={g.en} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                <span className="text-sm font-medium">{isAr ? g.ar : g.en}</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Enforced</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGovDialog(false)}>Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
