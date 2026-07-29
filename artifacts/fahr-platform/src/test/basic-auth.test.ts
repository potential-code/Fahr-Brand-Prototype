import { describe, expect, it, vi } from "vitest";
import {
  createBasicAuthGuard,
  verifyAuthorizationHeader,
} from "@workspace/basic-auth";

const CREDENTIALS = { username: "admin", password: "s3cret" };

function basicHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

function runGuard(
  options: Parameters<typeof createBasicAuthGuard>[0],
  request: { url?: string; method?: string; authorization?: string },
) {
  const guard = createBasicAuthGuard(options);
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    ended: false,
    body: "",
    setHeader(name: string, value: string | number) {
      headers[name.toLowerCase()] = String(value);
    },
    end(chunk?: string) {
      this.ended = true;
      if (chunk) this.body = chunk;
    },
  };
  const next = vi.fn();

  guard(
    {
      url: request.url ?? "/",
      method: request.method ?? "GET",
      headers: request.authorization
        ? { authorization: request.authorization }
        : {},
    },
    res,
    next,
  );

  return { res, headers, next };
}

const configured = {
  env: {
    PLATFORM_AUTH_USERNAME: CREDENTIALS.username,
    PLATFORM_AUTH_PASSWORD: CREDENTIALS.password,
  },
  realm: "FAHR AI Learning Platform",
  publicPaths: ["/healthz"],
};

describe("verifyAuthorizationHeader", () => {
  it("accepts only the exact credential pair", () => {
    expect(
      verifyAuthorizationHeader(basicHeader("admin", "s3cret"), CREDENTIALS),
    ).toBe(true);
    expect(
      verifyAuthorizationHeader(basicHeader("admin", "wrong"), CREDENTIALS),
    ).toBe(false);
    expect(
      verifyAuthorizationHeader(basicHeader("root", "s3cret"), CREDENTIALS),
    ).toBe(false);
  });

  it("rejects missing or malformed headers", () => {
    expect(verifyAuthorizationHeader(undefined, CREDENTIALS)).toBe(false);
    expect(verifyAuthorizationHeader("", CREDENTIALS)).toBe(false);
    expect(verifyAuthorizationHeader("Basic", CREDENTIALS)).toBe(false);
    expect(verifyAuthorizationHeader("Basic !!!not-base64", CREDENTIALS)).toBe(
      false,
    );
    expect(
      verifyAuthorizationHeader(
        `Bearer ${Buffer.from("admin:s3cret").toString("base64")}`,
        CREDENTIALS,
      ),
    ).toBe(false);
  });

  it("keeps passwords containing colons intact", () => {
    const credentials = { username: "admin", password: "a:b:c" };
    expect(
      verifyAuthorizationHeader(basicHeader("admin", "a:b:c"), credentials),
    ).toBe(true);
  });
});

describe("createBasicAuthGuard", () => {
  it("challenges unauthenticated requests to any route", () => {
    for (const url of ["/", "/manager/reports", "/assets/app-abc123.js"]) {
      const { res, headers, next } = runGuard(configured, { url });
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(headers["www-authenticate"]).toBe(
        'Basic realm="FAHR AI Learning Platform", charset="UTF-8"',
      );
      expect(headers["cache-control"]).toBe("no-store");
    }
  });

  it("passes authenticated requests through", () => {
    const { res, next } = runGuard(configured, {
      url: "/manager/recognition",
      authorization: basicHeader(CREDENTIALS.username, CREDENTIALS.password),
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.ended).toBe(false);
  });

  it("rejects wrong credentials", () => {
    const { res, next } = runGuard(configured, {
      url: "/",
      authorization: basicHeader("admin", "guess"),
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("leaves declared public paths open", () => {
    const { next } = runGuard(configured, { url: "/healthz?probe=1" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("fails closed when credentials are not configured", () => {
    const logger = { error: vi.fn() };
    const { res, next } = runGuard(
      { ...configured, env: {}, logger },
      {
        url: "/",
        authorization: basicHeader("admin", "s3cret"),
      },
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
