---
name: Sidebar active state and nav motion
description: Deepest-match nav highlighting rule and the layout-animation constraint behind it
---

## Highlight only the deepest matching nav item

Navigation matching picks the single longest matching entry, and each role's index entry is marked exact-match only. Without this, a plain prefix test lights a role's "Dashboard" on every screen beneath it, so two items appear active at once (the reported bug). Nested detail routes must highlight their parent list entry, nothing else.

**Why:** a prefix match plus a hardcoded exception for one role's index is the shape that caused the bug — the exception hid it for the learner while every other role stayed broken.

**How to apply:** when adding a nav entry, mark it exact only if a deeper route sits under the same path; otherwise leave it prefix-matching so its detail routes keep it lit. Assert "exactly one item active" in tests, not "the expected item is active".

## Desktop and mobile sidebars need separate layout-animation ids

Both sidebars render from the same item renderer, so the sliding active pill needs a distinct shared-layout id per surface — one id across both makes the pill fly between the desktop aside and the open mobile sheet.

## Sheet content needs a title even when the visible header is a logo

A Radix sheet or dialog without a title emits accessibility warnings in the console. Add a screen-reader-only title and description rather than leaving the warning to be rediscovered as a "console error" in every future test run.
