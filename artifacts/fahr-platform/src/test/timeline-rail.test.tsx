// The timeline node sits on the rail, and inside the list — the two ways the
// hand-positioned version got it wrong: clipped at a scroll container's edge, and
// offset from the line it is meant to sit on.
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TIMELINE_PADDING, TimelineNode, TimelineRail } from "@/components/TimelineRail";

/** `ps-6`, the padding the node is offset back from. */
const PADDING = 24;

function offsetOf(el: HTMLElement): number {
  return Number.parseFloat(el.style.insetInlineStart);
}

function sizeOf(el: HTMLElement): number {
  return Number.parseFloat(el.style.width);
}

describe("timeline rail geometry", () => {
  it("clears the list edge with padding wide enough for the node", () => {
    expect(TIMELINE_PADDING).toBe("ps-6");
  });

  it("centres the node on the rail", () => {
    const { container } = render(
      <ol className={`relative ${TIMELINE_PADDING}`}>
        <TimelineRail />
        <li className="relative">
          <TimelineNode testId="node" />
        </li>
      </ol>,
    );

    const rail = container.querySelector("span[aria-hidden]") as HTMLElement;
    const node = screen.getByTestId("node");

    // Measured from the list's leading edge: the node's centre and the rail's
    // centre are the same point.
    const railCentre = Number.parseFloat(rail.style.insetInlineStart) + 0.5;
    const nodeCentre = PADDING + offsetOf(node) + sizeOf(node) / 2;
    expect(nodeCentre).toBeCloseTo(railCentre, 5);
  });

  it("keeps the whole node inside the list, so a scroll container cannot clip it", () => {
    render(
      <ol className={`relative ${TIMELINE_PADDING}`}>
        <TimelineRail />
        <li className="relative">
          <TimelineNode testId="node" />
        </li>
      </ol>,
    );

    const node = screen.getByTestId("node");
    const leadingEdge = PADDING + offsetOf(node);
    expect(leadingEdge).toBeGreaterThanOrEqual(0);
    expect(leadingEdge + sizeOf(node)).toBeLessThanOrEqual(PADDING);
  });

  it("shifts by the border when the entry is a bordered card", () => {
    render(
      <>
        <TimelineNode testId="plain" />
        <TimelineNode testId="carded" borderedParent />
      </>,
    );

    // A 1px border moves the entry's padding box in by 1px, so the node has to
    // reach 1px further back to land on the same rail.
    expect(offsetOf(screen.getByTestId("carded"))).toBeCloseTo(
      offsetOf(screen.getByTestId("plain")) - 1,
      5,
    );
  });
});
