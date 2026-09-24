// Types for the entity (Ministry) admin console.
//
// The console reads the federal spine (`src/lib/federal`) for anything that
// other roles also see — ministries, departments, cohorts, people, submissions.
// These types cover the administration layer that only the entity admin needs:
// accounts and consent, content publishing state, event administration and
// communications history.
//
// Front-end mock model only — no backend.

import type { ContentItem, LearnerStatus } from "@/lib/federal/model";

/** Platform roles an entity admin can grant inside their own entity. */
export type PlatformRole =
  | "Federal Employee"
  | "Department Manager"
  | "Content Author"
  | "Reporting Viewer"
  | "Entity Admin";

export const PLATFORM_ROLES: PlatformRole[] = [
  "Federal Employee",
  "Department Manager",
  "Content Author",
  "Reporting Viewer",
  "Entity Admin",
];

/** Data-processing consent state tracked per account (§4.2). */
export type ConsentState = "Granted" | "Pending" | "Withdrawn";

export type AccountStatus = "Active" | "Invited" | "Suspended";

export type EntityAccount = {
  id: string;
  /** Links the account to the federal roster when the person is a learner. */
  personId?: string;
  name: string;
  email: string;
  jobRole: string;
  departmentId?: string;
  cohortId?: string;
  platformRole: PlatformRole;
  status: AccountStatus;
  lastActive: string;
  /** Profile completeness, 0-100. */
  profileCompletion: number;
  /** Fields the person still has to supply, named so the admin can chase them. */
  missingProfileFields: string[];
  consent: ConsentState;
  invitedOn?: string;
  /** True for accounts created during this session. */
  createdInSession?: boolean;
};

/** Per-account changes an admin makes during the session. */
export type AccountOverride = {
  departmentId?: string;
  cohortId?: string;
  jobRole?: string;
  platformRole?: PlatformRole;
  status?: AccountStatus;
  consent?: ConsentState;
};

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------

export type AssessmentOutcome = "Passed" | "Awaiting assessment" | "Retake needed";

export type CertificationState = "Certified" | "Ready to certify" | "In progress" | "Not started";

export type CohortMember = {
  id: string;
  name: string;
  role: string;
  departmentId?: string;
  levelId: string;
  pathwayProgress: number;
  assessmentScore: number;
  assessmentOutcome: AssessmentOutcome;
  certification: CertificationState;
  lastActive: string;
  status: LearnerStatus;
  /** True when the member is part of the generated roster rather than authored. */
  synthetic?: boolean;
};

/** Cohort fields an admin can change after creation. */
export type CohortOverride = {
  status?: import("@/lib/federal/model").CohortStatus;
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type ContentStatus = "Draft" | "In review" | "Scheduled" | "Published" | "Retired";

export const CONTENT_STATUSES: ContentStatus[] = [
  "Draft",
  "In review",
  "Scheduled",
  "Published",
  "Retired",
];

export type ContentVersionEntry = {
  version: string;
  on: string;
  by: string;
  note: string;
};

export type ContentRecord = {
  id: string;
  title: string;
  type: ContentItem["type"];
  /** Programme the item belongs to (§4.4 categorisation). */
  programme: string;
  competencyId: string;
  /** Who it is written for. */
  audience: string;
  language: ContentItem["language"];
  version: string;
  status: ContentStatus;
  updatedOn: string;
  owner: string;
  durationMins: number;
  summary: string;
  history: ContentVersionEntry[];
  createdInSession?: boolean;
};

export type ContentOverride = {
  status?: ContentStatus;
  version?: string;
  updatedOn?: string;
  pathway?: string;
  history?: ContentVersionEntry[];
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type EventFormat = "Instructor-led session" | "Webinar" | "In person" | "Hybrid";

export const EVENT_FORMATS: EventFormat[] = [
  "Instructor-led session",
  "Webinar",
  "In person",
  "Hybrid",
];

export type EventStatus = "Open" | "Full" | "Cancelled" | "Completed";

export type EntityEvent = {
  id: string;
  title: string;
  summary: string;
  format: EventFormat;
  facilitator: string;
  /** Written the way every other date in the demo is written. */
  date: string;
  time: string;
  location: string;
  seats: number;
  registered: number;
  /** Cohort, department or entity-wide targeting. */
  audienceLabel: string;
  competencyId?: string;
  status: EventStatus;
  createdInSession?: boolean;
};

export type EventOverride = {
  status?: EventStatus;
  date?: string;
  time?: string;
  seats?: number;
  facilitator?: string;
  /** Reason captured when an event is cancelled or moved. */
  note?: string;
};

export type EventRegistration = {
  id: string;
  name: string;
  departmentLabel: string;
  registeredOn: string;
  /** Undefined until the session has run. */
  attended?: boolean;
};

// ---------------------------------------------------------------------------
// Communications
// ---------------------------------------------------------------------------

export type CommunicationKind = "Announcement" | "Reminder";

export type CommunicationChannel = "In-platform" | "Email" | "In-platform and email";

export const COMMUNICATION_CHANNELS: CommunicationChannel[] = [
  "In-platform",
  "Email",
  "In-platform and email",
];

export type AudienceKind = "entity" | "cohort" | "department" | "status" | "role";

export type Communication = {
  id: string;
  kind: CommunicationKind;
  subject: string;
  body: string;
  audienceKind: AudienceKind;
  /** Cohort id, department id, learner status or role label. */
  audienceId?: string;
  audienceLabel: string;
  recipients: number;
  channel: CommunicationChannel;
  status: "Sent" | "Scheduled";
  sentOn?: string;
  scheduledFor?: string;
  /** Reminder repeat, e.g. "Weekly until the cohort closes". */
  cadence?: string;
  /** Share of recipients who opened it, for sent items. */
  openRate?: number;
  by: string;
  createdInSession?: boolean;
};
