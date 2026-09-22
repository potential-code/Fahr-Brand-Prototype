# FAHR prototype — demo refinements

**Date:** 2026-09-22
**Status:** approved for planning

Twenty-one changes across six areas of the FAHR learner prototype, driven by a
client demo. Four of them are new behaviour (landing bilingualism, adaptive
remediation, PII screening in the twin, competency badges and a certificate);
the rest are removals, restructures and copy.

The prototype is front-end only. Every "simulation" below is deterministic
client-side state — nothing is persisted server-side and nothing calls a model.

---

## 1. Landing page — English / Arabic toggle

### What

A language toggle in the landing header. Switching to Arabic translates every
landing section and flips the page to RTL. The toggle governs the **landing
page only**: navigating into the app resets to English and LTR.

### Why this shape

`lib/LanguageContext.tsx` already exists, already holds `en`/`ar`, already sets
`document.documentElement.dir`, and already carries ~16 `nav.*` / `btn.*` keys.
The app shell reads those keys but no page body does, so today the toggle would
produce a half-translated app. Restricting the toggle to the landing page is
what makes the feature honest: a fully bilingual marketing surface, with app
localisation stated as later work.

### Design

**Translation keys.** Extend the existing `translations` object with a
`landing.*` namespace, one key per string in the eight landing components.
Estimated 120–160 keys. Arabic is Modern Standard, government register,
written as part of this work and flagged for human review before the demo.

Keys are flat and dotted by component — `landing.hero.headline`,
`landing.pathways.learner.title` — so a missing key is obvious in review.
`t()` already falls back to the key itself, which makes an untranslated string
visible rather than silently English.

**Toggle.** Lives in `LandingHeader`, rendered as a two-state `EN | ع` control.
It calls the existing `setLanguage`.

**RTL.** Tailwind logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`,
`text-start`, `text-end`), plus `rtl:rotate-180` on directional arrow icons.
The codebase already uses this convention in places (`PersonalisedLearningPathway`,
`CoursePlayer`); the landing components use physical properties in several spots
and will be converted. No second stylesheet, no `dir`-specific components.

**Reset on leaving.** A `useEffect` in the app shell sets language back to `en`
whenever the active route is not the landing route. Placing it on the route
rather than on the navigation handler means it holds for deep links, the back
button and programmatic navigation alike.

### Files

`lib/LanguageContext.tsx`, `components/landing/{LandingHeader,HeroSection,PathwaysSection,JourneySection,EcosystemSection,LabSection,CtaSection,LandingFooter}.tsx`,
`components/landing/agents.ts`, `App.tsx`.

---

## 2. Copy — "line manager" → "department manager"

101 occurrences across 24 files, including tests and seed data. Case-preserving
replacement (`Line manager` → `Department manager`). Arabic strings that render
the same concept (`المدير المباشر`) are reviewed in the same pass and changed to
`مدير الإدارة` where they translate the English phrase.

### Files

24 files across `pages/`, `components/`, `lib/` and `test/`. Mechanical.

---

## 3. Agent wording — Assessment and Content

The client deck (*FAHR Agentic AI Platform Presentation*, slide 15) names the
same six agents the prototype uses, so no renaming is required. Slide 15 defines
the Assessment Agent as *"Evaluates capability progression and the quality of
outcomes"*; slide 10 adds *"AI + human review — quality and impact assessed
together, not an MCQ"*. The deck does not mention pre- and post-assessments, so
that framing comes from the client conversation and is additive, not a
correction.

Final wording:

- **Assessment Agent** — prepares the pre- and post-assessment for each pathway,
  then evaluates capability progression and the quality of outcomes.
- **Content Agent** — builds the learning-path content from the courses admins
  create, plus on-demand AI-generated material.

Applied wherever each agent describes itself: the landing agent cards, the
course player's adaptive-knowledge-check framing, and the recommendation copy.

### Files

`components/landing/agents.ts`, `lib/recommendations.ts`, `lib/coach.ts`,
`pages/CoursePlayer.tsx`.

---

## 4. Learner pathway page

### Removals

Two sections come out of `pages/PersonalisedLearningPathway.tsx`:

- **"More practice, open any time"** — the `plan.practice` grid.
- **"Your coaching plan and next checkpoint"** — the `plan.coaching` timeline
  and the `Next targeted assessment` card.

`buildRecommendations` still produces `practice`, `coaching` and
`nextAssessment`; other screens consume them, so the builder is left alone and
only the rendering is removed.

### Reorder

`Courses in your pathway` currently renders *above* the ordered journey. It
moves *below* `PathwayTimeline` and is retitled **Additional courses**, with the
caption reframed accordingly ("open at any time, alongside your sequenced
journey"). The ordered journey becomes the first thing under the progress card.

### Ordered journey restyle

`components/pathway/PathwayTimeline.tsx` gains visual weight:

- Step icon container 40px → 64px, icon 20px → 28px.
- Each entry whose item has a `courseId` shows a 160×96 course image on the
  trailing side of the row, rounded, with a subtle gradient scrim.
- Non-course steps (microlearning, simulation, live session, re-check) keep the
  icon-only treatment so the journey still reads as a sequence rather than a
  card grid.
- The connector rail runs behind the icons at reduced opacity.

**Imagery.** Reuse the four images already in `public/brand/learning/`:
`course-ai-foundations.jpg`, `course-ai-governance.jpg`,
`course-prompt-engineering.jpg`, `course-default.jpg`. No new art. `Course`
already carries an `image` field, so the timeline resolves
`item.courseId → COURSE_BY_ID[id].image` rather than holding a map of its own.

### Files

`pages/PersonalisedLearningPathway.tsx`, `components/pathway/PathwayTimeline.tsx`.

---

## 5. Course view

### 5.1 Remove the Coaching Agent here only

The bottom-right "Coaching Agent" pill is `components/AIConcierge.tsx`, rendered
by `Layout` for every learner route. The right-edge "Learning Agent" tab is
`components/coach/CoachDock.tsx`, rendered by `CoursePlayer` itself, and stays.

`Layout` gains an optional `hideConcierge?: boolean` prop, passed by
`CoursePlayer`. A prop rather than a route check inside `Layout`, so the
decision is visible at the call site and no route string is duplicated.

### 5.2 Capitalise lesson kinds

`LessonBody` already renders the kind through `className="capitalize"`. The
course **outline** builds its meta string as `` `${lesson.type} · ${lesson.duration}` ``,
which is where the lowercase in the screenshot comes from.

Add a `LESSON_TYPE_LABEL: Record<LessonType, string>` map in `lib/learningData.ts`
(`reading → "Reading"`, `video → "Video"`, `activity → "Activity"`) and use it in
both places, dropping the `capitalize` class. One source of truth, and it gives
the later Arabic pass somewhere to hang a translation.

### 5.3 Real video embeds

There are exactly three `type: "video"` lessons in `lib/learningData.ts` and
exactly three YouTube links supplied, so the mapping is 1:1 and explicit rather
than cycled:

| Lesson | Video |
|---|---|
| video lesson 1 | `zqowMgMgSjA` |
| video lesson 2 | `mUw27wG7uFA` |
| video lesson 3 | `_ZqSFVi6UDY` |

`Lesson` gains a required-for-video `videoId?: string`. A new
`components/learning/VideoEmbed.tsx` renders a `youtube-nocookie.com/embed/{id}`
iframe in a 16:9 container with `loading="lazy"`, `title` set from the lesson
title, and `allowfullscreen`.

**No empty placeholder may remain.** `VideoEmbed` has no poster/play-button
fallback state: a video lesson without a `videoId` is a type error, not a
runtime placeholder. The one other `aspect-video` placeholder in the learner
surface — `components/dashboard/AdvisorPanel.tsx`, which renders three
`brand/video-*.png` thumbnails — is checked in the same pass; those are real
images behind a play affordance, so they stay as they are unless the walkthrough
shows them reading as empty.

### 5.4 Post-assessment remediation

**Trigger.** The course's final assessment is the post-assessment. The first
attempt always scores low. After the revision units are completed, a retake
passes.

`components/learning/StepQuiz.tsx` today exposes only `onPass` and disables its
continue button until `correctCount >= passMark`. It gains an
`onAttempt?: (correct: number, total: number) => void` callback fired on every
submission, and a `failNote` for the below-pass state, so the quiz can report a
failure instead of silently blocking.

**Behaviour.** On the first below-pass final attempt, `CoursePlayer`:

1. Records `remediation: { courseId, competencyId, addedAt }` in
   `LearnerProgressContext`, so it survives navigation and refresh.
2. Renders a `RemediationBanner` above the outline — Content Agent attribution,
   the score, the competency identified as weak, and what was added.
3. Injects a **Revision** group into the course outline containing two units,
   visually marked "Added by the Content Agent" with a distinct icon and tint so
   a client can see it was not part of the original course.
4. Re-locks the final assessment until both revision units are complete.

The two revision units are authored per course in `lib/learningData.ts` as a
`revisionUnits` field, targeting that course's competency. Authored rather than
generated: the demo needs the content to be good, and generating plausible
lesson bodies client-side is not something this prototype does anywhere else.

**Retake.** With `remediation` recorded and both units complete, the final
assessment reopens and passes normally. The banner switches to a completed
state rather than disappearing, so the story is still visible on screen after
the fact.

### Files

`pages/CoursePlayer.tsx`, `components/Layout.tsx`,
`components/learning/StepQuiz.tsx`, new `components/learning/VideoEmbed.tsx`,
new `components/learning/RemediationBanner.tsx`, `lib/learningData.ts`,
`lib/LearnerProgressContext.tsx`.

---

## 6. Digital twin

### 6.1 Guardrails become policy, not controls

Today `components/twin/GuardrailControls.tsx` renders four federal guardrails as
switches, and the surrounding copy invites the user to switch one off and watch
the answer degrade.

The new model:

- **Two** federal guardrails remain: `noPersonalData` ("No sensitive personal
  data") and `approvedKnowledgeOnly` ("Approved knowledge only").
- `humanReview` ("Human review required") and `auditTrail` ("Full audit trail")
  are removed entirely — from `GUARDRAILS`, from `TwinProfile.guardrails`, and
  from the `answer()` branches that reference them.
- The two remaining guardrails render as a **read-only "Always on"** list: lock
  icon, policy chip, no `Switch`. They cannot be relaxed.
- **Custom rules** keep the ✕ remove button and lose their `Switch`. A custom
  rule is present or it is deleted; there is no disabled state.

This deletes the "relax a guardrail and watch it break" demo. That is
intentional and was confirmed with the client — a federal audience should not be
shown a control that turns federal policy off.

### 6.2 Consequent removals

- The **"Twin governance score"** card in `pages/AgenticAILabTwin.tsx`, and
  `scoreTwin`'s guardrail-relaxation penalty in `lib/digitalTwin.ts`.
- The **"Stage 2: Build a full agentic process"** Phase-2 roadmap card.
- `activeGuardrailCount` / `totalGuardrailCount` if nothing else consumes them
  after the above.
- The `describeGuardrails` line that reports "Applied N of M governance
  guardrails" is reworded, since M is now fixed and N always equals it.
- `test/digital-twin.test.ts` has a `describe("the Assessment Agent scores the
  twin")` block asserting the relaxation penalty. It is removed with the feature
  and replaced by tests for the PII screen.

### 6.3 PII screening simulation

`lib/digitalTwin.ts` already screens prompts, but only against a keyword list
(`PERSONAL_DATA_TERMS`) — it catches the phrase "phone number" and misses an
actual number. The demo requires typing a real name and phone and seeing them
caught.

New `lib/piiScreen.ts`, called by `answer()` before anything else:

```
screenForPii(text) -> { hit: boolean, findings: Finding[], redacted: string }
Finding = { kind, label, match, start, end }
```

Detected kinds, each a named pattern so a finding can be labelled in the UI:

| Kind | Pattern |
|---|---|
| Emirates ID | `784-YYYY-NNNNNNN-C`, with or without separators |
| UAE phone | `+971` / `00971` / `05` followed by 8 digits, separators tolerated |
| Email | standard address shape |
| IBAN | `AE` + 21 alphanumerics |
| Passport | letter + 7–8 digits, word-bounded |
| Date of birth | a date preceded by a birth-related word |
| Personal name | a capitalised two-or-three-word sequence introduced by a
  first-person phrase ("my name is", "I am", "اسمي") |
| Keyword | the existing `PERSONAL_DATA_TERMS` list, retained |

The name rule is deliberately narrow — anchored to an introducing phrase rather
than any capitalised pair — because a false positive on "Ministry of Health"
would be worse in front of this audience than missing an unprompted name.

**UI.** `components/twin/TwinTestChat.tsx` renders a blocked message as a
distinct card, not an ordinary assistant reply:

- A destructive-tinted panel headed **"Blocked before it reached the model"**.
- The learner's message shown **redacted** — each finding replaced by a chip
  naming what it was (`[phone number]`, `[full name]`) — so they can see exactly
  what was caught.
- A line per finding: what kind it was, and that it was discarded.
- Three explicit assurances: *not sent to the model*, *not stored*, *not
  written to any log*.
- The policy chip already carried by the `noPersonalData` guardrail.
- A "Rephrase in aggregate terms" affordance that clears the input to a
  suggested safe version.

The redaction happens in the render path from `findings`; the raw text is never
placed in component state, which is what makes the "not stored" claim true
rather than decorative.

### 6.4 Demo chips

Four suggestion chips under the empty state, one per behaviour:

1. **Grounded answer** — a task the learner taught the twin, returning a cited
   answer.
2. **Outside approved knowledge** — a plausible but unconnected question,
   returning the honest refusal.
3. **Personal data** — prefills a message containing a name and a UAE phone
   number, so the block can be shown in one click.
4. **Real work task** — a drafting request in the learner's own domain, showing
   the twin doing something useful.

Chips are derived from the learner's actual twin profile where possible (chips 1
and 4 read `profile.tasks`), so they stay true if the interview answers change.

### Files

`pages/AgenticAILabTwin.tsx`, `components/twin/GuardrailControls.tsx`,
`components/twin/TwinTestChat.tsx`, `lib/digitalTwin.ts`,
`lib/DigitalTwinContext.tsx`, new `lib/piiScreen.ts`,
`test/digital-twin.test.ts`, new `test/pii-screen.test.ts`.

---

## 7. Evaluation and Recognition

### 7.1 Rename

**"Evaluation & Certification" → "Project Evaluation"**, in the sidebar
(`nav.evaluation`, both `en` and `ar`), the dashboard quick links, and the page
heading. The page description drops "turned into a credential", since
certification now lives on Recognition.

### 7.2 Removals

| Section | Location |
|---|---|
| "What was evaluated / Who evaluated it / What it leads to" strip | `pages/AgenticAIEvaluation.tsx` |
| "Measured workplace impact" card | `components/recognition/StandingPanels.tsx` |
| "Digital credentials wallet" | `components/recognition/CredentialWallet.tsx` (deleted) |
| "Badges and achievements" grid | `components/recognition/AchievementsGrid.tsx` (deleted) |
| "Share what earned this" / "Earn the next credential live" | `pages/RecognitionAndImpact.tsx` |

`buildRecognitionRecord` still computes `credentials` and `achievements`; the
fields are removed only once nothing reads them, to avoid breaking the manager
and ministry screens that share the module.

### 7.3 Competency badges

Replaces the old six achievement badges. Five badges, one per competency in
`COMPETENCIES` (`literacy`, `prompting`, `analytics`, `agentic`, `governance`).

- **Flat, not tiered.** A badge is earned or locked.
- **Earned when** `result.scores[competencyId] >= 55` — the `min` of the
  `practitioner` band in `SCORE_BANDS`. The threshold is read from that band,
  not hard-coded, so re-banding the assessment moves the badges with it.
  `AssessmentResult.scores` already holds a percentage per competency; no new
  counter is introduced.
- Locked badges show the competency, the threshold, and current distance to it.
- Each badge is a distinct mark — competency icon on a FAHR-palette medallion —
  so the grid reads as a set rather than six identical circles.

New `components/recognition/CompetencyBadges.tsx`, fed by a
`competencyBadges` field added to `buildRecognitionRecord`.

### 7.4 Project certificate

The learner's certificate for an approved, scored workplace project.

**Demo state.** The project starts **submitted and approved**, so Recognition
shows a finished certificate on load. `pages/AgenticAIEvaluation.tsx` already
uses `demoSubmission(...)` as a fallback when nothing was submitted this
session; `WorkplaceProjectContext` is seeded from the same helper so both
screens agree without a second source of truth.

**Component.** New `components/recognition/ProjectCertificate.tsx`:

- Inline preview card, clicking opens a full-screen dialog.
- Certificate content: FAHR logo and seal, learner name, project title, the
  competencies demonstrated, the evaluation score, issue date, verification ID
  (reusing `verifyId` from `recognitionRecord.ts`), and the human reviewer's
  title.
- Landscape aspect, bordered, restrained — this is the one surface on the
  platform allowed to look formal rather than product-like.
- A **"Download PDF"** button that fires a toast reading "Certificate
  downloaded" and does nothing else. Demo-only by explicit decision; no file is
  produced.

### Files

`pages/AgenticAIEvaluation.tsx`, `pages/RecognitionAndImpact.tsx`,
`components/recognition/{RecognitionHero,StandingPanels}.tsx`,
deleted `components/recognition/{CredentialWallet,AchievementsGrid}.tsx`,
new `components/recognition/{CompetencyBadges,ProjectCertificate}.tsx`,
`lib/recognitionRecord.ts`, `lib/WorkplaceProjectContext.tsx`,
`components/dashboard/QuickLinksGrid.tsx`, `lib/LanguageContext.tsx`.

---

## 8. Assessment report

Remove the **"What you already do well" / "Where the gain is"** two-column card
from `pages/AssessmentReport.tsx`. The "Your top three development priorities"
section that follows it moves up to close the gap; its top margin is adjusted so
the page does not open with a void where the card was.

---

## Testing

- `pnpm typecheck` across the workspace.
- `pnpm test` — the existing vitest suite, minus the deleted guardrail-scoring
  block, plus:
  - `test/pii-screen.test.ts` — each detector fires on a positive case and
    stays silent on a near-miss (a budget figure is not a phone number; an
    entity name is not a person).
  - a remediation test — first final attempt fails, two revision units appear,
    retake passes.
  - an updated `test/digital-twin.test.ts` covering the two-guardrail model.
- A manual walkthrough of every changed screen in the running app, in both
  languages on the landing page.

## Out of scope

- Arabic anywhere except the landing page.
- A real PDF. The download is a toast.
- Server-side persistence of anything described here.
- Renaming the six agents; the deck and the prototype already agree.
