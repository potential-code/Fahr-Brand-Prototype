---
name: Deterministic tests for motion-heavy screens
description: How to keep animated counters, scroll reveals and stagger effects testable in jsdom without special-casing components.
---

Motion-heavy screens (animated counters, scroll-triggered chart reveals, staggered list
entrances) render placeholder or zero values in jsdom, so assertions on final numbers flake
or fail outright.

**Rule:** solve it once in the test setup, never in the components.
- Report `prefers-reduced-motion: reduce` from the `matchMedia` stub so motion primitives
  take their reduced-motion path and paint final values immediately.
- Stub `IntersectionObserver` so anything gated on "scrolled into view" considers itself
  visible.

**Why:** the alternative — a `disableAnimation` prop, or test-only branches inside each
animated component — spreads test concerns through product code and rots as soon as a new
animated surface is added. The reduced-motion path already has to exist for accessibility,
so tests simply reuse it, which also means the tests exercise a path real users get.

**How to apply:** when a new animated surface is added and its numbers assert as `0` or
empty in unit tests, check the shared test setup first rather than touching the component.
Screenshots of these pages taken mid-animation legitimately show low counter values — do
not "fix" a figure based on a screenshot alone; confirm against the source data.
