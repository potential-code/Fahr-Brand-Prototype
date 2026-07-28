import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import {
  FORMAT_LABEL,
  PAST_SESSIONS,
  SEEDED_REGISTRATIONS,
  competencyFor,
  dayLabel,
  daysAgoLabel,
  durationLabel,
  fullDate,
  isImminent,
  recommendedFirst,
  seatState,
  seatsLeft,
  sessionDate,
  upcomingSessions,
  type PastSession,
  type Session,
} from "@/lib/events";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Hourglass,
  MapPin,
  PlayCircle,
  Users,
  Video,
} from "lucide-react";

type TabId = "upcoming" | "mine" | "past";

/**
 * A learner's relationship to a session. A waiting-list place is deliberately
 * not a confirmed seat: it holds no seat and offers no joining details.
 */
type SeatHold = "none" | "registered" | "waitlisted";

const TABS: { id: TabId; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "mine", label: "My registrations" },
  { id: "past", label: "Past sessions" },
];

const FORMAT_ICON = {
  virtual: Video,
  webinar: Globe,
  "in-person": MapPin,
  hybrid: Globe,
} as const;

/** Calendar-style date block, dark so the date reads first in a dense list. */
function DateBlock({ session }: { session: Session }) {
  const { day, month, weekday } = dayLabel(sessionDate(session));
  return (
    <div className="relative flex w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-[#171310] py-2.5">
      <div aria-hidden="true" className="absolute -end-6 -top-6 h-16 w-16 rounded-full bg-primary/25 blur-xl" />
      <span className="relative text-[10px] font-semibold uppercase tracking-wider text-primary">{month}</span>
      <span className="relative text-2xl font-bold leading-none text-white">{day}</span>
      <span className="relative mt-0.5 text-[10px] text-white/50">{weekday}</span>
    </div>
  );
}

function SeatPill({ session, hold }: { session: Session; hold: SeatHold }) {
  // Only a confirmed registration takes a seat; a waiting-list place does not.
  const holdsSeat = hold === "registered";
  const state = seatState(session, holdsSeat);
  const left = seatsLeft(session, holdsSeat);

  const style =
    state === "full"
      ? "border-border bg-muted text-muted-foreground"
      : state === "filling"
        ? "border-accent/40 bg-accent/10 text-accent"
        : "border-primary/30 bg-primary/10 text-primary";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style}`}>
      <Users className="h-3 w-3" />
      {state === "full" ? "Waiting list only" : `${left} of ${session.seatsTotal} seats left`}
    </span>
  );
}

function SessionCard({
  session,
  index,
  hold,
  recommended,
  onRegister,
  onCancel,
}: {
  session: Session;
  index: number;
  hold: SeatHold;
  recommended: boolean;
  onRegister: (session: Session) => void;
  onCancel: (session: Session) => void;
}) {
  const [open, setOpen] = useState(false);
  const competency = competencyFor(session.competencyId);
  const FormatIcon = FORMAT_ICON[session.format];
  const registered = hold === "registered";
  const waitlisted = hold === "waitlisted";
  const full = seatState(session, false) === "full";
  const imminent = isImminent(session);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md ${
        registered ? "border-primary/40" : "border-card-border"
      }`}
      data-testid={`session-${session.id}`}
    >
      <div className="flex gap-4">
        <DateBlock session={session} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <FormatIcon className="h-3 w-3" /> {FORMAT_LABEL[session.format]}
            </span>
            {competency && (
              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-medium text-secondary">
                {competency.short}
              </span>
            )}
            {recommended && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Closes one of your gaps
              </span>
            )}
            {registered && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                <Check className="h-3 w-3" /> You are registered
              </span>
            )}
            {waitlisted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                <Hourglass className="h-3 w-3" /> On the waiting list
              </span>
            )}
          </div>

          <h3 className="mt-2.5 text-base font-bold leading-snug text-foreground">{session.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{session.summary}</p>

          <dl className="mt-3.5 grid gap-2 text-xs sm:grid-cols-2">
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">Facilitator</dt>
              <dd className="min-w-0 font-medium text-foreground">
                {session.facilitator} <span className="font-normal text-muted-foreground">· {session.facilitatorRole}</span>
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">When</dt>
              <dd className="font-medium text-foreground">
                {fullDate(sessionDate(session))} · {session.startTime}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">Where</dt>
              <dd className="min-w-0 font-medium text-foreground">{session.venue}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-muted-foreground">Length</dt>
              <dd className="font-medium text-foreground">
                {durationLabel(session.durationMins)} · {session.level}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <SeatPill session={session} hold={hold} />

            {registered && (
              <>
                <Button size="sm" variant={imminent ? "default" : "outline"} data-testid={`join-${session.id}`}>
                  {imminent ? "Join session" : "Add to calendar"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(session)}
                  data-testid={`cancel-${session.id}`}
                >
                  Cancel registration
                </Button>
              </>
            )}

            {/* A waiting-list place carries no joining details until a seat opens. */}
            {waitlisted && (
              <>
                <span className="text-xs text-muted-foreground">
                  You will be offered the first seat that opens.
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCancel(session)}
                  data-testid={`cancel-${session.id}`}
                >
                  Leave waiting list
                </Button>
              </>
            )}

            {hold === "none" && (
              <Button size="sm" onClick={() => onRegister(session)} data-testid={`register-${session.id}`}>
                {full ? "Join waiting list" : "Register"}
              </Button>
            )}

            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid={`agenda-toggle-${session.id}`}
            >
              What is covered
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
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
                <ul className="mt-3.5 space-y-1.5 rounded-xl border border-border bg-muted/30 p-3.5">
                  {session.agenda.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

function PastSessionCard({ session, index }: { session: PastSession; index: number }) {
  const competency = competencyFor(session.competencyId);
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
      className="rounded-2xl border border-card-border bg-card p-5"
      data-testid={`past-session-${session.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {competency && (
          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-medium text-secondary">
            {competency.short}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">{daysAgoLabel(session.daysAgo)}</span>
        {session.attended ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <Check className="h-3 w-3" /> You attended
          </span>
        ) : (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Not attended
          </span>
        )}
      </div>

      <h3 className="mt-2.5 text-base font-bold leading-snug text-foreground">{session.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {session.facilitator} · {durationLabel(session.durationMins)} · {session.attendees} attendees
      </p>

      <p className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Key takeaway: </span>
        {session.takeaway}
      </p>

      <Button size="sm" variant="outline" className="mt-3.5 gap-2" data-testid={`recording-${session.id}`}>
        <PlayCircle className="h-4 w-4" /> Watch recording · {durationLabel(session.recordingMins)}
      </Button>
    </motion.li>
  );
}

/**
 * Workshops & Events — instructor-led sessions, webinars and recordings
 * (proposal §4.3 and §4.6). Registration is simulated in state for the session:
 * seats update, the confirmed state is visible, and the learner's own
 * registrations collect in their own tab.
 */
export default function WorkshopsAndEvents() {
  const { toast } = useToast();
  const { result } = useLearnerProgress();
  const [tab, setTab] = useState<TabId>("upcoming");
  const [registeredIds, setRegisteredIds] = useState<string[]>(SEEDED_REGISTRATIONS);
  const [waitlistedIds, setWaitlistedIds] = useState<string[]>([]);

  const gaps = result?.gaps ?? [];
  const sessions = useMemo(() => recommendedFirst(upcomingSessions(), gaps), [gaps]);

  const holdFor = (session: Session): SeatHold =>
    registeredIds.includes(session.id) ? "registered" : waitlistedIds.includes(session.id) ? "waitlisted" : "none";

  // Both confirmed seats and waiting-list places belong to the learner, so both
  // appear here — labelled for what they are.
  const mine = sessions.filter((s) => holdFor(s) !== "none");

  const register = (session: Session) => {
    // A full session cannot confirm a seat; it takes a waiting-list place instead.
    if (seatState(session, false) === "full") {
      setWaitlistedIds((current) => (current.includes(session.id) ? current : [...current, session.id]));
      toast({
        title: "Added to the waiting list",
        description: `${session.title} is full. You will be offered the first seat that opens, and nothing is confirmed until then.`,
      });
      return;
    }

    setRegisteredIds((current) => (current.includes(session.id) ? current : [...current, session.id]));
    toast({
      title: "Seat confirmed",
      description: `${session.title} on ${fullDate(sessionDate(session))} at ${session.startTime}. A calendar invitation and a reminder 30 minutes before are set.`,
    });
  };

  const cancel = (session: Session) => {
    const wasWaitlisted = waitlistedIds.includes(session.id);
    setRegisteredIds((current) => current.filter((id) => id !== session.id));
    setWaitlistedIds((current) => current.filter((id) => id !== session.id));
    toast({
      title: wasWaitlisted ? "Left the waiting list" : "Registration cancelled",
      description: wasWaitlisted
        ? `You are no longer waiting for a seat on ${session.title}.`
        : `Your seat on ${session.title} has been released to the waiting list.`,
    });
  };

  const nextUp = mine[0] ?? null;

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
        <PageHeader
          icon={<CalendarDays className="mt-1 h-6 w-6 text-primary" />}
          title="Workshops & Events"
          description="Instructor-led workshops, webinars and clinics run by the FAHR AI Academy and federal entities. Attendance is recorded on your capability profile and earns impact points."
        />

        {/* Next commitment, so the learner sees their nearest obligation first */}
        {nextUp && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-2xl bg-[#171310] p-5 md:p-6"
            data-testid="next-session"
          >
            <div aria-hidden="true" className="absolute -end-20 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Your next session
                </p>
                <h2 className="mt-1.5 text-lg font-bold text-white">{nextUp.title}</h2>
                <p className="mt-1 text-sm text-white/60">
                  {fullDate(sessionDate(nextUp))} · {nextUp.startTime} · {FORMAT_LABEL[nextUp.format]} ·{" "}
                  {nextUp.facilitator}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/50">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                  Reminder set for 30 minutes before it starts
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setTab("mine")}
                data-testid="button-view-registrations"
              >
                My registrations <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Event listings">
          {TABS.map((t) => {
            const count = t.id === "mine" ? mine.length : t.id === "past" ? PAST_SESSIONS.length : sessions.length;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
                data-testid={`tab-${t.id}`}
              >
                {t.label} <span className="tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "upcoming" && (
              <ul className="space-y-4" data-testid="list-upcoming">
                {sessions.map((session, i) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    index={i}
                    hold={holdFor(session)}
                    recommended={gaps.includes(session.competencyId)}
                    onRegister={register}
                    onCancel={cancel}
                  />
                ))}
              </ul>
            )}

            {tab === "mine" && (
              <>
                {mine.length > 0 ? (
                  <ul className="space-y-4" data-testid="list-mine">
                    {mine.map((session, i) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        index={i}
                        hold={holdFor(session)}
                        recommended={gaps.includes(session.competencyId)}
                        onRegister={register}
                        onCancel={cancel}
                      />
                    ))}
                  </ul>
                ) : (
                  <Card className="border-dashed" data-testid="mine-empty">
                    <CardContent className="p-8 text-center">
                      <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold text-foreground">No registrations yet</p>
                      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Register for a workshop and it appears here with its joining details and reminder.
                      </p>
                      <Button size="sm" className="mt-4" onClick={() => setTab("upcoming")}>
                        Browse upcoming sessions
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tab === "past" && (
              <ul className="grid gap-4 md:grid-cols-2" data-testid="list-past">
                {PAST_SESSIONS.map((session, i) => (
                  <PastSessionCard key={session.id} session={session} index={i} />
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>

        <ScrollReveal>
          <Card className="border-card-border">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">Attendance counts towards your record</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every session you attend adds impact points and is cited on your capability profile alongside your
                  credentials.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/learner/recognition" data-testid="link-recognition-from-events">
                  Open my recognition record <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </Layout>
  );
}
