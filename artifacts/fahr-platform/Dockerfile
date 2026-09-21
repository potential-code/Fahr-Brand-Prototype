# syntax=docker/dockerfile:1

# FAHR platform mockup — Vite/React SPA built once, then served by nginx.
#
# Build from the REPOSITORY ROOT, not from this directory: the build needs the
# pnpm workspace manifests and the lib/* packages the platform imports.
#
#   docker build -f artifacts/fahr-platform/Dockerfile -t fahr-platform .
#
# linux/amd64 + glibc only, and both halves of that matter. The `overrides` in
# pnpm-workspace.yaml delete every esbuild / rollup / lightningcss /
# @tailwindcss/oxide binary except the linux-x64-gnu ones -- including the
# -musl variants. An Alpine builder therefore dies in `vite build` with
# "Cannot find module @rollup/rollup-linux-x64-musl", and arm64 fails the same
# way. Hence bookworm-slim below, not node:24-alpine.

##############################################################################
# Stage 1 — build the static bundle
##############################################################################
FROM --platform=linux/amd64 node:24-bookworm-slim AS builder

# NODE_ENV is deliberately NOT set here: pnpm reads it and would skip the
# devDependencies, which is where vite, tailwind and every plugin live.
ENV CI=true \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /repo

# Manifests first: this layer, and the install below it, stay cached until a
# dependency actually changes. Every workspace package needs its package.json
# present or pnpm cannot resolve the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts/package.json ./scripts/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/basic-auth/package.json ./lib/basic-auth/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/fahr-platform/package.json ./artifacts/fahr-platform/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/

# The trailing `...` pulls in the workspace libs the platform depends on and
# leaves the sandbox and API server out of the install.
RUN pnpm install --frozen-lockfile --filter "@workspace/fahr-platform..."

COPY tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts/fahr-platform ./artifacts/fahr-platform

# vite.config.ts throws unless both are present — it makes no distinction
# between `vite dev` and `vite build`. PORT only satisfies that check; nothing
# listens on it in this stage. BASE_PATH becomes `import.meta.env.BASE_URL`,
# which the components use to build every asset URL, so it has to be baked in
# at build time. Leave it at "/" unless the app is hosted under a sub-path.
ARG BASE_PATH=/
ENV NODE_ENV=production \
    BASE_PATH=${BASE_PATH} \
    PORT=3000

# The artifact's own build script, not the root one — `pnpm build` at the root
# runs a full workspace typecheck that CI should own, not the image build.
RUN pnpm --filter @workspace/fahr-platform run build

##############################################################################
# Stage 2 — serve
##############################################################################
FROM nginx:1.29-alpine AS runtime

# htpasswd, for the Basic auth file rebuilt on each start.
RUN apk add --no-cache apache2-utils

COPY artifacts/fahr-platform/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY artifacts/fahr-platform/docker/platform-auth.sh /docker-entrypoint.d/20-platform-auth.sh

# Fail closed by default: if the entrypoint script never runs, this include is
# what the server blocks pick up and every guarded location answers 503.
RUN chmod +x /docker-entrypoint.d/20-platform-auth.sh \
    && printf 'return 503;\n' > /etc/nginx/platform-auth.conf

# `build.outDir` in vite.config.ts is dist/public, not dist.
COPY --from=builder /repo/artifacts/fahr-platform/dist/public /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

# Inherits the nginx image's entrypoint (which runs /docker-entrypoint.d/*) and
# its `nginx -g "daemon off;"` command.
