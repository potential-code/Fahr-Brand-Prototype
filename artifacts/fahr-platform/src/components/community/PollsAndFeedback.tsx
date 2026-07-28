import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_PROMPT, share, totalVotes, type Poll } from "@/lib/engagement";
import { BarChart3, Check, CheckCircle2, MessageCircle } from "lucide-react";

/** A single poll: one vote per learner, results revealed the moment it lands. */
function PollBlock({ poll }: { poll: Poll }) {
  const [vote, setVote] = useState<string | null>(null);
  const total = totalVotes(poll.options, vote ? 1 : 0);

  return (
    <div className="rounded-xl border border-border p-4" data-testid={`poll-${poll.id}`}>
      <p className="text-sm font-semibold text-foreground">{poll.question}</p>
      <p className="mt-1 text-xs text-muted-foreground">{poll.context}</p>

      <div className="mt-3.5 space-y-2">
        {poll.options.map((option) => {
          const chosen = vote === option.id;
          const votes = option.votes + (chosen ? 1 : 0);
          const pct = share(votes, total);
          return (
            <button
              key={option.id}
              type="button"
              disabled={vote !== null}
              onClick={() => setVote(option.id)}
              className={`relative w-full overflow-hidden rounded-lg border px-3.5 py-2.5 text-start transition-colors ${
                chosen ? "border-primary" : "border-border"
              } ${vote === null ? "hover:border-primary/50 hover:bg-muted/40" : "cursor-default"}`}
              data-testid={`poll-option-${poll.id}-${option.id}`}
            >
              {vote !== null && (
                <motion.span
                  aria-hidden="true"
                  className={`absolute inset-y-0 start-0 ${chosen ? "bg-primary/15" : "bg-muted"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              )}
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {chosen && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  {option.label}
                </span>
                {vote !== null && (
                  <span className="shrink-0 text-sm font-bold tabular-nums text-primary">{pct}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {vote !== null
          ? `${total.toLocaleString("en-US")} federal employees have voted. Closes in ${poll.closesInDays} days.`
          : `Vote to see how ${totalVotes(poll.options).toLocaleString("en-US")} colleagues across the federal government responded.`}
      </p>
    </div>
  );
}

/** Polls plus the programme feedback prompt, both recording an answer in place. */
export function PollsAndFeedback({ polls }: { polls: Poll[] }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card className="border-card-border" data-testid="card-polls">
        <CardContent className="p-5">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            <BarChart3 className="h-4.5 w-4.5 text-primary" /> Community polls
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Two open polls. Your answer is recorded immediately and shapes what FAHR schedules next.
          </p>
          <div className="mt-4 space-y-4">
            {polls.map((poll) => (
              <PollBlock key={poll.id} poll={poll} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-card-border" data-testid="card-feedback">
        <CardContent className="p-5">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            <MessageCircle className="h-4.5 w-4.5 text-primary" /> Programme feedback
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{FEEDBACK_PROMPT.context}</p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.07] p-4"
              data-testid="feedback-sent"
            >
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Check className="h-4 w-4" /> Feedback recorded
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Thank you. Community feedback is reviewed monthly by the FAHR programme team, and the themes are
                published back here as announcements.
              </p>
            </motion.div>
          ) : (
            <>
              <p className="mt-4 text-sm font-medium text-foreground">{FEEDBACK_PROMPT.question}</p>
              <div className="mt-3 space-y-2">
                {FEEDBACK_PROMPT.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setChoice(option.id)}
                    aria-pressed={choice === option.id}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
                      choice === option.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/40 hover:bg-muted/40"
                    }`}
                    data-testid={`feedback-option-${option.id}`}
                  >
                    {choice === option.id ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-border" />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Anything specific the programme team should know? (optional)"
                className="mt-3"
                data-testid="input-feedback-comment"
              />

              <Button
                className="mt-3 w-full"
                disabled={choice === null}
                onClick={() => setSent(true)}
                data-testid="button-send-feedback"
              >
                Send feedback
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
