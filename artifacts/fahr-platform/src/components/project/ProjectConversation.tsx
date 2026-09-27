import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, CornerUpLeft, Send, Sparkles } from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import { projectThread, ROLE_LABEL, type ThreadMessage } from "@/lib/federal/journey";
import type { Submission } from "@/lib/federal/model";

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

function DecisionIcon({ message }: { message: ThreadMessage }) {
  switch (message.decision) {
    case "revision_requested":
    case "returned_to_entity":
      return <CornerUpLeft className="h-3.5 w-3.5 text-accent" />;
    case "escalated":
      return <ArrowUpRight className="h-3.5 w-3.5 text-primary" />;
    case "endorsed":
    case "approved_live":
    case "signed_off":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case "submitted":
    case "resubmitted":
      return <Send className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

/**
 * Every decision and reply on a project, as a conversation. The learner's own
 * messages sit on the right; reviewers' on the left, their words verbatim.
 */
export function ProjectConversation({
  submission,
  className = "",
}: {
  submission: Submission;
  className?: string;
}) {
  const { approvals } = useFederalData();
  const reduceMotion = useReducedMotion();
  const thread = projectThread(submission, approvals);

  return (
    <ol className={`space-y-4 ${className}`} data-testid={`conversation-${submission.id}`}>
      {thread.map((message, i) => {
        const mine = message.role === "learner";
        const needsAction = message.decision === "revision_requested" && message.role === "manager";
        return (
          <motion.li
            key={message.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: reduceMotion ? 0 : Math.min(i, 6) * 0.05 }}
            className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}
            data-testid={`message-${message.id}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                mine ? "bg-muted text-muted-foreground" : message.role === "system" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
              }`}
            >
              {initials(message.by)}
            </span>
            <div className={`min-w-0 flex-1 ${mine ? "text-end" : ""}`}>
              <div className={`flex flex-wrap items-center gap-x-2 text-[11px] ${mine ? "justify-end" : ""}`}>
                <span className="text-xs font-semibold text-foreground">{message.by}</span>
                {message.role !== "system" && <span className="text-muted-foreground">{ROLE_LABEL[message.role]}</span>}
                <span className="text-muted-foreground">· {message.on}</span>
              </div>
              <div
                className={`mt-1 inline-block max-w-full rounded-xl border px-3.5 py-2.5 text-start text-sm leading-relaxed ${
                  needsAction
                    ? "border-accent/40 bg-accent/5"
                    : mine
                      ? "border-border bg-muted/40"
                      : "border-primary/20 bg-primary/5"
                }`}
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <DecisionIcon message={message} />
                  {message.title}
                </p>
                {message.note && <p className="mt-1.5 whitespace-pre-line text-foreground">{message.note}</p>}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
