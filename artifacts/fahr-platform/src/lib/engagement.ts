// Federal AI Community: announcements, forums, polls and feedback,
// notifications, gamification and leaderboards (proposal §4.6).
//
// The community screen holds all of this in React state for the session:
// replies, votes, likes and read flags are real interactions on mock seed data.

import { COMPETENCY_BY_ID, type Competency } from "@/lib/learningData";
import { LEARNER_PROFILE } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export type AnnouncementKind = "programme" | "content" | "event" | "system";

export const ANNOUNCEMENT_LABEL: Record<AnnouncementKind, string> = {
  programme: "Programme",
  content: "New content",
  event: "Event",
  system: "System",
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  daysAgo: number;
  pinned: boolean;
  from: string;
  /** Where the announcement takes the learner, when it leads somewhere. */
  href?: string;
  hrefLabel?: string;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-hackathon",
    title: "Federal Agentic AI Hackathon 2026 — entries open",
    body: "Entities may enter teams of up to four. Submissions are evaluated on measured impact, governance and reusability across the federal government. Winning workflows are published to the federal library.",
    kind: "programme",
    daysAgo: 0,
    pinned: true,
    from: "FAHR Programme Team",
    href: "/learner/events",
    hrefLabel: "See the briefing session",
  },
  {
    id: "ann-governance-update",
    title: "Updated guidance on personal data in AI tools",
    body: "The Governance Office has clarified what counts as identifiable data in a prompt. Every workplace project submitted from today is checked against the revised wording.",
    kind: "programme",
    daysAgo: 1,
    pinned: true,
    from: "FAHR Governance Office",
    href: "/learner/lab/project",
    hrefLabel: "Check my project",
  },
  {
    id: "ann-module",
    title: "New module: Prompting for policy design",
    body: "Six microlearning steps on turning a policy objective into a structured brief, added to the catalogue for Emerging Practitioner and above.",
    kind: "content",
    daysAgo: 3,
    pinned: false,
    from: "FAHR AI Academy",
    href: "/learner/mission",
    hrefLabel: "Open my pathway",
  },
  {
    id: "ann-masterclass",
    title: "Masterclass: Agentic AI in Public Policy",
    body: "A virtual masterclass with the FAHR Programme Team on where agentic workflows are already carrying federal work forward, and what governance made that possible.",
    kind: "event",
    daysAgo: 4,
    pinned: false,
    from: "FAHR AI Academy",
    href: "/learner/events",
    hrefLabel: "Register",
  },
  {
    id: "ann-maintenance",
    title: "Planned maintenance: Saturday 02:00–04:00",
    body: "The Agentic AI Lab environment will be unavailable for two hours. Saved drafts are unaffected.",
    kind: "system",
    daysAgo: 6,
    pinned: false,
    from: "Platform Operations",
  },
];

// ---------------------------------------------------------------------------
// Discussion forums
// ---------------------------------------------------------------------------

export type Reply = {
  id: string;
  author: string;
  initials: string;
  role: string;
  when: string;
  body: string;
  /** Marked by the thread author as the answer that solved it. */
  accepted?: boolean;
  mine?: boolean;
};

export type ThreadScope = "entity" | "federal";

export type Thread = {
  id: string;
  title: string;
  body: string;
  author: string;
  initials: string;
  role: string;
  entity: string;
  when: string;
  scope: ThreadScope;
  competencyId: string;
  likes: number;
  replies: Reply[];
};

export const THREADS: Thread[] = [
  {
    id: "thr-summarisation",
    title: "Best pattern for summarising long policy documents?",
    body: "I am automating the summarisation of 40-page policy documents in the Agentic AI Lab. A sequential agent works but takes too long, and the summary drifts by the final section. Has anyone made a parallel pattern hold accuracy?",
    author: "Saeed Al Dhaheri",
    initials: "SD",
    role: "Innovation Lead",
    entity: "FAHR",
    when: "2 hours ago",
    scope: "federal",
    competencyId: "agentic",
    likes: 32,
    replies: [
      {
        id: "rep-1",
        author: "Fatima Al Jaber",
        initials: "FJ",
        role: "Policy Analyst, Ministry of Economy",
        when: "1 hour ago",
        body: "Map-reduce fixed both problems for us: summarise each section independently, then reduce the section summaries with a second instruction that only enforces structure. Accuracy held because nothing carries context it should not have.",
        accepted: true,
      },
      {
        id: "rep-2",
        author: "Omar Tariq",
        initials: "OT",
        role: "Automation Lead, FAHR",
        when: "35 minutes ago",
        body: "Add one checkpoint before the reduce step. If a section summary loses a reference number, you want a person to see it there rather than in the final brief.",
      },
    ],
  },
  {
    id: "thr-bilingual",
    title: "Keeping Arabic and English terminology consistent in one brief",
    body: "Our awareness campaigns publish in both languages on the same day. When I ask for the Arabic version afterwards the terminology drifts from the approved glossary. How are others handling this?",
    author: "Mariam Al Suwaidi",
    initials: "MS",
    role: "Communications Manager",
    entity: "Ministry of Health and Prevention",
    when: "5 hours ago",
    scope: "entity",
    competencyId: "prompting",
    likes: 21,
    replies: [
      {
        id: "rep-3",
        author: "Aisha Al Mansoori",
        initials: "AM",
        role: "Marketing Specialist, Ministry of Health and Prevention",
        when: "3 hours ago",
        body: "Put the glossary in the instruction as a constraint and ask for both languages in a single output. Translating afterwards is where ours drifted too.",
        mine: true,
      },
    ],
  },
  {
    id: "thr-governance-record",
    title: "What does a good governance record actually look like?",
    body: "I have my classification and my oversight decision written down, but I am not sure what an auditor expects to see. Does anyone have a record they are comfortable sharing as a model?",
    author: "Khalid Al Marri",
    initials: "KM",
    role: "Service Designer",
    entity: "Ministry of Interior",
    when: "1 day ago",
    scope: "federal",
    competencyId: "governance",
    likes: 45,
    replies: [
      {
        id: "rep-4",
        author: "Ahmed Al Balushi",
        initials: "AB",
        role: "Director, FAHR Governance Office",
        when: "20 hours ago",
        body: "Four things, every time: what data went in and at which classification, which model or tool, who accepted the output, and what changed between the draft and what was published. If those four are answerable, the record is sufficient.",
        accepted: true,
      },
      {
        id: "rep-5",
        author: "Hind Bint Maktoum",
        initials: "HB",
        role: "Strategic Planner, Ministry of Finance",
        when: "16 hours ago",
        body: "We keep it in the same file as the output rather than a separate register. Nobody maintains a separate register.",
      },
    ],
  },
  {
    id: "thr-measure-impact",
    title: "How are you evidencing hours saved without sounding made up?",
    body: "My line manager asked for the baseline behind my \"six hours a week\" figure. I had not taken one before the assistant went live. What is the most credible way to recover from that?",
    author: "Noura Al Ameri",
    initials: "NA",
    role: "HR Business Partner",
    entity: "Ministry of Health and Prevention",
    when: "2 days ago",
    scope: "entity",
    competencyId: "analytics",
    likes: 18,
    replies: [
      {
        id: "rep-6",
        author: "Mariam Al Suwaidi",
        initials: "MS",
        role: "Head of Insight, Ministry of Health and Prevention",
        when: "1 day ago",
        body: "Time three of the tasks manually this week and use that as a retrospective baseline. State plainly that it was taken after the fact — an honest late baseline is far stronger than a confident guess.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Polls and feedback
// ---------------------------------------------------------------------------

export type PollOption = { id: string; label: string; votes: number };

export type Poll = {
  id: string;
  question: string;
  context: string;
  closesInDays: number;
  options: PollOption[];
};

export const POLLS: Poll[] = [
  {
    id: "poll-capability",
    question: "Which AI capability would help you most in the next quarter?",
    context: "Results go to the FAHR programme team in aggregate and shape which sessions are scheduled next.",
    closesInDays: 9,
    options: [
      { id: "prompting", label: "Prompt engineering for official writing", votes: 3120 },
      { id: "analytics", label: "AI-assisted analysis of service data", votes: 2480 },
      { id: "agentic", label: "Building an assistant for a recurring process", votes: 1960 },
      { id: "governance", label: "Applying governance and data ethics", votes: 1240 },
    ],
  },
  {
    id: "poll-blocker",
    question: "What most slows your team down when adopting AI at work?",
    context: "Open to every federal entity. The FAHR Governance Office responds to the leading answer each quarter.",
    closesInDays: 4,
    options: [
      { id: "clarity", label: "Not knowing what is allowed", votes: 2140 },
      { id: "tools", label: "Tool access and approvals", votes: 1870 },
      { id: "time", label: "No time to learn while delivering", votes: 2610 },
      { id: "trust", label: "Colleagues not trusting the output", votes: 980 },
    ],
  },
];

export const FEEDBACK_PROMPT = {
  question: "Is the community giving you what you need?",
  context: "Sent to the FAHR programme team with your entity, not your name.",
  options: [
    { id: "yes", label: "Yes, I get answers here" },
    { id: "partly", label: "Partly — some areas are quiet" },
    { id: "no", label: "No, I cannot find what I need" },
  ],
} as const;

// ---------------------------------------------------------------------------
// Notifications and reminders
// ---------------------------------------------------------------------------

export type CommunityNotification = {
  id: string;
  title: string;
  body: string;
  when: string;
  kind: "reply" | "mention" | "reminder" | "award";
  href?: string;
  read: boolean;
};

export const COMMUNITY_NOTIFICATIONS: CommunityNotification[] = [
  {
    id: "note-reply",
    title: "Fatima Al Jaber replied in a thread you follow",
    body: "\"Map-reduce fixed both problems for us…\" on summarising long policy documents.",
    when: "1 hour ago",
    kind: "reply",
    read: false,
  },
  {
    id: "note-reminder",
    title: "Responsible AI governance briefing starts in six days",
    body: "You are registered. A calendar reminder is set for 30 minutes before.",
    when: "Today",
    kind: "reminder",
    href: "/learner/events",
    read: false,
  },
  {
    id: "note-award",
    title: "You earned the Peer Contributor badge",
    body: "Three answers of yours were marked helpful by colleagues in other entities.",
    when: "Yesterday",
    kind: "award",
    href: "/learner/recognition",
    read: false,
  },
  {
    id: "note-mention",
    title: "Khalid Al Marri mentioned you",
    body: "\"…the glossary constraint Aisha described is what we adopted.\"",
    when: "2 days ago",
    kind: "mention",
    read: true,
  },
];

// ---------------------------------------------------------------------------
// Leaderboards
// ---------------------------------------------------------------------------

export type LeaderboardScope = "entity" | "federal" | "cohort";

export const SCOPE_LABEL: Record<LeaderboardScope, string> = {
  entity: "My entity",
  federal: "Federal",
  cohort: "My cohort",
};

export const SCOPE_CAPTION: Record<LeaderboardScope, string> = {
  entity: "Ministry of Health and Prevention · 1,240 participants",
  federal: "All federal entities · 38,400 participants",
  cohort: "Agentic AI Practitioner cohort 2026-B · 42 participants",
};

export type LeaderboardRow = {
  rank: number;
  name: string;
  initials: string;
  detail: string;
  points: number;
  /** Places moved since last month. */
  movement: number;
  isCurrentUser?: boolean;
};

export const LEADERBOARDS: Record<LeaderboardScope, LeaderboardRow[]> = {
  entity: [
    { rank: 1, name: "Saeed Al Dhaheri", initials: "SD", detail: "Innovation Lead", points: 14500, movement: 0 },
    { rank: 2, name: LEARNER_PROFILE.name, initials: "AM", detail: LEARNER_PROFILE.role, points: 13200, movement: 3, isCurrentUser: true },
    { rank: 3, name: "Mariam Al Suwaidi", initials: "MS", detail: "Head of Insight", points: 12850, movement: -1 },
    { rank: 4, name: "Majed Al Futtaim", initials: "MF", detail: "Data Scientist", points: 11400, movement: 1 },
    { rank: 5, name: "Noura Al Ameri", initials: "NA", detail: "HR Business Partner", points: 10900, movement: -2 },
  ],
  federal: [
    { rank: 1, name: "Mohammed Alabbar", initials: "MA", detail: "Ministry of Finance", points: 28500, movement: 0 },
    { rank: 2, name: "Fatima Al Jaber", initials: "FJ", detail: "Ministry of Economy", points: 27200, movement: 2 },
    { rank: 3, name: "Khalaf Al Habtoor", initials: "KH", detail: "FAHR", points: 26850, movement: -1 },
    { rank: 4, name: "Salama Al Zaabi", initials: "SZ", detail: "Ministry of Education", points: 25100, movement: 4 },
    { rank: 142, name: LEARNER_PROFILE.name, initials: "AM", detail: "Ministry of Health and Prevention", points: 13200, movement: 18, isCurrentUser: true },
  ],
  cohort: [
    { rank: 1, name: LEARNER_PROFILE.name, initials: "AM", detail: "Ministry of Health and Prevention", points: 13200, movement: 2, isCurrentUser: true },
    { rank: 2, name: "Khalid Al Marri", initials: "KM", detail: "Ministry of Interior", points: 12740, movement: -1 },
    { rank: 3, name: "Reem Al Hosani", initials: "RH", detail: "Ministry of Justice", points: 11980, movement: 0 },
    { rank: 4, name: "Yousef Al Nuaimi", initials: "YN", detail: "Federal Tax Authority", points: 10420, movement: 1 },
    { rank: 5, name: "Hessa Al Falasi", initials: "HF", detail: "Ministry of Energy", points: 9850, movement: -3 },
  ],
};

/** How community points are earned — shown so the leaderboard is not a black box. */
export const POINT_RULES = [
  { label: "Answer marked helpful by a colleague", points: 150 },
  { label: "Workplace project passes evaluation", points: 1200 },
  { label: "Attend an instructor-led session", points: 200 },
  { label: "Complete a course in your pathway", points: 400 },
  { label: "Start a discussion others reply to", points: 80 },
];

export function competencyFor(id: string): Competency | null {
  return COMPETENCY_BY_ID[id] ?? null;
}

export function totalVotes(options: PollOption[], extra = 0): number {
  return options.reduce((n, o) => n + o.votes, 0) + extra;
}

export function share(votes: number, total: number): number {
  return total === 0 ? 0 : Math.round((votes / total) * 100);
}
