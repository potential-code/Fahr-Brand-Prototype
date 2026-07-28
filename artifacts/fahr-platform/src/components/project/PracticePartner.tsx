import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Wand2, RotateCcw } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import type { ImprovementPass, Suggestion } from "@/lib/workplaceProject";

/**
 * Streams a block of text in a few words at a time so the Practice Partner
 * looks like it is writing rather than pasting. Reduced motion gets the whole
 * text at once.
 */
function useStreamedText() {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [full, setFull] = useState("");
  const timer = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const stop = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(
    (value: string) => {
      stop();
      setFull(value);
      if (reduceMotion) {
        setText(value);
        setStreaming(false);
        return;
      }
      const tokens = value.split(/(\s+)/);
      let i = 0;
      setText("");
      setStreaming(true);
      timer.current = window.setInterval(() => {
        i += 4;
        if (i >= tokens.length) {
          setText(value);
          setStreaming(false);
          stop();
          return;
        }
        setText(tokens.slice(0, i).join(""));
      }, 40);
    },
    [reduceMotion, stop],
  );

  const reset = useCallback(() => {
    stop();
    setText("");
    setFull("");
    setStreaming(false);
  }, [stop]);

  return { text, full, streaming, start, reset, skip: () => { stop(); setText(full); setStreaming(false); } };
}

type PracticePartnerProps = {
  /** What the partner is being asked to draft, e.g. "the challenge". */
  subject: string;
  suggestion: Suggestion | null;
  /** True when the field already has content the learner wrote. */
  hasContent: boolean;
  onAccept: (text: string) => void;
};

/** Ask the AI Practice Partner for a draft, watch it write, then take it or leave it. */
export function PracticePartner({ subject, suggestion, hasContent, onAccept }: PracticePartnerProps) {
  const { text, streaming, start, reset, skip } = useStreamedText();
  const [open, setOpen] = useState(false);

  if (!suggestion) return null;

  const ask = () => {
    setOpen(true);
    start(suggestion.text);
  };

  const dismiss = () => {
    setOpen(false);
    reset();
  };

  return (
    <div className="rounded-xl border border-accent/25 bg-accent/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{AGENTS.practice}</p>
            <p className="text-xs text-muted-foreground">
              {hasContent ? `Can draft an alternative version of ${subject}` : `Can draft ${subject} for you to edit`}
            </p>
          </div>
        </div>
        {!open && (
          <Button variant="outline" size="sm" className="gap-2 border-accent/40 text-accent hover:bg-accent/10" onClick={ask} data-testid="button-ask-partner">
            <Wand2 className="h-3.5 w-3.5" /> Draft this for me
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-accent/20 px-4 py-4 space-y-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{suggestion.rationale}</p>
              <div className="rounded-lg border border-border bg-card p-3 text-sm leading-relaxed whitespace-pre-line text-foreground min-h-[72px]">
                {text}
                {streaming && <span className="ms-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-accent" />}
              </div>
              <div className="flex flex-wrap gap-2">
                {streaming ? (
                  <Button variant="ghost" size="sm" onClick={skip}>
                    Skip typing
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      onAccept(suggestion.text);
                      dismiss();
                    }}
                    data-testid="button-accept-draft"
                  >
                    <Check className="h-3.5 w-3.5" /> {hasContent ? "Replace what I wrote" : "Use this draft"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={dismiss}>
                  <X className="h-3.5 w-3.5" /> Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ImprovementPanelProps = {
  /** Runs the pass against whatever is in the field right now. */
  run: () => ImprovementPass;
  onApply: (text: string) => void;
  disabled: boolean;
};

/** The improvement pass: shows exactly what the partner would add before it touches anything. */
export function ImprovementPanel({ run, onApply, disabled }: ImprovementPanelProps) {
  const [pass, setPass] = useState<ImprovementPass | null>(null);
  const [working, setWorking] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const start = () => {
    setWorking(true);
    setPass(null);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPass(run());
      setWorking(false);
    }, 900);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Improvement pass</p>
          <p className="text-xs text-muted-foreground">
            {AGENTS.practice} reads what you wrote and adds only what evaluators find missing.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={start} disabled={disabled || working} data-testid="button-improve-pass">
          <RotateCcw className={`h-3.5 w-3.5 ${working ? "animate-spin" : ""}`} />
          {working ? "Reading your draft…" : pass ? "Run again" : "Improve what I wrote"}
        </Button>
      </div>

      {disabled && <p className="text-xs text-muted-foreground">Write something first — the pass works on your words, not from scratch.</p>}

      <AnimatePresence mode="wait">
        {pass && (
          <motion.div
            key={pass.after}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <p className="text-xs font-medium text-accent">{pass.note}</p>

            {pass.additions.length > 0 && (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Before</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{pass.before}</p>
                  </div>
                  <div className="rounded-lg border border-accent/30 bg-card p-3">
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">After</p>
                    <p className="text-xs leading-relaxed text-foreground">
                      {pass.before}{" "}
                      {pass.additions.map((a) => (
                        <mark key={a} className="rounded bg-accent/15 px-0.5 text-foreground">
                          {a}{" "}
                        </mark>
                      ))}
                    </p>
                  </div>
                </div>
                <Button size="sm" className="gap-2" onClick={() => onApply(pass.after)} data-testid="button-apply-improvement">
                  <Check className="h-3.5 w-3.5" /> Apply {pass.additions.length} change{pass.additions.length > 1 ? "s" : ""}
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
