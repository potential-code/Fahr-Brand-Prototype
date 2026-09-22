import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/lib/learningData";

type StepQuizProps = {
  questions: QuizQuestion[];
  /** Correct answers needed before the learner can continue. */
  passMark: number;
  /** Label on the button that leaves the quiz once it is passed. */
  submitLabel: string;
  onPass: (correct: number) => void;
  /** Copy shown above the score when the learner passes. */
  passNote?: string;
  /** Fired on every submission, pass or fail, with the score. */
  onAttempt?: (correct: number, total: number) => void;
  /** Shown instead of `passNote` when the attempt is below `passMark`. */
  failNote?: string;
};

/**
 * Paced knowledge check: one question at a time, with a progress indicator,
 * feedback and explanation after each answer, and a summary at the end.
 */
export function StepQuiz({
  questions,
  passMark,
  submitLabel,
  onPass,
  passNote,
  onAttempt,
  failNote,
}: StepQuizProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const question = questions[index];
  const done = answers.length === questions.length;
  const correctCount = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const passed = correctCount >= passMark;

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setChecked(false);
  };

  const advance = () => {
    setChecked(false);
    setPicked(null);
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  if (questions.length === 0) return null;

  if (done) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-card-border bg-muted/40 p-5"
        data-testid="quiz-summary"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Knowledge check complete</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          {correctCount} <span className="text-base font-semibold text-muted-foreground">of {questions.length} correct</span>
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {passed
            ? passNote ?? "Strong result. This is recorded as evidence against your Capability Profile."
            : failNote ?? "Review the explanations below, then run it again — repetition is how the capability sticks."}
        </p>

        <ul className="mt-4 space-y-2.5">
          {questions.map((q, i) => {
            const right = answers[i] === q.correctIndex;
            return (
              <li key={q.id} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    right ? "bg-primary" : "bg-destructive/15"
                  }`}
                >
                  {right ? (
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  ) : (
                    <X className="h-2.5 w-2.5 text-destructive" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug text-foreground">{q.question}</span>
                  {!right && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{q.explanation}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={restart} data-testid="button-retry-quiz">
            <RotateCcw className="me-2 h-4 w-4" /> Try again
          </Button>
          <Button onClick={() => onPass(correctCount)} disabled={!passed} data-testid="button-quiz-continue">
            {submitLabel} <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  const isRight = checked && picked === question.correctIndex;

  return (
    <div data-testid="quiz-step">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Question {index + 1} of {questions.length}
        </p>
        <div className="flex gap-1.5">
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <p className="mt-4 text-base font-semibold leading-snug text-foreground">{question.question}</p>

          <div className="mt-4 space-y-2">
            {question.options.map((opt, oi) => {
              const isPicked = picked === oi;
              const isAnswer = oi === question.correctIndex;
              let tone = "border-card-border bg-card hover:border-primary/40 hover:bg-muted/50";
              if (checked && isAnswer) tone = "border-primary bg-primary/5";
              else if (checked && isPicked) tone = "border-destructive/50 bg-destructive/5";
              else if (isPicked) tone = "border-primary bg-primary/5";
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={checked}
                  onClick={() => setPicked(oi)}
                  data-testid={`quiz-${question.id}-${oi}`}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-start text-sm transition-colors ${tone} ${
                    checked ? "cursor-default" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      (checked && isAnswer) || isPicked ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {((checked && isAnswer) || isPicked) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </span>
                  <span className={isPicked || (checked && isAnswer) ? "text-foreground" : "text-muted-foreground"}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {checked && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-card-border bg-muted/40 p-4">
              {isRight ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {isRight ? "Correct" : "Not quite"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{question.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5">
        {!checked ? (
          <Button disabled={picked === null} onClick={() => setChecked(true)} data-testid="button-check-answer">
            Check answer
          </Button>
        ) : (
          <Button
            onClick={() => {
              const next = [...answers, picked as number];
              setAnswers(next);
              if (next.length < questions.length) {
                advance();
              } else {
                const correct = next.filter((a, i) => a === questions[i].correctIndex).length;
                onAttempt?.(correct, questions.length);
              }
            }}
            data-testid="button-next-question"
          >
            {index === questions.length - 1 ? "See my result" : "Next question"}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
