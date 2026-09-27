// A manager's direct message has to arrive somewhere the learner can read it.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route } from "wouter";
import { renderScreen } from "./providers";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import LearnerMessages from "@/pages/LearnerMessages";

beforeEach(() => {
  window.sessionStorage.clear();
  cleanup();
});

describe("manager direct messages", () => {
  it("offers a direct message, and no separate recognition action", () => {
    renderScreen(<Route path="/manager/team/:memberId" component={TeamMemberDetail} />, "/manager/team/p-aisha");

    expect(screen.getByRole("button", { name: /Send Direct Message/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Send Recognition/ })).toBeNull();
  });

  it("lands in the learner's Messages, with a notification", async () => {
    const user = userEvent.setup();
    renderScreen(<Route path="/manager/team/:memberId" component={TeamMemberDetail} />, "/manager/team/p-aisha");

    await user.click(screen.getByRole("button", { name: /Send Direct Message/ }));
    await user.type(screen.getByTestId("input-manager-message"), "Great progress on the weekly report project.");
    await user.click(screen.getByTestId("button-manager-action-confirm"));

    // Switch to the learner, as the presenter would. The session store carries it over.
    cleanup();
    renderScreen(<LearnerMessages />, "/learner/messages?thread=manager");

    const thread = screen.getByTestId("manager-thread");
    expect(within(thread).getByText("Great progress on the weekly report project.")).toBeTruthy();
    expect(within(thread).getAllByText("Mariam Al Zaabi").length).toBeGreaterThan(0);
    expect(screen.getByTestId("thread-manager")).toBeTruthy();
  });

  it("the learner can reply, and the manager sees it on the team member page", async () => {
    const user = userEvent.setup();
    renderScreen(<Route path="/manager/team/:memberId" component={TeamMemberDetail} />, "/manager/team/p-aisha");
    const managerChat = within(screen.getByTestId("card-member-messages"));
    await user.type(managerChat.getByTestId("input-direct-reply"), "How is the first draft looking?");
    await user.click(managerChat.getByTestId("button-direct-send"));

    cleanup();
    renderScreen(<LearnerMessages />, "/learner/messages?thread=manager");
    const learnerChat = within(screen.getByTestId("manager-thread"));
    expect(learnerChat.getByText("How is the first draft looking?")).toBeTruthy();
    await user.type(learnerChat.getByTestId("input-direct-reply"), "Nearly there, I will share it on Monday.");
    await user.click(learnerChat.getByTestId("button-direct-send"));
    expect(learnerChat.getAllByTestId("message-mine").at(-1)?.textContent).toContain("Nearly there");

    // Back as the manager: the reply is in the conversation, on their side of it.
    cleanup();
    renderScreen(<Route path="/manager/team/:memberId" component={TeamMemberDetail} />, "/manager/team/p-aisha");
    const thread = within(screen.getByTestId("card-member-messages"));
    expect(thread.getAllByTestId("message-theirs").at(-1)?.textContent).toContain("Nearly there, I will share it on Monday.");
    expect(thread.getAllByTestId("message-mine")[0].textContent).toContain("How is the first draft looking?");
  });
});

describe("manager notifications for replies", () => {
  it("raises an alert when a team member writes to their manager", async () => {
    const { buildNotifications } = await import("@/lib/federal/notifications");
    const { PEOPLE, FOCUS } = await import("@/lib/federal/seed");
    const alerts = buildNotifications("manager", {
      submissions: [],
      escalations: [],
      sessions: [],
      team: PEOPLE.filter((p) => p.managerId === FOCUS.managerId),
      approvals: [],
      live: {} as never,
      people: PEOPLE,
      directMessages: [
        { id: "dm-1", fromId: FOCUS.learnerId, toId: FOCUS.managerId, body: "Draft is ready", on: "27 September 2026", at: "" },
      ],
    });
    const alert = alerts.find((n) => n.id === "n-mgr-dm-1");
    expect(alert?.title).toBe("New message from Aisha Al Mansoori");
    expect(alert?.href).toBe(`/manager/messages?member=${FOCUS.learnerId}`);
  });
});

describe("the manager's Messages tab", () => {
  it("lists the team with their seeded conversations, most recent first, and lets the manager reply", async () => {
    const { default: ManagerMessages } = await import("@/pages/ManagerMessages");
    const user = userEvent.setup();
    renderScreen(<ManagerMessages />, "/manager/messages");

    // Fatima wrote most recently, so her conversation opens first.
    const conversation = within(screen.getByTestId("manager-conversation"));
    expect(conversation.getByRole("heading", { name: "Fatima Al Qasimi" })).toBeTruthy();
    expect(conversation.getByText(/service request triage assistant/)).toBeTruthy();

    // Every seeded conversation is listed.
    for (const id of ["p-khalid-h", "p-omar", "p-zayed", "p-fatima-q", "p-aisha"]) {
      expect(screen.getByTestId(`manager-thread-${id}`)).toBeTruthy();
    }

    await user.type(conversation.getByTestId("input-direct-reply"), "See you Tuesday at 11.");
    await user.click(conversation.getByTestId("button-direct-send"));
    expect(conversation.getAllByTestId("message-mine").at(-1)?.textContent).toContain("See you Tuesday at 11.");
  });
});
