export declare const USERNAME_ENV_VAR: "PLATFORM_AUTH_USERNAME";
export declare const PASSWORD_ENV_VAR: "PLATFORM_AUTH_PASSWORD";

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

export interface BasicAuthGuardOptions {
  /** Realm shown in the browser's credential prompt. */
  realm?: string;
  /** Paths served without authentication, e.g. health checks. */
  publicPaths?: string[];
  /** Environment to read credentials from. Defaults to `process.env`. */
  env?: Record<string, string | undefined>;
  /** Logger used for misconfiguration warnings. Defaults to `console`. */
  logger?: { error?: (message: string) => void } | undefined;
}

/** Connect/Express compatible middleware. */
export type BasicAuthGuard = (
  req: any,
  res: any,
  next: (err?: any) => void,
) => void;

export interface BasicAuthVitePlugin {
  name: string;
  configureServer(server: any): void;
  configurePreviewServer(server: any): void;
}

export declare function readCredentials(env?: {
  [key: string]: string | undefined;
}): BasicAuthCredentials | null;

export declare function verifyAuthorizationHeader(
  headerValue: unknown,
  credentials: BasicAuthCredentials,
): boolean;

export declare function createBasicAuthGuard(
  options?: BasicAuthGuardOptions,
): BasicAuthGuard;

export declare function basicAuthVitePlugin(
  options?: BasicAuthGuardOptions,
): BasicAuthVitePlugin;
