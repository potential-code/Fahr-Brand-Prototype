import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/CountUp";
import { ScoreCard } from "@/components/evaluation/ScoreCard";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ArrowRight, ArrowUpRight, Award, MessageSquare, Sparkles, Star, UserCheck } from "lucide-react";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { demoSubmission, evaluateSubmission } from "@/lib/workplaceProject";
import { isLive, projectThread } from "@/lib/federal/journey";
import { useFederalData } from "@/lib/FederalDataContext";
import { PointsLegend } from "@/components/recognition/PointsLegend";

export default function AgenticAIEvaluation() {
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const { result } = useLearnerProgress();
  const { submission, project } = useWorkplaceProject();
  const { profile: twin } = useDigitalTwin();


  // Evaluates what the learner submitted this session; falls back to a worked
  // example so the screen is never empty when reached straight from the sidebar.
  const own = project ? submission : null;
  const evaluated = useMemo(() => own ?? demoSubmission(), [own]);
  // The evaluation shows in full the moment the project is submitted; until the
  // human chain has approved it, it is labelled provisional rather than hidden.
  const live = !project || isLive(project.state);
  const evaluation = useMemo(() => evaluateSubmission(evaluated, twin), [evaluated, twin]);
  const { approvals } = useFederalData();
  const latest = project ? projectThread(project, approvals).at(-1) : undefined;

  const currentIndex = useMemo(() => {
    const fromResult = CAPABILITY_LEVELS.findIndex((l) => l.id === result?.levelId);
    return fromResult >= 0 ? fromResult : 1;
  }, [result]);
  const fromLevel = CAPABILITY_LEVELS[currentIndex];
  const toLevel = CAPABILITY_LEVELS[Math.min(currentIndex + 1, CAPABILITY_LEVELS.length - 1)];

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
        <PageHeader
          bordered
          title="Project Evaluation"
          description="Where your workplace project is scored by the Assessment Agent and reviewed by a human."
          actions={
            <Badge
              variant="outline"
              className="border-primary/25 bg-primary/5 px-3 py-1 text-sm text-primary"
              data-testid="badge-evaluation-status"
            >
              Evaluation complete
            </Badge>
          }
        />

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.05] px-4 py-2.5 text-xs text-foreground"
          data-testid="text-evaluation-source"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
          {!project
            ? "This is a worked example. Submit your own workplace project and it is scored here."
            : live
              ? "This is the project you submitted, approved and now live."
              : "This is the project you submitted. The result is final once your line manager and entity approve it."}
        </motion.p>

        <ScoreCard dimensions={evaluation.dimensions} overall={evaluation.overall} verdict={evaluation.verdict} />

        {project && (
          <section className="rounded-xl border border-border bg-card p-5" data-testid="card-human-review">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Human review</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-latest-decision">
                    {latest ? `${latest.by}: ${latest.note ? `“${latest.note}”` : latest.title.toLowerCase()}` : "Waiting for your line manager"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setLocation(`/learner/messages?project=${project.id}`)}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Open in messages
              </Button>
            </div>
            <ProjectJourney submission={project} />
          </section>
        )}

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
              <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                impact points
                <PointsLegend className="-my-1" />
              </p>
            </div>
          </div>
        </motion.div>

        {/* Credential handoff */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {live ? "Your credential is ready" : "Your credential is ready — provisional until approved"}
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                This evaluation has issued a verifiable {toLevel.label} credential to your capability record and a
                project certificate on Recognition, and added {evaluated.impact.hoursPerMonth} hours a month of
                measured saving to the federal impact register.
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
