import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CalendarPlus,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Lightbulb,
  MapPin,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { StepQuiz } from "@/components/learning/StepQuiz";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";
import { FORMAT_LABEL, activityOutline, type PathwayItem } from "@/lib/pathway";
import type { CoachContext } from "@/lib/coach";

type PathwayActivityDialogProps = {
  item: PathwayItem | null;
  onClose: () => void;
  onComplete: (item: PathwayItem) => void;
  isComplete: boolean;
};

type Turn = { from: "coach" | "learner"; text: string };

/** Why the pathway assigned this item — present on every activity, by contract. */
function CoachNote({ note }: { note: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4"
      data-testid="activity-coach-note"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
          Why your {AGENTS.coach} assigned this
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{note}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-foreground">{children}</p>;
}

/** Reading body, shared by microlearning items and the fallback outline. */
function ReaderBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm leading-relaxed text-muted-foreground">
          {para}
        </p>
      ))}
    </div>
  );
}

function Takeaways({ points }: { points: string[] }) {
  return (
    <div className="mt-6 rounded-xl border border-card-border bg-muted/40 p-4" data-testid="activity-takeaways">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Lightbulb className="h-4 w-4 text-primary" /> Key takeaways
      </p>
      <ul className="mt-3 space-y-2.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-3 space-y-2.5" data-testid="activity-steps">
      {steps.map((step, i) => (
        <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function SamplePrompt({ prompt, onCopy }: { prompt: string; onCopy: () => void }) {
  return (
    <div className="mt-6" data-testid="activity-sample-prompt">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Sample instruction to start from</SectionLabel>
        <Button variant="ghost" size="sm" onClick={onCopy} data-testid="button-copy-prompt">
          <ClipboardCopy className="me-2 h-3.5 w-3.5" /> Copy
        </Button>
      </div>
      <p className="mt-2 rounded-xl border border-card-border bg-muted/50 p-4 font-mono text-[13px] leading-relaxed text-foreground">
        {prompt}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Adapt it to your own task before you run it — the point of the assignment is the correction you make, not
        the prompt you were given.
      </p>
    </div>
  );
}

/** Simulated evidence capture: no upload, no grading, but a real state change. */
function SubmissionBox({
  guidance,
  submitted,
  onSubmit,
}: {
  guidance: string;
  submitted: boolean;
  onSubmit: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="mt-6 rounded-xl border border-card-border p-4" data-testid="activity-submission">
      <SectionLabel>Your submission</SectionLabel>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{guidance}</p>

      {submitted ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/[0.05] p-3.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground">
            Submitted for review. Your {AGENTS.practice} has it, and it is attached to this item as evidence.
          </p>
        </div>
      ) : (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="mt-3 text-sm"
            placeholder="What you produced, what you changed, how long the review took…"
            data-testid="input-submission"
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={text.trim().length === 0}
            onClick={onSubmit}
            data-testid="button-submit-work"
          >
            <Send className="me-2 h-3.5 w-3.5" /> Submit for review
          </Button>
        </>
      )}
    </div>
  );
}

function SessionDetails({ item, onAddToCalendar }: { item: PathwayItem; onAddToCalendar: () => void }) {
  const details = [
    { icon: CalendarCheck, label: "When", value: item.meta ?? item.duration },
    { icon: UserRound, label: "Host", value: item.host ?? "FAHR AI Academy" },
    { icon: MapPin, label: "Format", value: item.venue ?? item.duration },
  ];

  return (
    <div className="mt-6" data-testid="activity-session-details">
      <dl className="grid gap-3 sm:grid-cols-3">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-card-border p-3.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" /> {label}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-snug text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {item.agenda && item.agenda.length > 0 && (
        <div className="mt-5">
          <SectionLabel>What is covered</SectionLabel>
          <ul className="mt-3 space-y-2.5">
            {item.agenda.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="outline" size="sm" className="mt-5" onClick={onAddToCalendar} data-testid="button-add-calendar">
        <CalendarPlus className="me-2 h-4 w-4" /> Add to my calendar
      </Button>
    </div>
  );
}

/**
 * Runs a single pathway activity with a layout matched to its format — a
 * microlearning reader, an assignment brief, a live-session panel, a role-play
 * or a hand-off to another screen — with the AI Learning Coach available as a
 * slide-in panel over the activity.
 */
export function PathwayActivityDialog({ item, onClose, onComplete, isComplete }: PathwayActivityDialogProps) {
  const reduceMotion = useReducedMotion();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachCollapsed, setCoachCollapsed] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [roleplayDone, setRoleplayDone] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const itemId = item?.id;
  useEffect(() => {
    setCoachOpen(false);
    setCoachCollapsed(false);
    setTurns([]);
    setRoleplayDone(false);
    setQuizPassed(false);
    setSubmitted(false);
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

  const copyPrompt = async () => {
    const prompt = item.samplePrompt;
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast({ title: "Instruction copied", description: "Paste it into your AI assistant to start the assignment." });
    } catch {
      toast({
        title: "Copy it manually",
        description: "Your browser blocked clipboard access, so select the instruction and copy it.",
      });
    }
  };

  const addToCalendar = () =>
    toast({
      title: "Added to your calendar",
      description: `${item.title} · ${item.meta ?? item.duration}. A reminder is set for 30 minutes before it starts.`,
    });

  const hasQuiz = Boolean(item.questions && item.questions.length > 0);
  const canFinish = item.format === "simulation" ? roleplayDone : hasQuiz ? quizPassed : true;

  // Every item renders something: its own authored content, or a guaranteed outline.
  const hasAuthoredBody = Boolean(
    (item.body && item.body.length > 0) ||
      (item.steps && item.steps.length > 0) ||
      item.roleplay ||
      item.agenda ||
      hasQuiz,
  );
  const isSession = item.format === "virtual-session";
  const numberedSteps = item.format === "practical-assignment" || item.format === "workplace-project";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="relative max-h-[88vh] overflow-hidden p-0 sm:max-w-[760px]"
        data-testid={`dialog-activity-${item.id}`}
      >
        <div className="flex max-h-[88vh] flex-col">
          {/* Header */}
          <div className="border-b border-border px-6 pb-4 pe-14 pt-6">
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
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <CoachNote note={item.coachNote} />

            {/* Reading body, or the guaranteed outline when an item has none. */}
            {item.body && item.body.length > 0 ? (
              <ReaderBody paragraphs={item.body} />
            ) : !hasAuthoredBody ? (
              <ReaderBody paragraphs={activityOutline(item)} />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            )}

            <div>
              {item.takeaways && item.takeaways.length > 0 && <Takeaways points={item.takeaways} />}

              {isSession ? (
                <SessionDetails item={item} onAddToCalendar={addToCalendar} />
              ) : (
                item.steps &&
                item.steps.length > 0 && (
                  <div className="mt-6">
                    <SectionLabel>
                      {numberedSteps ? "How to complete it" : "What this involves"}
                    </SectionLabel>
                    {numberedSteps ? (
                      <NumberedSteps steps={item.steps} />
                    ) : (
                      <ul className="mt-3 space-y-2.5" data-testid="activity-steps">
                        {item.steps.map((step) => (
                          <li
                            key={step}
                            className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              )}

              {item.samplePrompt && <SamplePrompt prompt={item.samplePrompt} onCopy={copyPrompt} />}

              {item.submissionPrompt && (
                <SubmissionBox
                  // Keyed so a draft never carries over into the next activity.
                  key={item.id}
                  guidance={item.submissionPrompt}
                  submitted={submitted}
                  onSubmit={() => {
                    setSubmitted(true);
                    toast({
                      title: "Work submitted",
                      description: `Your ${AGENTS.practice} has your submission for ${item.title}.`,
                    });
                  }}
                />
              )}
            </div>

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
              <div className="border-t border-border pt-6">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Knowledge check
                </p>
                <p className="mb-5 mt-1 text-sm text-muted-foreground">
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
                  <Check className="me-2 h-4 w-4" />
                  {isSession ? "Mark as attended" : "Mark as complete"}
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
