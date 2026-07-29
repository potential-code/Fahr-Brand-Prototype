---
name: Platform-wide HTTP Basic auth
description: Why the whole platform sits behind one server-side Basic auth guard, why the web artifact stopped being a static deployment, and what that costs in the workspace preview.
---

# Platform-wide HTTP Basic auth

The whole platform (landing page, every SPA route, every asset, the API) is gated by a single
HTTP Basic credential pair validated on the server. No login UI exists: the browser prompts once
and re-sends credentials for the rest of the session.

**Why:** the client wanted the demo shielded from anyone with the URL, with credentials that stay
configurable per environment. A front-end gate would be trivially bypassable, and Basic auth needs
no session store, no database and no login screen.

**How to apply:**

- One shared guard is the only implementation. Every service mounts it — the Vite dev/preview
  server (via a plugin), the platform's production Node server, and the Express API. Do not
  re-implement the check anywhere.
- The guard reads credentials from the environment on each request and **fails closed** (503) when
  they are missing. Never add a hard-coded fallback pair: a fallback silently defeats the gate.
- Health endpoints are the only public paths. They must stay open or the deployment's startup
  health check fails against a 401.
- Compare credentials in constant time (hash both sides, then `timingSafeEqual`) and never log the
  header or the values.

## The web artifact cannot be a static deployment any more

Replit's static hosting cannot check credentials, so the web artifact's production service runs a
small Node server that serves the build output with SPA fallback instead of `serve = "static"`.
Anything that reverts the artifact's production service back to static serving silently removes
authentication in production while dev still looks protected.

## Cost to be aware of

Browsers refuse Basic auth prompts inside cross-origin iframes, so the workspace preview pane and
headless screenshot tooling both land on the 401 page. That is expected, not a regression — verify
with `curl -u` against the dev domain, or open the app in a real browser tab. Do not "fix" it by
weakening the guard in development.

## Verifying in a browser anyway

The testing subagent is the only working way to drive the UI: tell it explicitly to build its
browser context with `httpCredentials` taken from the platform's auth env vars, or every navigation
returns 401 and it reports "unable".

Also tell it the real base path. The web artifact is mounted at the **root**, so learner/manager
routes are `/learner/...`, not `/<artifact-name>/...`. Guessing the artifact name as a URL prefix
produces the app's own 404 page, which reads like a broken router and wastes a whole test run.
Confirm the mount with the running dev server's `BASE_PATH` before writing the plan.
