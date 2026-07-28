import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FORMAT_LABEL,
  competencyFor,
  dayLabel,
  durationLabel,
  seatState,
  seatsLeft,
  sessionDate,
  type Session,
} from "@/lib/events";
import { ArrowRight, CalendarDays, Check, Hourglass, MapPin, Users } from "lucide-react";

/**
 * The community's events block. It keeps its place on this screen — the
 * dedicated Workshops & Events section is additive, so this shows the next two
 * sessions and hands over to the full listing.
 */
export function UpcomingEventsBlock({
  sessions,
  registeredIds,
  waitlistedIds,
  onRegister,
}: {
  sessions: Session[];
  registeredIds: string[];
  /** Sessions the learner is waiting on — a place in the queue, not a seat. */
  waitlistedIds: string[];
  onRegister: (session: Session) => void;
}) {
  const next = sessions.slice(0, 2);

  return (
    <Card className="border-card-border" data-testid="card-upcoming-events">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
              <CalendarDays className="h-4.5 w-4.5 text-primary" /> Upcoming events
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Instructor-led sessions open to your entity. Attendance adds impact points.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1.5">
            <Link href="/learner/events" data-testid="link-all-events">
              All events <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ul className="mt-4 space-y-3">
          {next.map((session, i) => {
            const date = sessionDate(session);
            const { day, month, weekday } = dayLabel(date);
            const registered = registeredIds.includes(session.id);
            const waitlisted = waitlistedIds.includes(session.id);
            const left = seatsLeft(session, registered);
            const full = seatState(session, false) === "full";
            const competency = competencyFor(session.competencyId);

            return (
              <motion.li
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                className="flex gap-4 rounded-xl border border-border p-4"
                data-testid={`community-event-${session.id}`}
              >
                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[#171310] py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{month}</span>
                  <span className="text-xl font-bold leading-none text-white">{day}</span>
                  <span className="mt-0.5 text-[10px] text-white/50">{weekday}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-foreground">{session.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {FORMAT_LABEL[session.format]} · {session.startTime} · {durationLabel(session.durationMins)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    {competency && (
                      <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 font-medium text-secondary">
                        {competency.short}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" /> {left} of {session.seatsTotal} seats left
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {session.venue}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {session.facilitator} · {session.facilitatorRole}
                  </p>
                </div>

                <div className="shrink-0 self-center">
                  {registered && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                      data-testid={`community-event-registered-${session.id}`}
                    >
                      <Check className="h-3.5 w-3.5" /> Registered
                    </span>
                  )}
                  {!registered && waitlisted && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                      data-testid={`community-event-waitlisted-${session.id}`}
                    >
                      <Hourglass className="h-3.5 w-3.5" /> Waiting list
                    </span>
                  )}
                  {!registered && !waitlisted && (
                    <Button
                      size="sm"
                      onClick={() => onRegister(session)}
                      data-testid={`community-event-register-${session.id}`}
                    >
                      {full ? "Join waiting list" : "Register"}
                    </Button>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
