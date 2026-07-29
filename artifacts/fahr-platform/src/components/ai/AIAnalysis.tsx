// Simulated AI analysis states for the admin and leadership consoles.
//
// Everywhere a non-learner screen presents something an AI agent produced —
// insights, evaluations, forecasts, generated briefs — it runs a short staged
// "analysing" sequence first, so a stakeholder watching the demo sees the agent
// do the work rather than finding the answer already sitting there.
//
// Rules this file encodes:
//  - The sequence stays inside the panel it belongs to. No full-screen takeover.
//  - It is short (demo-length, ~1.6-2.4s total) and always re-runnable.
//  - Reduced motion skips straight to the result; nothing is ever hidden behind
//    an animation the visitor cannot turn off.
//  - Figures are never invented here: the panel only gates *when* its children
//    appear, it does not produce content.

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import { MOTION } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Phase = "idle" | "running" | "done";

/** How long one step of the staged sequence holds, in ms. */
const STEP_MS = 460;

export type UseAISimulationOptions = {
  /** Play once as soon as the panel mounts. Default true — the demo should move on its own. */
  autoRun?: boolean;
  /** Change this to re-run: pass the filter/period/selection the analysis depends on. */
  runKey?: string | number;
  /** Per-step hold, in ms. Keep the total under ~2.5s. */
  stepMs?: number;
};

export type AISimulation = {
  phase: Phase;
  /** Index of the step currently being worked. Steps before it are complete. */
  activeStep: number;
  /** 0-100, for a progress affordance. */
  progress: number;
  run: () => void;
};

/**
 * Drives a staged analysis sequence. Reduced motion resolves immediately so the
 * result is never withheld from someone who asked the system to stop animating.
 */
export function useAISimulation(stepCount: number, options: UseAISimulationOptions = {}): AISimulation {
  const { autoRun = true, runKey, stepMs = STEP_MS } = options;
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>(() => (autoRun ? "idle" : "done"));
  const [activeStep, setActiveStep] = React.useState(0);
  const timers = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const run = React.useCallback(() => {
    clearTimers();
    if (reduceMotion || stepCount <= 0) {
      setActiveStep(Math.max(stepCount - 1, 0));
      setPhase("done");
      return;
    }
    setActiveStep(0);
    setPhase("running");
    for (let step = 1; step < stepCount; step += 1) {
      timers.current.push(window.setTimeout(() => setActiveStep(step), step * stepMs));
    }
    timers.current.push(window.setTimeout(() => setPhase("done"), stepCount * stepMs));
  }, [clearTimers, reduceMotion, stepCount, stepMs]);

  // Auto-run on mount, and again whenever the inputs the analysis depends on change.
  React.useEffect(() => {
    if (!autoRun) return;
    run();
    return clearTimers;
    // `run` is stable for a given stepCount/stepMs; runKey is the intentional trigger.
  }, [autoRun, runKey, run, clearTimers]);

  React.useEffect(() => clearTimers, [clearTimers]);

  const progress =
    phase === "done" ? 100 : stepCount === 0 ? 100 : Math.round(((activeStep + 1) / stepCount) * 100);

  return { phase, activeStep, progress, run };
}

/** The moving grid + sweep that reads as "the agent is working over the data". */
function AnalysisSweep({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || !active) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <motion.span
        className="absolute inset-y-0 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.20), hsl(var(--accent) / 0.14), transparent)",
        }}
        initial={{ x: "-40%" }}
        animate={{ x: "140%" }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}

function StepList({ steps, activeStep, phase }: { steps: string[]; activeStep: number; phase: Phase }) {
  const reduceMotion = useReducedMotion();
  return (
    <ul className="space-y-1.5" aria-live="polite">
      {steps.map((step, index) => {
        const complete = phase === "done" || index < activeStep;
        const current = phase === "running" && index === activeStep;
        if (!complete && !current) return null;
        return (
          <motion.li
            key={step}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.out }}
            className="flex items-start gap-2 text-xs"
          >
            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              {complete ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              )}
            </span>
            <span className={complete ? "text-muted-foreground" : "font-medium text-foreground"}>{step}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}

/**
 * Stacks the working overlay on top of the result instead of swapping them.
 *
 * The result stays mounted and is dimmed behind the overlay, so the panel holds
 * its settled height (nothing jumps when the analysis lands) and charts measure
 * themselves against a real layout rather than a zero-size container. The two
 * layers share one grid cell, so the wrapper is always as tall as the taller of
 * the two — a short result can never clip the working UI.
 *
 * While running, the result is `inert`: not clickable, not focusable, and out of
 * the accessibility tree, so nobody can tab into figures the panel is still
 * presenting as unfinished.
 */
function AnalysisBody({
  running,
  reduceMotion,
  overlay,
  children,
  contentClassName = "",
}: {
  running: boolean;
  reduceMotion: boolean;
  overlay: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="grid">
      <motion.div
        initial={false}
        animate={running && !reduceMotion ? { opacity: 0.3, filter: "blur(3px)" } : { opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.out }}
        className={`col-start-1 row-start-1 ${contentClassName}`}
        data-ai-content=""
        inert={running}
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {running && (
          <motion.div
            key="working"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.duration.fast }}
            className="col-start-1 row-start-1 z-10 flex items-start self-start print:hidden"
            role="status"
          >
            {overlay}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type AIAnalysisPanelProps = {
  /** Named agent doing the work — use a name from `constants.ts`. */
  agent?: string;
  /** What this analysis produces, e.g. "Team risk and intervention analysis". */
  title: string;
  /** What it read, e.g. "6 team records · 10 workplace projects". Shown as provenance. */
  sources?: string;
  /** 3-5 short working lines, in order. */
  steps: string[];
  /** Re-runs when this changes — pass the period/filter/selection the analysis depends on. */
  runKey?: string | number;
  autoRun?: boolean;
  /** Label on the re-run control. */
  rerunLabel?: string;
  /** The result. Revealed once the sequence completes. */
  children: React.ReactNode;
  className?: string;
  /** Render without the surrounding Card, for use inside an existing card. */
  bare?: boolean;
  "data-testid"?: string;
};

/**
 * A panel whose content is presented as the output of a named AI agent: it
 * stages a short analysis, then reveals the result with a provenance line and a
 * re-run control.
 */
export function AIAnalysisPanel({
  agent = AGENTS.analytics,
  title,
  sources,
  steps,
  runKey,
  autoRun,
  rerunLabel = "Re-run analysis",
  children,
  className = "",
  bare = false,
  "data-testid": testId,
}: AIAnalysisPanelProps) {
  const reduceMotion = useReducedMotion();
  const { phase, activeStep, progress, run } = useAISimulation(steps.length, { autoRun, runKey });
  const running = phase === "running";

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BrainCircuit className="h-5 w-5" />
          {running && !reduceMotion && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-lg ring-2 ring-accent"
              animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.12, 1] }}
              transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {agent}
            {running ? " · analysing" : sources ? ` · read ${sources}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AnimatePresence initial={false}>
          {phase === "done" && (
            <motion.span
              key="complete"
              initial={reduceMotion ? false : { opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="hidden items-center gap-1 text-[11px] font-medium text-primary sm:flex"
            >
              <Sparkles className="h-3 w-3" /> Analysis complete
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={run}
          disabled={running}
          data-testid={testId ? `${testId}-rerun` : undefined}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{running ? "Working" : rerunLabel}</span>
        </Button>
      </div>
    </div>
  );

  // The result stays mounted and sits behind the working overlay instead of
  // being swapped out: the panel keeps its final height (nothing jumps when the
  // analysis lands), charts measure themselves against a real layout instead of
  // a zero-size container, and the sweep reads as the agent working over the
  // actual figures. Print always gets the settled content.
  const body = (
    <AnalysisBody
      running={running}
      reduceMotion={Boolean(reduceMotion)}
      overlay={
        <div className="relative w-full overflow-hidden rounded-lg border border-primary/25 bg-background/90 p-4 shadow-sm backdrop-blur-[2px]">
          <AnalysisSweep active />
          <div className="relative z-10 space-y-3">
            <StepList steps={steps} activeStep={activeStep} phase={phase} />
            <div className="h-1 w-full overflow-hidden rounded-full bg-primary/15">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: MOTION.duration.base, ease: MOTION.ease.out }}
              />
            </div>
          </div>
        </div>
      }
    >
      {children}
    </AnalysisBody>
  );

  if (bare) {
    return (
      <div className={`space-y-3 ${className}`} data-testid={testId} data-ai-phase={phase}>
        {header}
        {body}
      </div>
    );
  }

  return (
    <Card
      className={`relative overflow-hidden border-primary/25 bg-gradient-to-br from-card to-primary/[0.04] ${className}`}
      data-testid={testId}
      data-ai-phase={phase}
    >
      <CardHeader className="border-b border-border/60 bg-background/60 py-3 backdrop-blur-sm">{header}</CardHeader>
      <CardContent className="pt-4">{body}</CardContent>
    </Card>
  );
}

export type AIAnalysisInlineProps = {
  agent?: string;
  steps: string[];
  /** Short label for what is being produced, e.g. "Evaluating submission". */
  label?: string;
  runKey?: string | number;
  autoRun?: boolean;
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * A compact variant for spots that already sit inside a titled card (an AI
 * evaluation block, a generated summary): one working line and a sweep, then the
 * content.
 */
export function AIAnalysisInline({
  agent = AGENTS.analytics,
  steps,
  label,
  runKey,
  autoRun,
  children,
  className = "",
  "data-testid": testId,
}: AIAnalysisInlineProps) {
  const reduceMotion = useReducedMotion();
  const { phase, activeStep, run } = useAISimulation(steps.length, { autoRun, runKey });
  const running = phase === "running";

  return (
    <div className={`relative ${className}`} data-testid={testId} data-ai-phase={phase}>
      <AnalysisBody
        running={running}
        reduceMotion={Boolean(reduceMotion)}
        contentClassName="space-y-3"
        overlay={
          <div className="relative w-full overflow-hidden rounded-lg border border-primary/25 bg-background/90 p-3 shadow-sm backdrop-blur-[2px]">
            <AnalysisSweep active />
            <div className="relative z-10 space-y-2">
              <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {label ?? `${agent} is working`}
              </p>
              <StepList steps={steps} activeStep={activeStep} phase={phase} />
            </div>
          </div>
        }
      >
        {children}
        <button
          type="button"
          onClick={run}
          className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline print:hidden"
          data-testid={testId ? `${testId}-rerun` : undefined}
        >
          <RefreshCw className="h-3 w-3" /> Re-run {agent}
        </button>
      </AnalysisBody>
    </div>
  );
}
