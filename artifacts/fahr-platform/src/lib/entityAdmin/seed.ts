// Authored seed for the entity (Ministry) admin console.
//
// Anything another role also sees stays in `src/lib/federal/seed.ts`. What lives
// here is the administration layer: accounts and consent, content publishing
// metadata, event enrichment and attendance, and the communications history.

import { PEOPLE, FOCUS } from "@/lib/federal/seed";
import type {
  Communication,
  ContentRecord,
  EntityAccount,
  EntityEvent,
  EventFormat,
} from "./model";

/** The entity admin whose console this is. */
export const ENTITY_ADMIN = "Noura Al Kaabi";

const EMAIL_DOMAIN = "mohap.gov.ae";

const emailFor = (name: string): string =>
  `${name
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part))
    .join(".")
    .replace(/\.al\./g, ".al")}@${EMAIL_DOMAIN}`;

type AccountSeed = {
  personId: string;
  platformRole: EntityAccount["platformRole"];
  profileCompletion: number;
  missingProfileFields: string[];
  consent: EntityAccount["consent"];
};

/**
 * Administration state for the entity's authored roster. Everything else about
 * these people — level, progress, assessment score — is read from the federal
 * roster so the two can never disagree.
 */
const ACCOUNT_SEEDS: AccountSeed[] = [
  { personId: "p-mariam", platformRole: "Department Manager", profileCompletion: 100, missingProfileFields: [], consent: "Granted" },
  { personId: "p-aisha", platformRole: "Federal Employee", profileCompletion: 100, missingProfileFields: [], consent: "Granted" },
  { personId: "p-khalid-h", platformRole: "Federal Employee", profileCompletion: 45, missingProfileFields: ["Job family", "Department manager", "Learning goals"], consent: "Pending" },
  { personId: "p-fatima-q", platformRole: "Federal Employee", profileCompletion: 85, missingProfileFields: ["Learning goals"], consent: "Granted" },
  { personId: "p-omar", platformRole: "Federal Employee", profileCompletion: 100, missingProfileFields: [], consent: "Granted" },
  { personId: "p-zayed", platformRole: "Federal Employee", profileCompletion: 70, missingProfileFields: ["Job family", "Preferred language"], consent: "Granted" },
  { personId: "p-noura-s", platformRole: "Content Author", profileCompletion: 100, missingProfileFields: [], consent: "Granted" },
  { personId: "p-saeed", platformRole: "Department Manager", profileCompletion: 90, missingProfileFields: ["Emergency contact"], consent: "Granted" },
  { personId: "p-fatima-z", platformRole: "Federal Employee", profileCompletion: 60, missingProfileFields: ["Job family", "Learning goals"], consent: "Withdrawn" },
  { personId: "p-khalid-r", platformRole: "Federal Employee", profileCompletion: 100, missingProfileFields: [], consent: "Granted" },
  { personId: "p-hessa", platformRole: "Department Manager", profileCompletion: 95, missingProfileFields: ["Preferred language"], consent: "Granted" },
  { personId: "p-yousef", platformRole: "Federal Employee", profileCompletion: 40, missingProfileFields: ["Job family", "Department manager", "Learning goals", "Preferred language"], consent: "Pending" },
];

/** Accounts that are not learners, so they have no row in the federal roster. */
const ADMIN_ACCOUNTS: EntityAccount[] = [
  {
    id: "ea-noura-k",
    name: ENTITY_ADMIN,
    email: "noura.alkaabi@mohap.gov.ae",
    jobRole: "Director of Learning & Development",
    platformRole: "Entity Admin",
    status: "Active",
    lastActive: "15 mins ago",
    profileCompletion: 100,
    missingProfileFields: [],
    consent: "Granted",
  },
  {
    id: "ea-ali-h",
    name: "Ali Al Hammadi",
    email: "ali.alhammadi@mohap.gov.ae",
    jobRole: "Head of Clinical Operations",
    departmentId: "mohap-hospitals",
    cohortId: "mohap-c6",
    platformRole: "Department Manager",
    status: "Active",
    lastActive: "Yesterday",
    profileCompletion: 90,
    missingProfileFields: ["Learning goals"],
    consent: "Granted",
  },
  {
    id: "ea-mohammed-r",
    name: "Mohammed Al Rayssi",
    email: "mohammed.alrayssi@mohap.gov.ae",
    jobRole: "Digital Content Producer",
    departmentId: "mohap-comms",
    platformRole: "Content Author",
    status: "Invited",
    lastActive: "—",
    profileCompletion: 20,
    missingProfileFields: ["Job family", "Department", "Learning goals", "Preferred language"],
    consent: "Pending",
    invitedOn: "21 July 2026",
  },
  {
    id: "ea-shamsa-d",
    name: "Shamsa Al Dhaheri",
    email: "shamsa.aldhaheri@mohap.gov.ae",
    jobRole: "Performance & Reporting Analyst",
    departmentId: "mohap-hr",
    platformRole: "Reporting Viewer",
    status: "Active",
    lastActive: "3 hours ago",
    profileCompletion: 100,
    missingProfileFields: [],
    consent: "Granted",
  },
  {
    id: "ea-jamal-s",
    name: "Jamal Al Suwaidi",
    email: "jamal.alsuwaidi@mohap.gov.ae",
    jobRole: "Procurement Officer",
    departmentId: "mohap-support",
    cohortId: "mohap-c12",
    platformRole: "Federal Employee",
    status: "Suspended",
    lastActive: "38 days ago",
    profileCompletion: 55,
    missingProfileFields: ["Job family", "Learning goals"],
    consent: "Withdrawn",
  },
];

/** The entity's account directory, built from the roster plus the admin accounts. */
export const ENTITY_ACCOUNTS: EntityAccount[] = [
  ...ACCOUNT_SEEDS.flatMap((seed) => {
    const person = PEOPLE.find((p) => p.id === seed.personId);
    if (!person || person.ministryId !== FOCUS.ministryId) return [];
    return [
      {
        id: `ea-${seed.personId.replace(/^p-/, "")}`,
        personId: person.id,
        name: person.name,
        email: emailFor(person.name),
        jobRole: person.role,
        departmentId: person.departmentId,
        cohortId: person.cohortId,
        platformRole: seed.platformRole,
        status: "Active" as const,
        lastActive: person.lastActive,
        profileCompletion: seed.profileCompletion,
        missingProfileFields: seed.missingProfileFields,
        consent: seed.consent,
      },
    ];
  }),
  ...ADMIN_ACCOUNTS,
];

/** Job roles offered when an admin assigns or invites someone. */
export const JOB_ROLE_OPTIONS = [
  "Communications Officer",
  "Content Producer",
  "Customer Happiness Officer",
  "Data Analyst",
  "Clinical Operations Lead",
  "Licensing Officer",
  "HR Coordinator",
  "Programme Officer",
  "Policy Analyst",
  "Procurement Officer",
];

/** Pathways the entity can assign to a cohort. */
export const PATHWAY_OPTIONS = [
  "Strategic AI Leadership",
  "AI-Enhanced Service Delivery",
  "Predictive Analytics Mastery",
  "Workforce AI Workflows",
  "Applied Agentic AI for Communications",
  "Applied AI for Clinical Support",
  "AI for Population Health",
  "AI in Policy & Regulation",
  "Agentic AI Product Delivery",
  "AI Foundations for Operations",
];

// ---------------------------------------------------------------------------
// Content catalogue
// ---------------------------------------------------------------------------

/**
 * Publishing metadata for the shared catalogue items, keyed by content id.
 * The title, type, competency, language and version come from the federal seed.
 */
export const CONTENT_META: Record<
  string,
  {
    programme: string;
    pathway: string;
    audience: string;
    durationMins: number;
    summary: string;
    history: ContentRecord["history"];
  }
> = {
  ct1: {
    programme: "Federal AI Core",
    pathway: "AI Foundations for Operations",
    audience: "All employees",
    durationMins: 240,
    summary: "The shared vocabulary and judgement every federal employee needs before using AI on real work.",
    history: [
      { version: "v3.1", on: "4 June 2026", by: "FAHR Programme Team", note: "Refreshed the failure-mode examples with 2026 federal cases." },
      { version: "v3.0", on: "16 March 2026", by: "FAHR Programme Team", note: "Rebuilt around the five-competency framework." },
      { version: "v2.2", on: "8 November 2025", by: "FAHR Programme Team", note: "Added the Arabic track." },
    ],
  },
  ct2: {
    programme: "Federal AI Core",
    pathway: "Applied Agentic AI for Communications",
    audience: "All employees",
    durationMins: 360,
    summary: "Structure, context and constraints applied to briefings, notices and bilingual communication.",
    history: [
      { version: "v2.4", on: "18 June 2026", by: "FAHR Programme Team", note: "Added the bilingual terminology exercise." },
      { version: "v2.3", on: "2 April 2026", by: "FAHR Programme Team", note: "Split the iteration lesson into two activities." },
    ],
  },
  ct3: {
    programme: "Governance & Assurance",
    pathway: "AI in Policy & Regulation",
    audience: "All employees",
    durationMins: 300,
    summary: "Federal policy, privacy and human-in-the-loop controls applied to every AI output.",
    history: [
      { version: "v2.0", on: "2 July 2026", by: "FAHR Governance Office", note: "Aligned with the July guardrail policy set." },
      { version: "v1.6", on: "11 May 2026", by: "FAHR Governance Office", note: "Added the classification check walkthrough." },
    ],
  },
  ct4: {
    programme: "Entity Applied AI",
    pathway: "Predictive Analytics Mastery",
    audience: "Data and analytics roles",
    durationMins: 45,
    summary: "A short clinic on turning service performance data into a decision with AI assistance.",
    history: [
      { version: "v1.2", on: "21 July 2026", by: "Digital Health", note: "Swapped in the clinic waiting-time dataset." },
      { version: "v1.0", on: "9 May 2026", by: "Digital Health", note: "First entity-authored microlearning." },
    ],
  },
  ct5: {
    programme: "Entity Applied AI",
    pathway: "Agentic AI Product Delivery",
    audience: "Practitioners and above",
    durationMins: 90,
    summary: "A guided simulation that builds a first multi-step assistant with human checkpoints.",
    history: [
      { version: "v1.0", on: "13 July 2026", by: "FAHR Programme Team", note: "Submitted for entity review before publishing." },
    ],
  },
  ct6: {
    programme: "Entity Applied AI",
    pathway: "Applied Agentic AI for Communications",
    audience: "Communications teams",
    durationMins: 30,
    summary: "How to bring stakeholders with you when an AI-assisted process changes their work.",
    history: [
      { version: "v1.1", on: "19 July 2026", by: "Comms & Public Awareness", note: "Added the objection-handling scenario." },
      { version: "v1.0", on: "3 June 2026", by: "Comms & Public Awareness", note: "Published for the Comms cohort." },
    ],
  },
  ct7: {
    programme: "Workplace Projects",
    pathway: "Unassigned",
    audience: "All employees",
    durationMins: 60,
    summary: "The brief template every workplace project is submitted against.",
    history: [
      { version: "v4.0", on: "17 June 2026", by: "FAHR Programme Team", note: "Added the impact-evidence section." },
    ],
  },
  ct8: {
    programme: "Governance & Assurance",
    pathway: "AI in Policy & Regulation",
    audience: "Department managers",
    durationMins: 120,
    summary: "A live clinic on running a human-in-the-loop review that stands up to audit.",
    history: [
      { version: "v1.0", on: "22 July 2026", by: "FAHR Governance Office", note: "Scheduled for the September governance window." },
    ],
  },
};

/** Programmes an item can be filed under. */
export const CONTENT_PROGRAMMES = [
  "Federal AI Core",
  "Entity Applied AI",
  "Governance & Assurance",
  "Workplace Projects",
];

export const CONTENT_AUDIENCES = [
  "All employees",
  "Department managers",
  "Practitioners and above",
  "Communications teams",
  "Data and analytics roles",
  "Clinical teams",
];

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Enrichment for the entity's sessions in the shared federal seed. */
export const EVENT_META: Record<
  string,
  { summary: string; facilitator: string; location: string; audienceLabel: string; competencyId?: string; format?: EventFormat }
> = {
  ev2: {
    summary:
      "A working clinic: every participant brings a live notice or awareness post and leaves with it rewritten as a reusable structured brief.",
    facilitator: "Mariam Al Zaabi",
    location: "Microsoft Teams",
    audienceLabel: "Comms & Marketing Batch 1",
    competencyId: "prompting",
    format: "Instructor-led session",
  },
  ev4: {
    summary:
      "Hands-on lab building a clinical support assistant against real standard operating procedures, with the governance checks applied as you go.",
    facilitator: "Dr. Hessa Al Nuaimi",
    location: "Digital Health Lab, Dubai + Teams",
    audienceLabel: "Clinical Operations Wave 1",
    competencyId: "agentic",
    format: "Hybrid",
  },
  ev6: {
    summary:
      "Webinar for every department manager in the entity on reading a capability profile and signing off a workplace project.",
    facilitator: "Noura Al Kaabi",
    location: "Microsoft Teams",
    audienceLabel: "All department managers",
    competencyId: "governance",
    format: "Webinar",
  },
  ev7: {
    summary:
      "Induction for the Customer Happiness cohort: what the pathway asks of them, how the Learning Agent works and what the workplace project involves.",
    facilitator: "Saeed Al Balushi",
    location: "Microsoft Teams",
    audienceLabel: "Customer Happiness Agents",
    competencyId: "literacy",
    format: "Instructor-led session",
  },
  ev8: {
    summary:
      "Closing session for the HR Automation Team: what each project delivered, and what the entity does with it next.",
    facilitator: "Fatima Al Zaabi",
    location: "MOHAP Head Office, Abu Dhabi",
    audienceLabel: "HR Automation Team",
    competencyId: "agentic",
    format: "In person",
  },
};

/**
 * Attendance for sessions that have already run, as a share of registrations.
 * Anything not listed has not happened yet, so it has registrations only.
 */
export const EVENT_ATTENDANCE_RATE: Record<string, number> = {
  ev8: 0.86,
};

// ---------------------------------------------------------------------------
// Communications
// ---------------------------------------------------------------------------

/** Announcements and reminders the entity has already sent. */
export const ENTITY_COMMUNICATIONS: Communication[] = [
  {
    id: "cm1",
    kind: "Announcement",
    subject: "Comms & Marketing Batch 1: workplace project briefs due 6 August",
    body:
      "Your workplace project brief is due to your department manager by 6 August. Use the template on the Workplace Project screen and bring questions to the prompt craft clinic on 27 August.",
    audienceKind: "cohort",
    audienceId: "mohap-c5",
    audienceLabel: "Comms & Marketing Batch 1",
    recipients: 115,
    channel: "In-platform and email",
    status: "Sent",
    sentOn: "24 July 2026",
    openRate: 78,
    by: ENTITY_ADMIN,
  },
  {
    id: "cm2",
    kind: "Announcement",
    subject: "Clinical Operations Wave 2 starts 13 July",
    body:
      "Onboarding opens on 13 July. Complete your baseline assessment before the first session so your pathway is ready on day one.",
    audienceKind: "cohort",
    audienceId: "mohap-c7",
    audienceLabel: "Clinical Operations Wave 2",
    recipients: 620,
    channel: "In-platform and email",
    status: "Sent",
    sentOn: "6 July 2026",
    openRate: 64,
    by: ENTITY_ADMIN,
  },
  {
    id: "cm3",
    kind: "Reminder",
    subject: "Complete your baseline assessment",
    body:
      "You have not finished the baseline assessment yet. It takes eight questions and generates the pathway the rest of the programme runs on.",
    audienceKind: "status",
    audienceId: "at-risk",
    audienceLabel: "Learners flagged at risk",
    recipients: 38,
    channel: "In-platform and email",
    status: "Scheduled",
    scheduledFor: "3 August 2026",
    cadence: "Weekly until completed",
    by: ENTITY_ADMIN,
  },
  {
    id: "cm4",
    kind: "Announcement",
    subject: "Digital Health: two new microlearning items published",
    body:
      "Reading Service Data with AI and Stakeholder Alignment with AI are now in the catalogue for the Digital Health Innovators cohort.",
    audienceKind: "department",
    audienceId: "mohap-digital",
    audienceLabel: "Digital Health",
    recipients: 140,
    channel: "In-platform",
    status: "Sent",
    sentOn: "21 July 2026",
    openRate: 91,
    by: "Khalid Al Rashid",
  },
  {
    id: "cm5",
    kind: "Reminder",
    subject: "Department managers: two projects are waiting on your sign-off",
    body:
      "Your team has workplace projects awaiting a decision. Open Team Projects to sign off or return them with a note.",
    audienceKind: "role",
    audienceId: "Department Manager",
    audienceLabel: "All department managers",
    recipients: 24,
    channel: "Email",
    status: "Sent",
    sentOn: "23 July 2026",
    openRate: 83,
    by: ENTITY_ADMIN,
  },
];

/** Reminder cadences offered when scheduling one. */
export const REMINDER_CADENCES = [
  "Once",
  "Weekly until completed",
  "Fortnightly until the cohort closes",
  "Three days before the deadline",
];

/** Entity-authored events created outside the shared session list. */
export const ENTITY_ONLY_EVENTS: EntityEvent[] = [];
