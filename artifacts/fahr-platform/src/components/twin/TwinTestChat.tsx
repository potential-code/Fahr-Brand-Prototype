import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Quote,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { answer, suggestedQuestions, type TwinReply } from "@/lib/digitalTwin";

type Turn =
  | { who: "learner"; text: string }
  | { who: "twin"; text: string; reply: TwinReply };

/**
 * Test the twin against what it was taught.
 *
 * Replies are composed from the learner's own answers, so the twin cites the
 * tasks and sources they typed minutes earlier. Ask it something outside them
 * and it declines by name — which is the part worth showing a client.
 */
export function TwinTestChat({ onAsked }: { onAsked?: () => void } = {}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { profile } = useDigitalTwin();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, thinking]);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;

    setTurns((current) => [...current, { who: "learner", text: trimmed }]);
    setDraft("");
    setThinking(true);
    onAsked?.();

    // A beat before the reply — instant answers read as canned.
    window.setTimeout(() => {
      const reply = answer(profile, trimmed, isAr);
      setTurns((current) => [...current, { who: "twin", text: reply.text, reply }]);
      setThinking(false);
    }, 700);
  };

  const suggestions = suggestedQuestions(profile, isAr);

  return (
    <div className="flex flex-col h-full min-h-0" data-testid="twin-test-chat">
      <div className="flex-1 overflow-y-auto space-y-4 pe-1 min-h-[260px] max-h-[380px]">
        {turns.length === 0 && !thinking && (
          <div className="text-center py-8 px-4">
            <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isAr
                ? "اسأل توأمك عن شيء علّمته إياه — ثم اسأله عن شيء لم تعلّمه، وراقب الفرق."
                : "Ask your twin about something you taught it — then ask it something you did not, and watch the difference."}
            </p>
          </div>
        )}

        {turns.map((turn, index) =>
          turn.who === "learner" ? (
            <div key={index} className="flex justify-end">
              <div className="bg-primary text-primary-foreground px-3.5 py-2.5 rounded-2xl rounded-ee-sm max-w-[85%] text-sm">
                {turn.text}
              </div>
            </div>
          ) : (
            <TwinTurn key={index} turn={turn} isAr={isAr} />
          ),
        )}

        {thinking && (
          <div className="flex gap-2.5">
            <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </span>
            <div className="bg-muted px-3.5 py-3 rounded-2xl rounded-ss-sm flex items-center gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* One-tap questions — the last two are the ones that show the guardrails working */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border mt-3">
        {suggestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => ask(question)}
            disabled={thinking}
            className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-colors disabled:opacity-50 text-start max-w-full truncate"
            data-testid="twin-suggested-question"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              ask(draft);
            }
          }}
          placeholder={isAr ? "اسأل توأمك الرقمي…" : "Ask your digital twin…"}
          disabled={thinking}
          data-testid="twin-chat-input"
        />
        <Button onClick={() => ask(draft)} disabled={thinking || !draft.trim()} size="icon">
          <Send className="w-4 h-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

function TwinTurn({ turn, isAr }: { turn: Extract<Turn, { who: "twin" }>; isAr: boolean }) {
  const { reply } = turn;

  const tone =
    reply.status === "blocked"
      ? "border-destructive/30 bg-destructive/5"
      : reply.status === "out-of-scope"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-border bg-muted";

  return (
    <div className="flex gap-2.5" data-testid={`twin-reply-${reply.status}`}>
      <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        {reply.status === "blocked" ? (
          <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        )}
      </span>

      <div className={`px-3.5 py-3 rounded-2xl rounded-ss-sm max-w-[88%] text-sm border ${tone}`}>
        <p className="whitespace-pre-line leading-relaxed">{turn.text}</p>

        {/* What of the learner's own material this leaned on */}
        {reply.citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Quote className="w-3 h-3" />
              {isAr ? "من المواد التي علّمتها" : "From what you taught it"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {reply.citations.map((citation) => (
                <Badge key={citation} variant="outline" className="text-[10px] font-normal bg-background">
                  {citation}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Guardrails that held, refused, or were absent */}
        {reply.notes.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
            {reply.notes.map((note) => (
              <p
                key={`${note.id}-${note.kind}`}
                className={`text-xs flex items-start gap-1.5 ${
                  note.kind === "breach" ? "text-destructive font-medium" : "text-muted-foreground"
                }`}
                data-testid={`guardrail-note-${note.kind}`}
              >
                {note.kind === "breach" ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px text-emerald-600" />
                )}
                {note.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
