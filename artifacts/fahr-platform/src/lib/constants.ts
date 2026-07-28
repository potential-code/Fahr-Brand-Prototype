// Shared platform constants — proposal-aligned naming

export const AGENTS = {
  coach: "AI Learning Coach",
  advisor: "AI Skills Advisor",
  practice: "AI Practice Partner",
  content: "AI Content Assistant",
  analytics: "AI Analytics Assistant",
  concierge: "AI Concierge",
} as const;

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
  { id: "manager", title: "Line Manager", route: "/manager" },
  { id: "entity", title: "Entity Admin", route: "/ministry" },
  { id: "fahr-team", title: "FAHR Programme Team", route: "/fahr" },
  { id: "leadership", title: "Federal Leadership", route: "/leadership" },
] as const;
