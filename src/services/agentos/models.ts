// src/services/agentos/models.ts
//
// Model catalog and provider configuration.
//
// NO SECRETS IN THE BROWSER
//   A BYOK credential is sent exactly once, to the agentos-provider-test edge
//   function, which performs the readiness probe and returns an opaque
//   credential_ref. Only that reference is stored here. The credential itself
//   never enters this file, the browser, or the database.

import { supabase } from "../../utils/supabase";
import { agentosDb, agentosErrorMessage } from "./client";
import {
  err,
  ok,
  type AgentOSResult,
  type ModelCatalogEntry,
  type ProviderConfig,
  type ProviderMode,
} from "../../types/agentos";

export async function listModelCatalog(options: {
  provider?: string;
  status?: "active" | "preview" | "deprecated";
} = {}): Promise<AgentOSResult<ModelCatalogEntry[]>> {
  let query = agentosDb
    .from("model_catalog")
    .select("*")
    .order("provider", { ascending: true })
    .order("display_name", { ascending: true });

  if (options.provider) query = query.eq("provider", options.provider);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) return err("database", "Could not load the model catalog", agentosErrorMessage(error));
  return ok((data ?? []) as ModelCatalogEntry[]);
}

export async function getModelCatalogEntry(
  modelId: string,
): Promise<AgentOSResult<ModelCatalogEntry>> {
  if (!modelId) return err("validation", "modelId is required");

  const { data, error } = await agentosDb
    .from("model_catalog")
    .select("*")
    .eq("id", modelId)
    .maybeSingle();

  if (error) return err("database", "Could not load the model", agentosErrorMessage(error));
  if (!data) return err("not_found", "Model not found in the catalog");
  return ok(data as ModelCatalogEntry);
}

/** Estimated credits for one execution, priced from the catalog. */
export async function estimateCredits(params: {
  modelId: string;
  promptTokens: number;
  completionTokens: number;
}): Promise<AgentOSResult<number>> {
  const model = await getModelCatalogEntry(params.modelId);
  if (model.error || !model.data) {
    return err(
      model.error?.code ?? "not_found",
      model.error?.message ?? "Model not found in the catalog",
      model.error?.detail,
    );
  }

  const rateIn = model.data.credit_rate_in;
  const rateOut = model.data.credit_rate_out;
  const credits =
    (params.promptTokens * rateIn) / 1000 + (params.completionTokens * rateOut) / 1000;

  return ok(Math.round(credits * 1_000_000) / 1_000_000);
}

// ---------------------------------------------------------------------------
// Provider configs
// ---------------------------------------------------------------------------

export async function listProviderConfigs(): Promise<AgentOSResult<ProviderConfig[]>> {
  const { data, error } = await agentosDb
    .from("provider_configs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return err("database", "Could not load provider configs", agentosErrorMessage(error));
  return ok((data ?? []) as ProviderConfig[]);
}

export interface CreateProviderConfigInput {
  provider: string;
  label?: string;
  mode: ProviderMode;
  model_ids?: string[];
  /** Required when mode = 'byok'. Never stored; exchanged for a reference. */
  credential?: string;
}

export interface ProviderTestOutcome {
  ok: boolean;
  credential_ref?: string;
  error?: string;
}

/**
 * Create a provider config. For BYOK the credential is sent once to the
 * readiness-test function; the returned reference is what gets persisted.
 */
export async function createProviderConfig(
  input: CreateProviderConfigInput,
): Promise<AgentOSResult<ProviderConfig>> {
  if (!input.provider) return err("validation", "provider is required");
  if (input.mode === "byok" && !input.credential) {
    return err("validation", "A BYOK credential is required");
  }

  let credentialRef: string | null = null;
  let status: ProviderConfig["status"] = "untested";
  let lastTestNote: string | null = null;
  let lastTestAt: string | null = null;

  if (input.mode === "byok") {
    const test = await testProvider({
      provider: input.provider,
      mode: input.mode,
      credential: input.credential,
    });
    if (test.error || !test.data) {
      return err("unknown", test.error?.message ?? "Provider readiness test failed", test.error?.detail);
    }
    if (!test.data.ok) {
      return err("validation", "The credential did not pass the provider readiness test", test.data.error);
    }
    credentialRef = test.data.credential_ref ?? null;
    status = "active";
    lastTestNote = "credential verified at configuration time";
    lastTestAt = new Date().toISOString();
  }

  const { data, error } = await agentosDb
    .from("provider_configs")
    .insert({
      provider: input.provider,
      label: input.label ?? input.provider,
      mode: input.mode,
      credential_ref: credentialRef,
      status,
      model_ids: input.model_ids ?? [],
      last_test_note: lastTestNote,
      last_test_at: lastTestAt,
    })
    .select("*")
    .single();

  if (error) return err("database", "Could not save provider config", agentosErrorMessage(error));
  return ok(data as ProviderConfig);
}

export interface UpdateProviderConfigInput {
  label?: string;
  model_ids?: string[];
  is_default?: boolean;
  enabled?: boolean;
}

export async function updateProviderConfig(
  providerConfigId: string,
  input: UpdateProviderConfigInput,
): Promise<AgentOSResult<ProviderConfig>> {
  if (!providerConfigId) return err("validation", "providerConfigId is required");

  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.model_ids !== undefined) patch.model_ids = input.model_ids;
  if (input.is_default !== undefined) patch.is_default = input.is_default;
  if (input.enabled !== undefined) patch.status = input.enabled ? "active" : "disabled";

  const { data, error } = await agentosDb
    .from("provider_configs")
    .update(patch)
    .eq("id", providerConfigId)
    .select("*")
    .single();

  if (error) return err("database", "Could not update provider config", agentosErrorMessage(error));
  return ok(data as ProviderConfig);
}

/** Re-run the readiness probe and record the outcome. */
export async function retestProviderConfig(
  providerConfigId: string,
): Promise<AgentOSResult<ProviderConfig>> {
  if (!providerConfigId) return err("validation", "providerConfigId is required");

  const { data: config, error: loadError } = await agentosDb
    .from("provider_configs")
    .select("*")
    .eq("id", providerConfigId)
    .maybeSingle();

  if (loadError) return err("database", "Could not load provider config", agentosErrorMessage(loadError));
  if (!config) return err("not_found", "Provider config not found");
  const row = config as ProviderConfig;

  const test = await testProvider({
    provider: row.provider,
    mode: row.mode,
    credential_ref: row.credential_ref ?? undefined,
  });

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    last_test_at: now,
    last_test_note: test.data?.error ?? (test.data?.ok ? "ok" : "unknown"),
    status: test.data?.ok ? "active" : "error",
  };

  const { data, error } = await agentosDb
    .from("provider_configs")
    .update(patch)
    .eq("id", providerConfigId)
    .select("*")
    .single();

  if (error) return err("database", "Could not record the test result", agentosErrorMessage(error));
  return ok(data as ProviderConfig);
}

export async function deleteProviderConfig(
  providerConfigId: string,
): Promise<AgentOSResult<{ id: string }>> {
  if (!providerConfigId) return err("validation", "providerConfigId is required");

  const { error } = await agentosDb.from("provider_configs").delete().eq("id", providerConfigId);
  if (error) return err("database", "Could not delete provider config", agentosErrorMessage(error));
  return ok({ id: providerConfigId });
}

// ---------------------------------------------------------------------------
// Readiness test (server-side probe)
// ---------------------------------------------------------------------------

export interface TestProviderInput {
  provider: string;
  mode: ProviderMode;
  /** Sent once; the function exchanges it for a reference. */
  credential?: string;
  /** Used for re-tests, where the credential already lives server-side. */
  credential_ref?: string;
  model_id?: string;
}

/**
 * Ask the server to probe a provider. The credential travels in the request
 * body exactly once and is never returned in the response.
 */
export async function testProvider(
  input: TestProviderInput,
): Promise<AgentOSResult<ProviderTestOutcome>> {
  if (!input.provider) return err("validation", "provider is required");

  const { data, error } = await supabase.functions.invoke("agentos-provider-test", {
    body: {
      provider: input.provider,
      mode: input.mode,
      credential: input.credential,
      credential_ref: input.credential_ref,
      model_id: input.model_id ?? "gpt-4o-mini",
    },
  });

  if (error) return err("unknown", "Could not reach the provider test", error.message);

  const envelope = data as
    | { data?: ProviderTestOutcome; error?: { code: string; message: string; detail?: string } };
  if (envelope?.error) {
    return err("unknown", envelope.error.message, envelope.error.detail);
  }

  return ok(envelope?.data ?? { ok: false, error: "no result" });
}
