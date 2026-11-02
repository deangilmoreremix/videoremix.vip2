// src/lib/userApiKeys.ts
//
// Users run the apps with their own provider API keys.
//
// WHY THIS EXISTS
//   The converted apps collect the key as an ordinary form field
//   (enter_your_openai_api_key, openai_api_key, xai_grok_api_key, …) and sent
//   it with the other inputs. run-ai-app writes every input into the prompt,
//   so a user's key was sent to the model as prompt text — and the platform's
//   own key paid for the run. Every caller now splits the keys out of the
//   inputs here: they travel separately as `credentials`, are used only to
//   authenticate that user's run, and never reach a prompt.
//
// REMEMBERED ON THIS DEVICE ONLY
//   A key the user enters is kept in this browser's localStorage so they do
//   not retype it for every app. It is never sent anywhere except with a run,
//   and "Forget" removes it. Storage can be unavailable (private windows,
//   blocked site data), so every access is guarded.

export type KeyProvider = "openai" | "xai";

export interface UserCredentials {
  openai?: string;
  xai?: string;
}

const STORAGE_PREFIX = "videoremix.apiKey.";
const KEY_FIELD = /api[_\s-]?key/i;

/** True for an input field that carries an API key. */
export function isApiKeyField(name: string): boolean {
  return KEY_FIELD.test(name);
}

/** Which provider a key field belongs to. */
export function providerForField(name: string): KeyProvider {
  return /xai|grok/i.test(name) ? "xai" : "openai";
}

/**
 * Split API keys out of an app's inputs. The returned inputs never contain a
 * key field, even an empty one.
 */
export function splitCredentials(inputs: Record<string, unknown>): {
  inputs: Record<string, unknown>;
  credentials: UserCredentials;
} {
  const clean: Record<string, unknown> = {};
  const credentials: UserCredentials = {};
  for (const [name, value] of Object.entries(inputs)) {
    if (!isApiKeyField(name)) {
      clean[name] = value;
      continue;
    }
    const key = typeof value === "string" ? value.trim() : "";
    if (key) credentials[providerForField(name)] = key;
  }
  return { inputs: clean, credentials };
}

export function getStoredKey(provider: KeyProvider): string {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + provider) ?? "";
  } catch {
    return "";
  }
}

export function storeKey(provider: KeyProvider, key: string): void {
  try {
    if (key.trim()) window.localStorage.setItem(STORAGE_PREFIX + provider, key.trim());
  } catch {
    // Not remembered; the run still uses the key.
  }
}

export function forgetKey(provider: KeyProvider): void {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + provider);
  } catch {
    // Nothing stored.
  }
}

/**
 * The credentials for a run: what the user typed in this app, otherwise what
 * they saved on this device. A key typed in is remembered for next time.
 */
export function resolveCredentials(typed: UserCredentials): UserCredentials {
  const out: UserCredentials = {};
  for (const provider of ["openai", "xai"] as const) {
    const key = typed[provider]?.trim() || getStoredKey(provider);
    if (typed[provider]?.trim()) storeKey(provider, typed[provider]!.trim());
    if (key) out[provider] = key;
  }
  return out;
}

/** Shown when a run is attempted with no key at all. */
export const MISSING_KEY_MESSAGE =
  "Add your OpenAI API key to run this app. It is used only for your runs and is saved on this device only.";
