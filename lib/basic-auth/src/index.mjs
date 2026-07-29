/**
 * Shared HTTP Basic authentication guard.
 *
 * Every service in this workspace (the platform web server, the API server and
 * the Vite dev/preview servers) mounts the same guard so a single credential
 * pair protects the whole platform. Credentials are read from the environment
 * on every request, never hard coded:
 *
 *   PLATFORM_AUTH_USERNAME
 *   PLATFORM_AUTH_PASSWORD
 *
 * The guard fails closed: when the credentials are not configured, nothing is
 * served.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export const USERNAME_ENV_VAR = "PLATFORM_AUTH_USERNAME";
export const PASSWORD_ENV_VAR = "PLATFORM_AUTH_PASSWORD";

const DEFAULT_REALM = "Restricted";

/**
 * Read the configured credential pair, or null when it is incomplete.
 */
export function readCredentials(env = process.env) {
  const username = env[USERNAME_ENV_VAR];
  const password = env[PASSWORD_ENV_VAR];

  if (typeof username !== "string" || username.length === 0) return null;
  if (typeof password !== "string" || password.length === 0) return null;

  return { username, password };
}

/**
 * Constant-time string comparison. Both values are hashed first so the
 * comparison never leaks the length of the expected value.
 */
function safeEqual(candidate, expected) {
  const a = createHash("sha256").update(String(candidate), "utf8").digest();
  const b = createHash("sha256").update(String(expected), "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * Validate an `Authorization` header value against the expected credentials.
 */
export function verifyAuthorizationHeader(headerValue, credentials) {
  if (typeof headerValue !== "string") return false;

  const separatorIndex = headerValue.indexOf(" ");
  if (separatorIndex === -1) return false;

  const scheme = headerValue.slice(0, separatorIndex);
  const encoded = headerValue.slice(separatorIndex + 1).trim();
  if (scheme.toLowerCase() !== "basic" || encoded.length === 0) return false;

  let decoded;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return false;
  }

  const colonIndex = decoded.indexOf(":");
  if (colonIndex === -1) return false;

  const username = decoded.slice(0, colonIndex);
  const password = decoded.slice(colonIndex + 1);

  // Compare both halves without short-circuiting.
  const usernameMatches = safeEqual(username, credentials.username);
  const passwordMatches = safeEqual(password, credentials.password);

  return usernameMatches && passwordMatches;
}

function quoteRealm(realm) {
  // A realm cannot contain quotes or backslashes.
  return String(realm).replace(/[\\"]/g, "");
}

function normalizePath(url) {
  const withoutQuery = String(url ?? "/").split("?")[0] ?? "/";
  const withoutHash = withoutQuery.split("#")[0] ?? "/";
  return withoutHash.length > 0 ? withoutHash : "/";
}

function isPublicPath(pathname, publicPaths) {
  return publicPaths.some((candidate) => {
    if (pathname === candidate) return true;
    const prefix = candidate.endsWith("/") ? candidate : `${candidate}/`;
    return pathname.startsWith(prefix);
  });
}

function sendPlainResponse(req, res, statusCode, message, extraHeaders = {}) {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${message}</title></head><body><h1>${message}</h1></body></html>`;

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  for (const [name, value] of Object.entries(extraHeaders)) {
    res.setHeader(name, value);
  }

  if (req?.method === "HEAD") {
    res.end();
    return;
  }

  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

/**
 * Create a connect/express compatible middleware enforcing Basic auth.
 */
export function createBasicAuthGuard(options = {}) {
  const {
    realm = DEFAULT_REALM,
    publicPaths = [],
    env = process.env,
    logger = console,
  } = options;

  const challengeHeader = `Basic realm="${quoteRealm(realm)}", charset="UTF-8"`;
  let warnedAboutMissingCredentials = false;

  return function basicAuthGuard(req, res, next) {
    const pathname = normalizePath(req?.url);

    if (isPublicPath(pathname, publicPaths)) {
      next();
      return;
    }

    const credentials = readCredentials(env);

    if (!credentials) {
      if (!warnedAboutMissingCredentials) {
        warnedAboutMissingCredentials = true;
        logger?.error?.(
          `Refusing all requests: ${USERNAME_ENV_VAR} and ${PASSWORD_ENV_VAR} must both be set.`,
        );
      }
      sendPlainResponse(req, res, 503, "Authentication is not configured");
      return;
    }

    if (verifyAuthorizationHeader(req?.headers?.authorization, credentials)) {
      // Authenticated responses must never be cached by shared proxies.
      res.setHeader("Vary", "Authorization");
      next();
      return;
    }

    sendPlainResponse(req, res, 401, "Authentication required", {
      "WWW-Authenticate": challengeHeader,
    });
  };
}

/**
 * Vite plugin wrapper so dev and preview servers enforce the same guard.
 * Mounted as a "pre" middleware so it runs ahead of Vite's own handlers.
 */
export function basicAuthVitePlugin(options = {}) {
  const guard = createBasicAuthGuard(options);

  return {
    name: "workspace:basic-auth",
    configureServer(server) {
      server.middlewares.use(guard);
    },
    configurePreviewServer(server) {
      server.middlewares.use(guard);
    },
  };
}
