import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/CountUp";
import { ScoreCard } from "@/components/evaluation/ScoreCard";
import { ReviewThread } from "@/components/evaluation/ReviewThread";
import { ArrowRight, ArrowUpRight, Award, FileCheck, Sparkles, Star, UserCheck } from "lucide-react";
import { CAPABILITY_LEVELS, LEARNER_PROFILE } from "@/lib/constants";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { buildRecommendations } from "@/lib/recommendations";
import { demoSubmission, evaluateSubmission, reviewThread } from "@/lib/workplaceProject";

export default function AgenticAIEvaluation() {
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const { result, answers } = useLearnerProgress();
  const { submission } = useWorkplaceProject();

  const plan = useMemo(() => (result ? buildRecommendations(result, answers) : null), [result, answers]);

  // Evaluates what the learner submitted this session; falls back to a worked
  // example so the screen is never empty when reached straight from the sidebar.
  const evaluated = useMemo(() => submission ?? demoSubmission(plan?.project ?? null), [submission, plan]);
  const evaluation = useMemo(() => evaluateSubmission(evaluated), [evaluated]);
  const thread = useMemo(() => reviewThread(evaluated, evaluation), [evaluated, evaluation]);

  const currentIndex = useMemo(() => {
    const fromResult = CAPABILITY_LEVELS.findIndex((l) => l.id === result?.levelId);
    return fromResult >= 0 ? fromResult : 1;
  }, [result]);
  const fromLevel = CAPABILITY_LEVELS[currentIndex];
  const toLevel = CAPABILITY_LEVELS[Math.min(currentIndex + 1, CAPABILITY_LEVELS.length - 1)];

  const submittedLabel = new Date(evaluated.submittedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const explainer = [
    {
      icon: FileCheck,
      label: "What was evaluated",
      value: evaluated.draft.title,
      detail: `Submitted ${submittedLabel} by ${LEARNER_PROFILE.name}`,
    },
    {
      icon: UserCheck,
      label: "Who evaluated it",
      value: "The evaluation engine and your Ministry Innovation Lead",
      detail: "Four scored dimensions, then a human decision on top of them",
    },
    {
      icon: Award,
      label: "What it leads to",
      value: `${toLevel.label} on the federal ladder`,
      detail: "A verifiable credential and impact points on the register",
    },
  ];

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
        <PageHeader
          bordered
          title="Evaluation & Certification"
          description="Where your workplace project is scored, reviewed by a human, and turned into a credential."
          actions={
            <Badge variant="outline" className="border-primary/25 bg-primary/5 px-3 py-1 text-sm text-primary">
              Evaluation complete
            </Badge>
          }
        />

        {/* Self-explaining strip: what, who, what next */}
        <div className="grid gap-3 md:grid-cols-3">
          {explainer.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" /> {item.label}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{item.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </motion.div>
            );
          })}
        </div>

        {submission && (
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.05] px-4 py-2.5 text-xs text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
            This is the project you just submitted. Every score below is derived from what you wrote.
          </motion.p>
        )}

        <ScoreCard dimensions={evaluation.dimensions} overall={evaluation.overall} verdict={evaluation.verdict} />

        <ReviewThread messages={thread} />

        {/* Level up */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04] p-6"
          data-testid="card-level-up"
        >
          <motion.span
            aria-hidden
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, type: "spring", stiffness: 160, damping: 18 }}
            className="pointer-events-none absolute -end-10 -top-14 h-44 w-44 rounded-full bg-accent/10"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <motion.span
              initial={reduceMotion ? false : { scale: 0.5, rotate: -12, opacity: 0 }}
              whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-card text-primary shadow-sm"
            >
              <Award className="h-8 w-8" />
            </motion.span>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground">You have moved up a level</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {toLevel.description}. Confirmed by an evaluated workplace project rather than course completion alone.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-muted-foreground line-through decoration-muted-foreground/40">
                  {fromLevel.label}
                </span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <motion.span
                  initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 240, damping: 16 }}
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm"
                  data-testid="text-new-level"
                >
                  {toLevel.label}
                </motion.span>
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-accent/25 bg-card px-5 py-4 text-center">
              <Star className="mx-auto h-5 w-5 fill-current text-accent" />
              <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">
                <CountUp to={evaluation.points} prefix="+" />
              </p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">impact points</p>
            </div>
          </div>
        </motion.div>

        {/* Credential handoff */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Your credential is ready</p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                This evaluation has issued a verifiable {toLevel.label} credential in your wallet, and added{" "}
                {evaluated.impact.hoursPerMonth} hours a month of measured saving to the federal impact register.
              </p>
            </div>
            <Button className="shrink-0 gap-2" onClick={() => setLocation("/learner/recognition")} data-testid="button-view-recognition">
              Open my credential <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
