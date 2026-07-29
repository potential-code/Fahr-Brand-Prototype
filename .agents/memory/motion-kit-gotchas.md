---
name: Motion kit gotchas (FAHR platform)
description: Non-obvious traps in the shared admin motion primitives — GSAP clip-path unit mismatches that silently hide charts, shadcn Badge inside PageHeader's description paragraph, counters restarting from zero, and gating content by swap vs. overlay.
---

# Gate content with an overlay, never by unmounting it

Any "loading / analysing / generating" state that hides its result with an
`AnimatePresence` swap remounts whatever is inside. A remounted recharts
`ResponsiveContainer` measures itself before the new layout settles, logs
`The width(0) and height(0) of chart should be greater than 0`, and the panel
jumps height when the result lands.

**Why:** the simulated AI-analysis panels originally swapped result for spinner
and produced exactly that on every dashboard carrying a chart.

**How to apply:** keep the result mounted, dim/blur it, and stack the working
overlay in the *same CSS grid cell* (`grid` + both children on
`col-start-1 row-start-1`) rather than `absolute inset-0` — the wrapper then
takes the height of the taller layer, so a short result cannot clip the overlay.
Mark the dimmed layer `inert` while working (React 19 supports the boolean prop)
so it is neither clickable nor tabbable, and add a `@media print` rule that
resets the dimming: framer-motion writes opacity/filter as inline styles, so a
`print:` utility class cannot override them.

# GSAP clip-path tweens: every inset component needs a unit

A `gsap.fromTo` between `inset(100% 0 0 0)` and `inset(0 0% 0 0)` interpolates the
clip-path string component by component. Where one side has `%` and the other is
unitless, the tween cannot resolve and the element **stays at its start value** —
i.e. fully clipped, an invisible chart, with no console error and no type error.

**Why:** the chart draw-in ("rise" direction) shipped blank on two screens and
looked like a data bug; the data was fine.

**How to apply:** write every inset component with an explicit unit on both
sides (`inset(100% 0% 0% 0%)` → `inset(0% 0% 0% 0%)`). If a GSAP-animated
element renders blank, suspect the tween's string units before the data.

# PageHeader's description renders a `<p>` — no divs inside

The shared `PageHeader` puts `description` in a paragraph, and shadcn's `Badge`
renders a `div`. Passing a status pill through `description` produces a React
"cannot be a descendant of" hydration warning at runtime only.

**How to apply:** badges belong in `actions` (a div), or the pill must be a
`span` with the badge classes. Prefer span-based pills for anything reused in
both places.

# Animated counters should count from their previous value

`CountUp` originally restarted at zero whenever its `to` changed, so a single
approval decision made every KPI on the screen re-animate from zero — janky in a
demo, and it makes screenshots and e2e assertions read mid-flight numbers.

**How to apply:** count from zero on first reveal only; afterwards tween from
the last landed value with a shorter duration. When an automated test reports a
"wrong" KPI, check whether it sampled a counter mid-animation before believing
the state is wrong.
