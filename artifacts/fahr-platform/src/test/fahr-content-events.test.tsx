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

  it("shows a learner course's real modules and units", async () => {
    const user = userEvent.setup();
    renderScreen(<FAHRContent />, "/fahr/content");

    await user.click(screen.getByTestId("row-content-ct1"));
    const outline = screen.getByTestId("content-detail-outline");
    // Units come from the course the learner actually plays.
    const course = COURSE_BY_ID["ai-foundations"];
    expect(outline.textContent).toContain(course.groups[0].title);
    expect(outline.textContent).toContain(course.groups[0].lessons[0].title);
    expect(screen.getByTestId("link-open-as-learner").getAttribute("href")).toContain("/learner/course/ai-foundations");
  });

  it("imports a Coursera course unpublished, and publishing puts it in reach", async () => {
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

    await user.click(screen.getByTestId("tab-library"));
    await user.click(screen.getByTestId(`button-publish-ct-crs-${course.id}`));
    expect(screen.getByTestId("probe-status").textContent ?? "").toContain(`${course.title}::Published`);
    expect(screen.getByTestId("probe-mapped").textContent ?? "").toContain(`${course.title}::${course.competencyId}`);
  });

  it("builds a course module by module and publishes it without review", async () => {
    const user = userEvent.setup();
    renderScreen(
      <>
        <FAHRContent />
        <Probe />
      </>,
      "/fahr/content",
    );

    await user.click(screen.getByTestId("button-build-course"));
    await user.type(screen.getByTestId("input-course-title"), "Writing Service Replies with AI");
    await user.click(screen.getByTestId("button-builder-next"));

    // Next stays closed until there is a module with at least one unit.
    expect((screen.getByTestId("button-builder-next") as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByTestId("input-module-title"), "Getting started");
    await user.click(screen.getByTestId("button-add-module"));
    await user.type(screen.getByTestId("input-unit-title-0"), "Why tone matters");
    await user.click(screen.getByTestId("button-add-unit-0"));
    await user.click(screen.getByTestId("button-builder-next"));

    // The learner preview shows what was built.
    expect(screen.getByTestId("builder-preview").textContent).toContain("Why tone matters");
    await user.click(screen.getByTestId("button-publish-course"));

    expect(screen.getByTestId("probe-status").textContent ?? "").toContain(
      "Writing Service Replies with AI::Published",
    );
  });

  it("removes an unpublished import so it can be imported again", async () => {
    const user = userEvent.setup();
    renderScreen(
      <>
        <FAHRContent />
        <Probe />
      </>,
      "/fahr/content",
    );

    const course = COURSERA_CATALOGUE[1];
    await user.click(screen.getByTestId("tab-coursera"));
    await user.click(screen.getByTestId(`button-preview-${course.id}`));
    await user.click(screen.getByTestId("button-import-coursera"));
    await user.click(screen.getByTestId("tab-library"));
    await user.click(screen.getByTestId(`row-content-ct-crs-${course.id}`));
    await user.click(screen.getByTestId("button-remove-content"));

    expect(screen.getByTestId("probe-library").textContent ?? "").not.toContain(course.title);
    await user.click(screen.getByTestId("tab-coursera"));
    expect((screen.getByTestId(`button-preview-${course.id}`) as HTMLButtonElement).disabled).toBe(false);
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
