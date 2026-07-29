/**
 * Production server for the FAHR AI Learning Platform.
 *
 * The platform is a single page app, but it is served by this small Node server
 * rather than a static host so that HTTP Basic authentication is enforced on
 * the server for every route, including the landing page and every asset.
 */

import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { createBasicAuthGuard } from "@workspace/basic-auth";

const REALM = "FAHR AI Learning Platform";
const HEALTH_PATH = "/healthz";

const publicDir = path.resolve(import.meta.dirname, "..", "dist", "public");
const indexFile = path.join(publicDir, "index.html");

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = (process.env.BASE_PATH ?? "/").replace(/\/+$/, "");

const MIME_TYPES = new Map(
  Object.entries({
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  }),
);

const guard = createBasicAuthGuard({
  realm: REALM,
  publicPaths: [HEALTH_PATH, `${basePath}${HEALTH_PATH}`],
});

function applyCommonHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
}

function sendStatus(req, res, statusCode, message) {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${message}</title></head><body><h1>${message}</h1></body></html>`;
  res.statusCode = statusCode;
  applyCommonHeaders(res);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

async function sendFile(req, res, filePath, { immutable }) {
  const stats = await stat(filePath);
  const contentType =
    MIME_TYPES.get(path.extname(filePath).toLowerCase()) ??
    "application/octet-stream";

  res.statusCode = 200;
  applyCommonHeaders(res);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stats.size);
  // Authenticated responses stay in the private (browser) cache only.
  res.setHeader(
    "Cache-Control",
    immutable ? "private, max-age=31536000, immutable" : "private, no-cache",
  );

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("end", resolve);
    stream.pipe(res);
  });
}

function resolveRequestedFile(pathname) {
  let requestPath = pathname;

  if (basePath && requestPath.startsWith(basePath)) {
    requestPath = requestPath.slice(basePath.length) || "/";
  }

  let decoded;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return null;
  }

  if (decoded.includes("\0")) return null;
  if (decoded.endsWith("/")) decoded = `${decoded}index.html`;

  const resolved = path.resolve(publicDir, `.${path.posix.normalize(decoded)}`);

  // Never serve anything outside the built output.
  if (resolved !== publicDir && !resolved.startsWith(`${publicDir}${path.sep}`)) {
    return null;
  }

  return resolved;
}

async function serve(req, res) {
  const pathname = (req.url ?? "/").split("?")[0] ?? "/";
  const filePath = resolveRequestedFile(pathname);

  if (!filePath) {
    sendStatus(req, res, 400, "Bad request");
    return;
  }

  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      await sendFile(req, res, path.join(filePath, "index.html"), {
        immutable: false,
      });
      return;
    }
    await sendFile(req, res, filePath, {
      immutable: filePath.includes(`${path.sep}assets${path.sep}`),
    });
    return;
  } catch {
    // Fall through to the single page app entry point.
  }

  // Asset-like requests should 404 rather than return the app shell.
  if (path.extname(filePath) && path.extname(filePath) !== ".html") {
    sendStatus(req, res, 404, "Not found");
    return;
  }

  try {
    await sendFile(req, res, indexFile, { immutable: false });
  } catch {
    sendStatus(req, res, 500, "Application build is missing");
  }
}

function sendHealth(req, res) {
  const body = JSON.stringify({ status: "ok" });
  res.statusCode = 200;
  applyCommonHeaders(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendStatus(req, res, 405, "Method not allowed");
    return;
  }

  const pathname = (req.url ?? "/").split("?")[0] ?? "/";
  if (pathname === HEALTH_PATH || pathname === `${basePath}${HEALTH_PATH}`) {
    sendHealth(req, res);
    return;
  }

  guard(req, res, () => {
    serve(req, res).catch((err) => {
      console.error("Failed to serve request", err);
      if (!res.headersSent) {
        sendStatus(req, res, 500, "Internal server error");
        return;
      }
      res.end();
    });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`FAHR platform listening on port ${port}`);
});
