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

## Motion layering (GSAP + framer-motion coexist)
- GSAP ScrollTrigger animates **section wrappers only**; framer-motion animates everything inside them. Never put both on the same node — they both write `transform` and the element ends up stuck or invisible. **How to apply:** wrap a section in the shared `ScrollReveal`, then use `whileInView`/`animate` on the cards and bars inside it.
- Screenshots of animated pages routinely capture counters and recharts mid-flight, so a ring reading 43% when the data says 62%, or an area chart that stops two thirds across, is the animation not a bug. **Why:** several rounds were nearly wasted "fixing" phantom mismatches. Confirm against the source number before changing anything.

## Rebrand palette (official FAHR, applied)
Theme tokens now: cream bg (40 33% 98%), camel-gold primary deepened to 37 33% 42% for white-text contrast (51% lightness failed review), bronze accent (35 38% 44%) with WHITE accent-foreground — never use `text-accent-foreground` on light surfaces (invisible); use `text-accent` instead. Greens/reds kept only for genuine success/danger semantics. Sidebar is a separated `bg-sidebar` panel card; top bar is logo-only.
- A low competency score is a development priority, not an error: rank strength / steady / gap by **weight** (solid primary, bronze accent, muted bar plus a solid dark "Priority gap" pill), never by hue. `destructive` red on a capability bar reads as a system failure on a government screen.
