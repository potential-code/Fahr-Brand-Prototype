// The ordered-journey timeline. Course artwork belongs to the step card, not to
// a floating tile beside it — a step with art and a step without have to read as
// the same object, so these tests pin the art inside the card that carries the
// step's title and its action.
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { PathwayTimeline, type TimelineEntry } from "@/components/pathway/PathwayTimeline";
import { COMPETENCIES, COURSES, courseImage } from "@/lib/learningData";
import type { PathwayItem } from "@/lib/pathway";

const competency = COMPETENCIES[0];
const course = COURSES[0];

const courseStep: PathwayItem = {
  id: "pw-course",
  format: "course",
  title: course.title,
  description: course.summary,
  duration: course.duration,
  competency,
  agent: "Content Agent",
  coachNote: "Opens the pathway.",
  courseId: course.id,
};

const microStep: PathwayItem = {
  id: "pw-micro",
  format: "microlearning",
  title: "The three ways AI fails you",
  description: "Fabrication, staleness and confident nonsense.",
  duration: "6 min",
  competency,
  agent: "Content Agent",
  coachNote: "Shortest read that moves your first priority.",
  meta: "Knowledge article",
};

const entries: TimelineEntry[] = [
  { item: courseStep, status: "in-progress" },
  { item: microStep, status: "locked" },
];

beforeEach(cleanup);

describe("pathway timeline", () => {
  it("renders the course artwork inside the step card, beside the title and action", () => {
    const { getByTestId } = render(<PathwayTimeline entries={entries} onOpen={() => {}} />);

    const row = getByTestId(`row-pathway-${courseStep.id}`);
    const image = row.querySelector("img");
    expect(image).not.toBeNull();
    expect(image!.getAttribute("src")).toContain(courseImage(course));

    // The card is the element that owns the artwork, the title and the action —
    // one bordered object rather than a card plus a detached thumbnail.
    const card = image!.closest("article");
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain(course.title);
    expect(card!.querySelector(`[data-testid="button-open-${courseStep.id}"]`)).not.toBeNull();
  });

  it("leaves steps without a course free of artwork", () => {
    const { getByTestId } = render(<PathwayTimeline entries={entries} onOpen={() => {}} />);

    const row = getByTestId(`row-pathway-${microStep.id}`);
    expect(row.querySelector("img")).toBeNull();
    expect(row.textContent).toContain(microStep.title);
  });

  it("numbers the steps in sequence", () => {
    const { getByTestId } = render(<PathwayTimeline entries={entries} onOpen={() => {}} />);

    expect(getByTestId(`row-pathway-${courseStep.id}`).textContent).toContain("01");
    expect(getByTestId(`row-pathway-${microStep.id}`).textContent).toContain("02");
  });
});
