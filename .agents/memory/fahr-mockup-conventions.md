---
name: FAHR mockup conventions
description: Durable conventions and gotchas for the FAHR platform mockup
---
- The platform is a front-end-only mockup: mock data, fake auth (any credentials), simulated AI. Keep it that way unless the user asks for a real backend.
- Shared naming lives in `src/lib/constants.ts` (six proposal agent names + unified capability ladder). All new UI must use these — legacy "Capability/Assessment/Governance Agent" naming was purged.
- English-only for now; the nav language toggle is an intentional non-functional placeholder (Arabic/RTL is a separate proposed task).
- **Why:** user explicitly chose these scopes during Task planning.
- Gotchas: fahr.gov.ae blocks scraping/screenshots (branding capture fails — use the existing theme in src/index.css). The FAHR logo PNG has a white background — never use `brightness-0 invert` on it (renders a white box); place it on a white chip instead. Radix/shadcn `<Select required>` creates unfulfillable native validation — avoid `required` on Selects.
