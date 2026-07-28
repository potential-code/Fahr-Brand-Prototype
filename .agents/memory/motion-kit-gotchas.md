---
name: Motion kit gotchas (FAHR platform)
description: Two non-obvious traps in the shared admin motion primitives — GSAP clip-path unit mismatches that silently hide charts, and shadcn Badge being a div inside PageHeader's description paragraph.
---

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
