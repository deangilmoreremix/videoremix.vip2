// src/services/agentos/client.ts
//
// The AgentOS data client.
//
// WHY THIS EXISTS
//   Every AgentOS table, function and RPC lives in the `agentos` schema — the
//   port deliberately targets a separate schema so it never collides with the
//   app's existing `public` tables (`public.tasks`, `public.workspaces`,
//   `public.conversations` all pre-date the port and still exist).
//
//   The shared browser client in `src/utils/supabase.ts` talks to the `public`
//   schema. PostgREST resolves an unqualified table name against the schemas
//   the project exposes, and on this project that list is `public, graphql_public`
//   — so an unqualified `supabase.from("workers")` never reaches
//   `agentos.workers`. It either 404s (PGRST205) or, once the schema is
//   exposed, silently resolves to a same-named `public` table.
//
//   This module therefore routes every AgentOS query at the `agentos` schema
//   explicitly. supabase-js sends the schema as the `Accept-Profile` /
//   `Content-Profile` header, which makes the resolution unambiguous no matter
//   which other schemas the project exposes.
//
// WHAT IS STILL REQUIRED OF THE PROJECT
//   The `agentos` schema must be exposed to PostgREST, otherwise PostgREST
//   rejects the profile with PGRST106 ("Only the following schemas are exposed:
//   public, graphql_public"). See:
//     - supabase/migrations/20261012120700_agentos_expose_schema.sql
//     - scripts/agentos-verify-exposure.sh
//     - docs/agentos/AGENTOS_STATUS.md
//   `agentosErrorMessage` turns that failure into an actionable message
//   instead of an opaque PGRST code.

import { supabase } from "../../utils/supabase";

/** The schema every AgentOS object lives in. */
export const AGENTOS_SCHEMA = "agentos";

interface ScopedClient {
  // deno-lint-ignore no-explicit-any
  from: (relation: string) => any;
  // deno-lint-ignore no-explicit-any
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<any>;
}

/**
 * The schema-scoped client is resolved lazily and re-resolved whenever the
 * underlying client changes. `supabase` is a module-level singleton in
 * production, but the test harness swaps it per test, so binding it at import
 * time would capture a stale client.
 */
let scopedClient: { base: unknown; scoped: ScopedClient } | null = null;

function agentosClient(): ScopedClient {
  const base = supabase as unknown as {
    schema?: (schema: string) => ScopedClient;
    from: (relation: string) => unknown;
    rpc: (fn: string, params?: Record<string, unknown>) => Promise<unknown>;
  };

  if (!scopedClient || scopedClient.base !== base) {
    scopedClient = {
      base,
      scoped:
        typeof base.schema === "function"
          ? base.schema(AGENTOS_SCHEMA)
          : (base as unknown as ScopedClient),
    };
  }

  return scopedClient.scoped;
}

/**
 * The AgentOS database surface. Use this instead of the shared `supabase`
 * client for every AgentOS table and RPC.
 */
export const agentosDb = {
  from(relation: string) {
    return agentosClient().from(relation);
  },
  rpc(fn: string, params?: Record<string, unknown>) {
    return agentosClient().rpc(fn, params);
  },
};

/**
 * A human-readable explanation of a PostgREST/Postgres error raised by an
 * AgentOS query.
 *
 * The one that matters is PGRST106: the project has not exposed the `agentos`
 * schema to PostgREST, so every AgentOS read fails. Saying so plainly turns a
 * silent, empty dashboard into a one-line fix.
 */
export function agentosErrorMessage(error: unknown): string {
  const code = readCode(error);
  const message = readMessage(error);

  if (code === "PGRST106" || /only the following schemas are exposed/i.test(message)) {
    return (
      `The "agentos" schema is not exposed to PostgREST, so AgentOS data cannot be read. ` +
      `Add it to the project's exposed schemas (Settings → API → Exposed schemas, or run ` +
      `supabase/migrations/20261012120700_agentos_expose_schema.sql) and verify with ` +
      `scripts/agentos-verify-exposure.sh. Original error: ${message}`
    );
  }

  if (code === "PGRST205" || /could not find the table/i.test(message)) {
    return (
      `AgentOS could not find the table in the "agentos" schema. Original error: ${message}`
    );
  }

  return message;
}

// deno-lint-ignore no-explicit-any
function readCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

// deno-lint-ignore no-explicit-any
function readMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.length > 0 ? message : "Unknown error";
}
