// src/services/agentos/connections.ts
//
// Connected work surfaces.
//
// The integration directory is filtered here so an unsupported integration —
// OpenClaw in particular — can never appear in a picker. Authorization records
// are created through the agentos-connections edge function, which is where the
// credential is exchanged for a server-side credential_ref.

import { supabase } from "../../utils/supabase";
import { agentosDb, agentosErrorMessage } from "./client";
import {
  type AgentOSError,
  err,
  ok,
  type AgentOSResult,
  type ConnectionIsolation,
  type ConnectedAccount,
  type Integration,
  type IntegrationSupport,
} from "../../types/agentos";

/**
 * Map an edge function's error envelope onto the shared AgentOSError codes.
 *
 * The edge functions already speak the same vocabulary (unauthenticated /
 * forbidden / not_found / validation / conflict / unsupported / ...), so
 * discarding it and reporting "unknown" throws away the one thing the UI
 * needs: whether the user must sign in, cannot do this, or can retry.
 *
 * WHY THE EXTRA CODES
 *   The AgentOS edge functions (supabase/functions/_shared/agentos-errors.ts)
 *   also return `not_configured`, `out_of_credits` and `timeout`, which the
 *   shared union did not know — they all surfaced as "unknown". `internal` is
 *   the server-side catch-all and maps onto `database`.
 */
function mapServerCode(code: string | undefined): AgentOSError["code"] {
  switch (code) {
    case "unauthenticated":
      return "unauthenticated";
    case "forbidden":
      return "forbidden";
    case "not_found":
      return "not_found";
    case "validation":
      return "validation";
    case "conflict":
      return "conflict";
    case "unsupported":
      return "unsupported";
    case "not_configured":
      return "not_configured";
    case "out_of_credits":
      return "out_of_credits";
    case "timeout":
      return "timeout";
    case "internal":
      return "database";
    default:
      return "unknown";
  }
}


/** Only these support levels may be surfaced or wired. */
const SURFACEABLE_SUPPORT: IntegrationSupport[] = ["supported", "limited"];

export async function listIntegrations(options: {
  category?: string;
  support?: IntegrationSupport;
  includeUnsupported?: boolean;
} = {}): Promise<AgentOSResult<Integration[]>> {
  let query = agentosDb.from("integrations").select("*").order("name", { ascending: true });

  if (options.category) query = query.eq("category", options.category);

  if (options.support) {
    query = query.eq("support", options.support);
  } else if (options.includeUnsupported !== true) {
    // Default: hide anything unsupported so it can never be picked.
    query = query.in("support", SURFACEABLE_SUPPORT);
  }

  const { data, error } = await query;
  if (error) return err("database", "Could not load the integration directory", agentosErrorMessage(error));
  return ok((data ?? []) as Integration[]);
}

export async function getIntegration(key: string): Promise<AgentOSResult<Integration>> {
  if (!key) return err("validation", "key is required");

  const { data, error } = await agentosDb
    .from("integrations")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) return err("database", "Could not load the integration", agentosErrorMessage(error));
  if (!data) return err("not_found", "Integration not found");

  const integration = data as Integration;
  if (integration.support === "unsupported") {
    // Refuse even when the caller asked for an unsupported integration by key.
    return err("unsupported", `${integration.name} is not supported in this port`);
  }
  return ok(integration);
}

// ---------------------------------------------------------------------------
// Connected accounts
// ---------------------------------------------------------------------------

export interface CreateConnectionInput {
  integration_key: string;
  account_label?: string;
  scopes?: string[];
  isolation?: ConnectionIsolation;
  workspace_id?: string | null;
  metadata?: Record<string, unknown>;
  /** Sent once to the edge function; exchanged for a credential_ref. */
  credential?: string;
}

export async function listConnectedAccounts(options: {
  includeRevoked?: boolean;
} = {}): Promise<AgentOSResult<ConnectedAccount[]>> {
  let query = agentosDb
    .from("connected_accounts")
    .select("*")
    .order("connected_at", { ascending: false });

  if (!options.includeRevoked) query = query.is("revoked_at", null);

  const { data, error } = await query;
  if (error) return err("database", "Could not load connected accounts", agentosErrorMessage(error));
  return ok((data ?? []) as ConnectedAccount[]);
}

export async function connectAccount(
  input: CreateConnectionInput,
): Promise<AgentOSResult<ConnectedAccount>> {
  if (!input.integration_key) return err("validation", "integration_key is required");

  const integration = await getIntegration(input.integration_key);
  if (integration.error || !integration.data) {
    return err(
      integration.error?.code ?? "not_found",
      integration.error?.message ?? "Integration not found",
      integration.error?.detail,
    );
  }

  const integrationData = integration.data;

  const { data, error } = await supabase.functions.invoke("agentos-connections", {
    body: {
      action: "connect",
      integration_key: input.integration_key,
      account_label: input.account_label ?? integrationData.name,
      scopes: input.scopes ?? integrationData.capabilities,
      isolation: input.isolation ?? "tenant",
      workspace_id: input.workspace_id ?? null,
      metadata: input.metadata ?? {},
      credential: input.credential,
    },
  });

  if (error) return err("unknown", "Could not connect the account", error.message);

  const envelope = data as
    | { data?: ConnectedAccount; error?: { code: string; message: string; detail?: string } };
  if (envelope?.error) {
    return err(
      mapServerCode(envelope.error.code),
      envelope.error.message,
      envelope.error.detail,
    );
  }
  if (!envelope?.data) return err("not_found", "The connection was not created");

  return ok(envelope.data);
}

export async function revokeAccount(
  connectionId: string,
): Promise<AgentOSResult<{ id: string; status: string }>> {
  if (!connectionId) return err("validation", "connectionId is required");

  const { data, error } = await supabase.functions.invoke("agentos-connections", {
    body: { action: "revoke", connection_id: connectionId },
  });

  if (error) return err("unknown", "Could not revoke the connection", error.message);

  const envelope = data as
    | { data?: { id: string; status: string }; error?: { code: string; message: string; detail?: string } };
  if (envelope?.error) return err(mapServerCode(envelope.error.code), envelope.error.message, envelope.error.detail);

  return ok(envelope?.data ?? { id: connectionId, status: "revoked" });
}

/**
 * Delete a revoked connection outright (revoked rows are hidden by default).
 *
 * WHY THE GUARD
 *   A connected account still holds a live authorization record. Deleting it
 *   silently would leave the operator believing the surface is revoked when
 *   the row — and with it the audit trail of what was authorized — is simply
 *   gone. A revoked account must be revoked first, then deleted.
 */
export async function deleteConnection(
  connectionId: string,
): Promise<AgentOSResult<{ id: string }>> {
  if (!connectionId) return err("validation", "connectionId is required");

  const { data: current, error: loadError } = await agentosDb
    .from("connected_accounts")
    .select("id, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (loadError) {
    return err("database", "Could not load the connection", agentosErrorMessage(loadError));
  }
  if (!current) return err("not_found", "Connection not found");

  if ((current as { status?: string }).status === "connected") {
    return err("conflict", "Revoke the account before deleting it");
  }

  const { error } = await agentosDb.from("connected_accounts").delete().eq("id", connectionId);
  if (error) return err("database", "Could not delete the connection", agentosErrorMessage(error));
  return ok({ id: connectionId });
}

/**
 * The tool keys the runtime can actually dispatch to a model.
 *
 * WHY THIS LIST EXISTS IN THE BROWSER
 *   The integration directory is wider than the runtime: it also lists the
 *   connected surfaces (Gmail, Slack, Drive) that a worker reaches through an
 *   app capability rather than through a model tool call. The runtime only
 *   offers the model the keys it has a dispatch spec for, so assigning a
 *   surface key produces a row the executor skips. The UI marks those keys
 *   instead of pretending the assignment does something.
 *
 * Mirrors TOOL_SPECS in supabase/functions/_shared/agentos-runtime.ts.
 */
export const DISPATCHABLE_TOOL_KEYS: readonly string[] = [
  "web_fetch",
  "vector_search",
  "artifact_write",
  "videoremix_apps",
  "videoremix_personalizer",
];

/**
 * Tool keys available for assignment to a worker.
 *
 * WHY ONLY THE DISPATCHABLE SET
 *   The integration directory lists sixteen entries, but the runtime can only
 *   dispatch five of them (TOOL_SPECS in
 *   supabase/functions/_shared/agentos-runtime.ts). The rest are surfaces a
 *   worker reaches through an app capability, not a model tool call. Offering
 *   them in a picker produced a tool assignment the executor silently skips,
 *   so the operator believed the worker had a capability it could never use.
 *
 *   The dispatchable set is therefore the whole answer. A key the directory
 *   explicitly marks unsupported is still dropped: the runtime refuses it
 *   before dispatch (resolveOfferedTools) whatever the picker says.
 */
export async function listAssignableToolKeys(): Promise<AgentOSResult<string[]>> {
  // The unsupported rows are read too: a key the directory marks unsupported
  // is refused by the runtime before dispatch, so it must not be offered even
  // though the runtime has a dispatch spec for it.
  const integrations = await listIntegrations({ includeUnsupported: true });
  if (integrations.error || !integrations.data) {
    // Map the error into this function's own return type.
    return err(
      "database",
      integrations.error?.message ?? "Could not load the integration directory",
      integrations.error?.detail,
    );
  }

  const unsupported = new Set(
    integrations.data
      .filter((integration) => integration.support === "unsupported")
      .map((integration) => integration.key),
  );

  return ok(DISPATCHABLE_TOOL_KEYS.filter((key) => !unsupported.has(key)));
}
