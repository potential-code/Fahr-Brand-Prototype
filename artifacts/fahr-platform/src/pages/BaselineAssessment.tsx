import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Clock,
  ShieldCheck,
  ListChecks,
} from "lucide-react";
import { ASSESSMENT_QUESTIONS, COMPETENCY_BY_ID } from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { AGENTS } from "@/lib/constants";

const ANALYSIS_STEPS = [
  "Reading your responses",
  "Mapping answers to the FAHR AI capability framework",
  "Benchmarking against 41,850 active federal learners",
  "Identifying capability strengths and gaps",
  "Selecting your recommended learning pathway",
  "Composing your AI Skills Advisor report",
];

const STEP_MS = 900;

function AnalysisOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= ANALYSIS_STEPS.length) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, onDone]);

  const pct = Math.min(100, Math.round((step / ANALYSIS_STEPS.length) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#171310]/95 backdrop-blur-sm flex items-center justify-center p-6"
      data-testid="overlay-analysis"
    >
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center text-center">
          {/* Pulsing agent orb */}
          <div className="relative h-24 w-24 mb-7">
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/25"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.9, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
            <div className="absolute inset-2 rounded-full bg-primary/90 flex items-center justify-center">
              <Sparkles className="h-9 w-9 text-primary-foreground" />
            </div>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {AGENTS.advisor}
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white">Analysing your responses</h2>
          <p className="mt-2 text-sm text-white/60 max-w-sm">
            Your answers are being mapped to the federal AI capability framework. This takes a few seconds.
          </p>

          <div className="w-full mt-8">
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="w-full mt-7 space-y-2.5 text-left">
            {ANALYSIS_STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              if (i > step) return null;
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center ${
                      done ? "bg-primary" : "bg-white/10"
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    )}
                  </span>
                  <span className={`text-sm ${active ? "text-white" : "text-white/55"}`}>{label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BaselineAssessment() {
  const [, setLocation] = useLocation();
  const { answers, setAnswer, completeAssessment } = useLearnerProgress();
  const [index, setIndex] = useState(0);
  const [analysing, setAnalysing] = useState(false);

  const total = ASSESSMENT_QUESTIONS.length;
  const question = ASSESSMENT_QUESTIONS[index];
  const selected = answers[question.id];
  const isLast = index === total - 1;
  const answeredCount = useMemo(
    () => ASSESSMENT_QUESTIONS.filter((q) => answers[q.id] !== undefined).length,
    [answers],
  );
  const pct = Math.round(((index + (selected !== undefined ? 1 : 0)) / total) * 100);

  const handleNext = () => {
    if (selected === undefined) return;
    if (isLast) {
      setAnalysing(true);
      return;
    }
    setIndex((i) => i + 1);
  };

  const handleAnalysisDone = () => {
    completeAssessment();
    setLocation("/learner/assessment/report");
  };

  return (
    <Layout role="learner">
      <AnimatePresence>{analysing && <AnalysisOverlay onDone={handleAnalysisDone} />}</AnimatePresence>

      <div className="w-full max-w-3xl mx-auto">
        <Link
          href="/learner"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="mt-5">
          <Badge variant="secondary" className="rounded-full">
            Baseline Assessment
          </Badge>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">
            AI Capability Baseline
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Eight scenario questions drawn from real federal work. There are no wrong answers — answer as you
            would act today so your pathway is calibrated to where you actually are.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> About 4 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> {answeredCount} of {total} answered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Results visible to you and your line manager
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-7">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-muted-foreground">
              Question {index + 1} of {total}
            </span>
            <span className="text-primary font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" data-testid="progress-assessment" />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="mt-5 border-card-border">
              <CardContent className="p-6 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {question.scenario} · {COMPETENCY_BY_ID[question.competencyId]?.short}
                </p>
                <h2 className="mt-3 text-lg md:text-xl font-semibold text-foreground leading-snug">
                  {question.question}
                </h2>

                <div className="mt-6 space-y-3" role="radiogroup" aria-label={question.question}>
                  {question.options.map((opt, i) => {
                    const isSelected = selected === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setAnswer(question.id, i)}
                        data-testid={`option-${question.id}-${i}`}
                        className={`w-full text-left rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-card-border bg-card hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                        <span
                          className={`text-sm leading-relaxed ${
                            isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            data-testid="button-previous"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          <div className="hidden sm:flex items-center gap-1.5">
            {ASSESSMENT_QUESTIONS.map((q, i) => (
              <span
                key={q.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-primary"
                    : answers[q.id] !== undefined
                      ? "w-1.5 bg-primary/50"
                      : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext} disabled={selected === undefined} data-testid="button-next">
            {isLast ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Submit for AI analysis
              </>
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
