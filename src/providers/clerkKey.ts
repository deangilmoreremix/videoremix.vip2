// src/providers/clerkKey.ts
//
// The Clerk publishable key, checked before the SDK sees it.
//
// WHY
//   A publishable key is the instance's frontend API host, base64-encoded:
//   pk_live_ + base64("clerk.auth.videoremix.vip$"). Clerk's SDK loads its
//   script from the host inside the key and ignores the frontendApi prop when
//   a key is given. Production was built with a key whose host is
//   ".clerk.accounts.dev" — no instance name — so the browser asked for
//   https://.clerk.accounts.dev/…, the script never loaded, and nobody could
//   sign in. A key whose host is not a real hostname is rebuilt from the
//   declared frontend API instead.

const HOSTNAME = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function decodeBase64(value: string): string | null {
  try {
    const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

function encodeBase64(value: string): string {
  return btoa(value).replace(/=+$/, "");
}

/** The frontend API host a publishable key points at, or null when it is not a hostname. */
export function hostFromPublishableKey(key: string): string | null {
  const match = /^pk_(live|test)_([A-Za-z0-9+/=]+)$/.exec(key.trim());
  if (!match) return null;
  const decoded = decodeBase64(match[2]);
  if (!decoded || !decoded.endsWith("$")) return null;
  const host = decoded.slice(0, -1);
  return HOSTNAME.test(host) ? host : null;
}

export interface ResolvedClerkKey {
  key: string;
  /** True when the configured key was malformed and was rebuilt. */
  rebuilt: boolean;
}

/**
 * The key to give Clerk: the configured one when it points at a real host,
 * otherwise a production key rebuilt from the frontend API.
 */
export function resolvePublishableKey(configuredKey: string, frontendApi: string): ResolvedClerkKey {
  const key = configuredKey.trim();
  if (!key) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your .env file.");
  if (hostFromPublishableKey(key)) return { key, rebuilt: false };

  const host = frontendApi.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!HOSTNAME.test(host)) {
    throw new Error("VITE_CLERK_PUBLISHABLE_KEY is malformed and VITE_CLERK_FRONTEND_API is not a hostname.");
  }
  const prefix = key.startsWith("pk_test_") ? "pk_test_" : "pk_live_";
  return { key: prefix + encodeBase64(`${host}$`), rebuilt: true };
}
