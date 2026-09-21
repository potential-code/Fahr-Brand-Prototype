# syntax=docker/dockerfile:1

# API server — Express 5, bundled to a single ESM file by esbuild.
#
# Build from the REPOSITORY ROOT:
#
#   docker build -f artifacts/api-server/Dockerfile -t fahr-api .
#
# linux/amd64 + glibc only, for the same reason as the platform image: the
# workspace overrides keep only the linux-x64-gnu native binaries, so an Alpine
# or arm64 builder fails to resolve them.

##############################################################################
# Stage 1 — bundle
##############################################################################
FROM --platform=linux/amd64 node:24-bookworm-slim AS builder

# Not NODE_ENV=production: esbuild and the pino plugin are devDependencies.
ENV CI=true \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate

WORKDIR /repo

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

RUN pnpm install --frozen-lockfile --filter "@workspace/api-server..."

COPY tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

RUN pnpm --filter @workspace/api-server run build

##############################################################################
# Stage 2 — run
##############################################################################
FROM --platform=linux/amd64 node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# build.mjs bundles every dependency into dist/ (plus the pino transport files
# the plugin emits alongside it), so there is no node_modules to carry over.
COPY --from=builder --chown=node:node /repo/artifacts/api-server/dist ./dist

USER node

EXPOSE 8080

# /api/healthz is the one route lib/basic-auth lets through unauthenticated.
# Probed with node's global fetch because bookworm-slim ships no curl or wget.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
