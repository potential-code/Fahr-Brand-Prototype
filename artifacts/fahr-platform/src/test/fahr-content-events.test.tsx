// The federal Content and Events tabs, and the two things that make them more
// than lists: an imported course reaches the Content Agent, and a targeted
// event reaches only its audience.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderScreen } from "./providers";
import FAHRContent from "@/pages/FAHRContent";
import FAHREvents from "@/pages/FAHREvents";
import WorkshopsAndEvents from "@/pages/WorkshopsAndEvents";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { COURSERA_CATALOGUE } from "@/lib/federal/fahrConsole";
import { COURSE_BY_ID } from "@/lib/learningData";
import FAHRCourseEditor from "@/pages/FAHRCourseEditor";
import { Route } from "wouter";
import { applyEditsToCourse, courseToModules } from "@/lib/contentLibrary";
import { matchesAudience } from "@/lib/events";
import { FOCUS, PEOPLE } from "@/lib/federal";

const LEARNER = PEOPLE.find((p) => p.id === FOCUS.learnerId)!;

/** Reads library state no single screen renders on its own. */
function Probe() {
  const { catalogueWithAdditions, learningSessions } = useFahrConsole();
  return (
    <div>
      <span data-testid="probe-library">{catalogueWithAdditions.map((c) => c.title).join("|")}</span>
      <span data-testid="probe-mapped">
        {catalogueWithAdditions.map((c) => `${c.title}::${c.competencyId}`).join("|")}
      </span>
      <span data-testid="probe-status">
        {catalogueWithAdditions.map((c) => `${c.title}::${c.status}`).join("|")}
      </span>
      <span data-testid="probe-sessions">{learningSessions.map((s) => s.title).join("|")}</span>
    </div>
  );
}

describe("federal content library", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("shows every course as a card with Edit, Delete and Open", () => {
    renderScreen(<FAHRContent />, "/fahr/content");
    for (const id of ["ct1", "ct5"]) {
      expect(screen.getByTestId(`card-course-${id}`)).toBeTruthy();
      expect(screen.getByTestId(`button-edit-${id}`)).toBeTruthy();
      expect(screen.getByTestId(`button-open-${id}`)).toBeTruthy();
    }
    // A published course can't be deleted; a draft can.
    expect((screen.getByTestId("button-delete-ct1") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("button-delete-ct5") as HTMLButtonElement).disabled).toBe(false);
  });

  it("imports a Coursera course unpublished, with its modules", async () => {
    const user = userEvent.setup();
    renderScreen(
      <>
        <FAHRContent />
        <Probe />
      </>,
      "/fahr/content",
    );

    const course = COURSERA_CATALOGUE[0];
    await user.click(screen.getByTestId("tab-coursera"));
    await user.click(screen.getByTestId(`button-preview-${course.id}`));
    expect(screen.getByTestId("coursera-preview").textContent).toContain(course.syllabus[0]);
    await user.click(screen.getByTestId("button-import-coursera"));

    expect(screen.getByTestId("probe-status").textContent ?? "").toContain(`${course.title}::Imported`);
    expect(screen.getByTestId(`card-course-ct-crs-${course.id}`)).toBeTruthy();
  });
});

describe("course editor", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("opens a learner course with its real modules, units and blocks", () => {
    renderScreen(<Route path="/fahr/content/:contentId" component={FAHRCourseEditor} />, "/fahr/content/ct1");
    const course = COURSE_BY_ID["ai-foundations"];
    expect(screen.getByTestId("editor-title").textContent).toContain("AI Foundations for Federal Service");
    expect(screen.getByText(course.groups[0].title)).toBeTruthy();
    expect(screen.getByText(course.groups[0].lessons[0].title)).toBeTruthy();
    expect(screen.getByTestId("editor-sync-note")).toBeTruthy();
  });

  it("builds a course: module, unit, text block, then publish", async () => {
    const user = userEvent.setup();
    renderScreen(
      <>
        <Route path="/fahr/content/:contentId" component={FAHRCourseEditor} />
        <Probe />
      </>,
      "/fahr/content/ct8",
    );

    await user.click(screen.getByTestId("button-add-module"));
    await user.type(screen.getByTestId("input-module-title"), "Replying to complaints");
    await user.click(screen.getByTestId("button-save-module"));

    await user.click(screen.getByTestId("button-add-unit-1"));
    await user.type(screen.getByTestId("input-unit-title"), "Acknowledge first");
    await user.click(screen.getByTestId("button-save-unit"));

    await user.click(screen.getByTestId("button-add-block-1-0"));
    await user.type(screen.getByTestId("input-block-title"), "Naming the concern");
    await user.type(screen.getByTestId("input-block-text"), "Start by naming the resident's concern.");
    await user.click(screen.getByTestId("button-save-block"));

    expect(screen.getByText("Acknowledge first")).toBeTruthy();
    expect(screen.getByText("Naming the concern")).toBeTruthy();

    await user.click(screen.getByTestId("button-toggle-publish"));
    expect(screen.getByTestId("probe-status").textContent ?? "").toContain("Writing Service Replies with AI::Published");
  });
});

describe("learner sync", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("applies FAHR's text and video edits to the course the learner plays", () => {
    const course = COURSE_BY_ID["ai-foundations"];
    const modules = courseToModules(course);
    const unit = modules[0].units[0];
    unit.title = "Edited lesson title";
    unit.blocks = [
      { id: "v", kind: "Video", title: "New video", videoUrl: "https://youtu.be/dQw4w9WgXcQ" },
      { id: "t", kind: "Text", title: "Reading", text: "First paragraph.\n\nSecond paragraph." },
    ];

    const learner = applyEditsToCourse(course, modules);
    const lesson = learner.groups[0].lessons[0];
    expect(lesson.title).toBe("Edited lesson title");
    expect(lesson.type).toBe("video");
    expect(lesson.videoId).toBe("dQw4w9WgXcQ");
    expect(lesson.body).toEqual(["First paragraph.", "Second paragraph."]);
    // Untouched lessons keep their ids, so learner progress still lines up.
    expect(learner.groups[0].lessons.map((l) => l.id)).toEqual(course.groups[0].lessons.map((l) => l.id));
  });

  it("leaves an unedited course exactly as it was", () => {
    const course = COURSE_BY_ID["prompt-craft"];
    expect(applyEditsToCourse(course, undefined)).toBe(course);
  });
});

describe("federal events", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    cleanup();
  });

  it("schedules an event and shows the audience it is configured for", async () => {
    const user = userEvent.setup();
    renderScreen(
      <>
        <FAHREvents />
        <Probe />
      </>,
      "/fahr/events",
    );

    await user.click(screen.getByTestId("button-create-event"));
    await user.type(screen.getByTestId("input-event-title"), "Agentic AI clinic");
    await user.type(screen.getByTestId("input-event-facilitator"), "Hind Al Owais");
    await user.click(screen.getByTestId("button-submit-event"));

    expect(screen.getByTestId("probe-sessions").textContent ?? "").toContain("Agentic AI clinic");
    const row = screen.getByText("Agentic AI clinic").closest("tr") as HTMLElement;
    expect(within(row).getByText(/All federal employees/)).toBeTruthy();
  });

  it("will not schedule a targeted event without naming the audience", async () => {
    const user = userEvent.setup();
    renderScreen(<FAHREvents />, "/fahr/events");

    await user.click(screen.getByTestId("button-create-event"));
    await user.type(screen.getByTestId("input-event-title"), "Health-only clinic");
    await user.type(screen.getByTestId("input-event-facilitator"), "Hind Al Owais");

    // Submit is live while the audience is "everyone"…
    expect((screen.getByTestId("button-submit-event") as HTMLButtonElement).disabled).toBe(false);

    // …and closes once a scope that needs a target is chosen but left empty.
    await user.click(screen.getByTestId("select-event-audience-scope"));
    await user.click(screen.getByRole("option", { name: "One entity" }));
    expect((screen.getByTestId("button-submit-event") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("audience targeting", () => {
  it("reaches a learner only when the audience includes them", () => {
    const viewer = {
      ministryId: LEARNER.ministryId,
      levelId: LEARNER.levelId,
      gapCompetencyIds: ["prompting"],
    };

    expect(matchesAudience(undefined, viewer)).toBe(true);
    expect(matchesAudience({ scope: "everyone" }, viewer)).toBe(true);

    expect(matchesAudience({ scope: "entity", value: LEARNER.ministryId }, viewer)).toBe(true);
    expect(matchesAudience({ scope: "entity", value: "moe" }, viewer)).toBe(false);

    expect(matchesAudience({ scope: "level", value: LEARNER.levelId }, viewer)).toBe(true);
    expect(matchesAudience({ scope: "level", value: "champion" }, viewer)).toBe(false);

    expect(matchesAudience({ scope: "competency", value: "prompting" }, viewer)).toBe(true);
    expect(matchesAudience({ scope: "competency", value: "governance" }, viewer)).toBe(false);
  });

  it("keeps an event for another entity off the learner's listing", async () => {
    window.sessionStorage.clear();
    cleanup();
    const user = userEvent.setup();
    renderScreen(<FAHREvents />, "/fahr/events");

    await user.click(screen.getByTestId("button-create-event"));
    await user.type(screen.getByTestId("input-event-title"), "Education-only clinic");
    await user.type(screen.getByTestId("input-event-facilitator"), "Hind Al Owais");
    await user.click(screen.getByTestId("select-event-audience-scope"));
    await user.click(screen.getByRole("option", { name: "One entity" }));
    await user.click(screen.getByTestId("select-event-audience-value"));
    await user.click(screen.getByRole("option", { name: "Ministry of Education" }));
    await user.click(screen.getByTestId("button-submit-event"));

    // The demo learner is in Health, so the Education event does not reach her.
    cleanup();
    renderScreen(<WorkshopsAndEvents />, "/learner/events");
    expect(screen.queryByText("Education-only clinic")).toBeNull();
  });
});
