// Account identities behind the sidebar profile block and the profile screen.
//
// Every portal is played by a different federal employee, so the demo never
// shows the learner's details in the manager, entity, FAHR or leadership shell.
// Names, emails and entities are the same ones the roster and platform-user
// tables already use — a person cannot be introduced here under a new name.

import { LEARNER_PROFILE } from "@/lib/constants";

export type PortalRole = "learner" | "manager" | "ministry" | "fahr" | "leadership";

export type AccountProfile = {
  /** Display name in the sidebar block and profile header. */
  name: string;
  nameAr: string;
  /** Government email — also the sign-in identity in the mockup. */
  email: string;
  /** Job title, not the portal name. */
  jobTitle: string;
  entity: string;
  department: string;
  seniority: string;
  employeeId: string;
  /** Who they answer to inside the programme, in plain words. */
  reportsTo: string;
  /** Static, authored date — never derived from the clock, so it cannot drift. */
  joinedOn: string;
  /** Optional portrait; falls back to initials when absent. */
  avatar?: string;
  /** What this portal lets them do, for the access card. */
  access: string[];
  /** Notification defaults, so each role's preferences read differently. */
  notifications: {
    announcements: boolean;
    digest: boolean;
    reminders: boolean;
  };
};

export const ACCOUNT_PROFILES: Record<PortalRole, AccountProfile> = {
  learner: {
    name: LEARNER_PROFILE.name,
    nameAr: LEARNER_PROFILE.nameAr,
    email: "aisha.almansoori@mohap.gov.ae",
    jobTitle: LEARNER_PROFILE.role,
    entity: LEARNER_PROFILE.entity,
    department: LEARNER_PROFILE.department,
    seniority: "Specialist · Grade 9",
    employeeId: "MOHAP-24118",
    reportsTo: "Mariam Al Zaabi · Director of Communications & Public Awareness",
    joinedOn: "4 May 2026",
    avatar: LEARNER_PROFILE.avatar,
    access: [
      "Personalised learning pathway and course player",
      "Agentic AI Lab — digital twin and workplace project",
      "Evaluation, certification and recognition",
    ],
    notifications: { announcements: true, digest: true, reminders: true },
  },
  manager: {
    name: "Mariam Al Zaabi",
    nameAr: "مريم الزعابي",
    email: "mariam.alzaabi@mohap.gov.ae",
    jobTitle: "Director of Communications & Public Awareness",
    entity: "Ministry of Health and Prevention",
    department: "Comms & Public Awareness",
    seniority: "Director · Grade 14",
    employeeId: "MOHAP-10442",
    reportsTo: "Noura Al Kaabi · Entity Admin, Ministry of Health and Prevention",
    joinedOn: "19 January 2026",
    access: [
      "Team capability dashboard and gap heatmap",
      "Workplace project validation and endorsement",
      "Team reports, recognition and impact",
    ],
    notifications: { announcements: true, digest: true, reminders: false },
  },
  ministry: {
    name: "Noura Al Kaabi",
    nameAr: "نورة الكعبي",
    email: "noura.alkaabi@mohap.gov.ae",
    jobTitle: "Head of Learning & Capability Development",
    entity: "Ministry of Health and Prevention",
    department: "HR & Training",
    seniority: "Head of Department · Grade 15",
    employeeId: "MOHAP-10037",
    reportsTo: "Undersecretary for Support Services · Ministry of Health and Prevention",
    joinedOn: "12 January 2026",
    access: [
      "Entity users, access and cohort administration",
      "Approvals, content library and communications",
      "Entity reporting for all 3,940 active learners",
    ],
    notifications: { announcements: true, digest: true, reminders: true },
  },
  fahr: {
    name: "Hind Al Owais",
    nameAr: "هند العويس",
    email: "hind.alowais@fahr.gov.ae",
    jobTitle: "Federal Programme Lead — AI Capability",
    entity: "Federal Authority for Government Human Resources",
    department: "Capability & Future Skills",
    seniority: "Programme Lead · Grade 16",
    employeeId: "FAHR-2041",
    reportsTo: "Director General · Federal Authority for Government Human Resources",
    joinedOn: "8 September 2025",
    access: [
      "All 14 federal entities, users and framework governance",
      "Escalations, credential registry and integrations",
      "Federal reporting and programme communications",
    ],
    notifications: { announcements: true, digest: true, reminders: true },
  },
  leadership: {
    name: "Fahad Al Zeyoudi",
    nameAr: "فهد الزيودي",
    email: "fahad.alzeyoudi@fahr.gov.ae",
    jobTitle: "Undersecretary — Federal Human Capital",
    entity: "Federal Authority for Government Human Resources",
    department: "Office of the Undersecretary",
    seniority: "Undersecretary",
    employeeId: "FAHR-1008",
    reportsTo: "Federal Government Human Capital Council",
    joinedOn: "8 September 2025",
    access: [
      "National capability overview across all federal entities",
      "Ministry comparison, outcomes and value realised",
      "Quarterly leadership briefings",
    ],
    notifications: { announcements: true, digest: false, reminders: false },
  },
};

/** Where each portal's profile screen lives. */
export const PROFILE_ROUTES: Record<PortalRole, string> = {
  // The learner's `/learner/profile` is the capability profile, so the account
  // screen sits alongside it rather than replacing it.
  learner: "/learner/account",
  manager: "/manager/profile",
  ministry: "/ministry/profile",
  fahr: "/fahr/profile",
  leadership: "/leadership/profile",
};

/** Two-letter monogram used when a role has no portrait. */
export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
