---
name: Manager team surfaces (heatmap, benchmark, recognition)
description: Rules the line-manager surfaces follow — proficiency colouring, where benchmark figures come from, and when applied impact starts counting.
---

## A low competency score is a development priority, not an error

Colour the gap heatmap (and any per-person competency read) with the capability-ladder
bands — leading / proficient / building / priority — not with the green/amber/red
"score tone" the entity report cards use.

**Why:** the programme's own language frames a weak competency as the next thing to
learn; a red cell reads as a failing person and reviewers pushed back on it.

**How to apply:** derive the band from the ladder thresholds in the manager selector
layer and tint with primary tints plus one accent for the weakest band. Keep a
`print:` fallback so the matrix survives the PDF layout, where background tints drop.

## Benchmark comparators are authored figures, never re-summed

Team-vs-department-vs-entity comparisons read the department and entity readiness
straight off the existing authored/derived rollups; only the team's own average is
computed from its members.

**Why:** the platform's core rule is author a figure once and derive the rest — a
manager screen that averages departments itself will quote a number no other role
sees.

**How to apply:** compute in the shared manager selectors, take comparators from the
existing entity rollups, and assert in tests that the rendered comparator equals the
authored figure.

## Applied impact counts from the moment a manager validates

Team impact, recognition and challenge eligibility aggregate submissions from the
"awaiting entity" state onward — never from "awaiting manager".

**Why:** the demo's whole point is that signing off visibly moves hours saved,
credentials and standing. Counting unvalidated submissions makes sign-off a no-op on
screen; counting only fully deployed ones makes it invisible until much later.

**How to apply:** keep one validated-state list in the manager selector layer and use
it for impact totals, recognition badges and top contributors alike. There is no
`signed_off` submission state — sign-off moves a project to awaiting entity.

## Recognition uses one points scale, the learner's

The manager recognition surface reuses the learner achievement vocabulary (badges,
ladder standing) and only shows impact points for the live demo learner, who actually
has them.

**Why:** inventing a manager-side score creates a second, contradictory ranking of the
same people. Rank contributors on applied impact, then credentials, then capability.
