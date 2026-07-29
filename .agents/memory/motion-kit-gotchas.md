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

# Never gate marketing content on a scroll-scrubbed progress value

A reveal driven by `useScroll({ target, offset })` — a mask, clip-path or
opacity tied to `scrollYProgress` — only finishes if the visitor actually
scrolls that range. On a tall viewport, a short page, or a deep link that lands
below the section, progress stalls part-way and the content stays permanently
half-masked. It looks like a cropped image, not a stuck animation.

**Why:** the learner-journey illustration shipped visibly cut in half on a tall
window because its clip-path was scroll-scrubbed.

**How to apply:** use scroll scrubbing only for *decoration* that is fine at any
intermediate value (parallax layers, light sweeps, background drift). For
anything a reader must see, use a viewport-triggered animation that runs to
completion once (`whileInView` + `viewport={{ once: true }}`).

# A fully clipped element never enters view — mask a child, not the observer

`whileInView` is IntersectionObserver-driven, and an element whose own
`clip-path` hides all of it reports no intersection. So an initial state of
`clip-path: inset(0% 0% 100% 0%)` on the observed node deadlocks: the reveal can
never trigger, and the content stays hidden forever — image loaded, opacity 1,
no console error, nothing to see.

**Why:** the learner-journey diagram on the landing page was invisible for this
reason; the asset and the network request were both fine.

**How to apply:** keep the observed element unclipped (travel/opacity only) and
move the mask to an inner `motion.div` driven by the parent's variant labels
(`initial="hidden"` / `whileInView="shown"` on the parent, matching `variants`
on the child, no `initial` on the child). A partial clip such as
`inset(14% 0% 14% 0%)` is safe to animate in place because the element still
intersects. If a reveal never fires, check for a self-clipping start state before
suspecting the trigger threshold.

# No pointer-following ("magnetic") wrappers on buttons

Buttons that drift toward the cursor read as a glitch to this client, not as
polish — the landing CTAs shipped with a spring-driven `x`/`y` follow and it was
the first thing flagged. Hover feedback stays colour, shadow and the arrow
nudge. Don't reintroduce a pointer-tracking wrapper around a CTA.

# Above-the-fold entrance chains must finish fast

An entrance sequence whose last step lands ~1s after mount means CTAs and stat
strips are still invisible in automated screenshots — and to anyone who scrolls
immediately. Keep the whole hero chain inside roughly 0.7s. If a screenshot
shows blank space where content should be, suspect entrance delay before
suspecting a layout or data bug.
