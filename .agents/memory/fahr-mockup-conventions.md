---
name: FAHR mockup conventions
description: Durable conventions and gotchas for the FAHR platform mockup
---
- The platform is a front-end-only mockup: mock data, fake auth (any credentials), simulated AI. Keep it that way unless the user asks for a real backend.
- Shared naming lives in `src/lib/constants.ts` (six proposal agent names + unified capability ladder). All new UI must use these — legacy "Capability/Assessment/Governance Agent" naming was purged.
- English-only for now; the nav language toggle is an intentional non-functional placeholder (Arabic/RTL is a separate proposed task).
- **Why:** user explicitly chose these scopes during Task planning.
- Gotchas: fahr.gov.ae blocks scraping/screenshots (branding capture fails — use the existing theme in src/index.css). The FAHR logo PNG has a white background — never use `brightness-0 invert` on it (renders a white box); place it on a white chip instead. Radix/shadcn `<Select required>` creates unfulfillable native validation — avoid `required` on Selects.

## Learner journey contract (decided with the user, keep consistent)
- The baseline assessment is the single diagnostic entry point. Onboarding is pure profile setup and must never regain an inline quiz.
- Assessment result -> recommended courses -> those same courses feed the Personalised Development Mission. Never create a second, parallel course list.
- The dashboard AI chat stays a conversational concierge; the assessment owns the diagnostic. Do not duplicate scoring in the chat.
- **Why:** the user chose a single spine so the demo reads as one continuous story rather than competing features.
- Reference screenshots the user supplies are for visual design only — all content stays FAHR/federal AI-competency themed.
- The landing page journey graphic is a user-supplied raster with the six stage names baked into the pixels, and the user explicitly accepted it as-is — including a caption overflow and two stage labels that the platform-wide terminology cleanup retires elsewhere. Do not regenerate, crop, overlay, or "correct" it, and do not add a text stage list beside it to compensate. **Why:** the user was shown the conflict and chose the image unchanged. Only replace it if they ask.
- Its alt text is deliberately generic (start-to-end summary, no stage names). **Why:** reciting the baked-in labels would propagate retired vocabulary, but renaming them in alt text would misdescribe the picture a sighted user sees. Keep alt text label-free while the raster survives.

## Screen vocabulary and heading scale
- Proposal vocabulary is canonical on every screen: Personalised Learning Pathway (short: Learning Pathway), Capability Profile, Workplace Project / Workplace Project Evaluation, Assessment & Certification, AI Learning Coach. The retired synonyms (Development Mission, Dynamic Capability Profile, Outcome Project, Assess & Validate, generic "AI Agent") must not reappear. AR equivalents: مسار التعلم الشخصي، المشروع التطبيقي، التقييم والاعتماد، مدرب التعلم الذكي.
- URL routes intentionally keep their old segments (`/learner/mission`, `/learner/lab/project`, `/learner/evaluation`). **Why:** they are not user-visible in a mockup and renaming them buys nothing but broken links.
- Every dashboard screen gets its title from the shared `PageHeader`; it owns the type scale so sizes cannot drift again. Marketing surfaces (landing, login, signup) and immersive flows (onboarding, assessment, course player, report) deliberately keep their own larger headings. **How to apply:** never hand-roll an `h1` on a dashboard page — extend `PageHeader` instead.

## Personalised recommendation content
- Anything the platform "recommends" to a learner (priorities, practice, coaching, re-check, resources, events, workplace project) must be derived from the assessment result in the recommendation builder, not hardcoded into a page. Pages consume the builder; they never invent their own pool. **Why:** the demo's whole claim is that two learners with different answers get different plans — hardcoding in a page silently breaks that, and the second consumer (Learning Pathway, manager view) then drifts out of sync.
- Each report section is attributed to one named agent from `constants.ts`, and the mapping is meaningful: advisor = diagnosis and re-check, content = courses and reading, practice = exercises and workplace project, coach = coaching plan, concierge = resources and events. **How to apply:** when adding a new recommendation type, decide which agent produces it before designing the card.
- Simulated AI "thinking" states stay inside the page where the learner's work was — no full-screen takeovers. **Why:** the user reads a takeover as the app breaking, and the surrounding chrome is what makes the staged analysis look like part of the product.

## Learning Pathway and the AI Learning Coach
- The pathway is ONE ordered journey of mixed formats (course, microlearning, virtual session, practical assignment, simulation, lab, workplace project, targeted re-check), not parallel lists of "courses" plus loose practice cards. Gating rule: courses are never locked; the activities between them unlock sequentially. **Why:** the demo has to reach the adaptive moment without anyone sitting through a whole course, while still showing that the journey is ordered.
- The coach is a panel, not a page. One panel component, mounted two ways: a fixed edge dock on full pages, and an **absolutely positioned panel inside the Radix `DialogContent`** when the activity is a dialog. **Why:** a fixed panel outside the dialog fights Radix's focus trap and sits under its overlay. **How to apply:** give the dialog `relative overflow-hidden` and let the panel be a child of it.
- Floating page-level chrome (the AI Concierge button) must stay **below** the dialog overlay in z-order, and the coach dock above it. A floating button that outranks a modal creates a live interaction path outside the modal.
- Not every capability has a catalogue course (analytics and agentic have none). Anything deriving quiz questions, lessons or artwork by looking a competency up in `COURSES` needs an explicit fallback or it silently renders nothing. **Why:** a microlearning knowledge check vanished this way and only a browser test caught it.

## Motion layering (GSAP + framer-motion coexist)
- GSAP ScrollTrigger animates **section wrappers only**; framer-motion animates everything inside them. Never put both on the same node — they both write `transform` and the element ends up stuck or invisible. **How to apply:** wrap a section in the shared `ScrollReveal`, then use `whileInView`/`animate` on the cards and bars inside it.
- Screenshots of animated pages routinely capture counters and recharts mid-flight, so a ring reading 43% when the data says 62%, or an area chart that stops two thirds across, is the animation not a bug. **Why:** several rounds were nearly wasted "fixing" phantom mismatches. Confirm against the source number before changing anything.

## Rebrand palette (official FAHR, applied)
Theme tokens now: cream bg (40 33% 98%), camel-gold primary deepened to 37 33% 42% for white-text contrast (51% lightness failed review), bronze accent (35 38% 44%) with WHITE accent-foreground — never use `text-accent-foreground` on light surfaces (invisible); use `text-accent` instead. Greens/reds kept only for genuine success/danger semantics. Sidebar is a separated `bg-sidebar` panel card; top bar is logo-only.
- A low competency score is a development priority, not an error: rank strength / steady / gap by **weight** (solid primary, bronze accent, muted bar plus a solid dark "Priority gap" pill), never by hue. `destructive` red on a capability bar reads as a system failure on a government screen.

## Sidebar-reachable screens must never be dead ends

Every screen in the learner sidebar can be opened directly, in any order, without the preceding step having been done. A screen whose content depends on an earlier action (an evaluation depending on a submitted project, a credential depending on an evaluation) must synthesise a worked example from the same derivation helpers it would use for real input, and label the real case explicitly ("this is the project you just submitted").

**Why:** stakeholders click through the sidebar top to bottom in demos rather than following the intended journey, and an empty "nothing submitted yet" panel reads as a broken screen.

**How to apply:** put the fallback in the domain module next to the real builder (same shapes, same scoring path) rather than hand-writing static display copy in the page, so the demo state and the live state can never drift apart.

## Say where a number came from, or don't show it as earned

The learner-facing record mixes two kinds of figures: those counted from activity inside the platform, and those the platform only reads from FAHR's existing programme records (attendance, peer recognition). Any ledger, badge or headline that mixes them must label the carried-in lines, and the shared headline points figure stays a single constant so recognition, profile and leaderboards can never disagree.

**Why:** a review round flagged "always-earned" badges and static ledger rows as invented data. They are legitimate for a mockup, but only if the screen is honest about their provenance — otherwise the demo overclaims what the platform measured.

**How to apply:** carry a `source` discriminator on the record entry itself, not a caption bolted on in the page, so every consumer of the record inherits the labelling.

## Waiting lists are not registrations

Where a seat can run out, hold "confirmed" and "waiting" as separate state, never one id list plus a full/not-full check. A waiting-list place consumes no seat, shows no joining details or calendar action, and its cancel copy differs.

**Why:** collapsing them produced a card that said "Added to the waiting list" in the toast and "You are registered" with a Join button on the card.

## Cross-stage wizard state, and how it looks broken to a browser tester

Multi-stage builders render one stage at a time, so inputs from other stages are absent from the DOM entirely. A browser test that reads inputs by test id on the wrong stage reports them as empty and will call it state loss. Confirm real loss by checking a cross-stage indicator (the readiness meter / submit gate) rather than by querying inputs.

**Why:** an e2e run flagged "outcomes emptied without a reload"; the outcome inputs simply were not mounted on the stage being inspected, and the submit gate — which requires every stage complete at once — passed.
