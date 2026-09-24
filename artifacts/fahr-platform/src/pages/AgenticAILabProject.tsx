import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { buildRecommendations } from "@/lib/recommendations";
import {
  HUMAN_CHECKPOINTS,
  SENSITIVITY_LABEL,
  STAGES,
  assessReadiness,
  defaultDraft,
  estimateImpact,
  evaluatePolicies,
  filled,
  improveSolution,
  stageIndex,
  suggestFor,
  type DataSensitivity,
  type StageId,
} from "@/lib/workplaceProject";
import { StageStepper } from "@/components/project/StageStepper";
import { TwinHandoff } from "@/components/project/TwinHandoff";
import { PracticePartner, ImprovementPanel } from "@/components/project/PracticePartner";
import { LineList } from "@/components/project/LineList";
import { ImpactEstimator } from "@/components/project/ImpactEstimator";
import { GovernanceCheck } from "@/components/project/GovernanceCheck";
import { ReadinessMeter } from "@/components/project/ReadinessMeter";
import { ManagerRevisionNotice } from "@/components/project/ManagerRevisionNotice";

export default function AgenticAILabProject() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const { result, answers } = useLearnerProgress();
  const { draft, seedDraft, updateDraft, submission, submit, reopen } = useWorkplaceProject();

  const [stage, setStage] = useState<StageId>("challenge");
  const [governanceRun, setGovernanceRun] = useState(false);

  // The project the learner builds is the one their own assessment asked for.
  const plan = useMemo(() => (result ? buildRecommendations(result, answers) : null), [result, answers]);
  useEffect(() => {
    seedDraft(defaultDraft(plan?.project ?? null));
  }, [plan, seedDraft]);

  const policies = useMemo(() => evaluatePolicies(draft), [draft]);
  const impact = useMemo(() => estimateImpact(draft), [draft]);
  const readiness = useMemo(() => assessReadiness(draft, policies, governanceRun), [draft, policies, governanceRun]);

  const completeStages = useMemo(() => {
    const byStage = new Map<StageId, boolean>();
    for (const item of readiness.items) {
      byStage.set(item.stage, (byStage.get(item.stage) ?? true) && item.done);
    }
    return new Set<StageId>([...byStage.entries()].filter(([, done]) => done).map(([id]) => id));
  }, [readiness]);

  const index = stageIndex(stage);
  const current = STAGES[index];
  const locked = submission !== null;

  const handleSubmit = () => {
    submit(impact, policies);
    toast({
      title: "Project submitted",
      description: `"${draft.title}" is with the Ministry Innovation Lead and the evaluation engine.`,
    });
  };

  // ---------------------------------------------------------------- submitted
  if (submission) {
    return (
      <Layout role="learner">
        <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
          <ManagerRevisionNotice />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="rounded-2xl border border-border bg-card p-8 text-center"
          >
            <motion.span
              initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.span>
            <h2 className="text-2xl font-bold text-foreground">Your project is submitted</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              "{submission.draft.title}" has gone to the Ministry Innovation Lead for human review and to the evaluation engine for scoring
              against the four federal dimensions.
            </p>

            <div className="mt-7 grid gap-3 text-start sm:grid-cols-3">
              {[
                { label: "Estimated return", value: `${submission.impact.hoursPerMonth} h / month` },
                { label: "Governance", value: `${submission.policies.length} policies cleared` },
                { label: "Submitted", value: new Date(submission.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="rounded-xl border border-border bg-muted/30 px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="gap-2" onClick={() => setLocation("/learner/evaluation")} data-testid="button-view-evaluation">
                See the evaluation <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={reopen} data-testid="button-reopen-draft">
                Reopen my draft
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // ------------------------------------------------------------------ builder
  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
        <PageHeader
          bordered
          title="Workplace Project"
          description="Put your Digital Twin to work on one real piece of your job, then submit it for evaluation and certification."
          actions={
            <Badge variant="outline" className="border-primary/25 bg-primary/5 px-3 py-1 text-sm text-primary">
              Draft · {readiness.percent}% ready
            </Badge>
          }
        />

        {/* What the department manager sent back, if anything. */}
        <ManagerRevisionNotice />

        {/* Where the twin built in Stage 1 becomes this project's subject. */}
        <TwinHandoff
          disabled={locked}
          onUseTask={(task) => {
            updateDraft({
              title: draft.title || task,
              challenge:
                draft.challenge ||
                `${task} is recurring work in my department. My digital twin already handles part of it, and this project puts that to work properly.`,
            });
            setStage("challenge");
          }}
        />

        <StageStepper current={stage} complete={completeStages} onSelect={setStage} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <AnimatePresence mode="wait">
              <motion.section
                key={stage}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Stage {index + 1} of {STAGES.length}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">{current.question}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{current.guidance}</p>
                </div>

                {stage === "challenge" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="project-title" className="text-sm font-semibold text-foreground">
                          Project title
                        </label>
                        <Input
                          id="project-title"
                          value={draft.title}
                          disabled={locked}
                          onChange={(e) => updateDraft({ title: e.target.value })}
                          className="text-base font-medium"
                          data-testid="input-project-title"
                        />
                        {plan && (
                          <p className="text-xs text-muted-foreground">
                            Suggested by your assessment as the project that closes {plan.project.competency.short}.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="project-challenge" className="text-sm font-semibold text-foreground">
                          The challenge in your own words
                        </label>
                        <Textarea
                          id="project-challenge"
                          value={draft.challenge}
                          disabled={locked}
                          placeholder="Which recurring task, who does it, how long it takes and what goes wrong."
                          onChange={(e) => updateDraft({ challenge: e.target.value })}
                          className="min-h-[150px] resize-none leading-relaxed"
                          data-testid="input-project-challenge"
                        />
                        <p className="text-xs text-muted-foreground">{draft.challenge.trim().length} characters · 120 or more reads as a defined challenge</p>
                      </div>
                    </div>
                    <PracticePartner
                      subject="the challenge"
                      suggestion={suggestFor("challenge", draft)}
                      hasContent={draft.challenge.trim().length > 0}
                      onAccept={(text) => updateDraft({ challenge: text })}
                    />
                  </div>
                )}

                {stage === "solution" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="project-solution" className="text-sm font-semibold text-foreground">
                          How the AI solution works
                        </label>
                        <Textarea
                          id="project-solution"
                          value={draft.solution}
                          disabled={locked}
                          placeholder="The steps the assistant runs, the data it reads, and where a person reviews its output."
                          onChange={(e) => updateDraft({ solution: e.target.value })}
                          className="min-h-[170px] resize-none leading-relaxed"
                          data-testid="input-project-solution"
                        />
                        <p className="text-xs text-muted-foreground">{draft.solution.trim().length} characters · 160 or more reads as a designed solution</p>
                      </div>

                      <div className="space-y-2 border-t border-border pt-4">
                        <p className="text-sm font-semibold text-foreground">Human checkpoint</p>
                        <p className="text-xs text-muted-foreground">Who accepts or rejects what the assistant produces.</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {HUMAN_CHECKPOINTS.map((option) => {
                            const active = draft.humanCheckpoint === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={locked}
                                onClick={() => updateDraft({ humanCheckpoint: active ? "" : option })}
                                data-testid={`checkpoint-${option.slice(0, 12).replace(/\s+/g, "-").toLowerCase()}`}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {active && <Check className="me-1 inline h-3 w-3" />}
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <PracticePartner
                      subject="the solution design"
                      suggestion={suggestFor("solution", draft)}
                      hasContent={draft.solution.trim().length > 0}
                      onAccept={(text) => updateDraft({ solution: text })}
                    />

                    <ImprovementPanel
                      run={() => improveSolution(draft.solution)}
                      onApply={(text) => {
                        updateDraft({ solution: text });
                        toast({ title: "Improvements applied", description: "Your solution design has been updated." });
                      }}
                      disabled={draft.solution.trim().length < 40}
                    />
                  </div>
                )}

                {stage === "outcomes" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Expected outcomes</p>
                        <p className="text-xs text-muted-foreground">Three things a colleague could confirm in three months.</p>
                      </div>
                      <LineList
                        lines={draft.outcomes}
                        disabled={locked}
                        onChange={(outcomes) => updateDraft({ outcomes })}
                        placeholders={[
                          "Brief preparation drops from six hours a week to under two",
                          "Every campaign launches bilingual from one source",
                          "Approvals stop bouncing on inconsistent structure",
                        ]}
                        addLabel="Add an outcome"
                        testIdPrefix="input-outcome"
                      />
                    </div>
                    <PracticePartner
                      subject="three outcomes"
                      suggestion={suggestFor("outcomes", draft)}
                      hasContent={filled(draft.outcomes).length > 0}
                      onAccept={(text) => updateDraft({ outcomes: text.split("\n") })}
                    />
                    <ImpactEstimator draft={draft} impact={impact} onChange={updateDraft} disabled={locked} />
                  </div>
                )}

                {stage === "measurement" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Measurement plan</p>
                        <p className="text-xs text-muted-foreground">One countable measure per outcome, each with a baseline you can take now.</p>
                      </div>
                      <LineList
                        lines={draft.measures}
                        disabled={locked}
                        onChange={(measures) => updateDraft({ measures })}
                        placeholders={[
                          "Hours per brief against the manual baseline",
                          "Briefs accepted without rework",
                          "Days from objective to approved brief",
                        ]}
                        addLabel="Add a measure"
                        testIdPrefix="input-measure"
                      />
                    </div>
                    <PracticePartner
                      subject="the measurement plan"
                      suggestion={suggestFor("measurement", draft)}
                      hasContent={filled(draft.measures).length > 0}
                      onAccept={(text) => updateDraft({ measures: text.split("\n") })}
                    />
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Your entity reports these figures into the federal impact register, which is where the numbers on the leadership
                        dashboards come from. Measures without a baseline cannot be reported.
                      </p>
                    </div>
                  </div>
                )}

                {stage === "review" && (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">Data classification</p>
                        <p className="text-xs text-muted-foreground">What the assistant reads determines which guardrails apply.</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(Object.keys(SENSITIVITY_LABEL) as DataSensitivity[]).map((key) => {
                            const active = draft.sensitivity === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={locked}
                                onClick={() => updateDraft({ sensitivity: key })}
                                data-testid={`sensitivity-${key}`}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {SENSITIVITY_LABEL[key]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Label AI-assisted outputs</p>
                          <p className="text-xs text-muted-foreground">Colleagues see that a draft came from the assistant before they review it.</p>
                        </div>
                        <Switch
                          checked={draft.disclosure}
                          disabled={locked}
                          onCheckedChange={(disclosure) => updateDraft({ disclosure })}
                          aria-label="Label AI-assisted outputs"
                          data-testid="switch-disclosure"
                        />
                      </div>
                    </div>

                    <GovernanceCheck
                      policies={policies}
                      hasRun={governanceRun}
                      onRunComplete={() => setGovernanceRun(true)}
                      onFix={updateDraft}
                    />

                    <div className="rounded-xl border border-border bg-card p-5">
                      <p className="text-sm font-semibold text-foreground">What you are submitting</p>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        {[
                          ["Project", draft.title],
                          ["Outcomes", `${filled(draft.outcomes).length} recorded`],
                          ["Measures", `${filled(draft.measures).length} with baselines`],
                          ["Estimated return", `${impact.hoursPerMonth} hours a month · ${impact.band.toLowerCase()} impact`],
                          ["Oversight", draft.humanCheckpoint || "Not named yet"],
                          ["Classification", SENSITIVITY_LABEL[draft.sensitivity]],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
                            <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                          {readiness.submittable ? (
                            <span className="flex items-center gap-1.5 font-medium text-primary">
                              <ShieldCheck className="h-3.5 w-3.5" /> Ready for evaluation.
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5" /> Still needed: {readiness.nextUp?.label.toLowerCase()}.
                            </span>
                          )}
                        </p>
                        <Button className="gap-2" onClick={handleSubmit} disabled={!readiness.submittable} data-testid="button-submit-project">
                          <Send className="h-4 w-4" /> Submit for evaluation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.section>
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button
                variant="ghost"
                className="gap-2"
                disabled={index === 0}
                onClick={() => setStage(STAGES[Math.max(0, index - 1)].id)}
                data-testid="button-stage-back"
              >
                <ArrowLeft className="h-4 w-4" /> {index > 0 ? STAGES[index - 1].label : "Back"}
              </Button>
              {index < STAGES.length - 1 && (
                <Button className="gap-2" onClick={() => setStage(STAGES[index + 1].id)} data-testid="button-stage-next">
                  {STAGES[index + 1].label} <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <ReadinessMeter readiness={readiness} onJump={setStage} />

            <div className="rounded-xl border border-accent/25 bg-accent/[0.04] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Working with you on this
              </p>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li>The AI Practice Partner drafts and improves your wording.</li>
                <li>The Analytics Agent keeps the impact estimate live.</li>
                <li>FAHR Governance and Audit runs the policy check before you submit.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Rocket className="h-3.5 w-3.5 text-primary" /> What happens next
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Submitting sends your brief to the Ministry Innovation Lead for human review and to the evaluation engine, which scores it on
                practical application, innovation, feasibility and governance. Clearing it issues your credential.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
