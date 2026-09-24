// Workshops and events: instructor-led virtual sessions, webinars and clinics.
//
// The proposal asks for instructor-led virtual sessions (4.3), event
// registration and webinar integration (4.6) and upcoming events on the learner
// dashboard (4.2). This module is the single source for all of them so the
// community screen, the events screen and the dashboard can never disagree.
//
// Front-end mock content only — registration is simulated in React state.

import { COMPETENCY_BY_ID, type Competency } from "@/lib/learningData";

export type SessionFormat = "virtual" | "webinar" | "in-person" | "hybrid";

export const FORMAT_LABEL: Record<SessionFormat, string> = {
  virtual: "Virtual workshop",
  webinar: "Webinar",
  "in-person": "In person",
  hybrid: "Hybrid",
};

/**
 * Who an event is for. A federally scheduled event is rarely for everyone —
 * it targets an entity, a rung of the capability ladder, or the people with a
 * particular competency gap — and the learner's listing honours that, so an
 * event configured for Health practitioners does not appear to everyone.
 */
export type AudienceScope = "everyone" | "entity" | "level" | "competency";

export type EventAudience = {
  scope: AudienceScope;
  /** A ministryId, levelId or competencyId — unused when the scope is everyone. */
  value?: string;
};

export const EVERYONE: EventAudience = { scope: "everyone" };

export type Session = {
  id: string;
  title: string;
  summary: string;
  facilitator: string;
  facilitatorRole: string;
  host: string;
  format: SessionFormat;
  /** Where it happens — a platform for virtual, a venue for in person. */
  venue: string;
  competencyId: string;
  /** Days from today, so the listing never goes stale in a demo. */
  inDays: number;
  startTime: string;
  durationMins: number;
  seatsTotal: number;
  seatsTaken: number;
  level: string;
  agenda: string[];
  /** Who the event is for. Seeded events are open to everyone. */
  audience?: EventAudience;
};

export type PastSession = {
  id: string;
  title: string;
  facilitator: string;
  daysAgo: number;
  competencyId: string;
  durationMins: number;
  attendees: number;
  recordingMins: number;
  takeaway: string;
  /** Whether the learner attended live — otherwise they can still watch it. */
  attended: boolean;
};

export const SESSIONS: Session[] = [
  {
    id: "sess-prompt-clinic",
    title: "Prompt craft clinic: rewriting real federal notices",
    summary:
      "Bring one notice, circular or awareness post you are working on. You leave with it rewritten into a structured, reusable instruction that holds tone in Arabic and English.",
    facilitator: "Dr. Layla Al Hashimi",
    facilitatorRole: "Lead Instructor, FAHR AI Academy",
    host: "FAHR AI Academy",
    format: "virtual",
    venue: "Microsoft Teams",
    competencyId: "prompting",
    inDays: 3,
    startTime: "10:00",
    durationMins: 90,
    seatsTotal: 40,
    seatsTaken: 33,
    level: "Emerging Practitioner and above",
    agenda: [
      "What separates a weak request from a structured brief",
      "Live rewrite of three participant notices",
      "Holding terminology steady across Arabic and English",
      "Turning your best prompt into a team asset",
    ],
  },
  {
    id: "sess-governance-briefing",
    title: "Responsible AI governance briefing for federal teams",
    summary:
      "The federal guardrails in practice: data classification, disclosure, human oversight and the record you are expected to keep for every AI-assisted output.",
    facilitator: "Ahmed Al Balushi",
    facilitatorRole: "Director, FAHR Governance Office",
    host: "FAHR Governance Office",
    format: "webinar",
    venue: "Webinar · live captions in Arabic and English",
    competencyId: "governance",
    inDays: 6,
    startTime: "13:00",
    durationMins: 45,
    seatsTotal: 500,
    seatsTaken: 291,
    level: "All levels",
    agenda: [
      "The five federal AI policies you are assessed against",
      "Classifying data before it reaches a tool",
      "Where a human must stay in the loop",
      "Live questions with the Governance Office",
    ],
  },
  {
    id: "sess-agentic-lab",
    title: "Agentic AI Lab open build session",
    summary:
      "A working session, not a lecture. Bring one recurring task and leave with a two-step assistant designed, checkpointed and ready to pilot in your department.",
    facilitator: "Omar Tariq",
    facilitatorRole: "Automation Lead, FAHR Programme Team",
    host: "FAHR Programme Team",
    format: "virtual",
    venue: "Agentic AI Lab environment",
    competencyId: "agentic",
    inDays: 9,
    startTime: "09:30",
    durationMins: 120,
    seatsTotal: 25,
    seatsTaken: 25,
    level: "Practitioner and above",
    agenda: [
      "Choosing the right first task to automate",
      "Mapping steps, tools and human checkpoints",
      "Building and running step one together",
      "Peer review of each other's designs",
    ],
  },
  {
    id: "sess-analytics-walkthrough",
    title: "AI-assisted analytics: federal service data walkthrough",
    summary:
      "Work through a real service performance export with AI: segment the audience, test the strongest claim, and build the answer to \"but did it work\".",
    facilitator: "Mariam Al Suwaidi",
    facilitatorRole: "Head of Insight, Ministry of Health and Prevention",
    host: "Ministry of Health and Prevention",
    format: "in-person",
    venue: "FAHR Innovation Centre, Dubai",
    competencyId: "analytics",
    inDays: 14,
    startTime: "10:00",
    durationMins: 150,
    seatsTotal: 30,
    seatsTaken: 18,
    level: "All levels",
    agenda: [
      "Reading a service performance export critically",
      "Prompting for comparison rather than description",
      "Verifying an AI-derived figure against the source",
      "Presenting outcomes to leadership",
    ],
  },
  {
    id: "sess-literacy-clinic",
    title: "AI fundamentals clinic: what it can and cannot do",
    summary:
      "The entry point for colleagues who have not used AI at work yet. Three ways AI fails in public service, and the checks that catch each one.",
    facilitator: "Fatima Al Jaber",
    facilitatorRole: "Instructor, FAHR AI Academy",
    host: "FAHR AI Academy",
    format: "webinar",
    venue: "Webinar · recorded for later viewing",
    competencyId: "literacy",
    inDays: 18,
    startTime: "11:00",
    durationMins: 60,
    seatsTotal: 300,
    seatsTaken: 96,
    level: "Aware and above",
    agenda: [
      "Fabrication, staleness and overreach",
      "The federal examples behind each failure",
      "A three-question check before you send",
      "Where to take your first supervised attempt",
    ],
  },
  {
    id: "sess-champions-forum",
    title: "AI Champions forum: scaling what worked",
    summary:
      "Entity champions present workplace projects that moved a real number, followed by an open exchange on what it took to get them adopted.",
    facilitator: "Saeed Al Dhaheri",
    facilitatorRole: "Innovation Lead, FAHR",
    host: "FAHR Programme Team",
    format: "hybrid",
    venue: "FAHR Headquarters, Abu Dhabi and online",
    competencyId: "agentic",
    inDays: 24,
    startTime: "14:00",
    durationMins: 180,
    seatsTotal: 120,
    seatsTaken: 74,
    level: "Practitioner and above",
    agenda: [
      "Three evaluated projects presented in full",
      "What adoption actually required",
      "Where governance slowed things down, and why that was right",
      "Open exchange between entities",
    ],
  },
];

export const PAST_SESSIONS: PastSession[] = [
  {
    id: "past-prompting-bilingual",
    title: "Bilingual prompting for public communications",
    facilitator: "Dr. Layla Al Hashimi",
    daysAgo: 12,
    competencyId: "prompting",
    durationMins: 75,
    attendees: 218,
    recordingMins: 68,
    takeaway: "Write the Arabic constraint into the instruction rather than translating the output afterwards.",
    attended: true,
  },
  {
    id: "past-governance-classification",
    title: "Data classification in practice",
    facilitator: "Ahmed Al Balushi",
    daysAgo: 21,
    competencyId: "governance",
    durationMins: 45,
    attendees: 402,
    recordingMins: 44,
    takeaway: "If a person is identifiable in the input, the tool choice is already decided for you.",
    attended: true,
  },
  {
    id: "past-agentic-checkpoints",
    title: "Where to place human checkpoints in an assistant",
    facilitator: "Omar Tariq",
    daysAgo: 34,
    competencyId: "agentic",
    durationMins: 90,
    attendees: 144,
    recordingMins: 87,
    takeaway: "Checkpoint on irreversibility, not on complexity.",
    attended: false,
  },
  {
    id: "past-analytics-outcomes",
    title: "From impressions to outcomes",
    facilitator: "Mariam Al Suwaidi",
    daysAgo: 47,
    competencyId: "analytics",
    durationMins: 60,
    attendees: 176,
    recordingMins: 58,
    takeaway: "Pick the single measure a director would act on, then evidence that one.",
    attended: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function competencyFor(competencyId: string): Competency | null {
  return COMPETENCY_BY_ID[competencyId] ?? null;
}

export function sessionDate(session: Pick<Session, "inDays">, now: Date = new Date()): Date {
  return new Date(now.getTime() + session.inDays * 86_400_000);
}

export function dayLabel(date: Date): { day: string; month: string; weekday: string } {
  return {
    day: date.toLocaleDateString("en-GB", { day: "numeric" }),
    month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
  };
}

export function fullDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function daysAgoLabel(daysAgo: number, now: Date = new Date()): string {
  return fullDate(new Date(now.getTime() - daysAgo * 86_400_000));
}

export function durationLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} hour${hours > 1 ? "s" : ""}`;
}

/** Seats left after the learner's own registrations are taken into account. */
export function seatsLeft(session: Session, registered: boolean): number {
  return Math.max(0, session.seatsTotal - session.seatsTaken - (registered ? 1 : 0));
}

export type SeatState = "open" | "filling" | "full";

export function seatState(session: Session, registered: boolean): SeatState {
  const left = seatsLeft(session, registered);
  if (left === 0) return "full";
  if (left <= Math.max(3, Math.round(session.seatsTotal * 0.15))) return "filling";
  return "open";
}

/** Sessions inside the next 24 hours can be joined rather than registered for. */
export function isImminent(session: Session): boolean {
  return session.inDays <= 1;
}

/**
 * The sessions the demo learner is already booked on before they touch anything,
 * so "My registrations" is never an empty tab on a first visit.
 */
export const SEEDED_REGISTRATIONS = ["sess-governance-briefing"];

/** Upcoming sessions, soonest first. */
export function upcomingSessions(): Session[] {
  return [...SESSIONS].sort((a, b) => a.inDays - b.inDays);
}

/**
 * Sessions ordered so the ones closing the learner's own competency gaps come
 * first — the events listing reflects their assessment like everything else.
 */
export function recommendedFirst(sessions: Session[], gapIds: string[]): Session[] {
  if (gapIds.length === 0) return sessions;
  const weight = (s: Session) => {
    const index = gapIds.indexOf(s.competencyId);
    return index === -1 ? gapIds.length : index;
  };
  return [...sessions].sort((a, b) => weight(a) - weight(b) || a.inDays - b.inDays);
}


// ---------------------------------------------------------------------------
// Audience targeting
// ---------------------------------------------------------------------------

/** What the learner sees against an event, and what the scheduler picks from. */
export function audienceLabel(
  audience: EventAudience | undefined,
  resolve: (scope: AudienceScope, value: string) => string,
): string {
  if (!audience || audience.scope === "everyone") return "All federal employees";
  if (!audience.value) return "All federal employees";
  return resolve(audience.scope, audience.value);
}

/** The viewer an audience is matched against. */
export type AudienceViewer = {
  ministryId?: string;
  levelId?: string;
  /** Competencies the learner's own profile names as development priorities. */
  gapCompetencyIds?: string[];
};

/**
 * Whether an event reaches this learner. An event with no audience reaches
 * everyone, which keeps every seeded event visible.
 */
export function matchesAudience(audience: EventAudience | undefined, viewer: AudienceViewer): boolean {
  if (!audience || audience.scope === "everyone" || !audience.value) return true;
  if (audience.scope === "entity") return viewer.ministryId === audience.value;
  if (audience.scope === "level") return viewer.levelId === audience.value;
  return (viewer.gapCompetencyIds ?? []).includes(audience.value);
}
