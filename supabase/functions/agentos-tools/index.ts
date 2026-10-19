// supabase/functions/agentos-tools/index.ts
//
// Server-side tool dispatcher for AgentOS workers.
//
// Every tool is executed here, never in the browser, because every one of them
// needs a server-side credential, a size-bounded outbound fetch, or the ability
// to call another first-party service. The browser sends a tool key plus plain
// arguments; it never carries a secret.
//
// Supported tool keys (must match agentos.integrations.key, and the matching
// integration must be support = 'supported'):
//
//   videoremix_apps        invoke an app from the canonical 130-app catalog
//                          through the same run-ai-app service and credit
//                          system the dashboard uses
//   videoremix_personalizer  run a Personalizer scan/generate/media job
//   web_fetch              bounded server-side GET with a response-size cap
//                          and an SSRF guard on every hop
//   vector_search          keyword + recency search over the worker's memories
//                          (the pgvector path is used when the embedding column
//                          exists; without it this degrades to ranking, which is
//                          the documented fallback)
//   artifact_write         persist a text artifact for the run
//
// Anything else — in particular any integration seeded with
// support = 'unsupported' — is refused before execution. There is no path here
// that can invoke an unsupported capability.
//
// WHY THE EXECUTION ITSELF LIVES IN THE SHARED RUNTIME
//   The executor (agentos-execute) runs the same tools on the model's behalf.
//   If the two paths implemented the tools separately, the policy would only
//   be real on one of them, so both call the same helper.

import { fail, ok, readJsonBody, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';
import {
  executeToolCall,
  invokeCatalogApp,
  vectorSearch,
  webFetchGuarded,
} from '../_shared/agentos-runtime.ts';

interface ToolRequestBody {
  tool: string;
  args?: Record<string, unknown>;
  worker_id?: string;
  task_id?: string;
  run_id?: string;
}

/** Look up the integration row so we can enforce its support level. */
async function loadIntegration(supabase: any, key: string) {
  const { data, error } = await supabase
    .from('integrations')
    .select('key, support, capabilities, auth_type')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(`integration lookup failed: ${error.message}`);
  return data as null | { key: string; support: string; capabilities: string[]; auth_type: string };
}

/**
 * Load a worker's permission block, so tool policy is enforced server-side.
 *
 * The allow-list (`allowed_app_slugs`) lives INSIDE the `permissions` jsonb
 * column — `agentos.workers` has no top-level `allowed_app_slugs` column, and
 * selecting one makes PostgREST reject the whole query (PGRST100), which
 * would leave every worker-scoped dispatch without a policy to enforce.
 */
async function loadWorkerPermissions(supabase: any, workerId: string) {
  const { data, error } = await supabase
    .from('workers')
    .select('permissions, owner_clerk_id')
    .eq('id', workerId)
    .maybeSingle();
  if (error) throw new Error(`worker lookup failed: ${error.message}`);
  return data as null | { permissions: Record<string, any> | null; owner_clerk_id: string | null };
}

/**
 * A bounded server-side GET.
 *
 * WHY THE GUARD IS IN THE SHARED HELPER
 *   The same fetch runs when a worker asks for it through the model. The
 *   scheme, the resolved addresses and every redirect hop are checked in one
 *   place so neither path can be the weaker one.
 */
async function webFetch(args: Record<string, unknown>): Promise<unknown> {
  const url = String(args.url ?? '');
  if (!/^https?:\/\//i.test(url)) throw new Error('url must be http(s)');
  return webFetchGuarded({ url });
}

async function handler(req: Request): Promise<Response> {
  const caller = await verifyCaller(req);
  if (!caller) return fail('unauthenticated', 'Unauthorized');

  const parsed = await readJsonBody<ToolRequestBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.tool) return fail('validation', 'tool is required');

  const supabase = getServiceClient();

  // The service-role token authorizes the internal app-catalog call only; it
  // never leaves the server.
  const serviceToken = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  // Resolve the tenant from the worker row, never from the request body, so a
  // caller cannot dispatch a tool against another tenant's worker.
  let permissions: Record<string, any> = {};
  let ownerClerkId = caller.clerkUserId;

  if (body.worker_id) {
    const worker = await loadWorkerPermissions(supabase, body.worker_id);
    if (!worker) return fail('not_found', 'Worker not found');
    if (worker.owner_clerk_id && worker.owner_clerk_id !== caller.clerkUserId) {
      return fail('forbidden', 'That worker belongs to a different tenant');
    }
    permissions = worker.permissions ?? {};
    ownerClerkId = worker.owner_clerk_id ?? caller.clerkUserId;
  }

  const denied = permissions.denied_tools;
  if (Array.isArray(denied) && denied.includes(body.tool)) {
    return fail('forbidden', `${body.tool} is denied by the worker's permissions`);
  }

  const integration = await loadIntegration(supabase, body.tool);
  if (!integration) {
    return fail('not_found', `Unknown tool: ${body.tool}`);
  }
  if (integration.support === 'unsupported') {
    return fail('unsupported', `${body.tool} is not supported in this port`);
  }

  const args = body.args ?? {};

  try {
    switch (body.tool) {
      case 'videoremix_apps':
      case 'videoremix_personalizer': {
        // Enforce the catalog app allow-list when the worker declares one.
        const slug = String(args.app_slug ?? '');
        const allowedApps = permissions.allowed_app_slugs;
        if (Array.isArray(allowedApps) && allowedApps.length > 0 && !allowedApps.includes(slug)) {
          return fail('forbidden', `${slug} is not in this worker's allowed app list`);
        }
        return ok({
          tool: body.tool,
          result: await invokeCatalogApp({ args, serviceToken }),
        });
      }

      case 'web_fetch': {
        if (permissions.allow_web_access === false) {
          return fail('forbidden', 'web access is disabled for this worker');
        }
        return ok({ tool: body.tool, result: await webFetch(args) });
      }

      case 'vector_search': {
        if (!body.worker_id) return fail('validation', 'worker_id is required for vector_search');
        return ok({
          tool: body.tool,
          result: await vectorSearch({ supabase, workerId: body.worker_id, args }),
        });
      }

      case 'artifact_write': {
        if (permissions.allow_artifacts === false) {
          return fail('forbidden', 'artifact writing is disabled for this worker');
        }
        // The shared helper also proves that the named task and run belong
        // to this tenant before the artifact is written.
        const outcome = await executeToolCall({
          supabase,
          toolKey: body.tool,
          args,
          workerId: body.worker_id ?? null,
          ownerClerkId,
          taskId: body.task_id ?? null,
          runId: body.run_id ?? null,
          permissions,
          serviceToken,
        });
        if (!outcome.ok) {
          return fail(outcome.code ?? 'internal', 'Tool execution failed', outcome.error);
        }
        return ok({ tool: body.tool, result: outcome.result });
      }

      default:
        return fail('unsupported', `${body.tool} has no implementation in this port`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail('internal', 'Tool execution failed', message);
  }
}

Deno.serve((req) =>
  withErrorGuard(async () => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }
    if (req.method !== 'POST') return fail('validation', 'Use POST');
    return handler(req);
  }),
);
