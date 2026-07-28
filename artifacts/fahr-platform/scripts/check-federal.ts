// Consistency check for the federal data spine — run with `npx tsx scripts/check-federal.ts`.
//
// Guards the invariant the four role consoles depend on: department rows sum
// back to their ministry, ministry figures roll up to the federal totals, and
// every id a screen can drill into resolves to something.
import {
  CAPABILITY_DISTRIBUTION,
  COHORTS,
  ESCALATIONS,
  FOCUS,
  MINISTRIES,
  PEOPLE,
  SESSIONS,
  SUBMISSIONS,
} from "@/lib/federal/seed";
import { DEPARTMENTS, FEDERAL, departmentsOf, CAPABILITY_BANDS, nationalGaps, peopleOf } from "@/lib/federal/selectors";
import { buildNotifications } from "@/lib/federal/notifications";

const fail: string[] = [];
const check = (ok: boolean, message: string) => {
  if (!ok) fail.push(message);
};

for (const m of MINISTRIES) {
  const depts = departmentsOf(m.id);
  const emp = depts.reduce((a, d) => a + d.employees, 0);
  const learners = depts.reduce((a, d) => a + d.activeLearners, 0);
  const twins = depts.reduce((a, d) => a + d.twins, 0);
  const weighted = Math.round(depts.reduce((a, d) => a + d.readiness * d.employees, 0) / emp);
  check(emp === m.employees, `${m.id}: dept employees ${emp} != ${m.employees}`);
  check(learners === m.activeLearners, `${m.id}: dept learners ${learners} != ${m.activeLearners}`);
  check(twins === m.twins, `${m.id}: dept twins ${twins} != ${m.twins}`);
  check(weighted === m.readiness, `${m.id}: weighted readiness ${weighted} != ${m.readiness}`);
  for (const d of depts) {
    check(d.activeLearners <= d.employees, `${d.id}: learners exceed employees`);
  }
}

check(FEDERAL.employees === 80000, `federal employees ${FEDERAL.employees}`);
check(FEDERAL.activeLearners === 41850, `federal learners ${FEDERAL.activeLearners}`);
check(FEDERAL.readiness === 64, `federal readiness ${FEDERAL.readiness}`);
check(FEDERAL.ministriesOnTrack === 9, `on track ${FEDERAL.ministriesOnTrack}/14`);

const bandTotal = CAPABILITY_BANDS.reduce((a, b) => a + b.count, 0);
check(bandTotal === FEDERAL.activeLearners, `capability bands ${bandTotal} != ${FEDERAL.activeLearners}`);
check(
  Object.keys(CAPABILITY_DISTRIBUTION).length === CAPABILITY_BANDS.length,
  "capability distribution keys do not match the ladder",
);

const mohapCohortLearners = COHORTS.filter((c) => c.ministryId === "mohap").reduce((a, c) => a + c.learners, 0);
const mohap = MINISTRIES.find((m) => m.id === "mohap")!;
check(
  mohapCohortLearners === mohap.activeLearners,
  `mohap cohort learners ${mohapCohortLearners} != ${mohap.activeLearners}`,
);

// Every referenced id resolves.
const deptIds = new Set(DEPARTMENTS.map((d) => d.id));
const cohortIds = new Set(COHORTS.map((c) => c.id));
const personIds = new Set(PEOPLE.map((p) => p.id));
for (const p of PEOPLE) {
  check(deptIds.has(p.departmentId), `person ${p.id}: unknown department ${p.departmentId}`);
  check(!p.cohortId || cohortIds.has(p.cohortId), `person ${p.id}: unknown cohort ${p.cohortId}`);
  check(!p.managerId || personIds.has(p.managerId), `person ${p.id}: unknown manager ${p.managerId}`);
}
for (const c of COHORTS) {
  check(!c.departmentId || deptIds.has(c.departmentId), `cohort ${c.id}: unknown department ${c.departmentId}`);
}
for (const s of SUBMISSIONS) {
  check(personIds.has(s.personId), `submission ${s.id}: unknown person`);
  check(deptIds.has(s.departmentId), `submission ${s.id}: unknown department ${s.departmentId}`);
}

// Every department opens to a roster.
for (const d of DEPARTMENTS) {
  check(peopleOf(d.id).length > 0, `department ${d.id}: empty roster`);
}

// A manager sign-off must travel: the manager's alert clears and the entity's
// endorsement queue picks it up, from the same state.
const emptyLive = {
  assessed: false,
  assessmentScore: 0,
  levelId: "aware",
  levelLabel: "Not yet assessed",
  gapCompetencyIds: [],
  strengthCompetencyIds: [],
  pathwayProgress: 0,
  activitiesCompleted: 0,
  courses: [],
};
const team = PEOPLE.filter((p) => p.managerId === FOCUS.managerId);
const before = { submissions: SUBMISSIONS, escalations: ESCALATIONS, sessions: SESSIONS, team, live: emptyLive };
const signedOff = SUBMISSIONS.map((s) => (s.id === "s1" ? { ...s, state: "awaiting_entity" as const } : s));
const after = { ...before, submissions: signedOff };

const managerBefore = buildNotifications("manager", before);
const managerAfter = buildNotifications("manager", after);
const entityBefore = buildNotifications("ministry", before);
const entityAfter = buildNotifications("ministry", after);

check(
  managerBefore.some((n) => n.id === "n-mgr-approval-s1"),
  "manager should be alerted to Aisha's submission before sign-off",
);
check(
  !managerAfter.some((n) => n.id === "n-mgr-approval-s1"),
  "manager alert should clear after sign-off",
);
check(
  !entityBefore.some((n) => n.id === "n-ent-approval-s1"),
  "entity should not see the submission before sign-off",
);
check(
  entityAfter.some((n) => n.id === "n-ent-approval-s1"),
  "entity should be alerted after sign-off",
);
check(
  managerBefore.every((n) => n.href.startsWith("/manager")),
  "manager notifications must deep link into manager screens",
);
check(
  buildNotifications("learner", before).length === 3,
  "learner notifications must stay as they were",
);

console.log("departments:", DEPARTMENTS.length);
console.log("federal:", FEDERAL);
console.log("gaps:", nationalGaps().map((g) => `${g.competency.short}:${g.ministries}/${g.trend}`).join(" "));
console.log(
  "mohap departments:",
  departmentsOf("mohap").map((d) => `${d.name} ${d.employees}/${d.activeLearners}/${d.readiness}`).join(" | "),
);
if (fail.length > 0) {
  console.error("\nFAILURES:\n" + fail.join("\n"));
  process.exit(1);
}
console.log("\nAll consistency checks passed.");
