import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ShieldCheck, Loader2, Wrench } from "lucide-react";
import type { PolicyResult, ProjectDraft } from "@/lib/workplaceProject";

type Props = {
  /** Recomputed on every edit, so re-running always reflects the current brief. */
  policies: PolicyResult[];
  /** True once a check has finished at least once. */
  hasRun: boolean;
  onRunComplete: () => void;
  /** Applies a one-click remediation to the draft. */
  onFix: (patch: Partial<ProjectDraft>) => void;
};

/**
 * The governance check as a visible run: each policy is examined in turn and
 * lands as a pass or a warning with remediation the learner can act on.
 */
export function GovernanceCheck({ policies, hasRun, onRunComplete, onFix }: Props) {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(hasRun ? policies.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  // A completed check stays visible while the learner fixes things, so results
  // must track a policy list that changes underneath it.
  useEffect(() => {
    if (hasRun && !running) setRevealed(policies.length);
  }, [hasRun, running, policies.length]);

  const run = () => {
    stop();
    if (reduceMotion) {
      setRevealed(policies.length);
      onRunComplete();
      return;
    }
    setRevealed(0);
    setRunning(true);
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= policies.length) {
        stop();
        setRunning(false);
        onRunComplete();
      }
    }, 420);
  };

  const warnings = policies.filter((p) => p.status === "warn").length;
  const done = hasRun && !running;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Governance check</p>
            <p className="text-xs text-muted-foreground">
              {policies.length} federal AI policies, run against your brief as written.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && (
            <Badge
              variant="outline"
              className={warnings === 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-accent/40 bg-accent/5 text-accent"}
            >
              {warnings === 0 ? "All clear" : `${warnings} to resolve`}
            </Badge>
          )}
          <Button size="sm" variant={done ? "outline" : "default"} className="gap-2" onClick={run} disabled={running} data-testid="button-run-governance">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {running ? "Checking…" : done ? "Re-run check" : "Run governance check"}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {policies.map((policy, i) => {
          const isRevealed = i < revealed;
          const isChecking = running && i === revealed;

          if (!isRevealed && !isChecking && !running) {
            return (
              <div key={policy.id} className="flex items-center gap-3 px-5 py-3 opacity-45">
                <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                <p className="text-sm text-muted-foreground">{policy.policy}</p>
              </div>
            );
          }

          if (!isRevealed) {
            return (
              <div key={policy.id} className="flex items-center gap-3 px-5 py-3">
                {isChecking ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                )}
                <p className={`text-sm ${isChecking ? "text-foreground" : "text-muted-foreground opacity-45"}`}>{policy.policy}</p>
              </div>
            );
          }

          const warn = policy.status === "warn";

          return (
            <motion.div
              key={policy.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={`px-5 py-4 ${warn ? "bg-accent/[0.04]" : ""}`}
              data-testid={`policy-${policy.id}`}
            >
              <div className="flex items-start gap-3">
                {warn ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{policy.policy}</p>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{policy.reference}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{policy.detail}</p>

                  <AnimatePresence>
                    {warn && policy.remediation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 rounded-lg border border-accent/25 bg-card p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">How to clear it</p>
                          <p className="mt-1 text-xs leading-relaxed text-foreground">{policy.remediation}</p>
                          {policy.fix && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2.5 gap-2 border-accent/40 text-accent hover:bg-accent/10"
                              onClick={() => onFix(policy.fix!.patch)}
                              data-testid={`button-fix-${policy.id}`}
                            >
                              <Wrench className="h-3.5 w-3.5" /> {policy.fix.label}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
