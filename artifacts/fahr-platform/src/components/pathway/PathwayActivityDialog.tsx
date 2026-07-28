import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { StepQuiz } from "@/components/learning/StepQuiz";
import { AGENTS } from "@/lib/constants";
import { FORMAT_LABEL, type PathwayItem } from "@/lib/pathway";
import type { CoachContext } from "@/lib/coach";

type PathwayActivityDialogProps = {
  item: PathwayItem | null;
  onClose: () => void;
  onComplete: (item: PathwayItem) => void;
  isComplete: boolean;
};

type Turn = { from: "coach" | "learner"; text: string };

/**
 * Runs a single pathway activity — microlearning, assignment, simulation,
 * session booking or a hand-off to another screen — with the AI Learning Coach
 * available as a slide-in panel over the activity.
 */
export function PathwayActivityDialog({ item, onClose, onComplete, isComplete }: PathwayActivityDialogProps) {
  const reduceMotion = useReducedMotion();
  const [, setLocation] = useLocation();
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachCollapsed, setCoachCollapsed] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [roleplayDone, setRoleplayDone] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const itemId = item?.id;
  useEffect(() => {
    setCoachOpen(false);
    setCoachCollapsed(false);
    setTurns([]);
    setRoleplayDone(false);
    setQuizPassed(false);
  }, [itemId]);

  const coachContext = useMemo<CoachContext>(
    () => ({
      subject: item?.title ?? "",
      competency: item?.competency,
      detail: item ? FORMAT_LABEL[item.format] : undefined,
    }),
    [item],
  );

  if (!item) return null;

  const finish = () => {
    onComplete(item);
    onClose();
  };

  const hasQuiz = Boolean(item.questions && item.questions.length > 0);
  const canFinish = item.format === "simulation" ? roleplayDone : hasQuiz ? quizPassed : true;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="relative max-h-[88vh] overflow-hidden p-0 sm:max-w-[760px]"
        data-testid={`dialog-activity-${item.id}`}
      >
        <div className="flex max-h-[88vh] flex-col">
          {/* Header */}
          <div className="border-b border-border px-6 pb-4 pt-6 pe-14">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {item.adaptive && <Sparkles className="me-1 inline h-3 w-3" />}
                {FORMAT_LABEL[item.format]}
              </span>
              <Badge variant="outline" className="rounded-full text-[11px]">
                {item.competency.short}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{item.duration}</span>
            </div>
            <DialogTitle className="mt-2 text-xl font-bold leading-snug">{item.title}</DialogTitle>
            <DialogDescription className="mt-1.5 text-sm leading-relaxed">
              {item.meta ? `${item.meta} · ` : ""}Assigned by your {item.agent}
            </DialogDescription>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {item.body && (
              <div className="space-y-4">
                {item.body.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {item.steps && (
              <ul className="mt-5 space-y-2.5 first:mt-0">
                {item.steps.map((step) => (
                  <li key={step} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}

            {item.format === "virtual-session" && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <CalendarCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  {item.meta} — the session is delivered live and recorded for your entity.
                </p>
              </div>
            )}

            {item.roleplay && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4.5 w-4.5 text-primary" />
                  </span>
                  <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed">
                    {item.roleplay.opening}
                  </p>
                </div>

                <AnimatePresence initial={false}>
                  {turns.map((turn, i) => (
                    <motion.div
                      key={i}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                      className={turn.from === "learner" ? "flex justify-end" : "flex gap-3"}
                    >
                      {turn.from === "coach" && (
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-4.5 w-4.5 text-primary" />
                        </span>
                      )}
                      <p
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          turn.from === "learner"
                            ? "rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-tl-sm bg-muted"
                        }`}
                      >
                        {turn.text}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!roleplayDone && (
                  <div className="space-y-2 pt-1">
                    {item.roleplay.options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setTurns([
                            { from: "learner", text: opt.label },
                            { from: "coach", text: opt.reply },
                          ]);
                          setRoleplayDone(true);
                        }}
                        data-testid={`button-roleplay-${opt.good ? "strong" : "weak"}`}
                        className="w-full rounded-lg border border-card-border bg-card px-4 py-3 text-start text-sm leading-relaxed transition-colors hover:border-primary/40 hover:bg-muted/50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {hasQuiz && (
              <div className="mt-7 border-t border-border pt-6">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Knowledge check
                </p>
                <p className="mt-1 mb-5 text-sm text-muted-foreground">
                  Two questions. Answer both to complete this item.
                </p>
                <StepQuiz
                  questions={item.questions ?? []}
                  passMark={item.questions?.length ?? 0}
                  submitLabel="Complete this item"
                  passNote="Both correct. This item is ready to complete."
                  onPass={() => setQuizPassed(true)}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCoachCollapsed(false);
                setCoachOpen(true);
              }}
              data-testid="button-activity-coach"
            >
              <Bot className="me-2 h-4 w-4" /> Ask the {AGENTS.coach}
            </Button>

            <div className="ms-auto flex flex-wrap gap-2">
              {item.href && (
                <Button
                  variant={canFinish && !isComplete ? "outline" : "default"}
                  onClick={() => setLocation(item.href as string)}
                  data-testid="button-activity-open"
                >
                  {item.hrefLabel ?? "Open"} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              )}
              {isComplete ? (
                <Button variant="outline" onClick={onClose}>
                  <Check className="me-2 h-4 w-4" /> Already complete
                </Button>
              ) : (
                <Button onClick={finish} disabled={!canFinish} data-testid="button-activity-complete">
                  <Check className="me-2 h-4 w-4" /> Mark as complete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Coach — slides in over the activity */}
        <AnimatePresence>
          {coachOpen && (
            <motion.div
              key="activity-coach"
              initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="absolute inset-y-0 end-0 z-10 shadow-2xl"
            >
              <motion.div
                animate={{ width: coachCollapsed ? 56 : 340 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full max-w-[100vw] overflow-hidden"
              >
                <CoachPanel
                  context={coachContext}
                  collapsed={coachCollapsed}
                  onCollapse={() => setCoachCollapsed((c) => !c)}
                  onClose={() => setCoachOpen(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
