# FAHR Demo Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land twenty-one client-requested changes across the FAHR learner prototype — a bilingual landing page, four restructured screens, a post-assessment remediation simulation, PII screening in the digital twin, and competency badges with a project certificate.

**Architecture:** This is a front-end-only prototype: a Vite + React 19 SPA in a pnpm workspace, routed by `wouter`, with all state in React contexts backed by `localStorage`. There is no server and no model call — every "agent" and "simulation" is deterministic client-side logic in `src/lib/`. Changes follow that grain: behaviour goes in `src/lib/`, presentation in `src/components/`, and screens in `src/pages/` compose the two.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Radix UI (`components/ui`), framer-motion, wouter, vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-22-fahr-demo-refinements-design.md`

## Global Constraints

- **Working directory for all paths below:** `artifacts/fahr-platform/`. A path written `src/lib/foo.ts` means `artifacts/fahr-platform/src/lib/foo.ts`.
- **Run tests from the repo root:** `pnpm --filter @workspace/fahr-platform run test`. Append a path to run one file: `... run test src/test/pii-screen.test.ts`.
- **Typecheck from the repo root:** `pnpm typecheck`. It covers the whole workspace and must pass before any commit.
- **The `@/` alias** resolves to `artifacts/fahr-platform/src/`. Use it in all imports; never write a relative path that climbs out of a directory.
- **Vitest runs with `globals: true`** — `describe`, `it` and `expect` are still imported explicitly in this codebase's tests. Follow that.
- **Agent names come from `AGENTS` in `@/lib/constants`.** Never hard-code an agent name in JSX; interpolate `AGENTS.assessment`, `AGENTS.content`, etc.
- **RTL-safe spacing everywhere you touch:** use Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`), not `ml-*`/`mr-*`/`text-left`. Directional icons get `rtl:rotate-180`.
- **Copy rule:** the phrase is **"department manager"**, never "line manager". Capital only at the start of a sentence.
- **Never change `pnpm-workspace.yaml`.** Its `minimumReleaseAge` and platform `overrides` are load-bearing; adding a dependency is out of scope for this plan.
- **Commit after every task**, using the message given in the task's final step.

---

### Task 1: Copy sweep — "line manager" becomes "department manager"

Mechanical and wide, so it goes first: every later task then edits text that already reads correctly.

**Files:**
- Modify: 24 files across `src/pages/`, `src/components/`, `src/lib/`, `src/test/` (enumerated by the command in Step 1)

**Interfaces:**
- Consumes: nothing
- Produces: nothing — pure copy

- [ ] **Step 1: See the full extent before changing anything**

```bash
cd artifacts/fahr-platform
grep -rn "line manager\|Line manager\|Line Manager" src/ | wc -l   # expect 101
grep -rln "line manager\|Line manager\|Line Manager" src/          # expect 24 files
```

- [ ] **Step 2: Replace, preserving case**

```bash
cd artifacts/fahr-platform
grep -rl "line manager\|Line manager\|Line Manager" src/ \
  | xargs sed -i -e 's/line manager/department manager/g' \
                 -e 's/Line manager/Department manager/g' \
                 -e 's/Line Manager/Department Manager/g'
```

- [ ] **Step 3: Handle the Arabic equivalent**

The Arabic `المدير المباشر` ("direct manager") is the translation of the English phrase and moves with it. Find and replace:

```bash
cd artifacts/fahr-platform
grep -rn "المدير المباشر\|مديرك المباشر" src/
sed -i -e 's/المدير المباشر/مدير الإدارة/g' -e 's/مديرك المباشر/مدير إدارتك/g' \
  $(grep -rl "المدير المباشر\|مديرك المباشر" src/)
```

- [ ] **Step 4: Verify nothing was missed and nothing was mangled**

```bash
cd artifacts/fahr-platform
grep -rn "line manager\|Line manager\|Line Manager" src/   # expect no output
grep -rn "department manager\|Department manager" src/ | wc -l   # expect 101
```

- [ ] **Step 5: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS. Test files contain the phrase in assertions and were rewritten by the same sweep, so they stay in sync.

- [ ] **Step 6: Commit**

```bash
git add -A artifacts/fahr-platform/src
git commit -m "Rename line manager to department manager throughout"
```

---

### Task 2: Agent wording — Assessment and Content

**Files:**
- Modify: `src/components/landing/agents.ts:76-92` (the `assessment` and `content` entries)

**Interfaces:**
- Consumes: `AGENTS` from `@/lib/constants`
- Produces: nothing — copy only. Agent *names* are unchanged; the deck and the prototype already agree on all six.

- [ ] **Step 1: Rewrite the Assessment Agent entry**

In `src/components/landing/agents.ts`, replace the `tagline`, `description` and `capabilities` of the `key: "assessment"` entry:

```ts
    tagline: "Sets and marks the test",
    description:
      "Prepares the pre- and post-assessment for each pathway, then evaluates capability progression and the quality of the work delivered.",
    stages: ["Assess & validate", "Recognition & impact"],
    sample:
      "Your pre-assessment put prompt design ahead of oversight, so the post-assessment weights oversight twice. Implementation quality 4/5: the workflow has a named approver and a fallback, but nothing measuring what it saved.",
    capabilities: ["Pre- and post-assessment", "Rubric with a reasoning trace"],
```

- [ ] **Step 2: Rewrite the Content Agent entry**

Replace the same three fields on the `key: "content"` entry:

```ts
    tagline: "Builds the material",
    description:
      "Builds the learning-path content from the courses entity admins create, and generates extra scenarios, cases and knowledge checks on demand, in Arabic and English.",
    stages: ["Personalised pathway", "Experiential learning"],
    sample:
      "Your entity admin published three courses this month. I have sequenced two of them into your pathway and generated a six-step case study on your public-awareness campaign, with an Arabic version and a knowledge check.",
    capabilities: ["Builds from admin courses", "Bilingual by default"],
```

- [ ] **Step 3: Check no other surface contradicts the new wording**

```bash
cd artifacts/fahr-platform
grep -rn "AGENTS.assessment\|AGENTS.content" src/ --include=*.tsx --include=*.ts
```

Read each hit. Any sentence that describes the Assessment Agent as only marking, or the Content Agent as only curating, is reworded to match. Leave usages that merely attribute an action (`Assigned by your ${AGENTS.content}`) alone.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Reword the Assessment and Content agents to match the client deck"
```

---

### Task 3: Assessment report — remove the strengths and gains card

**Files:**
- Modify: `src/pages/AssessmentReport.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Locate the block**

```bash
cd artifacts/fahr-platform
grep -n "What you already do well\|Where the gain is" src/pages/AssessmentReport.tsx
```

- [ ] **Step 2: Delete the whole card**

Remove the JSX element containing both headings — the two-column `Card` with `What you already do well` on the left and `Where the gain is` on the right, including its wrapping `ScrollReveal`/`motion` element if it wraps only this card.

- [ ] **Step 3: Close the gap**

The `CAPABILITY AGENT / Your top three development priorities` section immediately follows. If it carried a top margin that assumed the deleted card above it (`mt-8`, `mt-10`), reduce it to match the spacing used between the report's other sections. Read the two sections above and below and match their rhythm — do not invent a new spacing value.

- [ ] **Step 4: Remove now-unused imports**

```bash
cd artifacts/fahr-platform
pnpm typecheck 2>&1 | grep AssessmentReport
```

TypeScript reports unused imports as errors under this config. Delete any icon or helper import (likely `TrendingUp`, `TrendingDown`, or a `strengths`/`gaps` selector) that only the deleted card used.

- [ ] **Step 5: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 6: Commit**

```bash
git add artifacts/fahr-platform/src/pages/AssessmentReport.tsx
git commit -m "Remove the strengths and gains card from the assessment report"
```

---

### Task 4: Pathway page — remove two sections, move courses below the journey

**Files:**
- Modify: `src/pages/PersonalisedLearningPathway.tsx`

**Interfaces:**
- Consumes: `buildRecommendations` from `@/lib/recommendations` (unchanged — other screens still use `plan.practice`, `plan.coaching` and `plan.nextAssessment`)
- Produces: nothing

- [ ] **Step 1: Delete the "More practice, open any time" section**

Remove the entire `{plan && plan.practice.length > 1 && (...)}` block — the `ScrollReveal` containing the `Dumbbell` heading and the `plan.practice.slice(1)` grid.

- [ ] **Step 2: Delete the "Your coaching plan and next checkpoint" section**

Remove the entire `{plan && (...)}` block that follows it — the `MessagesSquare` heading, the coaching `<ol>`, and the `card-next-assessment` card.

- [ ] **Step 3: Move the courses section below the ordered journey**

Cut the `{courses.length > 0 && (<ScrollReveal className="mb-10"> ... </ScrollReveal>)}` block and paste it *after* the `{/* Ordered pathway */}` `ScrollReveal`. Change its wrapper class from `mb-10` to `mt-10` so the spacing now sits above it rather than below.

- [ ] **Step 4: Retitle it**

Within the moved block, replace the heading and caption:

```tsx
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Target className="h-3.5 w-3.5" /> Assigned by your {AGENTS.capability}
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">Additional courses</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Matched to your priority gaps and open at any time, alongside your sequenced journey.
                </p>
```

- [ ] **Step 5: Remove now-unused imports**

`CalendarCheck`, `Clock`, `Dumbbell` and `MessagesSquare` were used only by the deleted sections. Remove them from the `lucide-react` import. Keep `Target`, `Route`, `Sparkles`, `ArrowRight`, `ClipboardList`.

If `plan` is now referenced nowhere, remove the `plan` `useMemo` and the `buildRecommendations` import too — but check first:

```bash
cd artifacts/fahr-platform
grep -n "plan\b" src/pages/PersonalisedLearningPathway.tsx
```

- [ ] **Step 6: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 7: Commit**

```bash
git add artifacts/fahr-platform/src/pages/PersonalisedLearningPathway.tsx
git commit -m "Reorder the pathway page around the ordered journey"
```

---

### Task 5: Pathway timeline — bigger icons and course imagery

**Files:**
- Modify: `src/components/pathway/PathwayTimeline.tsx`

**Interfaces:**
- Consumes: `TimelineEntry` (already exported from this file), `COURSE_BY_ID` from `@/lib/learningData`
- Produces: unchanged export surface — `PathwayTimeline` and `type TimelineEntry`

- [ ] **Step 1: Read the current component end to end**

```bash
cd artifacts/fahr-platform
cat src/components/pathway/PathwayTimeline.tsx
```

Note the existing icon container size, the connector rail, and how `entry.status` drives colour. The restyle keeps all three mechanisms and changes their scale.

- [ ] **Step 2: Resolve the course image for entries that have one**

Add near the top of the component file:

```tsx
import { COURSE_BY_ID } from "@/lib/learningData";

const BASE = import.meta.env.BASE_URL;

/** The course art for a step, or null for microlearning, sessions and re-checks. */
function stepImage(courseId: string | undefined): string | null {
  if (!courseId) return null;
  const course = COURSE_BY_ID[courseId];
  return course ? `${BASE}${course.image}` : null;
}
```

- [ ] **Step 3: Enlarge the step icon**

In the row that renders each entry's icon, change the container from its current size to:

```tsx
        <span
          className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${statusClasses}`}
        >
          <Icon className="h-7 w-7" />
        </span>
```

Keep whatever `statusClasses` expression already encodes completed / current / locked colouring — only the geometry changes.

- [ ] **Step 4: Render the image on the trailing side**

Inside each entry row, after the text column, add:

```tsx
        {stepImage(entry.item.courseId) && (
          <div className="relative hidden h-24 w-40 shrink-0 overflow-hidden rounded-xl sm:block">
            <img
              src={stepImage(entry.item.courseId)!}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
        )}
```

The row's flex container needs `items-center gap-4` so the image aligns against the taller icon. Hidden below `sm` so the mobile timeline stays a list.

- [ ] **Step 5: Push the connector rail behind the icons**

The rail is the vertical line between steps. Give it `-z-0` (or remove its `z` class and add `z-10` to the icon span, as in Step 3) and drop its opacity so the larger icons read as the primary rhythm:

```tsx
          <span className="absolute inset-y-0 start-8 w-px -translate-x-1/2 bg-border/60" aria-hidden="true" />
```

`start-8` centres the rail under a 64px (`w-16`) icon. Use `start-*`, not `left-*`, so RTL mirrors correctly.

- [ ] **Step 6: Check it in the browser**

Run: `pnpm dev` from the repo root, open the learner pathway, and confirm: icons are visibly larger, course steps show art, non-course steps do not, and the rail runs behind rather than through the icons.

- [ ] **Step 7: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 8: Commit**

```bash
git add artifacts/fahr-platform/src/components/pathway/PathwayTimeline.tsx
git commit -m "Give the ordered journey larger icons and course artwork"
```

---

### Task 6: Capitalise the lesson kinds

**Files:**
- Modify: `src/lib/learningData.ts`, `src/pages/CoursePlayer.tsx`

**Interfaces:**
- Produces: `LESSON_TYPE_LABEL: Record<LessonType, string>` exported from `@/lib/learningData`, consumed by Task 7 and Task 11.

- [ ] **Step 1: Add the label map**

In `src/lib/learningData.ts`, directly beneath the `LessonType` declaration:

```ts
/**
 * Display labels for lesson kinds. One source of truth so the outline and the
 * lesson header can never disagree, and so the Arabic pass has somewhere to
 * hang a translation.
 */
export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  reading: "Reading",
  video: "Video",
  activity: "Activity",
};
```

- [ ] **Step 2: Use it in the outline**

In `src/pages/CoursePlayer.tsx`, the outline builds its meta string as `` `${lesson.type} · ${lesson.duration}` ``. Change it to:

```tsx
                          `${LESSON_TYPE_LABEL[lesson.type]} · ${lesson.duration}`,
```

- [ ] **Step 3: Use it in the lesson header and drop the `capitalize` class**

In `LessonBody`, replace:

```tsx
        <span className="capitalize">{lesson.type}</span>
```

with:

```tsx
        <span>{LESSON_TYPE_LABEL[lesson.type]}</span>
```

- [ ] **Step 4: Add the import**

Add `LESSON_TYPE_LABEL` to the existing `@/lib/learningData` import in `CoursePlayer.tsx`.

- [ ] **Step 5: Check for other lowercase renderings**

```bash
cd artifacts/fahr-platform
grep -rn "lesson.type" src/ --include=*.tsx
```

Every hit that renders to the screen uses the map. A hit used for logic (`lesson.type === "video"`) stays as it is.

- [ ] **Step 6: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 7: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Capitalise lesson kinds through a single label map"
```

---

### Task 7: Real YouTube embeds for the three video lessons

There are exactly three `type: "video"` lessons and exactly three supplied links, so the mapping is explicit, not cycled. All three lessons happen to share the id `l3`, so the `videoId` must be set per course, not per lesson id.

**Files:**
- Create: `src/components/learning/VideoEmbed.tsx`
- Modify: `src/lib/learningData.ts`, `src/pages/CoursePlayer.tsx`

**Interfaces:**
- Produces: `VideoEmbed({ videoId, title }: { videoId: string; title: string })`, default-exported as a named export from `@/components/learning/VideoEmbed`.
- Produces: `Lesson.videoId?: string` on the `Lesson` type in `@/lib/learningData`.

- [ ] **Step 1: Add `videoId` to the `Lesson` type**

In `src/lib/learningData.ts`, inside `export type Lesson = {`:

```ts
  /** YouTube id. Required when `type` is "video"; meaningless otherwise. */
  videoId?: string;
```

- [ ] **Step 2: Set the three ids**

Add `videoId` to each video lesson. The three are at the line numbers below, one per course:

| Course `id` | Lesson `id` | Title | `videoId` |
|---|---|---|---|
| `ai-foundations` | `l3` | Where AI fails in public service | `zqowMgMgSjA` |
| `prompt-craft` | `l3` | Showing an example | `mUw27wG7uFA` |
| `ai-governance` | `l3` | Being transparent with the public | `_ZqSFVi6UDY` |

```bash
cd artifacts/fahr-platform
grep -n 'type: "video"' src/lib/learningData.ts   # three hits, in course order
```

Each becomes, for example:

```ts
            type: "video",
            videoId: "zqowMgMgSjA",
```

- [ ] **Step 3: Write the embed component**

Create `src/components/learning/VideoEmbed.tsx`:

```tsx
/**
 * A lesson video, embedded from YouTube's no-cookie host.
 *
 * There is deliberately no poster or play-button fallback: a video lesson
 * without a `videoId` should fail the build, not render an empty black box in
 * front of a client.
 */
export function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-[#171310]">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        data-testid={`video-${videoId}`}
      />
    </div>
  );
}
```

- [ ] **Step 4: Replace the placeholder in `LessonBody`**

In `src/pages/CoursePlayer.tsx`, delete the entire `{lesson.type === "video" && (<div className="mt-5 relative aspect-video ...">...</div>)}` block — the one with the radial gradient and the `{lesson.duration} session` caption — and put in its place:

```tsx
      {lesson.type === "video" && lesson.videoId && (
        <VideoEmbed videoId={lesson.videoId} title={lesson.title} />
      )}
```

- [ ] **Step 5: Import it**

```tsx
import { VideoEmbed } from "@/components/learning/VideoEmbed";
```

- [ ] **Step 6: Prove no placeholder survives**

```bash
cd artifacts/fahr-platform
grep -rn "min session" src/                      # expect no output
grep -c 'videoId:' src/lib/learningData.ts       # expect 3
```

- [ ] **Step 7: Check every video lesson plays**

Run `pnpm dev`, open each of the three courses, navigate to its video lesson, and confirm the player loads and plays. A blocked or unavailable video is a failed step — report it rather than working around it.

- [ ] **Step 8: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 9: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Embed real course videos and delete the video placeholder"
```

---

### Task 8: Hide the Coaching Agent in the course view

The bottom-right "Coaching Agent" pill is `AIConcierge`, rendered by `Layout` for every learner route. The right-edge "Learning Agent" tab is `CoachDock`, rendered by `CoursePlayer` itself, and stays.

**Files:**
- Modify: `src/components/Layout.tsx:97`, `src/components/Layout.tsx:527`, `src/pages/CoursePlayer.tsx`

**Interfaces:**
- Produces: `Layout` gains an optional prop — `hideConcierge?: boolean`, default `false`.

- [ ] **Step 1: Widen the `Layout` signature**

```tsx
export function Layout({
  children,
  role,
  hideConcierge = false,
}: {
  children: React.ReactNode;
  role: Role;
  /**
   * Suppress the Coaching Agent pill. Set by screens that already carry a
   * dedicated agent surface — the course player has the Learning Agent dock,
   * and two floating agents in one corner is one too many.
   */
  hideConcierge?: boolean;
}) {
```

- [ ] **Step 2: Honour it at the render site**

Change line 527 from:

```tsx
      {role === "learner" && <AIConcierge />}
```

to:

```tsx
      {role === "learner" && !hideConcierge && <AIConcierge />}
```

- [ ] **Step 3: Pass it from the course player**

In `src/pages/CoursePlayer.tsx` there are **two** `<Layout role="learner">` openings — the course-not-found early return and the main render. Set the prop on the main one only; the not-found screen is a dead end where the concierge is useful:

```tsx
    <Layout role="learner" hideConcierge>
```

- [ ] **Step 4: Confirm in the browser**

Run `pnpm dev`. On a course page: no "Coaching Agent" pill bottom-right, "Learning Agent" tab still on the right edge, and the hero's "Ask the Learning Agent" button still opens the dock. On the learner dashboard: the pill is back.

- [ ] **Step 5: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS. If `src/test/agent-channels.test.tsx` asserts the concierge is present on a course route, update that assertion to expect its absence.

- [ ] **Step 6: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Hide the Coaching Agent on the course player"
```

---

### Task 9: Let `StepQuiz` report a failed attempt

`StepQuiz` currently exposes only `onPass` and disables its continue button until `correctCount >= passMark`, so a failure is invisible to the caller. Task 11 needs to know.

**Files:**
- Modify: `src/components/learning/StepQuiz.tsx`
- Test: `src/test/step-quiz.test.tsx`

**Interfaces:**
- Produces: two new optional props on `StepQuiz` —
  `onAttempt?: (correct: number, total: number) => void` (fired once per submission, pass or fail)
  and `failNote?: string` (shown in place of `passNote` when below `passMark`).

- [ ] **Step 1: Write the failing test**

Create `src/test/step-quiz.test.tsx`:

```tsx
// A quiz has to be able to report a failure, not just silently refuse to
// advance — the remediation simulation is driven by the failing attempt.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepQuiz } from "@/components/learning/StepQuiz";
import type { AssessmentQuestion } from "@/lib/learningData";

const QUESTIONS: AssessmentQuestion[] = [
  {
    id: "q1",
    competencyId: "governance",
    prompt: "Pick the second option.",
    options: ["Wrong", "Right"],
    correctIndex: 1,
  },
];

describe("StepQuiz attempt reporting", () => {
  it("reports the score on a failing attempt", () => {
    const onAttempt = vi.fn();
    render(
      <StepQuiz
        questions={QUESTIONS}
        passMark={1}
        submitLabel="Continue"
        passNote="Well done."
        failNote="Not yet."
        onAttempt={onAttempt}
        onPass={() => {}}
      />,
    );

    fireEvent.click(screen.getByText("Wrong"));
    fireEvent.click(screen.getByTestId("button-quiz-check"));

    expect(onAttempt).toHaveBeenCalledWith(0, 1);
    expect(screen.getByText("Not yet.")).toBeInTheDocument();
  });
});
```

Before running it, open `src/components/learning/StepQuiz.tsx` and confirm the real shape of `AssessmentQuestion` (field names for the prompt, options and correct index) and the `data-testid` of the button that submits an answer. Adjust the fixture and the selector to match the real component — do not change the component to match this fixture.

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/step-quiz.test.tsx`
Expected: FAIL — `onAttempt` is not a prop, so it is never called.

- [ ] **Step 3: Add the props**

In `StepQuizProps`:

```ts
  /** Fired on every submission, pass or fail, with the score. */
  onAttempt?: (correct: number, total: number) => void;
  /** Shown instead of `passNote` when the attempt is below `passMark`. */
  failNote?: string;
```

Destructure them in the signature, call `onAttempt?.(correctCount, questions.length)` at the point the quiz transitions to its scored state, and render `failNote` in the `!passed` branch where `passNote` renders in the `passed` branch.

- [ ] **Step 4: Run the test again**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/step-quiz.test.tsx`
Expected: PASS

- [ ] **Step 5: Confirm existing callers still work**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS. Both new props are optional, so `CoursePlayer`'s two existing `StepQuiz` usages compile unchanged.

- [ ] **Step 6: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Let StepQuiz report a failed attempt"
```

---

### Task 10: Revision units and remediation state

Data and state only. Task 11 renders it.

**Files:**
- Modify: `src/lib/learningData.ts`, `src/lib/LearnerProgressContext.tsx`

**Interfaces:**
- Produces: `Course.revisionUnits: Lesson[]` — exactly two per course, in `@/lib/learningData`.
- Produces: on the `LearnerProgressContext` value, exactly these three members —

```ts
export type Remediation = {
  /** The competency the low post-assessment identified as weakest. */
  competencyId: string;
  /** Score on the attempt that opened it, for the banner to quote. */
  lastScore: number;
  addedAt: string;
};

  remediation: Record<string, Remediation | undefined>;
  openRemediation: (courseId: string, competencyId: string, lastScore: number) => void;
  revisionDone: (courseId: string) => boolean;
```

  Task 11 calls `openRemediation` with all three arguments and reads
  `remediation[courseId].lastScore`. Do not omit `lastScore`.

- [ ] **Step 1: Add `revisionUnits` to the `Course` type**

```ts
  /**
   * Two extra units the Content Agent adds when the post-assessment comes back
   * low. Authored rather than generated: the demo needs this content to be as
   * good as the rest of the course.
   */
  revisionUnits: Lesson[];
```

- [ ] **Step 2: Author two units per course**

For each of `ai-foundations`, `prompt-craft` and `ai-governance`, add a `revisionUnits` array of two `Lesson` objects. Ids must not collide with the course's existing lesson ids — prefix them `r1`, `r2`. Each targets the course's own `competencyId`. Write real body copy in the voice of the surrounding lessons: two or three paragraphs, plus a `points` list. For `ai-governance`, for example:

```ts
    revisionUnits: [
      {
        id: "r1",
        title: "Classification, one more time",
        type: "reading",
        duration: "6 min",
        body: [
          "Your post-assessment showed the classification step being skipped when the material felt routine. That is exactly where it matters: routine material is what gets pasted into a tool without a second thought.",
          "This unit walks the four federal classifications again, with the borderline cases that caused the most wrong answers — internal drafts, resident correspondence, and anything containing a name.",
        ],
        points: [
          "Classify before you paste, not after",
          "A draft inherits the classification of its source material",
          "If you cannot classify it, it does not go into the tool",
        ],
      },
      {
        id: "r2",
        title: "Deciding what needs a human",
        type: "activity",
        duration: "8 min",
        body: [
          "Proportionate review is the other half of the guardrail, and the post-assessment showed it being applied evenly rather than proportionately.",
          "Work through five outputs and decide, for each, whether it needs a named reviewer before it leaves your desk. Compare your answers with the federal threshold at the end.",
        ],
        points: [
          "Risk to the resident sets the level of review, not the length of the output",
          "A named reviewer, not a team inbox",
          "Record the decision either way",
        ],
      },
    ],
```

Write comparable pairs for `ai-foundations` (competency `literacy`) and `prompt-craft` (competency `prompting`).

- [ ] **Step 3: Add remediation state to the context**

In `src/lib/LearnerProgressContext.tsx`, add to the context value type:

```ts
  /** Courses where a low post-assessment opened a revision group, keyed by course id. */
  remediation: Record<string, Remediation | undefined>;
  /** Record a low post-assessment and open the revision units for that course. */
  openRemediation: (courseId: string, competencyId: string, lastScore: number) => void;
  /** True when a course has remediation open and both revision units are complete. */
  revisionDone: (courseId: string) => boolean;
```

with the type exported from the same file:

```ts
export type Remediation = { competencyId: string; lastScore: number; addedAt: string };
```

Implement it alongside the existing `courseProgress` state, persisted by the same `localStorage` mechanism the file already uses — read how `courseProgress` is stored and validated on load and follow it exactly, including the validation that discards unknown course ids.

```ts
  const openRemediation = useCallback((courseId: string, competencyId: string, lastScore: number) => {
    setRemediation((prev) =>
      prev[courseId]
        ? prev
        : { ...prev, [courseId]: { competencyId, lastScore, addedAt: new Date().toISOString() } },
    );
  }, []);

  const revisionDone = useCallback(
    (courseId: string) => {
      if (!remediation[courseId]) return false;
      const course = COURSE_BY_ID[courseId];
      if (!course) return false;
      const done = getCourseProgress(courseId).completedLessonIds;
      return course.revisionUnits.every((unit) => done.includes(unit.id));
    },
    [remediation, getCourseProgress],
  );
```

`openRemediation` is idempotent on purpose: a second failing attempt must not reset `addedAt` or duplicate the units.

- [ ] **Step 4: Include the revision units in the course's lesson list**

`courseLessons(course)` currently flattens `course.groups`. Revision units must count toward completion and be reachable, so extend it:

```ts
export function courseLessons(course: Course): Lesson[] {
  return [...course.groups.flatMap((group) => group.lessons), ...course.revisionUnits];
}
```

This changes `getCoursePercent` denominators for every course. Check the effect:

```bash
cd artifacts/fahr-platform
grep -rn "courseLessons" src/
```

If any caller needs the pre-remediation list, add a second export `courseBaseLessons(course)` returning only the grouped lessons and use it there, rather than branching inside `courseLessons`.

- [ ] **Step 5: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS. Any test asserting a lesson count or a completion percentage needs updating to the new totals — update the expectation, not the production code.

- [ ] **Step 6: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Add revision units and remediation state"
```

---

### Task 11: The remediation simulation in the course view

**Files:**
- Create: `src/components/learning/RemediationBanner.tsx`
- Create: `src/test/remediation.test.tsx`
- Modify: `src/pages/CoursePlayer.tsx`

**Interfaces:**
- Consumes: `onAttempt` / `failNote` from Task 9; `revisionUnits`, `remediation`, `openRemediation`, `revisionDone` from Task 10.
- Produces: `RemediationBanner({ competencyShort, correct, total, unitCount, complete }: { competencyShort: string; correct: number; total: number; unitCount: number; complete: boolean })`

- [ ] **Step 1: Write the failing test**

Test the remediation rules through the context hook rather than by driving the
whole course UI — the gating logic is what can silently break, and a
twenty-click UI walk is a slow, brittle way to assert it. The full click-through
is covered manually in Step 6.

Create `src/test/remediation.test.tsx`:

```tsx
// A low post-assessment has to visibly change the course: two revision units
// appear and the final assessment closes until they are done.
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LearnerProgressProvider, useLearnerProgress } from "@/lib/LearnerProgressContext";
import { COURSE_BY_ID } from "@/lib/learningData";

const COURSE_ID = "ai-governance";

function useProgress() {
  return renderHook(() => useLearnerProgress(), { wrapper: LearnerProgressProvider });
}

describe("post-assessment remediation", () => {
  it("opens no revision by default", () => {
    const { result } = useProgress();
    expect(result.current.remediation[COURSE_ID]).toBeUndefined();
    expect(result.current.revisionDone(COURSE_ID)).toBe(false);
  });

  it("records the competency and the score that opened it", () => {
    const { result } = useProgress();
    act(() => result.current.openRemediation(COURSE_ID, "governance", 1));

    expect(result.current.remediation[COURSE_ID]).toMatchObject({
      competencyId: "governance",
      lastScore: 1,
    });
  });

  it("is idempotent — a second failure does not overwrite the first", () => {
    const { result } = useProgress();
    act(() => result.current.openRemediation(COURSE_ID, "governance", 1));
    const first = result.current.remediation[COURSE_ID];
    act(() => result.current.openRemediation(COURSE_ID, "governance", 0));

    expect(result.current.remediation[COURSE_ID]).toBe(first);
  });

  it("stays incomplete until every revision unit is done", () => {
    const { result } = useProgress();
    const units = COURSE_BY_ID[COURSE_ID].revisionUnits;
    expect(units).toHaveLength(2);

    act(() => result.current.openRemediation(COURSE_ID, "governance", 1));
    act(() => result.current.toggleLessonComplete(COURSE_ID, units[0].id));
    expect(result.current.revisionDone(COURSE_ID)).toBe(false);

    act(() => result.current.toggleLessonComplete(COURSE_ID, units[1].id));
    expect(result.current.revisionDone(COURSE_ID)).toBe(true);
  });
});
```

Check the provider's real export name in `src/lib/LearnerProgressContext.tsx` before running, and whether it needs props. If `src/test/providers.tsx` already exports a wrapper that composes it, use that instead of naming the provider directly.

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/remediation.test.tsx`
Expected: FAIL — `result.current.openRemediation is not a function`. If Task 10 is already done, the first three pass and the fourth fails on `revisionUnits` being undefined; either way the suite is red before this task's work.

- [ ] **Step 3: Write the banner**

Create `src/components/learning/RemediationBanner.tsx`:

```tsx
import { Sparkles, CheckCircle2 } from "lucide-react";
import { AGENTS } from "@/lib/constants";

/**
 * What the Content Agent did about a low post-assessment.
 *
 * Stays on screen after the revision is finished rather than disappearing —
 * the point of the simulation is that someone can see what happened.
 */
export function RemediationBanner({
  competencyShort,
  correct,
  total,
  unitCount,
  complete,
}: {
  competencyShort: string;
  correct: number;
  total: number;
  unitCount: number;
  complete: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        complete ? "border-emerald-600/30 bg-emerald-600/[0.05]" : "border-primary/30 bg-primary/[0.04]"
      }`}
      data-testid="remediation-banner"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            complete ? "bg-emerald-600/10" : "bg-primary/10"
          }`}
        >
          {complete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </span>
        <div className="min-w-[16rem] flex-1">
          <p
            className={`text-[11px] font-bold uppercase tracking-wider ${
              complete ? "text-emerald-700" : "text-primary"
            }`}
          >
            {AGENTS.content}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {complete
              ? `Revision complete — the final assessment is open again`
              : `${unitCount} revision units added to this course`}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            You scored {correct} of {total}. {competencyShort} was the weakest area, so {unitCount} units
            covering it have been added below the course content. Complete them and the final assessment
            reopens.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire the course player**

Four changes in `src/pages/CoursePlayer.tsx`:

1. Pull the new context members: `const { remediation, openRemediation, revisionDone, ... } = useLearnerProgress();` and derive `const remediationFor = remediation[course.id];`.

2. Render the banner above the outline/content grid:

```tsx
        {remediationFor && (
          <div className="mt-6">
            <RemediationBanner
              competencyShort={COMPETENCY_BY_ID[remediationFor.competencyId]?.short ?? "this capability"}
              correct={remediationFor.lastScore}
              total={course.finalAssessment.questions.length}
              unitCount={course.revisionUnits.length}
              complete={revisionDone(course.id)}
            />
          </div>
        )}
```

`lastScore` is part of the `Remediation` type Task 10 defines — read it, do not
re-derive it here.

3. Render a **Revision** group in the outline, after `course.groups.map(...)` and before the final-assessment divider:

```tsx
                {remediationFor && (
                  <div className="mt-4">
                    <p className="flex items-center gap-1.5 px-3 pb-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3 w-3" /> Revision
                    </p>
                    <p className="px-3 pb-2 text-[11px] text-muted-foreground">
                      Added by the {AGENTS.content}
                    </p>
                    <div className="space-y-1">
                      {course.revisionUnits.map((lesson) => {
                        const Icon = LESSON_ICON[lesson.type];
                        return outlineItem(
                          lesson.id,
                          lesson.title,
                          `${LESSON_TYPE_LABEL[lesson.type]} · ${lesson.duration}`,
                          <Icon className="h-2.5 w-2.5 text-muted-foreground" />,
                          active.kind === "lesson" && active.id === lesson.id,
                          progress.completedLessonIds.includes(lesson.id),
                          () => setActive({ kind: "lesson", id: lesson.id }),
                        );
                      })}
                    </div>
                  </div>
                )}
```

4. Gate the final assessment and hook the failing attempt. Replace the `allLessonsDone` used for the final item's `locked` argument with:

```tsx
  const finalOpen = allLessonsDone && (!remediationFor || revisionDone(course.id));
```

and on the final `StepQuiz`, add:

```tsx
                              failNote="Below the pass mark. Your Content Agent is adding revision units."
                              onAttempt={(correct, total) => {
                                if (correct >= 2) return;
                                openRemediation(course.id, course.competencyId, correct);
                              }}
```

`lessons` already includes the revision units via Task 10's `courseLessons`, so `allLessonsDone` naturally accounts for them.

- [ ] **Step 5: Run the test**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/remediation.test.tsx`
Expected: PASS

- [ ] **Step 6: Walk it in the browser**

Run `pnpm dev`. Open a course, complete the pretest and every lesson, open the final assessment, answer everything wrongly, and submit. Confirm: the banner appears, two units appear under **Revision**, the final assessment is locked, completing both units reopens it, and a correct retake passes and leaves the banner in its completed state.

- [ ] **Step 7: Typecheck and full test run**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 8: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Add the post-assessment remediation simulation"
```

---

### Task 12: Pattern-based PII screening

`lib/digitalTwin.ts` already screens prompts, but only against the keyword list `PERSONAL_DATA_TERMS` — it catches the phrase "phone number" and misses `0501234567`. The demo needs a real name and number to be caught.

**Files:**
- Create: `src/lib/piiScreen.ts`
- Create: `src/test/pii-screen.test.ts`

**Interfaces:**
- Produces:

```ts
export type PiiKind =
  | "emiratesId" | "phone" | "email" | "iban"
  | "passport" | "dateOfBirth" | "name" | "keyword";

export type PiiFinding = { kind: PiiKind; label: string; match: string; start: number; end: number };

export type PiiScreen = { hit: boolean; findings: PiiFinding[]; redacted: string };

export function screenForPii(text: string): PiiScreen;
```

`label` is the human name for the kind, used verbatim in the UI chip — `"Emirates ID"`, `"phone number"`, `"email address"`, `"bank account"`, `"passport number"`, `"date of birth"`, `"full name"`, `"personal data"`.

- [ ] **Step 1: Write the failing test**

Create `src/test/pii-screen.test.ts`:

```ts
// The twin's headline governance claim is that personal data never reaches the
// model. A screen that misses a plain phone number cannot support that claim —
// and one that flags a budget figure is worse than useless in a demo.
import { describe, it, expect } from "vitest";
import { screenForPii } from "@/lib/piiScreen";

describe("screenForPii catches personal data", () => {
  it("catches a UAE mobile number in any common format", () => {
    for (const number of ["0501234567", "+971 50 123 4567", "00971501234567", "050 123 4567"]) {
      const screen = screenForPii(`Call me on ${number} tomorrow`);
      expect(screen.hit, number).toBe(true);
      expect(screen.findings.some((f) => f.kind === "phone"), number).toBe(true);
    }
  });

  it("catches an Emirates ID with or without separators", () => {
    expect(screenForPii("784-1987-1234567-1").hit).toBe(true);
    expect(screenForPii("784198712345671").hit).toBe(true);
  });

  it("catches an email address and an AE IBAN", () => {
    expect(screenForPii("write to aisha.almansoori@fahr.gov.ae").findings[0].kind).toBe("email");
    expect(screenForPii("AE070331234567890123456").findings[0].kind).toBe("iban");
  });

  it("catches a name only when the sentence introduces one", () => {
    const introduced = screenForPii("My name is Aisha Al Mansoori and I work in communications");
    expect(introduced.findings.some((f) => f.kind === "name")).toBe(true);
  });

  it("keeps the existing keyword list working", () => {
    expect(screenForPii("summarise this patient's medical record").hit).toBe(true);
  });

  it("redacts every finding by label", () => {
    const screen = screenForPii("My name is Aisha Al Mansoori, call 0501234567");
    expect(screen.redacted).toContain("[full name]");
    expect(screen.redacted).toContain("[phone number]");
    expect(screen.redacted).not.toContain("0501234567");
    expect(screen.redacted).not.toContain("Aisha");
  });
});

describe("screenForPii does not cry wolf", () => {
  it("a budget figure is not a phone number", () => {
    expect(screenForPii("The campaign budget was 4500000 dirhams").hit).toBe(false);
  });

  it("an entity name is not a person", () => {
    expect(screenForPii("Draft a note for the Ministry of Health and Prevention").hit).toBe(false);
  });

  it("a year is not a date of birth", () => {
    expect(screenForPii("Our 2026 plan is ready").hit).toBe(false);
  });

  it("an empty prompt is clean", () => {
    const screen = screenForPii("");
    expect(screen.hit).toBe(false);
    expect(screen.findings).toEqual([]);
    expect(screen.redacted).toBe("");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/pii-screen.test.ts`
Expected: FAIL — `Cannot find module '@/lib/piiScreen'`

- [ ] **Step 3: Implement the screen**

Create `src/lib/piiScreen.ts`. Structure it as an ordered list of named detectors, each a regex plus a label, then a single pass that collects matches, drops overlaps (earlier detector wins), and builds the redaction from the surviving findings.

Notes that matter for the tests above:
- **Phone** must require a UAE prefix (`+971`, `00971`, or a leading `05`) and tolerate spaces and dashes, so a bare `4500000` cannot match.
- **Emirates ID** is `784` + 4 digits + 7 digits + 1 digit, separators optional.
- **Name** is anchored to an introducing phrase — `my name is`, `i am`, `this is`, `اسمي` — followed by two or three capitalised words. Not any capitalised pair, or "Ministry of Health and Prevention" trips it.
- **Date of birth** requires a birth-related word (`born`, `dob`, `date of birth`, `مواليد`) near the date.
- **Keyword** reuses the existing `PERSONAL_DATA_TERMS` list; export it from `digitalTwin.ts` and import it here rather than duplicating it.
- **Redaction** replaces each finding's `[start, end)` span with `[${label}]`, applied right-to-left so earlier offsets stay valid.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/pii-screen.test.ts`
Expected: PASS, all ten cases.

- [ ] **Step 5: Commit**

```bash
git add artifacts/fahr-platform/src/lib/piiScreen.ts artifacts/fahr-platform/src/test/pii-screen.test.ts
git commit -m "Add pattern-based PII screening for the digital twin"
```

---

### Task 13: Reduce the twin to two enforced guardrails

**Files:**
- Modify: `src/lib/digitalTwin.ts`, `src/lib/DigitalTwinContext.tsx`, `src/components/twin/GuardrailControls.tsx`, `src/test/digital-twin.test.ts`

**Interfaces:**
- Produces: `GuardrailId` narrows to `"noPersonalData" | "approvedKnowledgeOnly"`. `GUARDRAILS` has two entries. `setGuardrail` is removed from the context; `setCustomGuardrail` is removed; `addCustomGuardrail` and `removeCustomGuardrail` stay.

- [ ] **Step 1: Narrow the type and the list**

In `src/lib/digitalTwin.ts`:

```ts
export type GuardrailId = "noPersonalData" | "approvedKnowledgeOnly";
```

Delete the `humanReview` and `auditTrail` entries from `GUARDRAILS`, leaving two. Delete `"Full audit trail"` and `"Human review required"` wholesale — labels, on/off copy and policy chips.

- [ ] **Step 2: Follow the compiler**

Run: `pnpm typecheck`

Every error is a place that referenced a deleted guardrail. Work through them:
- `answer()` — delete the `if (!guardrails.auditTrail)` breach note, the `auditRef` computation (it becomes unconditionally `null`, so remove `auditRef` from `TwinReply` and its consumers), and the `if (guardrails.humanReview)` branch.
- `emptyProfile()` — the `guardrails` record now has two keys, both `true`.
- `describeGuardrails` — "Applied N of M governance guardrails" is now always "2 of 2". Reword to name the two guardrails instead of counting them.
- `scoreTwin` — delete the `relaxed` penalty entirely (see Task 14).

- [ ] **Step 3: Make the presets read-only in the UI**

In `src/components/twin/GuardrailControls.tsx`:
- Delete the `relaxed` computation and the `guardrail-warning` panel — nothing can be relaxed now.
- Remove the `<Switch>` from each federal guardrail row and replace it with a lock affordance:

```tsx
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600/10 px-2.5 py-1">
                <Lock className="h-3 w-3 text-emerald-700" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  {isAr ? "مفعّل دائمًا" : "Always on"}
                </span>
              </span>
```

- Each row's border and tint become the unconditional enabled styling; delete the `enabled ? ... : ...` ternaries and the `AlertTriangle` branch.
- Import `Lock` from `lucide-react`; drop `AlertTriangle` and `Switch` if now unused.

- [ ] **Step 4: Strip the toggle from custom rules**

In the same file's `profile.customGuardrails.map(...)`, delete the `<Switch>` and keep the ✕ button. A custom rule is present or deleted; remove the `rule.enabled ? ... : ...` styling ternaries and treat every rule as active.

Then in `src/lib/digitalTwin.ts`, drop `enabled` from `CustomGuardrail`, and in `src/lib/DigitalTwinContext.tsx` delete `setCustomGuardrail` and `setGuardrail` from the context value and its type.

- [ ] **Step 5: Update the intro copy**

The section above the list currently invites the user to switch one off — "Switch one off, then ask the same question again — the answer changes." Replace with copy that describes enforcement:

```
These two are enforced in code and cannot be switched off. Add your own rules below.
```

Find it with `grep -rn "Switch one off" src/`.

- [ ] **Step 6: Rewrite the guardrail tests**

In `src/test/digital-twin.test.ts`, delete assertions covering `humanReview`, `auditTrail`, `auditRef`, and any test that switches a guardrail off. Replace with a test that both guardrails are on in `emptyProfile()` and that `GuardrailId` admits only two values.

- [ ] **Step 7: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 8: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Reduce the twin to two enforced, non-toggleable guardrails"
```

---

### Task 14: Remove the governance score and the Phase 2 card

**Files:**
- Modify: `src/pages/AgenticAILabTwin.tsx`, `src/lib/digitalTwin.ts`

**Interfaces:**
- Produces: `scoreTwin` (or whatever the function at `digitalTwin.ts:685` is named — check) is deleted along with its export, unless another screen consumes it.

- [ ] **Step 1: Delete the governance score card**

```bash
cd artifacts/fahr-platform
grep -n "Twin governance score" src/pages/AgenticAILabTwin.tsx
```

Remove the card and the comment above it (`{/* What the Assessment Agent makes of the twin as configured. ... */}` at roughly line 502).

- [ ] **Step 2: Delete the Phase 2 roadmap card**

```bash
grep -n "Build a full agentic process" src/pages/AgenticAILabTwin.tsx
```

Remove the whole locked "Stage 2" card, including its `Lock` icon and "Phase 2 roadmap" badge.

- [ ] **Step 3: Delete the scoring function**

```bash
grep -rn "scoreTwin\|assessTwin" src/
```

If it is used only by the deleted card and its tests, delete the function from `digitalTwin.ts`. If another screen consumes it, leave the function and delete only the guardrail-relaxation penalty inside it. Do not guess — read the call sites.

- [ ] **Step 4: Reflow what remains**

Read the section the two cards sat in. If removing them leaves a one-item grid or a stranded heading, collapse the grid to a single column or remove the heading. The twin page must not open with a gap.

- [ ] **Step 5: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS. `src/test/twin-lab.test.tsx` may assert the score card; remove those assertions with the feature.

- [ ] **Step 6: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Remove the twin governance score and the Phase 2 roadmap card"
```

---

### Task 15: The PII block in the test chat, and the demo chips

**Files:**
- Modify: `src/lib/digitalTwin.ts`, `src/components/twin/TwinTestChat.tsx`

**Interfaces:**
- Consumes: `screenForPii`, `PiiFinding` from Task 12.
- Produces: `TwinReply` gains `pii?: { findings: PiiFinding[]; redacted: string }`, set only when `status === "blocked"`.

- [ ] **Step 1: Use the new screen in `answer()`**

In `src/lib/digitalTwin.ts`, replace the `mentionsPersonalData(question)` check in step 1 of `answer()` with `screenForPii(question)`, and attach the result to the blocked reply:

```ts
  const pii = screenForPii(question);
  if (pii.hit) {
    return {
      status: "blocked",
      text: isAr
        ? "لا أستطيع معالجة هذا الطلب. يحتوي على بيانات شخصية، وقد أوقفه الفحص قبل وصوله إلى النموذج. أعد صياغة السؤال بصيغة مجمّعة وسأساعدك."
        : "I cannot process that. It contains personal data, and the screen stopped it before it reached the model. Ask me the same question in aggregate terms and I will help.",
      citations: [],
      notes: [
        {
          id: "noPersonalData",
          kind: "refused",
          text: isAr
            ? "أوقف الضابط الطلب قبل وصوله إلى النموذج."
            : "The guardrail stopped the prompt before it reached the model.",
        },
      ],
      pii: { findings: pii.findings, redacted: pii.redacted },
    };
  }
```

The `noPersonalData` guardrail can no longer be switched off, so the old `else` branch that let personal data through is deleted along with `mentionsPersonalData`.

- [ ] **Step 2: Render the block as its own card**

In `src/components/twin/TwinTestChat.tsx`, branch on `reply.status === "blocked"` before the ordinary assistant bubble:

```tsx
        <div
          className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-4"
          data-testid="pii-block"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm font-semibold text-destructive">
              {isAr ? "أُوقف قبل وصوله إلى النموذج" : "Blocked before it reached the model"}
            </p>
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isAr ? "ما أرسلته، بعد التنقيح" : "What you sent, redacted"}
          </p>
          <p className="mt-1.5 rounded-lg bg-background p-3 text-sm leading-relaxed text-foreground">
            {reply.pii?.redacted}
          </p>

          <ul className="mt-3 space-y-1.5">
            {reply.pii?.findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <span>
                  {isAr ? "حُذف" : "Discarded"}: {finding.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              isAr ? "لم يصل إلى النموذج" : "Not sent to the model",
              isAr ? "لم يُخزَّن" : "Not stored",
              isAr ? "لم يُسجَّل" : "Not written to any log",
            ].map((claim) => (
              <span
                key={claim}
                className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
              >
                {claim}
              </span>
            ))}
          </div>
        </div>
```

Render only `reply.pii.redacted` — never the raw message — so the "not stored" claim is structurally true and not just a sentence.

- [ ] **Step 3: Replace the suggestion chips**

The chips are **not** in the component. `TwinTestChat` renders
`suggestedQuestions(profile, isAr)` from `@/lib/digitalTwin` (around line 660),
which returns `string[]` — including the two the client asked to replace,
"Pull up this patient's medical record…" and "What is next year's federal
budget forecast?".

A plain string cannot express the personal-data chip, which needs a safe
label on the button and a loaded message as the thing actually sent. So
change the return type:

```ts
export type SuggestedQuestion = {
  /** What the chip reads. */
  label: string;
  /** What is actually sent when it is clicked. Usually the same as `label`. */
  prompt: string;
};

export function suggestedQuestions(profile: TwinProfile, isAr: boolean): SuggestedQuestion[] {
```

Return exactly four, one per behaviour, derived from the learner's own twin
where possible so the chips stay true if the interview answers change:

```ts
  const task = (i: number) => profile.tasks[i];
  return [
    // 1 — grounded: something the learner taught it, so the answer cites a source.
    {
      label: task(0)
        ? isAr ? `كيف أتعامل مع: ${task(0)}؟` : `How should I approach: ${task(0)}?`
        : isAr ? "ماذا يقول دليل النبرة الرسمي للهيئة؟" : "What does the FAHR tone guide say?",
      prompt: task(0)
        ? isAr ? `كيف أتعامل مع: ${task(0)}؟` : `How should I approach: ${task(0)}?`
        : isAr ? "ماذا يقول دليل النبرة الرسمي للهيئة؟" : "What does the FAHR tone guide say?",
    },
    // 2 — outside approved knowledge: the honest refusal.
    {
      label: isAr ? "ما توقعات الميزانية الاتحادية للعام القادم؟" : "What is next year's federal budget forecast?",
      prompt: isAr ? "ما توقعات الميزانية الاتحادية للعام القادم؟" : "What is next year's federal budget forecast?",
    },
    // 3 — personal data: safe label, loaded prompt, so the block is one click.
    {
      label: isAr ? "جرّب رسالة تحتوي بيانات شخصية" : "Try a message containing personal data",
      prompt: isAr
        ? "اسمي عائشة المنصوري ورقم هاتفي 0501234567 — اكتب ردًا باسمي."
        : "My name is Aisha Al Mansoori, my mobile is 0501234567 — draft a reply from me.",
    },
    // 4 — real work: the twin being useful.
    {
      label: task(1)
        ? isAr ? `اكتب موجزًا قصيرًا عن: ${task(1)}` : `Draft a short brief for: ${task(1)}`
        : isAr ? "اكتب تحديثًا من سطرين لمدير إدارتي" : "Draft a two-line update for my department manager",
      prompt: task(1)
        ? isAr ? `اكتب موجزًا قصيرًا عن: ${task(1)}` : `Draft a short brief for: ${task(1)}`
        : isAr ? "اكتب تحديثًا من سطرين لمدير إدارتي" : "Draft a two-line update for my department manager",
    },
  ];
```

Then update the render at `TwinTestChat.tsx:109` — it currently maps
`suggestions` as strings. It now maps objects: show `question.label`, send
`question.prompt`. Keep the `data-testid="twin-suggested-question"`.

`src/test/digital-twin.test.ts` asserts against the old strings
("Pull up this patient's medical record", "What is next year's federal budget
forecast?") by passing them to `answer()` directly, not through
`suggestedQuestions`. Those tests keep working — the budget question is still
out of scope and the medical-record question is still caught, now by the
keyword detector in `piiScreen.ts`. Leave them alone.

- [ ] **Step 4: Import the icons**

`ShieldAlert` and `X` from `lucide-react`.

- [ ] **Step 5: Try all four chips in the browser**

Run `pnpm dev`, build a twin, and click each chip. Expected: a cited answer, an honest refusal, the block card with the name and number redacted, and a useful draft. Then type your own name and number by hand and confirm the same block.

- [ ] **Step 6: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 7: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Show blocked personal data in the twin chat and add demo chips"
```

---

### Task 16: Rename to Project Evaluation and remove the explainer strip

**Files:**
- Modify: `src/lib/LanguageContext.tsx`, `src/pages/AgenticAIEvaluation.tsx`, `src/components/dashboard/QuickLinksGrid.tsx`

**Interfaces:**
- Produces: `nav.evaluation` reads `"Project Evaluation"` / `"تقييم المشروع"`.

- [ ] **Step 1: Rename the nav key**

In `src/lib/LanguageContext.tsx`:

```ts
    "nav.evaluation": "Project Evaluation",
```

and in the `ar` block:

```ts
    "nav.evaluation": "تقييم المشروع",
```

- [ ] **Step 2: Rename every hard-coded occurrence**

```bash
cd artifacts/fahr-platform
grep -rn "Evaluation & Certification" src/
```

Replace each with `Project Evaluation`.

- [ ] **Step 3: Rewrite the page description**

In `src/pages/AgenticAIEvaluation.tsx`, certification now lives on Recognition, so:

```tsx
          description="Where your workplace project is scored by the Assessment Agent and reviewed by a human."
```

- [ ] **Step 4: Delete the explainer strip**

Remove the `explainer` array (the three entries `What was evaluated` / `Who evaluated it` / `What it leads to`) and the `<div className="grid gap-3 md:grid-cols-3">` block that maps over it.

- [ ] **Step 5: Remove what only it used**

Delete the now-unused `FileCheck`, `UserCheck` and `Award` icon imports if nothing else on the page uses them, plus `submittedLabel`, `LEARNER_PROFILE`, `toLevel` and `fromLevel` if the strip was their only consumer. Let `pnpm typecheck` tell you which.

- [ ] **Step 6: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 7: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Rename Evaluation and Certification to Project Evaluation"
```

---

### Task 17: Competency badges replace the achievements grid

**Files:**
- Create: `src/components/recognition/CompetencyBadges.tsx`
- Create: `src/test/competency-badges.test.ts`
- Delete: `src/components/recognition/AchievementsGrid.tsx`, `src/components/recognition/CredentialWallet.tsx`
- Modify: `src/lib/recognitionRecord.ts`, `src/pages/RecognitionAndImpact.tsx`, `src/components/recognition/StandingPanels.tsx`

**Interfaces:**
- Produces: `competencyBadges(result: AssessmentResult | null): CompetencyBadge[]` exported from `@/lib/recognitionRecord`, where
  `CompetencyBadge = { competencyId: string; label: string; short: string; earned: boolean; score: number; threshold: number }`.
- Produces: `CompetencyBadges({ badges }: { badges: CompetencyBadge[] })`.

- [ ] **Step 1: Write the failing test**

Create `src/test/competency-badges.test.ts`:

```ts
// Badges are now one per AI competency, earned at the Practitioner threshold,
// and read from the learner's real assessment rather than a separate counter.
import { describe, it, expect } from "vitest";
import { competencyBadges } from "@/lib/recognitionRecord";
import { COMPETENCIES, SCORE_BANDS } from "@/lib/learningData";

const PRACTITIONER = SCORE_BANDS.find((band) => band.id === "practitioner")!.min;

function resultWith(scores: Record<string, number>) {
  return {
    overall: 50,
    levelId: "emerging",
    levelLabel: "Emerging Practitioner",
    levelBlurb: "",
    completedOn: "2026-09-01T00:00:00.000Z",
    scores,
    strengths: [],
    gaps: [],
    recommendedCourseIds: [],
  } as any;
}

describe("competencyBadges", () => {
  it("returns one badge per competency", () => {
    expect(competencyBadges(resultWith({}))).toHaveLength(COMPETENCIES.length);
  });

  it("earns a badge at the Practitioner threshold and not below it", () => {
    const badges = competencyBadges(
      resultWith({ governance: PRACTITIONER, literacy: PRACTITIONER - 1 }),
    );
    expect(badges.find((b) => b.competencyId === "governance")!.earned).toBe(true);
    expect(badges.find((b) => b.competencyId === "literacy")!.earned).toBe(false);
  });

  it("reports the threshold it used, so the UI need not know it", () => {
    expect(competencyBadges(resultWith({}))[0].threshold).toBe(PRACTITIONER);
  });

  it("locks everything when there is no assessment result", () => {
    expect(competencyBadges(null).every((b) => !b.earned)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/competency-badges.test.ts`
Expected: FAIL — `competencyBadges` is not exported.

- [ ] **Step 3: Implement the selector**

In `src/lib/recognitionRecord.ts`:

```ts
export type CompetencyBadge = {
  competencyId: string;
  label: string;
  short: string;
  earned: boolean;
  /** The learner's percentage in this competency, 0 when unassessed. */
  score: number;
  /** The percentage that earns the badge. */
  threshold: number;
};

/**
 * One badge per AI competency, earned at the Practitioner threshold.
 *
 * The threshold is read from SCORE_BANDS rather than hard-coded, so re-banding
 * the assessment moves the badges with it.
 */
export function competencyBadges(result: AssessmentResult | null): CompetencyBadge[] {
  const threshold = SCORE_BANDS.find((band) => band.id === "practitioner")?.min ?? 55;
  return COMPETENCIES.map((competency) => {
    const score = result?.scores?.[competency.id] ?? 0;
    return {
      competencyId: competency.id,
      label: competency.label,
      short: competency.short,
      earned: score >= threshold,
      score,
      threshold,
    };
  });
}
```

Check `Competency`'s real field names (`label` vs `name`) in `learningData.ts` and match them.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @workspace/fahr-platform run test src/test/competency-badges.test.ts`
Expected: PASS

- [ ] **Step 5: Build the badge grid**

Create `src/components/recognition/CompetencyBadges.tsx`. Five badges in a responsive grid. Earned badges get a filled FAHR-palette medallion with the competency icon; locked badges get a dashed outline, the threshold, and the distance remaining ("62% to go"). Use the icon already associated with each competency if `COMPETENCIES` carries one; otherwise pick one `lucide-react` icon per competency and map it in this file. Follow the card idiom of the surrounding recognition components — read `StandingPanels.tsx` for the house style before writing.

- [ ] **Step 6: Swap it into the page**

In `src/pages/RecognitionAndImpact.tsx`:
- Delete the `<CredentialWallet ... />` block and the `<AchievementsGrid ... />` block, with their imports.
- Delete the `handleCredentialAction` callback.
- Add `<CompetencyBadges badges={competencyBadges(result)} />` in an existing `ScrollReveal`.
- Delete the final `ScrollReveal` holding "Share what earned this" and "Earn the next credential live", plus the now-unused `Link`, `Button`, `Users`, `CalendarDays` and `ArrowRight` imports.

Then delete the two component files:

```bash
cd artifacts/fahr-platform
git rm src/components/recognition/AchievementsGrid.tsx src/components/recognition/CredentialWallet.tsx
```

- [ ] **Step 7: Remove the "Measured workplace impact" card**

In `src/components/recognition/StandingPanels.tsx`, delete the `ImpactPanel` export (the "Measured workplace impact" card with its "Build my workplace project" and "See how it is evaluated" buttons) and its usage in `RecognitionAndImpact.tsx`.

- [ ] **Step 8: Clean up the record builder**

```bash
cd artifacts/fahr-platform
grep -rn "\.achievements\|\.credentials\|earnedCount" src/
```

`buildRecognitionRecord` still computes `achievements` and `credentials`. Remove each field only once nothing reads it — `RecognitionHero` uses `record.earnedCount`, so check before deleting. If `RecognitionHero` still needs a count, point it at the earned competency badges instead.

- [ ] **Step 9: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 10: Commit**

```bash
git add -A artifacts/fahr-platform/src
git commit -m "Replace the achievements grid with competency badges"
```

---

### Task 18: The project certificate

**Files:**
- Create: `src/components/recognition/ProjectCertificate.tsx`
- Modify: `src/lib/WorkplaceProjectContext.tsx`, `src/pages/RecognitionAndImpact.tsx`

**Interfaces:**
- Consumes: `demoSubmission`, `evaluateSubmission` from `@/lib/workplaceProject`; `verifyId` from `@/lib/recognitionRecord`.
- Produces: `ProjectCertificate({ learnerName, projectTitle, competencies, score, issuedOn, verifyId, reviewer }: { learnerName: string; projectTitle: string; competencies: string[]; score: number; issuedOn: string; verifyId: string; reviewer: string })`

- [ ] **Step 1: Seed the project as submitted and approved**

`src/pages/AgenticAIEvaluation.tsx` already falls back to `demoSubmission(plan?.project ?? null)` when nothing was submitted this session. Seed `WorkplaceProjectContext` from the same helper so Recognition and Evaluation agree without a second source of truth:

```ts
  // The demo opens on an approved project so the certificate is on screen from
  // the first load. Evaluation already falls back to the same helper, so both
  // screens describe the same submission.
  const [submission, setSubmission] = useState<Submission | null>(() => stored() ?? demoSubmission(null));
```

Read the file's existing `localStorage` hydration first and place the fallback after it, so a real submission from this session always wins.

- [ ] **Step 2: Build the certificate**

Create `src/components/recognition/ProjectCertificate.tsx`. An inline preview card that opens a full-screen `Dialog` (from `@/components/ui/dialog`) on click.

The certificate itself is landscape, bordered, and deliberately formal — this is the one surface allowed to look like a document rather than a product. It carries: the FAHR logo (`${import.meta.env.BASE_URL}brand/fahr-logo.png`), a seal mark, "Certificate of Completion", the learner's name in display type, the project title, the competencies demonstrated as a row, the evaluation score, the issue date, the reviewer's title, and the verification ID in small monospace at the foot.

Include the fake download:

```tsx
        <Button
          variant="outline"
          onClick={() =>
            toast({
              title: "Certificate downloaded",
              description: `${projectTitle} — verification ID ${verifyId}.`,
            })
          }
          data-testid="button-download-certificate"
        >
          <Download className="me-2 h-4 w-4" /> Download PDF
        </Button>
```

It fires a toast and produces no file. That is the agreed behaviour for the demo — do not add a PDF library.

- [ ] **Step 3: Place it on Recognition**

In `src/pages/RecognitionAndImpact.tsx`, render `ProjectCertificate` directly beneath `RecognitionHero`, above the competency badges, fed from `submission` and `evaluateSubmission(submission, twin)`. It is the headline artefact of the screen and should not be scrolled to.

- [ ] **Step 4: Check both states in the browser**

Run `pnpm dev`, open Recognition. Expected: the certificate is present on first load with the learner's real name and the demo project's title; clicking it opens full-screen; "Download PDF" shows the toast and downloads nothing.

- [ ] **Step 5: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS. `src/test/twin-to-project.test.tsx` asserts on project state — if seeding a default submission breaks it, adjust the test to start from an explicitly empty context rather than removing the seed.

- [ ] **Step 6: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Add the workplace project certificate to Recognition"
```

---

### Task 19: Landing i18n — keys, toggle and RTL

Infrastructure only. Task 20 writes the Arabic.

**Files:**
- Modify: `src/lib/LanguageContext.tsx`, `src/components/landing/LandingHeader.tsx`, `src/App.tsx`
- Modify: the seven other `src/components/landing/*.tsx` files

**Interfaces:**
- Produces: a `landing.*` key namespace in `translations`, with English populated and Arabic stubbed to the English string in Task 19, replaced in Task 20.

- [ ] **Step 1: Inventory every landing string**

```bash
cd artifacts/fahr-platform
wc -l src/components/landing/*.tsx
```

Read all eight components. List every user-visible string. Assign each a dotted key named for its component and role — `landing.hero.headline`, `landing.hero.sub`, `landing.pathways.learner.title`. Keep the list; Task 20 works from it.

- [ ] **Step 2: Add the keys with English values**

Add every key to the `en` block of `translations` in `src/lib/LanguageContext.tsx`, with the exact string currently in the JSX. Add the same keys to the `ar` block with the **English** value for now — Task 20 replaces them. Stubbing rather than omitting means `t()` never falls back to rendering a raw key on screen mid-implementation.

- [ ] **Step 3: Replace the literals with `t()` calls**

In each of the eight components, call `const { t } = useLanguage();` and replace every literal with its `t("landing....")` call. Work one component at a time and check the page still renders identically in English after each.

- [ ] **Step 4: Add the toggle**

In `src/components/landing/LandingHeader.tsx`:

```tsx
      <button
        type="button"
        onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
        aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        data-testid="button-language-toggle"
      >
        {language === "ar" ? "EN" : "ع"}
      </button>
```

`useLanguage()` already provides `language` and `setLanguage`, and the provider already sets `document.documentElement.dir`.

- [ ] **Step 5: Convert the landing components to logical properties**

```bash
cd artifacts/fahr-platform
grep -rn "ml-\|mr-\|pl-\|pr-\|text-left\|text-right\|left-\|right-" src/components/landing/
```

Replace: `ml-*` → `ms-*`, `mr-*` → `me-*`, `pl-*` → `ps-*`, `pr-*` → `pe-*`, `text-left` → `text-start`, `text-right` → `text-end`, `left-*` → `start-*`, `right-*` → `end-*`. Add `rtl:rotate-180` to every directional arrow icon (`ArrowRight`, `ChevronRight`).

Leave decorative absolute positioning that is genuinely symmetric — a background blob does not need to mirror. Use judgement, and check the result in Step 7.

- [ ] **Step 6: Reset the language when leaving the landing page**

In `src/App.tsx`, inside the component that owns routing:

```tsx
  // The toggle governs the landing page only. Anything else is English, so a
  // deep link, a back button and a click through the hero all behave alike.
  const [location] = useLocation();
  const { language, setLanguage } = useLanguage();
  useEffect(() => {
    if (location !== "/" && language !== "en") setLanguage("en");
  }, [location, language, setLanguage]);
```

Check the landing route's actual path before writing `"/"`, and make sure this hook sits inside `LanguageProvider`, not outside it.

- [ ] **Step 7: Check the RTL layout in the browser**

Run `pnpm dev`, open the landing page, click the toggle. Expected: the page mirrors, arrows point the other way, nothing overflows horizontally, and no text is clipped. The copy will still be English — that is Task 20. Then click into the app and confirm it returns to LTR English.

- [ ] **Step 8: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 9: Commit**

```bash
git add artifacts/fahr-platform/src
git commit -m "Route the landing page through translation keys and add the language toggle"
```

---

### Task 20: Landing page Arabic

**Files:**
- Modify: `src/lib/LanguageContext.tsx` (the `ar` block only)

**Interfaces:**
- Consumes: the key inventory from Task 19.

- [ ] **Step 1: Translate every `landing.*` key**

Replace each stubbed English value in the `ar` block with Modern Standard Arabic in government register. Conventions to hold to:

- Match the tone of the `nav.*` and `btn.*` Arabic already in the file — formal, plain, no marketing flourish.
- Use the Arabic already present elsewhere in the codebase for established terms: `التوأم الرقمي الذكي` (AI Digital Twin), `مسار التعلم` (learning pathway), `مختبر الذكاء الاصطناعي` (Agentic AI Lab), `ملف القدرات` (capability profile). Grep for them rather than inventing new renderings.
- Agent names: translate consistently and once. Check `src/lib/digitalTwin.ts` and `src/components/twin/GuardrailControls.tsx`, which already carry Arabic for policy language.
- Leave Latin-script proper nouns (FAHR, Potential.com) as they are.
- Numbers stay in Western Arabic numerals, matching the rest of the platform.

- [ ] **Step 2: Check nothing falls back to a raw key**

Run `pnpm dev`, switch to Arabic, and scroll the whole landing page. Any dotted key visible on screen (`landing.hero.headline`) is a missing translation. Fix it.

- [ ] **Step 3: Check the Arabic layout at three widths**

Mobile, tablet and desktop. Arabic text runs longer than English in most places and shorter in a few; look for wrapped buttons, clipped headings and broken grid alignment. Fix by letting containers grow, not by shortening the Arabic.

- [ ] **Step 4: Typecheck and test**

Run: `pnpm typecheck && pnpm --filter @workspace/fahr-platform run test`
Expected: both PASS

- [ ] **Step 5: Commit**

```bash
git add artifacts/fahr-platform/src/lib/LanguageContext.tsx
git commit -m "Translate the landing page into Arabic"
```

- [ ] **Step 6: Flag it for review**

The Arabic is machine-written and has not been reviewed by a native speaker in a government context. Say so explicitly when reporting this task complete — it needs a human pass before the client sees it.

---

### Task 21: Full verification pass

**Files:** none — verification only.

- [ ] **Step 1: Clean typecheck and full test run**

```bash
cd /home/aliya/Projects/Fahr-Brand-Prototype
pnpm typecheck
pnpm --filter @workspace/fahr-platform run test
```

Expected: both PASS with no skipped suites.

- [ ] **Step 2: Production build**

```bash
pnpm build
```

Expected: PASS. This runs the workspace typecheck and every artifact's build.

- [ ] **Step 3: Walk every changed screen**

Run `pnpm dev` and check, in order:

1. **Landing** — toggle to Arabic, scroll the whole page, toggle back, click into the app and confirm it is English and LTR.
2. **Learner dashboard** — Coaching Agent pill present.
3. **Assessment report** — no strengths/gains card, no gap where it was.
4. **Pathway** — ordered journey first with large icons and course art, "Additional courses" below it, no practice or coaching sections.
5. **Course player** — no Coaching Agent pill, Learning Agent tab present, "Reading/Video/Activity" capitalised, all three videos play.
6. **Remediation** — fail a final assessment, see the banner and two revision units, complete them, retake and pass.
7. **Digital twin** — two locked guardrails, custom rules with ✕ only, no governance score, no Phase 2 card; all four chips; type a real name and phone and see the block.
8. **Project Evaluation** — renamed in the sidebar and heading, no three-card strip.
9. **Recognition** — certificate on load, full-screen opens, Download PDF toasts, five competency badges, no wallet, no achievements grid, no impact card, no bottom two cards.

- [ ] **Step 4: Grep for anything left behind**

```bash
cd artifacts/fahr-platform
grep -rn "line manager" src/                          # expect none
grep -rn "min session" src/                           # expect none
grep -rn "Evaluation & Certification" src/            # expect none
grep -rn "Digital credentials wallet" src/            # expect none
grep -rn "humanReview\|auditTrail" src/               # expect none
grep -rn "Switch one off" src/                        # expect none
```

- [ ] **Step 5: Report**

State plainly what passed, what did not, and that the Arabic needs a native-speaker review before the demo.

---

## Notes for the executor

- **Do not add dependencies.** Everything here is buildable with what is already installed. `pnpm-workspace.yaml` has a `minimumReleaseAge` guard and platform `overrides` that make adding one non-trivial, and it is out of scope.
- **Tasks 1–18 are independent of 19–20.** If the Arabic is blocking, the rest can ship without it.
- **Where a step says "let `pnpm typecheck` tell you"**, that is deliberate. This codebase errors on unused imports, so the compiler is a reliable dead-code finder after a deletion.
- **When a test asserts something the spec deliberately removes**, update the test to the new behaviour. Never weaken production code to keep an obsolete assertion green.
