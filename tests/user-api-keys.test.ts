// tests/user-api-keys.test.ts
//
// Users run the apps with their own API keys. A key must travel only as
// `credentials` and pay for that user's run; it must never be written into
// the prompt, and the platform's key must never be used for a customer run.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { forgetKey, getStoredKey, resolveCredentials, splitCredentials } from "../src/lib/userApiKeys";

const KEY = "sk-test-1234567890abcdef";

beforeAll(() => {
  // tests/setup.ts replaces localStorage with a no-op mock; this suite needs
  // one that actually stores.
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    get length() { return store.size; },
  });
  // credentials.ts reads XAI_MODEL through Deno.env.
  (globalThis as unknown as { Deno: unknown }).Deno = { env: { get: () => undefined } };
});

afterEach(() => {
  forgetKey("openai");
  forgetKey("xai");
});

describe("browser: keys are split out of the inputs", () => {
  it("removes every key field and returns it as credentials", () => {
    const { inputs, credentials } = splitCredentials({
      enter_your_openai_api_key: KEY,
      xai_grok_api_key: "xai-abc",
      openai_api_key: "",
      topic: "launch plan",
    });
    expect(inputs).toEqual({ topic: "launch plan" });
    expect(credentials).toEqual({ openai: KEY, xai: "xai-abc" });
  });

  it("remembers a typed key on this device and uses it when the field is blank", () => {
    resolveCredentials({ openai: KEY });
    expect(getStoredKey("openai")).toBe(KEY);
    expect(resolveCredentials({})).toEqual({ openai: KEY });
  });

  it("has no credentials when nothing was typed or saved", () => {
    expect(resolveCredentials({})).toEqual({});
  });
});

describe("server: run-ai-app-live", () => {
  it("never leaves a key in the inputs that become the prompt", async () => {
    const { stripKeyFields } = await import("../supabase/functions/run-ai-app-live/credentials.ts");
    expect(stripKeyFields({ enter_your_openai_api_key: KEY, "OpenAI API Key": KEY, request: "hi" })).toEqual({ request: "hi" });
  });

  it("uses the user's key, and accepts one still sent the old way inside the inputs", async () => {
    const { resolveProvider } = await import("../supabase/functions/run-ai-app-live/credentials.ts");
    expect(resolveProvider({ openai: KEY }, {})).toMatchObject({ name: "openai", apiKey: KEY, url: "https://api.openai.com/v1/responses" });
    expect(resolveProvider(undefined, { openai_api_key: KEY })).toMatchObject({ name: "openai", apiKey: KEY });
    expect(resolveProvider({ xai: "xai-abc" }, {})).toMatchObject({ name: "xai", url: "https://api.x.ai/v1/responses" });
  });

  it("refuses a run without a user key rather than using the platform key", async () => {
    const { resolveProvider } = await import("../supabase/functions/run-ai-app-live/credentials.ts");
    expect(resolveProvider(undefined, { request: "hi" })).toBeNull();

    const source = readFileSync(join(__dirname, "../supabase/functions/run-ai-app-live/index.ts"), "utf8");
    const textPaths = source.slice(0, source.indexOf("async function handleRealtimeSession"));
    // The text and streaming paths authenticate only with the user's key.
    expect(textPaths).not.toMatch(/Deno\.env\.get\("OPENAI_API_KEY"\)/);
    expect(textPaths.match(/Authorization: `Bearer \$\{provider\.apiKey\}`/g)?.length).toBe(2);
    // The prompt is built from the stripped inputs.
    expect(textPaths).toMatch(/const inputs = stripKeyFields\(body\.inputs\)/);
    expect(textPaths).toMatch(/const inputs = stripKeyFields\(data\.inputs\)/);
  });
});
