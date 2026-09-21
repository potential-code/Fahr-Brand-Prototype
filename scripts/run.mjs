/**
 * Local runner for the workspace artifacts.
 *
 * On Replit each artifact service gets PORT / BASE_PATH injected from its
 * `.replit-artifact/artifact.toml`, and the Basic-auth credentials come from
 * Replit Secrets. Nothing sets them outside Replit, so `vite.config.ts` throws
 * on startup and the shared auth guard fails closed with a 503. This script
 * supplies the same values locally: per-target defaults, plus anything found
 * in a `.env` file at the repo root.
 *
 *   node scripts/run.mjs [platform|sandbox|api|all] [script]
 *
 * `script` is the package script to run and defaults to `dev`. Long-running
 * scripts (`dev`, `serve`, `preview`, `start`) run concurrently and are torn
 * down together on Ctrl-C; anything else runs sequentially and the first
 * failure stops the run.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");

const LONG_RUNNING_SCRIPTS = new Set(["dev", "serve", "preview", "start"]);

const TARGETS = {
  platform: {
    pkg: "@workspace/fahr-platform",
    label: "FAHR platform (mockup)",
    env: { PORT: "23288", BASE_PATH: "/" },
    needsAuth: true,
  },
  sandbox: {
    pkg: "@workspace/mockup-sandbox",
    label: "Mockup sandbox (component canvas)",
    env: { PORT: "8081", BASE_PATH: "/__mockup" },
    needsAuth: false,
    urlPath: "/__mockup",
  },
  api: {
    pkg: "@workspace/api-server",
    label: "API server",
    env: { PORT: "8080" },
    needsAuth: true,
    needsDatabase: true,
  },
};

/** Parse a .env file. Supports `KEY=value`, `export KEY=value`, quotes and `#` comments. */
function parseEnvFile(contents) {
  const result = {};

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;

    const withoutExport = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = withoutExport.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = withoutExport.slice(0, separatorIndex).trim();
    if (key.length === 0) continue;

    let value = withoutExport.slice(separatorIndex + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length > 1) {
      value = value.slice(1, -1);
    } else {
      const commentIndex = value.indexOf(" #");
      if (commentIndex !== -1) value = value.slice(0, commentIndex).trim();
    }

    result[key] = value;
  }

  return result;
}

function loadDotEnv() {
  try {
    return parseEnvFile(readFileSync(path.join(repoRoot, ".env"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

const requested = (process.argv[2] ?? "platform").toLowerCase();
const script = process.argv[3] ?? "dev";
const isLongRunning = LONG_RUNNING_SCRIPTS.has(script);
const names = requested === "all" ? Object.keys(TARGETS) : [requested];

for (const name of names) {
  if (!TARGETS[name]) {
    console.error(
      `Unknown target "${name}". Use one of: ${Object.keys(TARGETS).join(", ")}, all.`,
    );
    process.exit(1);
  }
}

const dotEnv = loadDotEnv();
// Real environment variables win over .env, so `PORT=3000 pnpm dev` still works.
const baseEnv = { ...dotEnv, ...process.env };

// Credentials and the database are only needed to serve traffic, not to build.
if (isLongRunning) {
  const needsAuth = names.some((name) => TARGETS[name].needsAuth);
  if (
    needsAuth &&
    (!baseEnv.PLATFORM_AUTH_USERNAME || !baseEnv.PLATFORM_AUTH_PASSWORD)
  ) {
    console.error(
      [
        "",
        "PLATFORM_AUTH_USERNAME and PLATFORM_AUTH_PASSWORD are not set.",
        "The shared auth guard fails closed, so every route would answer 503.",
        "",
        "Fix: copy .env.example to .env and set both values.",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  if (names.some((name) => TARGETS[name].needsDatabase) && !baseEnv.DATABASE_URL) {
    console.error(
      "\nDATABASE_URL is not set — the API server needs a Postgres connection string.\n" +
        "The FAHR platform mockup is front-end only; run `pnpm dev` on its own instead.\n",
    );
    process.exit(1);
  }
}

/**
 * The dev servers use `strictPort`, so an occupied port surfaces as a Vite
 * stack trace. Check first and say plainly what is holding it.
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "0.0.0.0");
  });
}

if (isLongRunning) {
  const taken = [];
  for (const name of names) {
    const port = Number({ ...baseEnv, ...TARGETS[name].env }.PORT);
    if (!(await isPortFree(port))) taken.push({ name, port });
  }

  if (taken.length > 0) {
    console.error("");
    for (const { name, port } of taken) {
      console.error(
        `Port ${port} (${TARGETS[name].label}) is already in use — probably an earlier dev server.`,
      );
    }
    console.error(
      "\nFind it with:  ss -ltnp | grep ':" +
        taken[0].port +
        "'\nStop it, or start on another port:  PORT=3000 pnpm dev\n",
    );
    process.exit(1);
  }
}

function startTarget(name) {
  const target = TARGETS[name];
  const env = { ...baseEnv, ...target.env };

  if (isLongRunning) {
    console.log(
      `\n▸ ${target.label} → http://localhost:${env.PORT}${target.urlPath ?? ""}`,
    );
    if (target.needsAuth) {
      console.log(
        `  Basic auth: sign in as "${env.PLATFORM_AUTH_USERNAME}" when the browser prompts.`,
      );
    }
  }

  return spawn("pnpm", ["--filter", target.pkg, "run", script], {
    cwd: repoRoot,
    env,
    stdio: "inherit",
    shell: false,
  });
}

if (isLongRunning) {
  const children = [];
  let shuttingDown = false;

  const shutdown = (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of children) child.kill("SIGTERM");
    process.exit(code);
  };

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  for (const name of names) {
    const child = startTarget(name);
    child.on("exit", (code, signal) => {
      if (shuttingDown) return;
      console.error(
        `\n${TARGETS[name].label} exited (${signal ? `signal ${signal}` : `code ${code}`}).`,
      );
      shutdown(code ?? 1);
    });
    children.push(child);
  }
} else {
  for (const name of names) {
    const code = await new Promise((resolve) => {
      startTarget(name).on("exit", (exitCode) => resolve(exitCode ?? 1));
    });

    if (code !== 0) {
      console.error(`\n${TARGETS[name].label}: "${script}" failed (code ${code}).`);
      process.exit(code);
    }
  }
}
