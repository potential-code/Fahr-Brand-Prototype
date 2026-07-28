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

## Rebrand palette (official FAHR, applied)
Theme tokens now: cream bg (40 33% 98%), camel-gold primary deepened to 37 33% 42% for white-text contrast (51% lightness failed review), bronze accent (35 38% 44%) with WHITE accent-foreground — never use `text-accent-foreground` on light surfaces (invisible); use `text-accent` instead. Greens/reds kept only for genuine success/danger semantics. Sidebar is a separated `bg-sidebar` panel card; top bar is logo-only.
