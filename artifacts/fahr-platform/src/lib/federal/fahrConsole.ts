// The FAHR programme console's own slice of the federal spine.
//
// Everything here belongs to the central programme team: the integration
// estate, the federal role catalogue, the guardrail consequences, the policy
// version history, communications and the entity onboarding pipeline. It sits
// beside `seed.ts` rather than inside it so the cross-role model stays about
// people, projects and entities.
//
// Front-end mock data only. Session changes live in `@/lib/FahrConsoleContext`.

import { CAPABILITY_LEVELS } from "@/lib/constants";
import { COMPETENCIES } from "@/lib/learningData";

// ---------------------------------------------------------------------------
// Federal roles and the programme team
// ---------------------------------------------------------------------------

export type FederalRole = {
  id: string;
  label: string;
  /** What the role is for, in one line. */
  description: string;
  scope: "Federal" | "Entity" | "Department" | "Individual";
  permissions: string[];
};

/** The platform's role catalogue — the roles a federal user can be granted. */
export const FEDERAL_ROLES: FederalRole[] = [
  {
    id: "employee",
    label: "Federal Employee",
    description: "Learner on a personalised pathway, submitting workplace projects.",
    scope: "Individual",
    permissions: ["Own pathway and profile", "Submit workplace projects", "Own credentials"],
  },
  {
    id: "manager",
    label: "Department Manager",
    description: "Signs off the team's workplace projects and monitors their capability.",
    scope: "Department",
    permissions: ["Team dashboard", "Project sign-off", "Nudge via Learning Agent"],
  },
  {
    id: "content",
    label: "Content Author",
    description: "Authors and versions catalogue content for their entity.",
    scope: "Entity",
    permissions: ["Draft catalogue content", "Submit content for federal review"],
  },
  {
    id: "entity-admin",
    label: "Entity Admin",
    description: "Administers one entity: users, cohorts, endorsements and quota.",
    scope: "Entity",
    permissions: ["Entity users and cohorts", "Endorse projects", "Escalate to FAHR", "Entity reporting"],
  },
  {
    id: "fahr-team",
    label: "FAHR Programme Team",
    description: "Runs the federal programme across every entity.",
    scope: "Federal",
    permissions: [
      "All entities and users",
      "Framework and catalogue",
      "Quota allocation",
      "Escalation triage",
      "Federal reporting",
    ],
  },
  {
    id: "fahr-governance",
    label: "FAHR Governance Officer",
    description: "Owns the AI guardrails, audit trail and policy versions.",
    scope: "Federal",
    permissions: ["Guardrail configuration", "Audit trail", "Policy versions", "Integration credentials"],
  },
  {
    id: "leadership",
    label: "Federal Leadership",
    description: "Reads the national picture; takes no operational action.",
    scope: "Federal",
    permissions: ["National dashboards", "Leadership briefings"],
  },
];

export const ROLE_BY_LABEL: Record<string, FederalRole> = Object.fromEntries(
  FEDERAL_ROLES.map((role) => [role.label, role]),
);

/** Programme-team members escalations and campaigns can be assigned to. */
export const FAHR_STAFF = [
  { id: "hind", name: "Hind Al Owais", title: "Programme Lead" },
  { id: "sultan", name: "Sultan Al Rashdi", title: "Governance Officer" },
  { id: "maitha", name: "Maitha Al Suwaidi", title: "Capability Manager" },
  { id: "obaid", name: "Obaid Al Marri", title: "Integrations Engineer" },
  { id: "support", name: "FAHR Support Desk", title: "Learner support" },
] as const;

// ---------------------------------------------------------------------------
// Guardrail consequences and policy versions
// ---------------------------------------------------------------------------

export type GuardrailEffect = {
  /** Matches a `GovernancePolicy` id in `seed.ts`. */
  id: string;
  /** Platform behaviour while the guardrail is enforced. */
  whenOn: string;
  /** What changes on the platform the moment it is switched off. */
  whenOff: string;
  /** The surfaces the change is felt on. */
  surfaces: string[];
  /** Risk the audit entry is written at when the guardrail is switched off. */
  offRisk: "Medium" | "High";
};

export const GUARDRAIL_EFFECTS: GuardrailEffect[] = [
  {
    id: "humanInLoop",
    whenOn: "High-risk agent output is held for a named approver before it reaches a resident or a record.",
    whenOff: "High-risk agent output publishes straight through with no named approver.",
    surfaces: ["Workplace Project Evaluation", "AI Practice Partner", "Entity endorsement queue"],
    offRisk: "High",
  },
  {
    id: "auditTrail",
    whenOn: "Every agent action, decision and override is written to the immutable federal audit trail.",
    whenOff: "Agent actions stop being recorded — the audit trail below will no longer receive new entries.",
    surfaces: ["Federal audit trail", "Entity governance reports"],
    offRisk: "High",
  },
  {
    id: "preventPII",
    whenOn: "Prompts are screened and personal data is stripped before any model call.",
    whenOff: "Prompts reach models unscreened; personal data can leave the platform boundary.",
    surfaces: ["Learning Agent", "Coaching Agent", "Agentic AI Lab"],
    offRisk: "High",
  },
  {
    id: "dataResidency",
    whenOn: "Knowledge sources and embeddings are pinned to approved UAE infrastructure.",
    whenOff: "Embeddings may be processed outside the UAE, breaching the federal residency mandate.",
    surfaces: ["Content repositories", "Knowledge sources", "Digital twins"],
    offRisk: "High",
  },
  {
    id: "restrictPublicModels",
    whenOn: "Only models on the federal approved list can be reached from the platform.",
    whenOff: "Learners can route requests to unapproved public models.",
    surfaces: ["Agentic AI Lab", "AI Practice Partner"],
    offRisk: "Medium",
  },
  {
    id: "explainability",
    whenOn: "Each AI-assisted decision carries its reasoning and sources for the reviewer.",
    whenOff: "Reviewers see the recommendation without the reasoning behind it.",
    surfaces: ["Workplace Project Evaluation", "Capability Profile", "Entity reporting"],
    offRisk: "Medium",
  },
];

export const GUARDRAIL_EFFECT_BY_ID: Record<string, GuardrailEffect> = Object.fromEntries(
  GUARDRAIL_EFFECTS.map((effect) => [effect.id, effect]),
);

export type PolicyVersion = {
  id: string;
  /** Semantic-ish version of the federal AI policy set. */
  version: string;
  recordedOn: string;
  by: string;
  summary: string;
  /** Guardrail ids enforced in this version. */
  enabledIds: string[];
  note?: string;
};

/** The policy set's history before this session. */
export const POLICY_VERSIONS: PolicyVersion[] = [
  {
    id: "pv3",
    version: "v3.2",
    recordedOn: "2 July 2026",
    by: "Sultan Al Rashdi",
    summary: "Human-in-the-loop extended to every high-risk agent action.",
    enabledIds: [
      "humanInLoop",
      "auditTrail",
      "preventPII",
      "dataResidency",
      "restrictPublicModels",
      "explainability",
    ],
    note: "Approved by the FAHR Governance Board.",
  },
  {
    id: "pv2",
    version: "v3.1",
    recordedOn: "18 June 2026",
    by: "Sultan Al Rashdi",
    summary: "Personal-data screening and UAE residency enforcement switched on federally.",
    enabledIds: ["humanInLoop", "auditTrail", "preventPII", "dataResidency", "explainability"],
  },
  {
    id: "pv1",
    version: "v3.0",
    recordedOn: "11 May 2026",
    by: "Hind Al Owais",
    summary: "First federal guardrail set published with the platform rollout.",
    enabledIds: ["humanInLoop", "auditTrail", "explainability"],
  },
];

// ---------------------------------------------------------------------------
// Integration estate
// ---------------------------------------------------------------------------

export type IntegrationStatus = "Connected" | "Degraded" | "Not connected";

export type IntegrationCategory = "Identity" | "HR" | "Analytics" | "Productivity" | "Content" | "API";

export type Integration = {
  id: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  /** What the connection is for on this platform. */
  purpose: string;
  /** Proposal clause the integration answers. */
  reference: string;
  status: IntegrationStatus;
  lastSync: string;
  direction: "Inbound" | "Outbound" | "Bi-directional";
  /** Records moved on the last successful sync, where the connection moves records. */
  records?: number;
  owner: string;
  /** Fields or scopes exchanged, shown on the connection card. */
  dataPoints: string[];
  /** Note explaining a degraded or unconnected state. */
  statusNote?: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "uaepass",
    name: "UAE PASS",
    vendor: "Federal digital identity",
    category: "Identity",
    purpose: "National single sign-on for every federal employee entering the platform.",
    reference: "§7.3 Identity · TECH-02",
    status: "Connected",
    lastSync: "Today, 07:40",
    direction: "Inbound",
    records: 80000,
    owner: "Obaid Al Marri",
    dataPoints: ["Emirates ID reference", "Full name", "Entity", "Email"],
  },
  {
    id: "coursera",
    name: "Coursera",
    vendor: "Coursera for Government",
    category: "Content",
    purpose:
      "Brings Coursera courses into the federal content library so the Content Agent can draw on them when it generates a learner's pathway.",
    reference: "§4.8 Catalogue",
    status: "Connected",
    lastSync: "Today, 04:20",
    direction: "Inbound",
    records: 318,
    owner: "Maitha Al Suwaidi",
    dataPoints: ["Course title and summary", "Duration", "Level", "Competency tags", "Enrolment link"],
  },
];

export type ApiCredential = {
  id: string;
  label: string;
  /** Scopes the key can reach. */
  scopes: string[];
  /** Visible portion of the key; the secret itself is shown once on creation. */
  prefix: string;
  createdOn: string;
  lastUsed: string;
  status: "Active" | "Revoked";
  owner: string;
};

export const API_CREDENTIALS: ApiCredential[] = [
  {
    id: "key1",
    label: "Federal BI warehouse pull",
    scopes: ["reports:read", "entities:read"],
    prefix: "fahr_live_9f21",
    createdOn: "11 May 2026",
    lastUsed: "Yesterday, 22:10",
    status: "Active",
    owner: "Maitha Al Suwaidi",
  },
  {
    id: "key2",
    label: "Bayanati HR sync",
    scopes: ["users:read", "users:write", "credentials:write"],
    prefix: "fahr_live_3ad7",
    createdOn: "2 April 2026",
    lastUsed: "Today, 05:00",
    status: "Active",
    owner: "Hind Al Owais",
  },
  {
    id: "key3",
    label: "MoE pilot integration (retired)",
    scopes: ["users:read"],
    prefix: "fahr_live_77c0",
    createdOn: "14 January 2026",
    lastUsed: "3 June 2026",
    status: "Revoked",
    owner: "Obaid Al Marri",
  },
];

/** Scopes a new API credential can be granted. */
export const API_SCOPES = [
  "users:read",
  "users:write",
  "pathways:read",
  "credentials:read",
  "credentials:write",
  "reports:read",
  "entities:read",
] as const;

// ---------------------------------------------------------------------------
// Communications
// ---------------------------------------------------------------------------

export type AnnouncementChannel = "In-app" | "Email" | "Microsoft Teams";

export type AnnouncementKind = "Announcement" | "Campaign" | "Coach nudge";

export type AnnouncementAudience = {
  /** Empty means every entity. */
  entityIds: string[];
  /** Role labels from `FEDERAL_ROLES`; empty means every role. */
  roleLabels: string[];
  /** Capability level ids; empty means every level. */
  levelIds: string[];
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  channels: AnnouncementChannel[];
  audience: AnnouncementAudience;
  /** Recipients the audience resolved to when it was sent. */
  recipients: number;
  status: "Sent" | "Scheduled" | "Draft";
  sentOn: string;
  sentBy: string;
  /** Engagement, for sent items. */
  opened?: number;
  acted?: number;
};

export const EMPTY_AUDIENCE: AnnouncementAudience = { entityIds: [], roleLabels: [], levelIds: [] };

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "an1",
    title: "Q3 federal AI capability challenge is open",
    body: "Every entity can enter up to three workplace projects into the federal challenge. Entries close on 15 September 2026 and shortlisted projects present to the FAHR Governance Board.",
    kind: "Campaign",
    channels: ["In-app", "Email"],
    audience: { entityIds: [], roleLabels: ["Entity Admin", "Department Manager"], levelIds: [] },
    recipients: 1840,
    status: "Sent",
    sentOn: "21 July 2026",
    sentBy: "Hind Al Owais",
    opened: 1412,
    acted: 386,
  },
  {
    id: "an2",
    title: "Human-in-the-loop policy update — v3.2",
    body: "The federal guardrail set now requires a named approver for every high-risk agent action. Entity admins should brief their reviewers this week.",
    kind: "Announcement",
    channels: ["In-app", "Email", "Microsoft Teams"],
    audience: { entityIds: [], roleLabels: ["Entity Admin", "FAHR Governance Officer"], levelIds: [] },
    recipients: 46,
    status: "Sent",
    sentOn: "2 July 2026",
    sentBy: "Sultan Al Rashdi",
    opened: 44,
    acted: 31,
  },
  {
    id: "an3",
    title: "Agentic AI clinic — seats released for Health and Education",
    body: "Two additional Human-in-the-loop Review Clinics have been scheduled. Learners at Practitioner level and above can register from their pathway.",
    kind: "Announcement",
    channels: ["In-app"],
    audience: { entityIds: ["mohap", "moe"], roleLabels: ["Federal Employee"], levelIds: ["practitioner", "advanced"] },
    recipients: 6120,
    status: "Sent",
    sentOn: "18 July 2026",
    sentBy: "Maitha Al Suwaidi",
    opened: 3980,
    acted: 742,
  },
  {
    id: "an4",
    title: "National AI Week — entity readiness briefing pack",
    body: "The readiness briefing pack for National AI Week will be shared with every entity admin, with the reporting extract due back on 4 October.",
    kind: "Campaign",
    channels: ["Email"],
    audience: { entityIds: [], roleLabels: ["Entity Admin"], levelIds: [] },
    recipients: 14,
    status: "Scheduled",
    sentOn: "1 September 2026",
    sentBy: "Hind Al Owais",
  },
];

// ---------------------------------------------------------------------------
// Entity onboarding
// ---------------------------------------------------------------------------

export type OnboardingStageId = "details" | "admins" | "identity" | "pathways" | "live";

export const ONBOARDING_STAGES: { id: OnboardingStageId; label: string; description: string }[] = [
  { id: "details", label: "Entity details", description: "Name, sector and targeted workforce confirmed." },
  { id: "admins", label: "Entity admins", description: "At least one entity administrator invited." },
  { id: "identity", label: "Identity & HRIS", description: "UAE PASS federation and HR record sync switched on." },
  { id: "pathways", label: "Pathways & quota", description: "Baseline pathways assigned and a token quota allocated." },
  { id: "live", label: "Live on the programme", description: "Learners can sign in; figures join the next reporting cycle." },
];

export const ONBOARDING_STAGE_ORDER: OnboardingStageId[] = ONBOARDING_STAGES.map((stage) => stage.id);

export type EntityAdminInvite = { name: string; email: string };

export type EntityOnboarding = {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  /** Workforce the entity expects to put on the programme. */
  employees: number;
  admins: EntityAdminInvite[];
  stage: OnboardingStageId;
  requestedOn: string;
  /** Monthly AI token quota allocated for the entity's first period, in millions. */
  quotaM: number;
  note?: string;
};

/** Entities part-way through onboarding when the session starts. */
export const ENTITY_ONBOARDINGS: EntityOnboarding[] = [
  {
    id: "onb-space",
    name: "UAE Space Agency",
    shortName: "Space",
    sector: "Science & technology",
    employees: 640,
    admins: [{ name: "Reem Al Hashimi", email: "reem.alhashimi@space.gov.ae" }],
    stage: "identity",
    requestedOn: "14 July 2026",
    quotaM: 1.2,
    note: "UAE PASS federation requested; HR extract expected this week.",
  },
  {
    id: "onb-stats",
    name: "Federal Competitiveness and Statistics Centre",
    shortName: "Statistics",
    sector: "Government data",
    employees: 410,
    admins: [],
    stage: "details",
    requestedOn: "22 July 2026",
    quotaM: 0.8,
  },
];

export const ENTITY_SECTORS = [
  "Health & social care",
  "Education",
  "Economy & finance",
  "Infrastructure & energy",
  "Interior & justice",
  "Culture & community",
  "Science & technology",
  "Government data",
] as const;

// ---------------------------------------------------------------------------
// Competency framework: capability expectations and personalisation rules
// ---------------------------------------------------------------------------

/**
 * What each competency looks like at each rung of the capability ladder. This
 * is the mapping the Capability Agent scores an assessment against, so it is
 * authored once here and read by both the framework screen and the
 * personalisation explainer.
 */
export const COMPETENCY_EXPECTATIONS: Record<string, Record<string, string>> = {
  literacy: {
    aware: "Can describe what generative and agentic AI are, and name two federal use cases.",
    emerging: "Recognises where AI helps and where it must not be used on their own work.",
    practitioner: "Explains model limits, hallucination and bias to a colleague using service examples.",
    advanced: "Advises their department on which problems are worth an AI approach.",
    champion: "Sets the entity's position on responsible AI adoption and briefs leadership.",
  },
  prompting: {
    aware: "Writes a simple instruction and recognises when the output is unusable.",
    emerging: "Uses role, context and format in a prompt with a template to hand.",
    practitioner: "Builds reusable prompts for a recurring task and iterates on the output.",
    advanced: "Designs prompt libraries and reviews colleagues' prompts for reliability.",
    champion: "Owns the entity's prompt standards, including Arabic-language quality.",
  },
  analytics: {
    aware: "Reads an AI-generated summary of service data and identifies the headline.",
    emerging: "Asks an assistant for a breakdown and checks it against the source figure.",
    practitioner: "Turns service or campaign data into a decision, with the assumption stated.",
    advanced: "Builds recurring analysis with an assistant and validates the method.",
    champion: "Sets the entity's measurement approach for AI-assisted analysis.",
  },
  agentic: {
    aware: "Explains what an AI agent does differently from a chatbot.",
    emerging: "Runs a supplied agentic workflow and reports where it broke.",
    practitioner: "Builds a two-or-three-step workflow that carries real work forward.",
    advanced: "Designs multi-agent workflows with hand-offs and failure handling.",
    champion: "Governs the entity's agent estate and its human-approval points.",
  },
  governance: {
    aware: "Knows the federal guardrails apply to their own AI use.",
    emerging: "Applies the personal-data rule and asks before connecting a data source.",
    practitioner: "Runs the human-in-the-loop check and records the decision.",
    advanced: "Reviews colleagues' AI outputs against federal policy before release.",
    champion: "Represents the entity in federal governance and signs off exceptions.",
  },
};

/**
 * How a capability gap becomes assigned learning. The Capability Agent reads
 * these rules, so the framework screen can show the exact chain from an
 * assessment score to the content a learner is given.
 */
export type PersonalisationRule = {
  competencyId: string;
  /** Score at or below which the competency is treated as a development priority. */
  gapAtOrBelow: number;
  /** Catalogue items assigned, in order, when the rule fires. */
  contentIds: string[];
  /** Workplace project brief the pathway ends on. */
  projectBrief: string;
};

export const PERSONALISATION_RULES: PersonalisationRule[] = [
  {
    competencyId: "literacy",
    gapAtOrBelow: 55,
    contentIds: ["ct1", "ct4"],
    projectBrief: "Document one service task an assistant could take over, with the risks named.",
  },
  {
    competencyId: "prompting",
    gapAtOrBelow: 60,
    contentIds: ["ct2", "ct6"],
    projectBrief: "Build a reusable prompt set for a recurring communication task.",
  },
  {
    competencyId: "analytics",
    gapAtOrBelow: 60,
    contentIds: ["ct4", "ct2"],
    projectBrief: "Turn one month of service data into a decision memo with an assistant.",
  },
  {
    competencyId: "agentic",
    gapAtOrBelow: 65,
    contentIds: ["ct5", "ct7"],
    projectBrief: "Ship a two-step agentic workflow with a human approval point.",
  },
  {
    competencyId: "governance",
    gapAtOrBelow: 65,
    contentIds: ["ct3", "ct8"],
    projectBrief: "Run a human-in-the-loop review clinic for your own department.",
  },
];

export const PERSONALISATION_RULE_BY_COMPETENCY: Record<string, PersonalisationRule> = Object.fromEntries(
  PERSONALISATION_RULES.map((rule) => [rule.competencyId, rule]),
);

/** Framework version shown on the framework screen and in report headers. */
export const FRAMEWORK_VERSION = {
  version: "v2.3",
  approvedOn: "2 July 2026",
  owner: "FAHR Capability Office",
  competencies: COMPETENCIES.length,
  levels: CAPABILITY_LEVELS.length,
} as const;

/** A publish, review or version decision taken on a catalogue item. */
export type CatalogueRevision = {
  id: string;
  contentId: string;
  contentTitle: string;
  version: string;
  status: "Published" | "In review" | "Draft" | "Scheduled";
  on: string;
  by: string;
  note?: string;
};

/** Catalogue history before this session. */
export const CATALOGUE_REVISIONS: CatalogueRevision[] = [
  {
    id: "rev1",
    contentId: "ct3",
    contentTitle: "AI Governance & Data Ethics in Federal Work",
    version: "v2.0",
    status: "Published",
    on: "2 July 2026",
    by: "Sultan Al Rashdi",
    note: "Rewritten against guardrail policy v3.2.",
  },
  {
    id: "rev2",
    contentId: "ct5",
    contentTitle: "Designing Your First Agentic Workflow",
    version: "v1.0",
    status: "In review",
    on: "13 July 2026",
    by: "Maitha Al Suwaidi",
    note: "Awaiting governance review of the simulation's tool access.",
  },
  {
    id: "rev3",
    contentId: "ct4",
    contentTitle: "Reading Service Data with AI",
    version: "v1.2",
    status: "Published",
    on: "21 July 2026",
    by: "Digital Health",
    note: "Refreshed datasets for the Q3 cohort.",
  },
];

// ---------------------------------------------------------------------------
// Reporting suite
// ---------------------------------------------------------------------------

export type ReportTypeId = "engagement" | "competency" | "assessment" | "certification" | "impact";

export type ReportType = {
  id: ReportTypeId;
  label: string;
  description: string;
  /** Proposal clause the report answers. */
  reference: string;
  /** Column set, for the export header and the report description. */
  measures: string[];
};

export const REPORT_TYPES: ReportType[] = [
  {
    id: "engagement",
    label: "Engagement",
    description: "Who is learning, how much of the workforce is covered and how active they are.",
    reference: "FR-04 · §4.9",
    measures: ["Targeted workforce", "Active learners", "Coverage", "Learning hours", "Pathway completion"],
  },
  {
    id: "competency",
    label: "Competency development",
    description: "Movement along the capability ladder and where the national gaps are.",
    reference: "FR-04 · §4.4",
    measures: ["Average capability", "Learners in development", "Entities reporting gap", "Trend"],
  },
  {
    id: "assessment",
    label: "Assessment outcomes",
    description: "Baseline and re-assessment results, and how many reach Practitioner.",
    reference: "FR-04 · §4.6",
    measures: ["Assessments completed", "Average baseline", "At Practitioner or above", "Re-assessments"],
  },
  {
    id: "certification",
    label: "Certification",
    description: "Credentials issued nationally, by entity and capability level.",
    reference: "FR-04 · §4.6",
    measures: ["Credentials issued", "Advanced", "Champion", "Issued this period"],
  },
  {
    id: "impact",
    label: "Project impact",
    description: "Workplace projects delivered and the value and hours they returned.",
    reference: "FR-04 · §4.5",
    measures: ["Projects submitted", "Deployed", "Hours saved / month", "Est. value (AED M)"],
  },
];

export type ReportPeriod = {
  id: string;
  label: string;
  /**
   * Share of the rolling-twelve-month figures that falls in this period. The
   * annual figures are the authored ones, so every period view is derived from
   * them rather than invented separately.
   */
  share: number;
};

export const REPORT_PERIODS: ReportPeriod[] = [
  { id: "q1-2026", label: "Q1 2026", share: 0.18 },
  { id: "q2-2026", label: "Q2 2026", share: 0.24 },
  { id: "q3-2026", label: "Q3 2026 (to date)", share: 0.19 },
  { id: "ytd-2026", label: "Year to date 2026", share: 0.61 },
  { id: "rolling-12", label: "Rolling 12 months", share: 1 },
];

export const REPORT_PERIOD_BY_ID: Record<string, ReportPeriod> = Object.fromEntries(
  REPORT_PERIODS.map((period) => [period.id, period]),
);

/** Default period the reporting suite opens on. */
export const DEFAULT_REPORT_PERIOD = "rolling-12";
