import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Plus, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { AGENTS } from "@/lib/constants";
import { INTERVIEW, fieldValues, type TwinFieldId } from "@/lib/digitalTwin";
import { TwinDocumentUpload } from "./TwinDocumentUpload";

/**
 * The Capability Agent interviewing the learner about their work.
 *
 * Free text is the real input, but every question also offers tap-to-add
 * suggestions: in a live demo nobody wants to watch someone type, and a client
 * who taps three chips still ends up with a twin built from choices they made.
 */
export function TwinInterview({ onComplete }: { onComplete: () => void }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { profile, capture, discard } = useDigitalTwin();

  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const step = INTERVIEW[index];
  const answers = useMemo(() => fieldValues(profile, step.field), [profile, step.field]);
  const answered = answers.length > 0;
  const isLast = index === INTERVIEW.length - 1;

  // Keep focus on the field as the interview advances, so the whole thing can
  // be driven from the keyboard while presenting.
  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const add = (value: string) => {
    capture(step.field, value);
    setDraft("");
    inputRef.current?.focus();
  };

  const submitDraft = () => {
    if (draft.trim()) add(draft);
  };

  const advance = () => {
    if (draft.trim()) add(draft);
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((current) => current + 1);
    setDraft("");
  };

  const remaining = INTERVIEW.length - index - 1;

  return (
    <div className="space-y-5" data-testid="twin-interview">
      {/* Progress across the five questions */}
      <div className="flex items-center gap-2">
        {INTERVIEW.map((entry, i) => (
          <span
            key={entry.field}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* The agent's question */}
      <div className="flex gap-3">
        <span className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
            {AGENTS.capability}
          </p>
          <p className="text-base font-semibold leading-snug" data-testid="twin-interview-question">
            {isAr ? step.question.ar : step.question.en}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? step.why.ar : step.why.en}</p>
        </div>
      </div>

      {/* What they have said so far, as removable chips */}
      {answered && (
        <div className="flex flex-wrap gap-2" data-testid="twin-interview-answers">
          {answers.map((value) => (
            <Badge
              key={value}
              variant="outline"
              className="bg-primary/5 border-primary/30 gap-1.5 py-1.5 ps-3 pe-1.5 max-w-full"
            >
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{value}</span>
              <button
                type="button"
                onClick={() => discard(step.field, value)}
                className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                aria-label={isAr ? `إزالة ${value}` : `Remove ${value}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* The documents step accepts real files; everything else is typed. */}
      {step.field === "briefs" && <TwinDocumentUpload onLearned={(name) => add(name)} />}

      {/* Their answer */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (step.multi) submitDraft();
            else advance();
          }}
          placeholder={isAr ? step.placeholder.ar : step.placeholder.en}
          data-testid="twin-interview-input"
        />
        {step.multi && (
          <Button type="button" variant="outline" onClick={submitDraft} disabled={!draft.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tap-to-add, so a demo never stalls on typing */}
      <div className="flex flex-wrap gap-2">
        {(isAr ? step.suggestions.map((s) => s.ar) : step.suggestions.map((s) => s.en))
          .filter((suggestion) => !answers.includes(suggestion))
          .map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => add(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-colors"
              data-testid="twin-interview-suggestion"
            >
              + {suggestion}
            </button>
          ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground">
          {remaining > 0
            ? isAr
              ? `${remaining} أسئلة متبقية`
              : `${remaining} ${remaining === 1 ? "question" : "questions"} to go`
            : isAr
              ? "السؤال الأخير"
              : "Last question"}
        </p>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setIndex((c) => c - 1)}>
              {isAr ? "رجوع" : "Back"}
            </Button>
          )}
          <Button
            onClick={advance}
            disabled={!answered && !draft.trim()}
            data-testid="button-interview-next"
          >
            {isLast ? (isAr ? "درّب التوأم" : "Train my twin") : isAr ? "التالي" : "Next"}
            <ArrowRight className="ms-2 w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Field order shared with the canvas so both light up in the same sequence. */
export function interviewOrder(): TwinFieldId[] {
  return INTERVIEW.map((step) => step.field);
}
