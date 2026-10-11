/**
 * Client-side vector-store id source for file_search-backed RAG apps.
 *
 * The shared `run-ai-app` edge function only attaches the `file_search` tool
 * when the request carries at least one vector store id
 * (`inputs.vector_store_ids`, see `buildResponseTools` in
 * `supabase/functions/run-ai-app/index.ts`). Until a vector-store creation
 * service exists, apps can resolve an id from:
 *
 *   1. the per-user selection persisted in `localStorage`
 *      (set by an operator/admin through the RAG app UI), or
 *   2. the `VITE_OPENAI_VECTOR_STORE_ID` build-time default.
 *
 * When neither is set, no `vector_store_ids` key is sent and the runner omits
 * the file_search tool — the app then answers from the sources supplied
 * inline in the request (the honest degraded path documented in
 * docs/completion/app-completion.md).
 */

const STORAGE_KEY = "videoremix:vector-store-ids";

function readEnvDefault(): string[] {
  const raw = (import.meta.env as Record<string, string | undefined>)
    .VITE_OPENAI_VECTOR_STORE_ID;
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function readStored(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
    }
  } catch {
    // Corrupt entry — fall through to the env default.
  }
  return [];
}

/** Current vector store ids (stored selection first, then env default). */
export function getVectorStoreIds(): string[] {
  const stored = readStored();
  if (stored.length > 0) return stored;
  return readEnvDefault();
}

/** Persist (or clear, with an empty array) the user's vector store selection. */
export function setVectorStoreIds(ids: string[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (ids.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // Storage unavailable (private mode / quota) — selection is best-effort.
  }
}

/**
 * Merge the resolved vector store ids into runner inputs. Returns the inputs
 * unchanged when no id is configured, so the request stays backward
 * compatible with apps that never configure a store.
 */
export function withVectorStoreIds(inputs: Record<string, unknown>): Record<string, unknown> {
  const ids = getVectorStoreIds();
  if (ids.length === 0) return inputs;
  return { ...inputs, vector_store_ids: ids };
}
