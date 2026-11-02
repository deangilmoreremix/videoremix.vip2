// supabase/functions/run-ai-app-live/credentials.ts
//
// Users run the apps with their own provider keys.
//
// The browser sends the user's key as `credentials`, apart from `inputs`
// (src/lib/userApiKeys.ts). This module picks the provider and key for a run,
// and removes any key-shaped field that still arrives inside `inputs` — the
// runner writes every input into the prompt, so a key left there would be
// sent to the model as text. The platform's own key is never used for a
// customer's run: without a key, the run is refused with a clear message.

export interface RunCredentials {
  openai?: string;
  xai?: string;
}

export interface Provider {
  name: "openai" | "xai";
  apiKey: string;
  /** The Responses API endpoint of the provider. */
  url: string;
  /** The model to use, or null to keep the app's configured model. */
  model: string | null;
}

const KEY_FIELD = /api[_\s-]?key/i;

export const MISSING_KEY_MESSAGE =
  "Add your OpenAI API key to run this app. It is used only for your runs and is saved on your device only.";

/** The inputs without any field that carries an API key. */
export function stripKeyFields(inputs: unknown): unknown {
  if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs)) return inputs;
  const clean: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(inputs as Record<string, unknown>)) {
    if (!KEY_FIELD.test(name)) clean[name] = value;
  }
  return clean;
}

/**
 * The provider a run uses: the user's OpenAI key, otherwise their xAI key.
 * A key typed into an old-style form field (still inside `inputs`) is
 * accepted too, so pages that predate `credentials` keep working.
 */
export function resolveProvider(credentials: unknown, inputs: unknown): Provider | null {
  const given = (typeof credentials === "object" && credentials !== null ? credentials : {}) as RunCredentials;
  let openai = typeof given.openai === "string" ? given.openai.trim() : "";
  let xai = typeof given.xai === "string" ? given.xai.trim() : "";

  if (typeof inputs === "object" && inputs !== null && !Array.isArray(inputs)) {
    for (const [name, value] of Object.entries(inputs as Record<string, unknown>)) {
      if (!KEY_FIELD.test(name) || typeof value !== "string" || !value.trim()) continue;
      if (/xai|grok/i.test(name)) xai ||= value.trim();
      else openai ||= value.trim();
    }
  }

  if (openai) return { name: "openai", apiKey: openai, url: "https://api.openai.com/v1/responses", model: null };
  if (xai) {
    return {
      name: "xai",
      apiKey: xai,
      url: "https://api.x.ai/v1/responses",
      model: Deno.env.get("XAI_MODEL") ?? "grok-4",
    };
  }
  return null;
}
