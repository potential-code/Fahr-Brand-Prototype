import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOTION } from "@/components/motion";
import { History } from "lucide-react";
import { TIMELINE_PADDING, TimelineNode, TimelineRail } from "@/components/TimelineRail";
import type { AuditEvent } from "@/lib/federal/model";

const riskClass = (risk: AuditEvent["risk"]): string => {
  if (risk === "High") return "bg-red-50 text-red-700 border-red-200";
  if (risk === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-green-50 text-green-700 border-green-200";
};

type Props = {
  events: AuditEvent[];
  /** ids added during this session, animated in with a highlight. */
  freshIds: Set<string>;
};

/**
 * The entity decision trail: audit events for this entity, newest first.
 * A newly recorded decision animates in from the queue with a spring so the
 * handoff reads as one movement.
 */
export function ApprovalsTrail({ events, freshIds }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
        <History className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">No entity activity yet</p>
        <p className="text-xs text-muted-foreground">
          Decisions you and your department managers take this session appear here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[520px] pr-3">
      <ol className={`relative space-y-3 ${TIMELINE_PADDING}`}>
        <TimelineRail inset="inset-y-4" />
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const fresh = freshIds.has(event.id);
            return (
              <motion.li
                key={event.id}
                layout
                initial={fresh ? { opacity: 0, x: 24, scale: 0.98 } : false}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className={`relative rounded-md border p-3 text-sm transition-colors ${
                  fresh ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-muted/40"
                }`}
                data-testid={`row-trail-${event.id}`}
              >
                <TimelineNode top="top-4" borderedParent testId={`trail-node-${event.id}`} />
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug">{event.action}</p>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${riskClass(event.risk)}`}>
                    {event.risk}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">{event.actor}</span>
                  <span>·</span>
                  <span>{event.status}</span>
                  <span>·</span>
                  <span>{event.time}</span>
                  {event.agent && event.agent !== "Human decision" && (
                    <>
                      <span>·</span>
                      <span className="text-accent">{event.agent}</span>
                    </>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </ScrollArea>
  );
}
