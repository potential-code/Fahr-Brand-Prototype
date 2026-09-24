import React from "react";

/**
 * A vertical timeline rail with a node per entry.
 *
 * Drawn deliberately rather than with a border on the list, because a
 * border-drawn rail sits on the list's own edge, which forces the nodes to be
 * pulled outside it with a negative offset — where a scroll container clips
 * them, and where the arithmetic drifts out of alignment the moment padding
 * changes. Here the rail and the nodes are positioned from the same two
 * constants, so they cannot disagree, and both sit inside the padding.
 */

/** Distance from the list's leading edge to the centre line of the rail. */
const RAIL_CENTRE = 10.5;
/** Diameter of a node. */
const NODE = 11;

/** Leading padding that clears the rail and nodes. */
export const TIMELINE_PADDING = "ps-6";
/** `ps-6` in pixels — a node's offset is measured back from it. */
const TIMELINE_PADDING_PX = 24;

/**
 * The rail itself. Drop it inside a `relative` list alongside the entries.
 * `inset` trims the rail at both ends so it starts and stops at the first and
 * last node rather than running past them.
 */
export function TimelineRail({
  className = "",
  inset = "inset-y-2",
}: {
  className?: string;
  inset?: string;
}) {
  return (
    <span
      aria-hidden
      className={`absolute ${inset} w-px bg-border ${className}`}
      style={{ insetInlineStart: RAIL_CENTRE - 0.5 }}
    />
  );
}

/**
 * One node, centred on the rail. Give it the entry's `top` offset so it lines
 * up with the entry's first line of text; `borderedParent` accounts for the
 * 1px border on a card-style entry, which shifts the padding box the node is
 * positioned against.
 */
export function TimelineNode({
  top = "top-1",
  borderedParent = false,
  className = "",
  testId,
}: {
  top?: string;
  borderedParent?: boolean;
  className?: string;
  testId?: string;
}) {
  return (
    <span
      aria-hidden
      data-testid={testId}
      className={`absolute ${top} rounded-full border-2 border-primary bg-background ${className}`}
      style={{
        insetInlineStart: RAIL_CENTRE - NODE / 2 - TIMELINE_PADDING_PX - (borderedParent ? 1 : 0),
        height: NODE,
        width: NODE,
      }}
    />
  );
}
