// Shared platform constants — proposal-aligned naming

// The six specialised agents of the platform proposal, plus the Practice
// Partner. The Coaching Agent is the always-on surface the learner meets as a
// concierge in the flow of work — one agent, two ways in.
export const AGENTS = {
  capability: "Capability Agent",
  learning: "Learning Agent",
  assessment: "Assessment Agent",
  content: "Content Agent",
  coaching: "Coaching Agent",
  analytics: "Analytics Agent",
  practice: "AI Practice Partner",
} as const;

/** The demo learner used throughout the learner journey screens. */
export const LEARNER_PROFILE = {
  name: "Aisha Al Mansoori",
  nameAr: "عائشة المنصوري",
  role: "Marketing Specialist",
  roleAr: "أخصائية تسويق",
  entity: "Ministry of Health and Prevention",
  entityAr: "وزارة الصحة ووقاية المجتمع",
  department: "Communications and Public Awareness",
  departmentAr: "الاتصال والتوعية المجتمعية",
  avatar: "brand/aisha-avatar.png",
} as const;

/** Impact points shown for the demo learner across dashboard, profile and recognition. */
export const IMPACT_POINTS = 13200;

export type CapabilityLevel = {
  id: string;
  label: string;
  order: number;
  description: string;
};

// Unified capability ladder used across profile, evaluation, recognition and dashboards
export const CAPABILITY_LEVELS: CapabilityLevel[] = [
  { id: "aware", label: "Aware", order: 1, description: "Understands AI fundamentals and responsible-use principles" },
  { id: "emerging", label: "Emerging Practitioner", order: 2, description: "Applies AI tools to routine tasks with guidance" },
  { id: "practitioner", label: "Practitioner", order: 3, description: "Independently applies AI to deliver measurable work outcomes" },
  { id: "advanced", label: "Advanced", order: 4, description: "Designs agentic workflows and mentors colleagues" },
  { id: "champion", label: "Champion", order: 5, description: "Leads AI transformation and governance across the entity" },
];

export const STAKEHOLDERS = [
  { id: "learner", title: "Federal Employee / Learner", route: "/learner" },
  { id: "manager", title: "Department Manager", route: "/manager" },
  { id: "entity", title: "Entity Admin", route: "/ministry" },
  { id: "fahr-team", title: "FAHR Programme Team", route: "/fahr" },
  { id: "leadership", title: "Federal Leadership", route: "/leadership" },
] as const;
