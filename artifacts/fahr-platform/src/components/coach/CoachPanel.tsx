import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bot, ChevronsRight, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENTS } from "@/lib/constants";
import { coachGreeting, coachPrompts, coachReply, type CoachContext } from "@/lib/coach";

type Msg = { from: "coach" | "learner"; text: string };

type CoachPanelProps = {
  context: CoachContext;
  collapsed: boolean;
  onCollapse: () => void;
  onClose: () => void;
};

/**
 * The AI Learning Coach itself: conversation, suggested questions and a text
 * input. Positioning is the caller's job — this renders as a full-height
 * column and is used both as a fixed dock and as an in-dialog slide-in.
 */
export function CoachPanel({ context, collapsed, onCollapse, onClose }: CoachPanelProps) {
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Msg[]>([{ from: "coach", text: coachGreeting(context) }]);
  const [asked, setAsked] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const prompts = useMemo(() => coachPrompts(context), [context]);
  const remaining = prompts.filter((p) => !asked.includes(p.id));

  // A reply in flight belongs to the screen that asked for it. Tracked so it
  // can be cancelled before the conversation is re-anchored.
  const replyTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    },
    [],
  );

  // Re-anchor the conversation when the learner moves to a different lesson or
  // activity, so the coach is never answering about the previous screen.
  const subject = context.subject;
  useEffect(() => {
    if (replyTimer.current !== null) {
      window.clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }
    setTyping(false);
    setMessages([{ from: "coach", text: coachGreeting(context) }]);
    setAsked([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, collapsed]);

  const answer = (question: string, reply: string, promptId?: string) => {
    if (promptId) setAsked((a) => [...a, promptId]);
    setMessages((m) => [...m, { from: "learner", text: question }]);
    setTyping(true);
    if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      replyTimer.current = null;
      setMessages((m) => [...m, { from: "coach", text: reply }]);
      setTyping(false);
    }, 700);
  };

  if (collapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center gap-3 border-s border-card-border bg-card py-4">
        <button
          type="button"
          onClick={onCollapse}
          aria-label={`Expand the ${AGENTS.coach}`}
          data-testid="button-coach-expand"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          <Bot className="h-5 w-5" />
        </button>
        <span className="mt-2 flex-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">
          {AGENTS.coach}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close the ${AGENTS.coach}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col border-s border-card-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Bot className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{AGENTS.coach}</p>
          <p className="flex items-center gap-1 text-[11px] text-primary-foreground/75">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online — simulated
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary-foreground hover:bg-white/10"
          onClick={onCollapse}
          aria-label={`Collapse the ${AGENTS.coach}`}
          data-testid="button-coach-collapse"
        >
          <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary-foreground hover:bg-white/10"
          onClick={onClose}
          aria-label={`Close the ${AGENTS.coach}`}
          data-testid="button-coach-close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={m.from === "learner" ? "flex justify-end" : "flex gap-2.5"}
          >
            {m.from === "coach" && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </span>
            )}
            <p
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.from === "learner"
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-muted text-foreground"
              }`}
            >
              {m.text}
            </p>
          </motion.div>
        ))}

        {typing && (
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </span>
            <span className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                  animate={reduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }}
                />
              ))}
            </span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {!typing && remaining.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1.5 pt-1"
            >
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Ask about this
              </p>
              {remaining.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => answer(p.label, p.answer, p.id)}
                  data-testid={`button-coach-prompt-${p.id}`}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-start text-[13px] leading-snug text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  {p.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text) return;
          setInput("");
          answer(text, coachReply(text, context));
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          aria-label={`Message the ${AGENTS.coach}`}
          data-testid="input-coach-message"
          className="min-w-0 flex-1 rounded-full border border-input bg-background px-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
