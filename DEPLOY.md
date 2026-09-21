# Deploying to Dokploy

Two images, both built from the repository root:

| Service         | Dockerfile                             | Port | What it is                                              |
| --------------- | -------------------------------------- | ---- | ------------------------------------------------------- |
| `fahr-platform` | `artifacts/fahr-platform/Dockerfile`   | 80   | The Vite/React mockup, built to static files and served by nginx |
| `api-server`    | `artifacts/api-server/Dockerfile`      | 8080 | Express 5, bundled by esbuild. Only `/api/healthz` exists today |

`artifacts/mockup-sandbox` is a component canvas for local work and is not deployed.

The front end never calls the API — nothing under `artifacts/fahr-platform/src`
imports `@workspace/api-client-react`. If you only want the clickable prototype
online, delete the `api-server` service from `docker-compose.prod.yml` and
deploy one container.

## Set up the Dokploy app

1. **Project → Create Service → Compose.**
2. **Provider:** this Git repository, branch `main`.
3. **Compose Path:** `docker-compose.prod.yml`.
4. **Environment** (Dokploy writes these to the `.env` next to the compose file,
   which is where the `${...}` substitutions read from):

   ```
   PLATFORM_AUTH_USERNAME=fahr
   PLATFORM_AUTH_PASSWORD=<a real password>
   BASE_PATH=/
   ```

   Both credentials are required. The compose file uses `${VAR:?...}` so a
   missing one aborts the deploy rather than shipping something unreachable.

5. **Domains.** Add one per service — Dokploy asks for the service name and the
   container port:

   | Domain              | Service         | Container port | HTTPS            |
   | ------------------- | --------------- | -------------- | ---------------- |
   | `fahr.example.ae`   | `fahr-platform` | `80`           | Let's Encrypt on |
   | `api.fahr.example.ae` | `api-server`  | `8080`         | Let's Encrypt on |

   Point the DNS A records at the Dokploy host before saving, or the ACME
   challenge fails.

6. **Deploy.** First build takes a few minutes (a full `pnpm install` plus a
   Vite production build); later ones reuse the dependency layer unless
   `pnpm-lock.yaml` changed.

## Authentication

`lib/basic-auth` gates every service behind one HTTP Basic credential pair and
fails closed when it is not configured. That guard is a Vite plugin, so it
disappears the moment the app is a pile of static files. The platform image
restores it in nginx: `docker/platform-auth.sh` runs on every container start,
writes an htpasswd file from `PLATFORM_AUTH_USERNAME` / `PLATFORM_AUTH_PASSWORD`,
and — when either is missing — replaces the guard with a blanket `503`.

Behaviour, verified against the built images:

| Request                     | No credentials configured | Configured, no auth | Configured, correct auth |
| --------------------------- | ------------------------- | ------------------- | ------------------------ |
| `GET /healthz`              | `200`                     | `200`               | `200`                    |
| `GET /` and everything else | `503`                     | `401`               | `200`                    |

`/healthz` (platform) and `/api/healthz` (API) stay public so the container
health checks work without credentials. Changing the password is a restart,
not a rebuild.

**To make the prototype public**, drop the `include /etc/nginx/platform-auth.conf;`
lines from `artifacts/fahr-platform/docker/nginx.conf`. Don't do it by leaving
the environment variables blank — that serves a `503`, not the site.

## Things that will bite you

- **Build on linux/amd64 with glibc.** `pnpm-workspace.yaml` `overrides` delete
  every native binary except the `linux-x64-gnu` ones, *including* the musl
  builds. An Alpine builder dies with `Cannot find module
  @rollup/rollup-linux-x64-musl`; arm64 fails the same way. Both Dockerfiles
  pin `--platform=linux/amd64` and use `node:24-bookworm-slim` for this reason.
- **`BASE_PATH` is a build argument, not a runtime one.** The components build
  every image URL from `import.meta.env.BASE_URL`. Changing it needs a rebuild.
- **`PORT` at build time is a formality.** `vite.config.ts` throws without it
  for *any* vite command, `build` included, so the Dockerfile sets a dummy
  value. Nothing listens on it.
- **No `ports:` in the compose file.** Traefik reaches containers over
  `dokploy-network` by container port. Publishing host ports only collides with
  the other apps on the server.
- **`attached_assets/` is excluded from the build context** (34 MB, and the
  `@assets` alias is currently unused). If a component ever imports through
  `@assets`, remove that line from `.dockerignore` or the build fails on an
  unresolved import.
- **No database.** `lib/db` throws at import time without `DATABASE_URL`, but
  nothing imports it yet. When something does, add a Dokploy-managed Postgres
  and paste its internal connection string into the environment — don't add a
  `postgres:` service to `docker-compose.prod.yml`.

## Running the stack locally

```sh
docker network create dokploy-network        # once; Dokploy creates it on the server
PLATFORM_AUTH_USERNAME=fahr PLATFORM_AUTH_PASSWORD=change-me \
  docker compose -f docker-compose.prod.yml up --build
```

Or a single image:

```sh
docker build -f artifacts/fahr-platform/Dockerfile -t fahr-platform .
docker run --rm -p 8080:80 \
  -e PLATFORM_AUTH_USERNAME=fahr -e PLATFORM_AUTH_PASSWORD=change-me \
  fahr-platform
```

For day-to-day development use `pnpm dev` instead — Docker rebuilds the whole
bundle on every change.
