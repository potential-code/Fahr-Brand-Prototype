# FAHR Federal Agentic AI Learning & Skilling Platform

A clickable, bilingual (English/Arabic, RTL-ready) front-end prototype for a UAE Government FAHR-branded Agentic AI workforce-capability platform, with three role experiences (Learner, Ministry Admin, FAHR Admin) and realistic mock data. Mockup only — no backend.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secrets: `PLATFORM_AUTH_USERNAME`, `PLATFORM_AUTH_PASSWORD` — the HTTP Basic credentials that gate the whole platform. Without both set, every service answers `503` (fail closed).

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

- **Platform-wide HTTP Basic auth is enforced server-side**, not in React. One shared guard (`lib/basic-auth`) is mounted by the Vite dev/preview server, the platform's production Node server and the Express API server, so the landing page, every route and every asset need credentials. There is no login UI — the browser prompts once and re-sends the credentials for the rest of the session.
- **The web artifact is served by a small Node server in production** (`artifacts/fahr-platform/server/index.mjs`) instead of Replit's static hosting, because a static host cannot check credentials. It serves `dist/public`, falls back to `index.html` for SPA routes, and keeps `/healthz` open for the deployment health check.
- Credentials come from `PLATFORM_AUTH_USERNAME` / `PLATFORM_AUTH_PASSWORD` (Replit Secrets, so they apply to both the dev URL and the published app) and are compared in constant time. Nothing is hard coded and the guard fails closed when they are missing.

## Product

- Front-end-only clickable prototype in `artifacts/fahr-platform` (React + Vite, wouter routing, recharts charts).
- Three role experiences: Learner (Aisha Al Mansoori journey — AI Capability Agent, capability profile, development mission, multi-interface agent, Agentic AI Lab Digital Twin + Outcome Project, evaluation, recognition), Ministry Admin (Ministry of Health dashboard + project portfolio), FAHR Admin (federal executive dashboard + governance/audit).
- Bilingual EN/AR with RTL: `src/lib/LanguageContext.tsx` sets `document.documentElement.dir` and `lang`; header toggle switches labels. All data is hardcoded mock data.
- FAHR logo lives at `artifacts/fahr-platform/public/brand/fahr-logo.png`, referenced via `${import.meta.env.BASE_URL}brand/fahr-logo.png`.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The workspace **preview pane cannot pass Basic auth** — browsers refuse credential prompts inside a cross-origin iframe, so the preview shows the 401 page. Open the app in its own browser tab (or the published URL) and sign in there.
- Automated screenshots and headless browsers hit the same wall; give them the credentials explicitly or point them at `/healthz`.
- After changing the auth secrets, restart the workflows (dev) and republish (production) so the servers pick them up.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
