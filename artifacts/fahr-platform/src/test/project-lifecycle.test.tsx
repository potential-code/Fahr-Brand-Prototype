// One workplace project, learner to leadership. Every role reads the same
// project from the federal store, so a decision taken on one dashboard has to
// show up — as a status, a message and a notification — on the others.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen } from "./providers";
import ManagerDashboard from "@/pages/ManagerDashboard";
import LearnerMessages from "@/pages/LearnerMessages";
import AgenticAIEvaluation from "@/pages/AgenticAIEvaluation";
import RecognitionAndImpact from "@/pages/RecognitionAndImpact";
import LeadershipDashboard from "@/pages/LeadershipDashboard";
import FAHREscalations from "@/pages/FAHREscalations";
import ManagerValidations from "@/pages/ManagerValidations";
import MinistryApprovals from "@/pages/MinistryApprovals";
import { learnerProjectId, useFederalData, type ProjectSubmissionInput } from "@/lib/FederalDataContext";
import { journeyFor } from "@/lib/federal/journey";
import { FOCUS } from "@/lib/federal";

const PROJECT = learnerProjectId(FOCUS.learnerId);

const BRIEF: ProjectSubmissionInput = {
  title: "Campaign brief assistant",
  description: "Drafts campaign briefs from past campaigns for the comms team.",
  metrics: "Brief turnaround time",
  hoursSavedPerMonth: 32,
  impact: "Medium",
  governanceStatus: "Compliant",
  competencyIds: ["agentic"],
  brief: {
    challenge: "Campaign briefs take two days to assemble from past campaigns.",
    solution: "The assistant drafts the brief from the last three campaigns; the comms lead reviews it.",
    humanCheckpoint: "Communications lead signs off each output",
    outcomes: ["Briefs drafted the same day"],
    measures: ["Brief turnaround time against the current two days"],
    sensitivity: "internal",
    disclosure: true,
    hoursPerWeek: 6,
    peopleAffected: 8,
    automationPct: 55,
    policies: [{ policy: "Human oversight", status: "pass", detail: "A named reviewer checks every output." }],
  },
};

/**
 * Takes the actions of roles a test is not rendering, and exposes what the
 * store holds, so each step can be checked from the role it belongs to.
 */
function Driver() {
  const store = useFederalData();
  const project = store.getSubmission(PROJECT);
  const journey = project ? journeyFor(project, store.approvals) : null;
  const ids = (role: Parameters<typeof store.notificationsFor>[0]) =>
    store.notificationsFor(role).map((n) => n.id).join(",");
  return (
    <div>
      <button onClick={() => store.submitProject(BRIEF)}>submit</button>
      <button onClick={() => store.submitProject(BRIEF, { note: "Added the measured baseline." })}>resubmit</button>
      <button onClick={() => store.escalate(PROJECT, { by: "Entity Admin", note: "Reaches three entities." })}>escalate</button>
      <button onClick={() => store.signOff(PROJECT, { by: "Mariam Al Zaabi" })}>escalate-ready</button>
      <button onClick={() => store.endorse(PROJECT, { by: "Entity Admin" })}>endorse</button>
      <button onClick={() => store.fahrReturn(PROJECT, { note: "Clarify the data-sharing basis." })}>fahr-return</button>
      <button onClick={() => store.fahrApprove(PROJECT)}>fahr-approve</button>
      <span data-testid="state">{project?.state ?? "none"}</span>
      <span data-testid="steps">{journey?.steps.map((s) => `${s.id}:${s.status}`).join(",")}</span>
      <span data-testid="n-learner">{ids("learner")}</span>
      <span data-testid="n-manager">{ids("manager")}</span>
      <span data-testid="n-ministry">{ids("ministry")}</span>
      <span data-testid="n-fahr">{ids("fahr")}</span>
      <span data-testid="n-leadership">{ids("leadership")}</span>
      <span data-testid="unread-manager">{store.unreadCountFor("manager")}</span>
      <span data-testid="credential">
        {store.credentials.some((c) => c.submissionId === PROJECT) ? "issued" : "none"}
      </span>
    </div>
  );
}

const text = (id: string) => screen.getByTestId(id).textContent ?? "";

/** Switches role the way the demo does: a fresh mount on the shared session. */
function as(ui: React.ReactElement, path: string) {
  cleanup();
  renderScreen(
    <>
      {ui}
      <Driver />
    </>,
    path,
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

describe("a workplace project travels learner → manager → entity → FAHR → leadership", () => {
  it("keeps one project connected across every dashboard", async () => {
    const user = userEvent.setup();

    // Nothing submitted yet: the inbox explains what will arrive, not a blank screen.
    as(<LearnerMessages />, "/learner/messages");
    expect(screen.getByText("Nothing to review yet")).toBeTruthy();
    await user.click(screen.getByText("submit"));
    expect(text("state")).toBe("awaiting_manager");

    // The line manager sees it in the sign-off queue and sends it back.
    as(<ManagerDashboard />, "/manager");
    expect(text("n-manager")).toContain(`n-mgr-approval-${PROJECT}`);
    await user.click(screen.getByTestId(`button-request-revision-${PROJECT}`));
    await user.type(screen.getByTestId("input-revision-comments"), "Add a measured baseline.");
    await user.click(screen.getByTestId("button-send-revision"));
    expect(text("state")).toBe("revision_requested");

    // The learner is told, with the comment verbatim and the action it needs.
    as(<LearnerMessages />, `/learner/messages?project=${PROJECT}`);
    expect(screen.getByTestId("messages-action-required")).toBeTruthy();
    expect(screen.getByTestId(`conversation-${PROJECT}`).textContent).toContain("Add a measured baseline.");
    expect(text("n-learner")).toMatch(/n-learner-a-/);
    expect(text("steps")).toContain("manager:returned");

    // Resubmitting puts it back in the same queue as a fresh, unread alert.
    const unreadBefore = Number(text("unread-manager"));
    await user.click(screen.getByText("resubmit"));
    expect(text("state")).toBe("awaiting_manager");
    expect(Number(text("unread-manager"))).toBeGreaterThanOrEqual(unreadBefore);

    as(<ManagerDashboard />, "/manager");
    expect(screen.getByTestId(`badge-state-${PROJECT}`).textContent).toContain("Resubmitted");
    await user.click(screen.getByTestId(`button-sign-off-${PROJECT}`));
    expect(text("state")).toBe("awaiting_entity");
    expect(text("n-ministry")).toContain(`n-ent-approval-${PROJECT}`);
    // Signing off no longer mints the credential; going live does.
    expect(text("credential")).toBe("none");

    // The entity escalates; FAHR has a decision waiting.
    await user.click(screen.getByText("escalate"));
    expect(text("state")).toBe("escalated");
    expect(text("n-fahr")).toContain(`n-fahr-project-${PROJECT}`);

    // While in review, the evaluation and certificate already show — marked provisional.
    as(<RecognitionAndImpact />, "/learner/recognition");
    expect(screen.getByTestId("certificate-provisional")).toBeTruthy();
    expect(screen.getByTestId("certificate-provisional-watermark")).toBeTruthy();
    as(<AgenticAIEvaluation />, "/learner/evaluation");
    expect(text("badge-evaluation-status")).toBe("Evaluation complete");
    expect(text("text-evaluation-source")).toContain("final once your line manager and entity approve");
    expect(screen.getByTestId("card-level-up")).toBeTruthy();

    // FAHR approves from its project decisions queue: live everywhere at once.
    as(<FAHREscalations />, `/fahr/escalations?tab=projects&project=${PROJECT}`);
    await user.click(screen.getByTestId(`button-fahr-approve-${PROJECT}-sheet`));
    await user.click(screen.getByTestId("button-decision-confirm"));
    expect(text("state")).toBe("deployed");
    expect(text("steps")).toBe("submitted:done,manager:done,entity:done,fahr:done,live:done");
    expect(text("credential")).toBe("issued");
    expect(text("n-leadership")).toMatch(/n-lead-live-/);
    expect(text("n-manager")).toMatch(/n-mgr-live-/);
    expect(text("n-ministry")).toMatch(/n-ent-live-/);

    // Leadership sees it among the newly live projects.
    as(<LeadershipDashboard />, "/leadership");
    expect(screen.getByTestId(`live-project-${PROJECT}`).textContent).toContain(BRIEF.title);

    as(<AgenticAIEvaluation />, "/learner/evaluation");
    expect(text("badge-evaluation-status")).toBe("Evaluation complete");
    as(<RecognitionAndImpact />, "/learner/recognition");
    expect(screen.queryByTestId("certificate-provisional")).toBeNull();
    expect(screen.queryByTestId("certificate-provisional-watermark")).toBeNull();
  }, 30_000);

  it("FAHR can send an escalated project back to the entity", async () => {
    const user = userEvent.setup();
    as(<ManagerDashboard />, "/manager");
    await user.click(screen.getByText("submit"));
    await user.click(screen.getByTestId(`button-sign-off-${PROJECT}`));
    await user.click(screen.getByText("escalate"));
    await user.click(screen.getByText("fahr-return"));

    expect(text("state")).toBe("awaiting_entity");
    expect(text("steps")).toContain("fahr:returned");
    expect(text("n-ministry")).toContain(`n-ent-approval-${PROJECT}`);
    expect(text("n-fahr")).not.toContain(`n-fahr-project-${PROJECT}`);
    expect(text("credential")).toBe("none");
  });

  it("an entity endorsement goes live without FAHR", async () => {
    const user = userEvent.setup();
    as(<ManagerDashboard />, "/manager");
    await user.click(screen.getByText("submit"));
    await user.click(screen.getByTestId(`button-sign-off-${PROJECT}`));
    await user.click(screen.getByText("endorse"));

    expect(text("state")).toBe("endorsed");
    expect(text("steps")).toBe("submitted:done,manager:done,entity:done,fahr:skipped,live:done");
    expect(text("credential")).toBe("issued");
  });

  it("ignores a second submission while the project is in review", async () => {
    const user = userEvent.setup();
    as(<ManagerDashboard />, "/manager");
    await user.click(screen.getByText("submit"));
    await user.click(screen.getByText("resubmit"));
    const count = screen.getAllByTestId(`button-sign-off-${PROJECT}`).length;
    expect(count).toBe(1);
    expect(text("state")).toBe("awaiting_manager");
  });

  it("shows every reviewer the learner's brief, stage by stage", async () => {
    const user = userEvent.setup();
    as(<ManagerDashboard />, "/manager");
    await user.click(screen.getByText("submit"));

    // The line manager reads the full brief in the review sheet.
    as(<ManagerValidations />, `/manager/validations?project=${PROJECT}`);
    const brief = screen.getByTestId(`brief-${PROJECT}`);
    expect(brief.textContent).toContain(BRIEF.brief.challenge);
    expect(brief.textContent).toContain(BRIEF.brief.humanCheckpoint);
    expect(brief.textContent).toContain(BRIEF.brief.outcomes[0]);
    expect(brief.textContent).toContain(BRIEF.brief.measures[0]);
    for (const step of [1, 2, 3, 4, 5]) expect(screen.getByTestId(`brief-section-${step}`)).toBeTruthy();

    // The entity sees a two-line summary on the card and the full brief on demand.
    as(<ManagerDashboard />, "/manager");
    await user.click(screen.getByText("escalate-ready"));
    as(<MinistryApprovals />, "/ministry/approvals");
    expect(screen.getByTestId(`summary-${PROJECT}`)).toBeTruthy();
    expect(screen.queryByText("Decision trail")).toBeNull();
    await user.click(screen.getByTestId(`button-open-brief-${PROJECT}`));
    expect(screen.getByTestId("sheet-project-detail").textContent).toContain(BRIEF.brief.solution);
  }, 30_000);
});
