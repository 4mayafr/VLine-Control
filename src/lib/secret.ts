/**
 * Edge-safe secret helpers.
 *
 * This module must not import any Node built-ins: it is used by middleware,
 * which runs on the edge runtime.
 */
export const DEV_SECRET_FALLBACK =
  "vline-control-development-only-secret-do-not-use-in-production";

export function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not configured. Set a random 32+ character AUTH_SECRET before running in production.",
    );
  }
  return DEV_SECRET_FALLBACK;
}
