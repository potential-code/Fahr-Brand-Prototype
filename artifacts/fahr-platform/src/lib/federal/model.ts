// Shared federal programme model — the one data spine every non-learner screen
// reads from. Front-end mock data only; no backend.
//
// The rule that keeps the four role consoles honest: a figure is authored in
// exactly one place, and everything coarser or finer is *derived* from it.
// Ministry headline numbers are authored; department rows are generated from
// them (so they always sum back); federal totals are summed from ministries.

export type Risk = "Low" | "Medium" | "High";

export type LearnerStatus = "excelling" | "on-track" | "needs-attention" | "at-risk";

export type Ministry = {
  id: string;
  /** Full entity name as it appears on federal screens. */
  name: string;
  /** Short label for charts and table columns. */
  shortName: string;
  employees: number;
  activeLearners: number;
  /** AI readiness index, 0-100. */
  readiness: number;
  twins: number;
  projectsSubmitted: number;
  /** Estimated annual value created, in millions of AED. */
  valueCreatedAedM: number;
  hoursSavedPerMonth: number;
  credentialsIssued: number;
  /** Biggest capability gap — a competency id from the framework. */
  topGapCompetencyId: string;
  entityAdmin: string;
  /** AI token consumption for the current period, in millions. */
  tokensUsedM: number;
  tokenQuotaM: number;
};

export type Department = {
  id: string;
  ministryId: string;
  name: string;
  employees: number;
  activeLearners: number;
  readiness: number;
  twins: number;
  projects: number;
  hoursSavedPerMonth: number;
  risk: Risk;
};

export type CohortStatus = "Planning" | "Onboarding" | "Active" | "Completed";

export type Cohort = {
  id: string;
  ministryId: string;
  departmentId?: string;
  name: string;
  status: CohortStatus;
  learners: number;
  /** Baseline completion percentage; recomputed where member records exist. */
  progress: number;
  startsOn: string;
};

export type Person = {
  id: string;
  name: string;
  role: string;
  ministryId: string;
  departmentId: string;
  cohortId?: string;
  /** Department manager, when the person is a direct report. */
  managerId?: string;
  isManager?: boolean;
  /** Capability ladder id from `constants.ts`. */
  levelId: string;
  /** Learning pathway completion, 0-100. */
  pathwayProgress: number;
  /** Latest baseline assessment result, 0-100. */
  assessmentScore: number;
  lastActive: string;
  status: LearnerStatus;
  /** competencyId -> 0-100, when the person has been assessed in detail. */
  competencyScores?: Record<string, number>;
  /** Development priorities, as competency ids. */
  gapCompetencyIds?: string[];
  /**
   * True for the person the demo is played as — her figures are replaced with
   * live learner-journey state rather than read from the seed.
   */
  live?: boolean;
};

/**
 * Where a workplace project sits in the Manager -> Entity -> FAHR chain.
 * `awaiting_manager` is the manager's sign-off queue, `awaiting_entity` the
 * entity endorsement queue, `escalated` the FAHR queue.
 */
export type SubmissionState =
  | "awaiting_manager"
  | "revision_requested"
  | "awaiting_entity"
  | "endorsed"
  | "escalated"
  | "deployed";

export type SubmissionImpact = "High" | "Medium" | "Low";

export type TimelineEntry = { date: string; event: string };

export type Submission = {
  id: string;
  title: string;
  personId: string;
  ministryId: string;
  departmentId: string;
  cohortId?: string;
  state: SubmissionState;
  impact: SubmissionImpact;
  governanceStatus: "Compliant" | "Needs Review" | "Blocked";
  /** Person currently accountable for the next decision, if any. */
  reviewer?: string;
  description: string;
  metrics: string;
  estimatedValueAed: number;
  hoursSavedPerMonth: number;
  competencyIds: string[];
  submittedOn: string;
  timeline: TimelineEntry[];
};

export type ApprovalDecision =
  | "signed_off"
  | "revision_requested"
  | "endorsed"
  | "escalated"
  | "credential_issued";

export type ApprovalRecord = {
  id: string;
  submissionId: string;
  /** Role that took the decision. */
  role: "manager" | "ministry" | "fahr";
  decision: ApprovalDecision;
  by: string;
  on: string;
  note?: string;
};

export type AuditRisk = "Low" | "Medium" | "High";

export type AuditEvent = {
  id: string;
  /** Human-readable relative or absolute time, as shown in the audit trail. */
  time: string;
  actor: string;
  /** Named agent from `constants.ts`, or "Human decision" / "System". */
  agent: string;
  action: string;
  risk: AuditRisk;
  status: string;
  ministryId?: string;
};

export type ScheduledSession = {
  id: string;
  title: string;
  mode: "Virtual" | "In person" | "Hybrid";
  date: string;
  time: string;
  host: string;
  ministryId?: string;
  seats: number;
  registered: number;
  status: "Open" | "Full" | "Closed" | "Completed";
};

export type ContentItem = {
  id: string;
  title: string;
  type: "Course" | "Microlearning" | "Simulation" | "Assignment" | "Virtual session";
  competencyId: string;
  language: "English" | "Arabic" | "Bilingual";
  version: string;
  status: "Published" | "In review" | "Draft" | "Scheduled";
  updatedOn: string;
  owner: string;
};

export type Credential = {
  id: string;
  personId: string;
  personName: string;
  title: string;
  levelId: string;
  issuedOn: string;
  ministryId: string;
  submissionId?: string;
  verificationCode: string;
};

export type EscalationStatus = "Open" | "In progress" | "Resolved";

export type Escalation = {
  id: string;
  ministryId: string;
  subject: string;
  kind: "Approval" | "Quota" | "Policy" | "Support";
  raisedOn: string;
  raisedBy: string;
  status: EscalationStatus;
  detail: string;
  submissionId?: string;
  /** FAHR programme-team member the item is triaged to. */
  assignee?: string;
  priority?: "Standard" | "High";
  /** How the federal team closed the item. */
  resolution?: string;
  resolvedOn?: string;
  /** Token quota, in millions, an entity is asking for. */
  requestedQuotaM?: number;
  /** Person the item was raised on behalf of, for support escalations. */
  personId?: string;
};

export type GovernancePolicy = {
  id: string;
  label: string;
  description: string;
  /** Whether the guardrail is switched on across the federal platform. */
  enabled: boolean;
  scope: "Federal" | "Entity";
  lastReviewed: string;
  owner: string;
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  ministryId?: string;
  departmentId?: string;
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};

// ---------------------------------------------------------------------------
// Distribution helpers — how department rows are generated from a ministry's
// authored headline figures so the two can never disagree.
// ---------------------------------------------------------------------------

/**
 * Splits `total` across `weights` as integers that sum to exactly `total`
 * (largest-remainder method).
 */
export function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || weights.length === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let remaining = total - out.reduce((a, b) => a + b, 0);
  const byFraction = raw
    .map((v, i) => ({ i, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction);
  let k = 0;
  while (remaining > 0 && byFraction.length > 0) {
    out[byFraction[k % byFraction.length].i] += 1;
    remaining -= 1;
    k += 1;
  }
  return out;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Turns per-department readiness *offsets* into absolute scores whose
 * employee-weighted mean rounds back to the ministry's authored readiness.
 */
export function normaliseReadiness(target: number, employees: number[], offsets: number[]): number[] {
  const totalEmployees = employees.reduce((a, b) => a + b, 0);
  if (totalEmployees === 0) return offsets.map(() => target);
  const meanOffset = offsets.reduce((sum, o, i) => sum + o * employees[i], 0) / totalEmployees;
  const values = offsets.map((o) => clamp(Math.round(target + o - meanOffset), 5, 99));
  const largest = employees.indexOf(Math.max(...employees));
  for (let guard = 0; guard < 60; guard += 1) {
    const mean = values.reduce((sum, v, i) => sum + v * employees[i], 0) / totalEmployees;
    if (Math.round(mean) === target) break;
    values[largest] = clamp(values[largest] + (mean < target ? 1 : -1), 5, 99);
  }
  return values;
}

/** Risk banding used everywhere a department or entity is flagged. */
export function riskForReadiness(readiness: number): Risk {
  if (readiness >= 70) return "Low";
  if (readiness >= 60) return "Medium";
  return "High";
}
