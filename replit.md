# FAHR Federal Agentic AI Learning & Skilling Platform

A clickable, bilingual (English/Arabic, RTL-ready) front-end prototype for a UAE Government FAHR-branded Agentic AI workforce-capability platform, with three role experiences (Learner, Ministry Admin, FAHR Admin) and realistic mock data. Mockup only — no backend.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Front-end-only clickable prototype in `artifacts/fahr-platform` (React + Vite, wouter routing, recharts charts).
- Three role experiences: Learner (Aisha Al Mansoori journey — AI Capability Agent, capability profile, development mission, multi-interface agent, Agentic AI Lab Digital Twin + Outcome Project, evaluation, recognition), Ministry Admin (Ministry of Health dashboard + project portfolio), FAHR Admin (federal executive dashboard + governance/audit).
- Bilingual EN/AR with RTL: `src/lib/LanguageContext.tsx` sets `document.documentElement.dir` and `lang`; header toggle switches labels. All data is hardcoded mock data.
- FAHR logo lives at `artifacts/fahr-platform/public/brand/fahr-logo.png`, referenced via `${import.meta.env.BASE_URL}brand/fahr-logo.png`.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
