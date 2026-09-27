import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  BookOpenCheck,
  CircleSlash,
  FlaskConical,
  Lock,
  PenLine,
  Quote,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import {
  answer,
  suggestedQuestions,
  type SuggestionKind,
  type TwinReply,
} from "@/lib/digitalTwin";
import { screenForPii } from "@/lib/piiScreen";

/** Where the screen caught something in the learner's own message. */
type Caught = { start: number; end: number; label: string };

type Turn =
  | { who: "learner"; text: string; caught: Caught[] }
  | { who: "twin"; text: string; reply: TwinReply };

const AVATAR = `${import.meta.env.BASE_URL}brand/agent-avatar.png`;
const LEARNER_AVATAR = `${import.meta.env.BASE_URL}brand/aisha-avatar.png`;

/** How long the twin "works" before replying — instant answers read as canned. */
const REPLY_MS = 900;

/** One scenario per suggested question: what it demonstrates, and how it looks. */
const SCENARIOS: Record<
  SuggestionKind,
  { icon: LucideIcon; title: { en: string; ar: string }; tint: string; iconTint: string }
> = {
  grounded: {
    icon: BookOpenCheck,
    title: { en: "Ask about your work", ar: "اسأل عن عملك" },
    tint: "hover:border-emerald-500/40 hover:bg-emerald-500/5",
    iconTint: "bg-emerald-500/10 text-emerald-700",
  },
  "out-of-scope": {
    icon: CircleSlash,
    title: { en: "Ask outside its knowledge", ar: "اسأل خارج معرفته" },
    tint: "hover:border-amber-500/40 hover:bg-amber-500/5",
    iconTint: "bg-amber-500/10 text-amber-700",
  },
  "personal-data": {
    icon: ShieldAlert,
    title: { en: "Send personal data", ar: "أرسل بيانات شخصية" },
    tint: "hover:border-destructive/40 hover:bg-destructive/5",
    iconTint: "bg-destructive/10 text-destructive",
  },
  draft: {
    icon: PenLine,
    title: { en: "Draft real work", ar: "صِغ عملًا حقيقيًا" },
    tint: "hover:border-primary/40 hover:bg-primary/5",
    iconTint: "bg-primary/10 text-primary",
  },
};

/**
 * Test the twin against what it was taught — the sandbox a client watches.
 *
 * Replies are composed from the learner's own answers, so the twin cites the
 * tasks and sources they typed minutes earlier. Ask it something outside them
 * and it declines by name; send it personal data and the screen stops the
 * message before it reaches the model.
 */
export function TwinTestChat({ onAsked }: { onAsked?: () => void } = {}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { profile } = useDigitalTwin();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  // Which step of the pipeline the typing indicator is narrating.
  const [stage, setStage] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  // Scroll the message list only. scrollIntoView would also scroll the page,
  // dragging the whole screen up every time a message lands.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || (turns.length === 0 && !thinking)) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [turns, thinking]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;

    // The learner sees what they typed, with whatever the screen caught
    // marked in place. Only the redacted form ever reaches the twin's reply.
    const screen = screenForPii(trimmed);
    setTurns((current) => [
      ...current,
      {
        who: "learner",
        text: trimmed,
        caught: screen.findings.map(({ start, end, label }) => ({ start, end, label })),
      },
    ]);
    setDraft("");
    setThinking(true);
    setStage(0);
    onAsked?.();

    timers.current.push(
      window.setTimeout(() => setStage(1), REPLY_MS / 2),
      window.setTimeout(() => {
        const reply = answer(profile, trimmed, isAr);
        setTurns((current) => [...current, { who: "twin", text: reply.text, reply }]);
        setThinking(false);
      }, REPLY_MS),
    );
  };

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setTurns([]);
    setThinking(false);
    setDraft("");
  };

  const suggestions = suggestedQuestions(profile, isAr);
  const customRules = profile.customGuardrails.length;
  const twinName = isAr ? "توأم عائشة" : "Aisha Twin";
  const started = turns.length > 0 || thinking;

  return (
    <div className="flex flex-col h-full min-h-0" data-testid="twin-test-chat">
      {/* Header: who you are talking to, and what governs it */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 ring-1 ring-primary/25 flex items-center justify-center overflow-hidden">
              <img src={AVATAR} alt="" className="h-11 w-11 object-contain" />
            </div>
            <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold leading-tight text-foreground">
                {isAr ? "اختبر توأمك" : "Test your twin"}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <FlaskConical className="h-3 w-3" />
                {isAr ? "بيئة تجريبية" : "Sandbox"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isAr ? "يجيب فقط مما علّمته إياه" : "Answers only from what you taught it"}
            </p>
          </div>
          {turns.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="shrink-0 text-muted-foreground"
              data-testid="twin-chat-clear"
            >
              <RotateCcw className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "مسح" : "Clear"}
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            isAr ? "فحص البيانات الشخصية" : "Personal-data screen",
            isAr ? "المعرفة المعتمدة فقط" : "Approved knowledge only",
          ].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
            >
              <ShieldCheck className="h-3 w-3" />
              {label}
            </span>
          ))}
          {customRules > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              +{customRules} {isAr ? "من قواعدك" : customRules === 1 ? "rule of your own" : "rules of your own"}
            </span>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={viewportRef}
        className="relative h-[440px] overflow-y-auto overscroll-contain scroll-smooth border-y border-border bg-muted/30 px-4 py-5"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {!started ? (
          <div className="flex min-h-full flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-background ring-1 ring-border shadow-sm flex items-center justify-center overflow-hidden">
              <img src={AVATAR} alt="" className="h-14 w-14 object-contain" />
            </div>
            <p className="mt-3 font-semibold text-foreground">
              {isAr ? "ضع توأمك على المحك" : "Put your twin to the test"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {isAr
                ? "كل سيناريو يُظهر سلوكًا مختلفًا. اختر واحدًا، أو اكتب سؤالك."
                : "Each scenario shows a different behaviour. Pick one, or type your own question."}
            </p>
            <div className="mt-5 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
              {suggestions.map((question) => {
                const scenario = SCENARIOS[question.kind];
                const Icon = scenario.icon;
                return (
                  <button
                    key={question.kind}
                    type="button"
                    onClick={() => ask(question.prompt)}
                    className={`group flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${scenario.tint}`}
                    data-testid="twin-suggested-question"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${scenario.iconTint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {isAr ? scenario.title.ar : scenario.title.en}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground line-clamp-2">
                        {question.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {turns.map((turn, index) =>
              turn.who === "learner" ? (
                <LearnerTurn key={index} turn={turn} isAr={isAr} />
              ) : (
                <TwinTurn key={index} turn={turn} isAr={isAr} name={twinName} />
              ),
            )}

            {thinking && (
              <div className="flex gap-2.5">
                <TwinAvatar />
                <div className="rounded-2xl rounded-ss-sm border border-border bg-background px-3.5 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stage === 0
                        ? isAr
                          ? "يفحص البيانات الشخصية…"
                          : "Screening for personal data…"
                        : isAr
                          ? "يراجع ما علّمته إياه…"
                          : "Checking what you taught it…"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario shortcuts stay one tap away once the conversation starts */}
      <div className="px-4 pt-3 pb-4">
        {started && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {suggestions.map((question) => {
              const scenario = SCENARIOS[question.kind];
              const Icon = scenario.icon;
              return (
                <button
                  key={question.kind}
                  type="button"
                  onClick={() => ask(question.prompt)}
                  disabled={thinking}
                  title={question.label}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors disabled:opacity-50 ${scenario.tint}`}
                  data-testid="twin-suggested-question"
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${scenario.iconTint}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  {isAr ? scenario.title.ar : scenario.title.en}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-background p-1.5 ps-3 shadow-sm transition-shadow focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
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
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="twin-chat-input"
          />
          <Button
            onClick={() => ask(draft)}
            disabled={thinking || !draft.trim()}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
            aria-label={isAr ? "إرسال" : "Send"}
          >
            <Send className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3 shrink-0" />
          {isAr
            ? "تُفحص كل رسالة بحثًا عن البيانات الشخصية قبل وصولها إلى النموذج."
            : "Every message is screened for personal data before it reaches the model."}
        </p>
      </div>
    </div>
  );
}

function TwinAvatar({ blocked = false }: { blocked?: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ${
        blocked ? "bg-destructive/10 ring-destructive/30" : "bg-background ring-border"
      }`}
    >
      {blocked ? (
        <ShieldAlert className="h-4 w-4 text-destructive" />
      ) : (
        <img src={AVATAR} alt="" className="h-7 w-7 object-contain" />
      )}
    </span>
  );
}

/** The learner's message, with anything the screen caught marked in place. */
function LearnerTurn({ turn, isAr }: { turn: Extract<Turn, { who: "learner" }>; isAr: boolean }) {
  const parts: { text: string; caught?: string }[] = [];
  let cursor = 0;
  for (const hit of [...turn.caught].sort((a, b) => a.start - b.start)) {
    if (hit.start > cursor) parts.push({ text: turn.text.slice(cursor, hit.start) });
    parts.push({ text: turn.text.slice(hit.start, hit.end), caught: hit.label });
    cursor = hit.end;
  }
  if (cursor < turn.text.length) parts.push({ text: turn.text.slice(cursor) });

  const flagged = turn.caught.length > 0;

  return (
    <div className="flex justify-end gap-2.5">
      <div className="flex max-w-[85%] flex-col items-end gap-1">
        <div className="rounded-2xl rounded-ee-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {parts.map((part, i) =>
            part.caught ? (
              <mark
                key={i}
                title={part.caught}
                className="whitespace-nowrap rounded bg-destructive/85 px-1 py-px text-white"
                data-testid="pii-caught"
              >
                {part.text}
              </mark>
            ) : (
              <Fragment key={i}>{part.text}</Fragment>
            ),
          )}
        </div>
        {flagged && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
            <ShieldAlert className="h-3 w-3 shrink-0" />
            {isAr
              ? `التقط الفحص ${turn.caught.length} عنصر بيانات شخصية`
              : `Screen caught ${turn.caught.length} personal ${turn.caught.length === 1 ? "detail" : "details"}`}
          </p>
        )}
      </div>
      <img src={LEARNER_AVATAR} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border" />
    </div>
  );
}

function TwinTurn({
  turn,
  isAr,
  name,
}: {
  turn: Extract<Turn, { who: "twin" }>;
  isAr: boolean;
  name: string;
}) {
  const { reply } = turn;

  if (reply.status === "blocked") {
    return (
      <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid={`twin-reply-${reply.status}`}>
        <TwinAvatar blocked />

        <div
          className="max-w-[88%] overflow-hidden rounded-2xl rounded-ss-sm border border-destructive/30 bg-background shadow-sm"
          data-testid="pii-block"
        >
          <div className="flex items-center gap-2 bg-destructive/[0.07] px-4 py-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm font-semibold text-destructive">
              {isAr ? "أُوقف قبل وصوله إلى النموذج" : "Blocked before it reached the model"}
            </p>
          </div>

          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? "ما أرسلته، بعد التنقيح" : "What you sent, redacted"}
            </p>
            <p className="mt-1.5 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
              {reply.pii?.redacted}
            </p>

            <ul className="mt-3 space-y-1.5">
              {reply.pii?.findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                  <span>
                    {isAr ? "حُذف" : "Discarded"}: {finding.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                isAr ? "لم يصل إلى النموذج" : "Not sent to the model",
                isAr ? "لم يُخزَّن" : "Not stored",
                isAr ? "لم يُسجَّل" : "Not written to any log",
              ].map((claim) => (
                <span
                  key={claim}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {claim}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const outOfScope = reply.status === "out-of-scope";
  const status = outOfScope
    ? {
        label: isAr ? "خارج ما علّمته إياه" : "Outside what you taught it",
        className: "bg-amber-500/10 text-amber-700",
      }
    : {
        label:
          reply.citations.length > 0
            ? isAr
              ? "من مصادرك"
              : "Grounded in your sources"
            : isAr
              ? "أجاب"
              : "Answered",
        className: "bg-emerald-600/10 text-emerald-700",
      };

  return (
    <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300" data-testid={`twin-reply-${reply.status}`}>
      <TwinAvatar />

      <div className="min-w-0 max-w-[88%]">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div
          className={`rounded-2xl rounded-ss-sm border px-3.5 py-3 text-sm shadow-sm ${
            outOfScope ? "border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5" : "border-border bg-background"
          }`}
        >
          <p className="whitespace-pre-line leading-relaxed">{turn.text}</p>

          {/* What of the learner's own material this leaned on */}
          {reply.citations.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Quote className="h-3 w-3" />
                {isAr ? "من المواد التي علّمتها" : "From what you taught it"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reply.citations.map((citation) => (
                  <Badge key={citation} variant="outline" className="bg-muted/40 text-[10px] font-normal">
                    {citation}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Guardrails that held, refused, or were absent */}
          {reply.notes.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2.5">
              {reply.notes.map((note) => (
                <p
                  key={`${note.id}-${note.kind}`}
                  className={`flex items-start gap-1.5 text-xs ${
                    note.kind === "breach" ? "font-medium text-destructive" : "text-muted-foreground"
                  }`}
                  data-testid={`guardrail-note-${note.kind}`}
                >
                  {note.kind === "breach" ? (
                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  )}
                  {note.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
