import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, UserCheck } from "lucide-react";
import type { ReviewMessage } from "@/lib/workplaceProject";

/** The human half of the evaluation: a conversation, not a single quote. */
export function ReviewThread({ messages }: { messages: ReviewMessage[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserCheck className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Human review</p>
          <p className="text-xs text-muted-foreground">Fatima Al Suwaidi, Ministry Innovation Lead</p>
        </div>
      </div>

      <ol className="space-y-4 p-5">
        {messages.map((message, i) => {
          const isLearner = message.side === "learner";
          return (
            <motion.li
              key={message.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.08 }}
              className={`flex gap-3 ${isLearner ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isLearner ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                {message.initials}
              </span>
              <div className={`min-w-0 flex-1 ${isLearner ? "text-end" : ""}`}>
                <div className={`flex flex-wrap items-center gap-2 ${isLearner ? "justify-end" : ""}`}>
                  <span className="text-xs font-semibold text-foreground">{message.author}</span>
                  <span className="text-[11px] text-muted-foreground">{message.role}</span>
                  <span className="text-[11px] text-muted-foreground">· {message.when}</span>
                </div>
                <div
                  className={`mt-1.5 inline-block rounded-xl border px-3.5 py-2.5 text-start text-sm leading-relaxed ${
                    isLearner ? "border-border bg-muted/40 text-foreground" : "border-primary/20 bg-primary/5 text-foreground"
                  }`}
                >
                  {message.body}
                  {message.decision === "approved" && (
                    <Badge variant="outline" className="ms-2 border-primary/30 bg-card align-middle text-primary">
                      <CheckCircle2 className="me-1 h-3 w-3" /> Approved
                    </Badge>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
