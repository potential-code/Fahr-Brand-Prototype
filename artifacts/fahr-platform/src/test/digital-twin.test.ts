// The twin must only ever stand on what the learner taught it. Its two
// federal guardrails are enforced in code and cannot be switched off — a
// federal audience should never see a control that disables federal policy.
import { describe, it, expect } from "vitest";
import {
  answer,
  assessTwin,
  emptyProfile,
  GUARDRAILS,
  isTrainable,
  readiness,
  trainingLog,
  type TwinProfile,
} from "@/lib/digitalTwin";

/** A twin built the way a learner would build it in the interview. */
function trainedProfile(overrides: Partial<TwinProfile> = {}): TwinProfile {
  return {
    ...emptyProfile(),
    role: "Public health communications specialist",
    tasks: ["Drafting campaign briefs", "Writing social media copy"],
    briefs: ["National Immunisation Week brief"],
    tone: "Authoritative but reassuring, no jargon",
    knowledge: ["Ministry health policies 2026"],
    trainedAt: "2026-09-21T10:00:00.000Z",
    ...overrides,
  };
}

describe("twin readiness", () => {
  it("an untouched twin is at zero and cannot be trained", () => {
    const profile = emptyProfile();
    expect(readiness(profile)).toBe(0);
    expect(isTrainable(profile)).toBe(false);
  });

  it("the two federal guardrails are on by default, and no others exist", () => {
    const profile = emptyProfile();
    expect(profile.guardrails).toEqual({ noPersonalData: true, approvedKnowledgeOnly: true });
    expect(GUARDRAILS.map((guardrail) => guardrail.id)).toEqual([
      "noPersonalData",
      "approvedKnowledgeOnly",
    ]);
  });

  it("describing the twin cannot alone take it to 100 — training carries the last 20", () => {
    const described = { ...trainedProfile(), trainedAt: null };
    expect(readiness(described)).toBe(80);
    expect(readiness(trainedProfile())).toBe(100);
  });

  it("a role plus one recurring task is enough to train", () => {
    const profile = { ...emptyProfile(), role: "Campaign lead", tasks: ["Drafting briefs"] };
    expect(isTrainable(profile)).toBe(true);
  });
});

describe("the training log quotes the learner back", () => {
  it("names the tasks the learner entered rather than a generic line", () => {
    const log = trainingLog(trainedProfile(), false).join("\n");
    expect(log).toContain("Drafting campaign briefs");
    expect(log).toContain("Public health communications specialist");
    expect(log).toContain("Authoritative but reassuring");
  });

  it("names the two enforced guardrails rather than counting them", () => {
    const log = trainingLog(trainedProfile(), false).join("\n");
    expect(log).toContain("No sensitive personal data");
    expect(log).toContain("Approved knowledge only");
  });
});

describe("the twin answers only from what it was taught", () => {
  it("cites the learner's own task when the question overlaps it", () => {
    const reply = answer(trainedProfile(), "Draft the campaign brief for flu season", false);
    expect(reply.status).toBe("ok");
    expect(reply.citations).toContain("Drafting campaign briefs");
  });

  it("declines anything outside the connected sources, and says what it can cover", () => {
    const reply = answer(trainedProfile(), "What is next year's federal budget forecast?", false);
    expect(reply.status).toBe("out-of-scope");
    expect(reply.citations).toHaveLength(0);
    expect(reply.text).toContain("Drafting campaign briefs");
  });

  it("answers out of scope anyway once approved-knowledge-only is switched off", () => {
    const profile = trainedProfile({
      guardrails: { ...emptyProfile().guardrails, approvedKnowledgeOnly: false },
    });
    const reply = answer(profile, "What is next year's federal budget forecast?", false);
    expect(reply.status).toBe("ok");
    expect(reply.notes.some((note) => note.id === "approvedKnowledgeOnly" && note.kind === "breach")).toBe(true);
  });
});

describe("guardrails change the outcome, not just the wording", () => {
  it("blocks a prompt carrying personal data before it reaches the model", () => {
    const reply = answer(trainedProfile(), "Summarise this patient's medical record", false);
    expect(reply.status).toBe("blocked");
    expect(reply.notes.some((note) => note.id === "noPersonalData" && note.kind === "refused")).toBe(true);
  });

  it("lets the same prompt through, flagged, once the screen is switched off", () => {
    const profile = trainedProfile({
      guardrails: { ...emptyProfile().guardrails, noPersonalData: false },
    });
    const reply = answer(profile, "Summarise this patient's medical record", false);
    expect(reply.status).not.toBe("blocked");
    expect(reply.notes.some((note) => note.id === "noPersonalData" && note.kind === "breach")).toBe(true);
  });
});

describe("Arabic", () => {
  /** A twin an Arabic-speaking learner would build, answered in Arabic. */
  const arabicProfile = trainedProfile({
    role: "أخصائي اتصال في الصحة العامة",
    tasks: ["صياغة موجزات الحملات"],
    tone: "موثوق ومطمئن",
    knowledge: ["سياسات الوزارة الصحية"],
  });

  it("answers in Arabic without leaking English scaffolding", () => {
    const reply = answer(arabicProfile, "ساعدني في صياغة موجزات الحملات", true);
    expect(reply.status).toBe("ok");
    expect(reply.text).toContain("صياغة موجزات الحملات");
    expect(reply.text).not.toContain("routed");
  });

  it("declines out of scope in Arabic too", () => {
    const reply = answer(arabicProfile, "ما توقعات الميزانية الاتحادية؟", true);
    expect(reply.status).toBe("out-of-scope");
    expect(reply.text).toContain("صياغة موجزات الحملات");
  });

  // The twin matches on the words it was taught, so it understands its owner
  // in the language they built it in. A twin described in English will not
  // recognise an Arabic question about the same task — demo in one language.
  it("does not match across scripts", () => {
    expect(answer(trainedProfile(), "صغ لي موجز الحملة", true).status).toBe("out-of-scope");
  });
});

describe("the Assessment Agent scores the twin", () => {
  it("a fully described, fully trained twin scores at the top", () => {
    const assessed = assessTwin(trainedProfile());
    expect(assessed.value).toBe(100);
    expect(assessed.evidence.join("\n")).toContain("no sensitive personal data");
    expect(assessed.evidence.join("\n")).toContain("approved knowledge only");
  });

  it("an ungrounded twin is marked down for having no task and no source", () => {
    const thin = assessTwin({ ...emptyProfile(), role: "Analyst", trainedAt: "2026-09-21T10:00:00.000Z" });
    const evidence = thin.evidence.join("\n");
    expect(evidence).toContain("not yet anchored to real work");
    expect(evidence).toContain("nothing the twin says can be traced");
  });
});

describe("the learner's own rules", () => {
  const withOwnRules = (labels: string[]) =>
    trainedProfile({
      customGuardrails: labels.map((label, index) => ({
        id: `own-${index}`,
        label,
      })),
    });

  it("are stated by the twin alongside the federal guardrails", () => {
    const reply = answer(withOwnRules(["Never quote a figure without a source"]), "Draft the campaign brief", false);
    const own = reply.notes.find((note) => note.text.includes("Never quote a figure"));
    expect(own?.kind).toBe("held");
    expect(own?.text).toContain("Your rule applied");
  });

  it("are named in the training log and in the assessment", () => {
    const profile = withOwnRules(["Never name an individual resident"]);
    expect(trainingLog(profile, false).join("\n")).toContain("Never name an individual resident");
    expect(assessTwin(profile).evidence.join("\n")).toContain("Never name an individual resident");
  });
});
