// src/services/agentos/agentKeys.ts
//
// "Let my agents use this key": the owner's OpenAI key, stored encrypted on
// the server (Supabase Vault) so agents can run while the browser is closed.
// The key goes to the agentos-user-keys function once and is never sent back:
// the server answers with a four-character hint.

import { supabase } from "../../utils/supabase";

export interface AgentKeyStatus {
  saved: boolean;
  hint: string | null;
  updated_at: string | null;
}

export type AgentKeyResult = { ok: true; status: AgentKeyStatus } | { ok: false; message: string };

async function call(body: Record<string, unknown>): Promise<AgentKeyResult> {
  const { data, error } = await supabase.functions.invoke("agentos-user-keys", { body });
  if (error) {
    // A non-2xx answer carries the server's message in the response body.
    let message = "Could not reach the server. Try again in a moment.";
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const payload = await context.json();
        if (payload?.error?.message) message = String(payload.error.message);
      } catch {
        /* keep the generic message */
      }
    }
    return { ok: false, message };
  }
  const envelope = data as { data?: { openai?: AgentKeyStatus } } | null;
  const status = envelope?.data?.openai;
  if (!status) return { ok: false, message: "The server sent an unexpected answer." };
  return { ok: true, status };
}

export const getAgentKeyStatus = () => call({ action: "status" });
export const saveAgentKey = (key: string) => call({ action: "save", provider: "openai", key });
export const removeAgentKey = () => call({ action: "delete", provider: "openai" });
