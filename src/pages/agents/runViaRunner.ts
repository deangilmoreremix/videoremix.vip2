import { getClerkTokenGetter } from "../../utils/supabase";

/**
 * Canonical bridge from the legacy `/agents/:slug` pages to the shared
 * `run-ai-app` Supabase Edge Function.
 *
 * These pages previously POSTed to per-app edge functions that do not exist
 * (every request failed with a 404 from the functions gateway). The canonical
 * runner (`supabase/functions/run-ai-app/index.ts`) is the single execution
 * path for all internal AI apps: it authenticates the Clerk JWT, applies the
 * app's specialized config from `app-configs.ts`, enforces credits, and
 * returns `{ success, appSlug, output, metadata }`.
 *
 * The return value mimics the subset of the Fetch `Response` API the legacy
 * pages rely on (`ok`, `status`, `json()`), so existing
 * `const data = await res.json(); if (!res.ok) throw new Error(data.error)`
 * blocks keep working unchanged. The adapted payload:
 *   - `result` carries the runner `output` (string or structured object)
 *   - structured `output` keys are also spread onto the top level
 *     (pages historically read `data.sources`, `data.emails`, …)
 *   - `demo` is true when the app has no specialized config yet (the runner
 *     then answers with an honest demo-mode placeholder)
 */

export interface RunnerResponseLike {
  ok: boolean;
  status: number;
  // Matches the Fetch API `Response.json()` return type the legacy pages
  // rely on (`any`), so existing `data.error` / `data.result` access keeps
  // type-checking exactly as it did against the old per-app functions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: () => Promise<any>;
}

interface RunnerPayload {
  result: unknown;
  demo: boolean;
  appSlug: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Convert a FormData body (legacy file-upload pages) to a plain object. */
function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // The runner accepts text inputs; binary files are referenced by name.
      obj[key] = value.name;
    } else if (key in obj) {
      const existing = obj[key];
      obj[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

/**
 * Run an internal AI app through the canonical `run-ai-app` edge function.
 *
 * @param appSlug Internal app slug (resolved by `getAppConfig` server-side).
 * @param inputs  Form/chat inputs. Legacy fields (`userId`, `mode`) are
 *                dropped: the billed identity always comes from the verified
 *                Clerk JWT, never from the client payload.
 */
export async function runViaRunner(
  appSlug: string,
  inputs: Record<string, unknown> | FormData,
): Promise<RunnerResponseLike> {
  const payload: Record<string, unknown> =
    inputs instanceof FormData ? formDataToObject(inputs) : { ...inputs };
  delete payload.userId;

  let token = "";
  try {
    token = (await getClerkTokenGetter()()) ?? "";
  } catch {
    token = "";
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-ai-app`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appSlug, inputs: payload, stream: false }),
    },
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    return {
      ok: false,
      status: res.status,
      json: async () => ({ error: message }),
    };
  }

  const output = data?.output;
  const spread =
    output && typeof output === "object" && !Array.isArray(output)
      ? (output as Record<string, unknown>)
      : {};

  const payloadOut: RunnerPayload = {
    ...spread,
    result: output ?? null,
    demo: data?.metadata?.demo === true,
    appSlug: data?.appSlug ?? appSlug,
    metadata: data?.metadata ?? {},
  };

  return {
    ok: true,
    status: res.status,
    json: async () => payloadOut,
  };
}
