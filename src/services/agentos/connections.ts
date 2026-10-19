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

/** Delete a revoked connection outright (revoked rows are hidden by default). */
export async function deleteConnection(
  connectionId: string,
): Promise<AgentOSResult<{ id: string }>> {
  if (!connectionId) return err("validation", "connectionId is required");

  const { error } = await agentosDb.from("connected_accounts").delete().eq("id", connectionId);
  if (error) return err("database", "Could not delete the connection", agentosErrorMessage(error));
  return ok({ id: connectionId });
}

/** Tool keys available for assignment to a worker. */
export async function listAssignableToolKeys(): Promise<AgentOSResult<string[]>> {
  const integrations = await listIntegrations();
  if (integrations.error || !integrations.data) {
    // Map the error into this function's own return type.
    return err(
      "database",
      integrations.error?.message ?? "Could not load the integration directory",
      integrations.error?.detail,
    );
  }

  const keys = integrations.data
    .filter((integration) => integration.support === "supported" || integration.support === "limited")
    .map((integration) => integration.key);

  return ok(keys);
}
