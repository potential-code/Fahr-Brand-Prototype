---
name: FAHR federal data spine
description: How the shared non-learner mock data is authored and why screens must not compute their own totals
---

## Author a figure in exactly one place, derive everything else

The non-learner mockup data has one authoring level — the entity/ministry headline row. Department rows are *generated* from their ministry's headline (head counts, learners, twins and readiness split so they sum and weight back to it), and the federal totals are *summed* from the ministries. A screen must read the level it displays and never add figures up itself.

**Why:** the four role consoles are walked back-to-back in one demo sitting, so a leadership total that disagrees with the entity drill-down is the single most visible failure. When every screen kept its own array, they all disagreed.

**How to apply:** add a new number at the ministry authoring level and let the split helpers push it down; if a screen needs a total, take it from the derived layer. Readiness is normalised so the employee-weighted mean rounds back to the authored ministry score — never hand-write absolute department scores.

## Live learner state beats flattering demo numbers

The learner the demo just played as appears in her manager's team with her *actual* assessment score, gaps and step-weighted course progress, derived from the learner progress context — not with authored numbers. Her status and level are computed from those live signals by the same helpers used for everyone else.

**Why:** the demo's whole claim is "one platform, one data model". A manager screen showing a nicer number than the learner just saw breaks it in the most noticeable possible place.

## Departments with no authored roster synthesise one

Any department can be drilled into, so a department without hand-written people generates a deterministic roster (seeded PRNG, centred on that department's readiness) rather than showing an empty table.

**Why:** stakeholders click every row; an empty drill-down reads as broken. Deterministic generation keeps repeated visits identical.

## Cross-role decisions live in a session store, not in the pages

Decisions (sign off, request revision, endorse, escalate, issue credential, adjust quota) are actions on a provider that overlays a mutable slice on the seed and persists it in sessionStorage. Notifications are *derived* from that state, so one role's action clears its own alert and raises the next role's.

**How to apply:** never mutate a page's local copy of a submission — call the action, then let each role's view and notification list recompute.
