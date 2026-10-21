// tests/agentos/edge-contract.test.ts
//
// Static contract guards for the AgentOS edge functions.
//
// WHY STATIC
//   supabase/functions/agentos-* run on Deno against a live Supabase project
//   with the OpenAI key and a scheduler driving them. None of that exists in
//   this environment, so these tests do NOT execute the functions: they read
//   each function's source and assert the invariants that make the
//   browser/server contract and the security boundary real, so a regression
//   fails here instead of in production:
//
//   * every function a browser service invokes exists and handles the exact
//     action / body key the service sends;
//   * every endpoint either verifies the Clerk JWT or is an explicitly
//     service-role-gated scheduler endpoint with the reason documented;
//   * no service-role key, credential, or provider secret is ever read inside
//     a return statement or interpolated into a returned message;
//   * agentos-tools refuses support = 'unsupported' BEFORE dispatching;
//   * the queue functions claim with a lease, guard the batch budget, honour
//     the workspace / worker / approval policies, and sweep calls both RPCs;
//   * no function file contains the legacy `openclaw` surface.
//
// These are source-level regression guards. They say nothing about runtime
// behaviour: live execution, real OpenAI calls, and actual queue claiming
// against Postgres need a provisioned project and worker.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// vitest transforms modules through vite, so import.meta.url is not always a
// file: URL (jsdom); fall back to the project root the runner was started in.
const ROOT = (() => {
  try {
    return fileURLToPath(new URL('../../', import.meta.url));
  } catch {
    return process.cwd();
  }
})();
const FUNCTIONS_DIR = join(ROOT, 'supabase', 'functions');
const SHARED_DIR = join(FUNCTIONS_DIR, '_shared');
const SERVICES_DIR = join(ROOT, 'src', 'services', 'agentos');

/** Every AgentOS edge function. (There is no agentos-missions function.) */
const AGENTOS_FUNCTIONS = [
  'agentos-approvals',
  'agentos-connections',
  'agentos-execute',
  'agentos-provider-test',
  'agentos-sweep',
  'agentos-tasks',
  'agentos-tools',
] as const;

/** Endpoints a browser can reach: they must verify the Clerk JWT. */
const USER_FACING_FUNCTIONS = [
  'agentos-approvals',
  'agentos-connections',
  'agentos-provider-test',
  'agentos-tasks',
  'agentos-tools',
] as const;

function functionSource(name: string): string {
  const path = join(FUNCTIONS_DIR, name, 'index.ts');
  expect(existsSync(path), `${name}/index.ts exists`).toBe(true);
  return readFileSync(path, 'utf8');
}

function sharedSource(name: string): string {
  const path = join(SHARED_DIR, name);
  expect(existsSync(path), `_shared/${name} exists`).toBe(true);
  return readFileSync(path, 'utf8');
}

/** Comments removed, preserving string literals (URLs contain `//`). */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s|\()\/\/[^\n]*/g, '$1');
}

/** The `${...}` expressions inside a statement. */
function interpolations(statement: string): string[] {
  return [...statement.matchAll(/\$\{([^}]*)\}/g)].map((match) => match[1]);
}

/** Every `return ...;` statement plus every `fail(...)` message argument. */
function returnedAndFailedStatements(source: string): string[] {
  const stripped = stripComments(source);
  return [
    ...[...stripped.matchAll(/\breturn\b[^;]*;/g)].map((match) => match[0]),
    ...[...stripped.matchAll(/\bfail\([^;]*\)/g)].map((match) => match[0]),
  ];
}

const CREDENTIALISH =
  /credential\b(?!_)|apikey|api_key|secret|servicekey|service_role|token/i;

// ---------------------------------------------------------------------------
// Shared helpers exist and export what the functions import
// ---------------------------------------------------------------------------

describe('agentos shared helpers', () => {
  it('expose the envelope helpers every function imports', () => {
    const errors = sharedSource('agentos-errors.ts');
    for (const name of ['ok', 'fail', 'readJsonBody', 'withErrorGuard']) {
      expect(errors).toMatch(new RegExp(`export (async )?function ${name}\\b`));
    }
    expect(errors).toContain("'unauthenticated'");
    expect(errors).toContain("unauthenticated: 401");
  });

  it('expose the service client and the JWT verifier', () => {
    const client = sharedSource('agentos-client.ts');
    expect(client).toMatch(/export function getServiceClient\b/);
    expect(client).toMatch(/export async function verifyCaller\b/);
    // Identity may only come from the verified JWT context.
    expect(client).toContain("auth: 'user'");
  });

  it('expose the runtime steps the executor imports', () => {
    const runtime = sharedSource('agentos-runtime.ts');
    for (const name of [
      'emitEvent',
      'assemblePrompt',
      'runModel',
      'computeCredits',
      'RUNTIME_LIMITS',
    ]) {
      expect(runtime).toMatch(new RegExp(`export (const|function|async function) ${name}\\b`));
    }
  });

  it('share the CORS headers with the app-level helper', () => {
    const cors = sharedSource('cors.ts');
    expect(cors).toContain("'Access-Control-Allow-Origin': '*'");
  });
});

// ---------------------------------------------------------------------------
// Structural invariants, per function
// ---------------------------------------------------------------------------

describe('agentos edge functions: structure', () => {
  it.each(AGENTOS_FUNCTIONS)('%s is a POST edge function using the shared envelope', (name) => {
    const src = functionSource(name);
    expect(src).toContain('Deno.serve(');
    expect(src).toContain("req.method === 'OPTIONS'");
    expect(src).toContain("from '../_shared/agentos-errors.ts'");
    expect(src).toContain('withErrorGuard');
    expect(src).toMatch(/\bok\(/);
    expect(src).toMatch(/\bfail\(/);
    expect(src).not.toContain('console.log');
  });

  it.each(AGENTOS_FUNCTIONS)('%s only ever writes a raw Response for the CORS preflight', (name) => {
    const src = functionSource(name);
    for (const match of src.matchAll(/new Response\(/g)) {
      const lineStart = src.lastIndexOf('\n', match.index) + 1;
      const lineEnd = src.indexOf('\n', match.index);
      const line = src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      expect(line, `${name}: every raw Response is the OPTIONS preflight`).toContain(
        "new Response('ok'",
      );
    }
  });

  it.each(AGENTOS_FUNCTIONS)('%s only imports shared modules that exist', (name) => {
    const src = functionSource(name);
    for (const match of src.matchAll(/from '(\.[^']+\.ts)'/g)) {
      const target = join(FUNCTIONS_DIR, name, match[1]);
      expect(existsSync(target), `${name} imports ${match[1]}`).toBe(true);
    }
  });

  it.each(AGENTOS_FUNCTIONS)('%s contains no openclaw surface', (name) => {
    expect(functionSource(name).toLowerCase()).not.toContain('openclaw');
  });
});

// ---------------------------------------------------------------------------
// Authentication: no endpoint is anonymous
// ---------------------------------------------------------------------------

describe('agentos edge functions: authentication', () => {
  it.each(USER_FACING_FUNCTIONS)('%s requires the verified Clerk JWT', (name) => {
    const src = functionSource(name);
    expect(src).toContain('verifyCaller(req)');
    expect(src).toMatch(/if \(!caller\) return fail\('unauthenticated'/);
  });

  it('agentos-execute only classifies a service-role caller as the scheduler', () => {
    const src = functionSource('agentos-execute');
    expect(src).toContain('verifyCaller(req)');
    // The cron path is keyed on the service-role credential ONLY. Treating
    // `!caller` as a service call made the guard below unreachable and let an
    // anonymous caller claim every tenant's queue.
    // The service call is decided by the platform's own verification of the
    // credential, not by a substring test: a real service-role key is a JWT
    // whose base64 does NOT contain the text 'service_role', so the substring
    // test rejected the scheduler's own calls.
    expect(src).toContain('await isServiceRoleRequest(req)');
    expect(src).not.toContain("includes('service_role')");
    expect(src).not.toMatch(/service_role['"]?\)\s*\|\|\s*!caller/);
    expect(src).toContain('if (!caller && !serviceCall)');
  });

  it('agentos-execute only executes the caller\'s own claims', () => {
    const src = functionSource('agentos-execute');
    // claim_due_tasks is a scheduler RPC with no tenant predicate, so the
    // handler must scope execution to the verified owner itself.
    expect(src).toContain('claim.owner_clerk_id === caller.clerkUserId');
  });

  it('agentos-sweep is service-role gated and documents why it skips verifyCaller', () => {
    const src = functionSource('agentos-sweep');
    // No browser caller exists, so the sweep does not verify a user JWT; it
    // must instead refuse anyone without the service-role key.
    expect(src).not.toContain('verifyCaller');
    // The service credential is verified by the platform (both the new
    // secret key and the legacy service-role JWT are accepted).
    expect(src).toContain('await isServiceRoleRequest(req)');
    expect(src).not.toContain("includes('service_role')");
    expect(src).toContain("fail('unauthenticated'");
    expect(src).toMatch(/\/\/[^\n]*service-role/i);
    expect(src).toMatch(/pg_cron|provisioned worker/);
  });
});

// ---------------------------------------------------------------------------
// No secret is ever returned or logged
// ---------------------------------------------------------------------------

describe('agentos edge functions: secret handling', () => {
  it.each(AGENTOS_FUNCTIONS)('%s never reads the service-role key inside a return', (name) => {
    const src = stripComments(functionSource(name));
    let index = src.indexOf("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    while (index !== -1) {
      // Walk back to the start of the enclosing statement and prove it is not
      // a return: a returned service-role key would leak it to the client.
      const before = src.slice(0, index);
      const start = Math.max(before.lastIndexOf(';'), before.lastIndexOf('{'), before.lastIndexOf('}'));
      const statement = start === -1 ? before : before.slice(start + 1);
      const cut = statement.search(/\breturn\b|\bthrow\b/);
      expect(cut, `${name}: service-role key read must not be inside a return`).toBe(-1);
      index = src.indexOf("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')", index + 1);
    }
  });

  it.each(AGENTOS_FUNCTIONS)('%s never interpolates a credential into a response', (name) => {
    const src = functionSource(name);
    for (const statement of returnedAndFailedStatements(src)) {
      for (const expression of interpolations(statement)) {
        expect(
          expression,
          `${name}: returned message must not interpolate a credential (${expression})`,
        ).not.toMatch(CREDENTIALISH);
      }
    }
  });

  it.each(AGENTOS_FUNCTIONS)('%s never prints a credential', (name) => {
    const src = stripComments(functionSource(name));
    for (const statement of [...src.matchAll(/console\.error\([^;]*\)/g)].map((m) => m[0])) {
      expect(statement).not.toMatch(CREDENTIALISH);
    }
  });

  it.each(USER_FACING_FUNCTIONS)('%s stamps ownership from the verified caller only', (name) => {
    const src = functionSource(name);
    if (name === 'agentos-tasks' || name === 'agentos-connections') {
      expect(src).toMatch(/insert\(\{[\s\S]{0,500}?owner_clerk_id: caller\.clerkUserId/);
    }
    // No write path may read an owner identity out of the request body.
    expect(src).not.toMatch(
      /insert\(\{[\s\S]{0,500}?owner_clerk_id['"]?\s*:\s*(body|parsed\.body|task)\b/,
    );
  });

  it('agentos-provider-test consumes the credential once and returns only a reference', () => {
    const src = functionSource('agentos-provider-test');
    expect(src).toContain('mintCredentialRef');
    expect(src).toContain('return ok({ ok: true, credential_ref })');
    // Platform mode ignores any caller-supplied credential and is resolved
    // before the byok branch reads one.
    const platformMode = src.indexOf("mode === 'platform'");
    const byokCredential = src.indexOf('apiKey = body.credential');
    expect(platformMode).toBeGreaterThan(-1);
    expect(byokCredential).toBeGreaterThan(platformMode);
    // The raw credential never rides back out in a returned object.
    expect(src).not.toMatch(/return[\s\S]{0,160}?\bcredential\b(?!_)\s*[,}]/);
  });

  it('agentos-connections never persists or echoes the raw credential', () => {
    const src = functionSource('agentos-connections');
    // The credential is exchanged for a reference here and dropped.
    expect(src).toContain('void body.credential');
    expect(src).not.toMatch(/insert\(\{[\s\S]{0,600}?\bcredential\s*:/);
    expect(src).toContain("connection.owner_clerk_id !== caller.clerkUserId");
    expect(src).toContain(".eq('member_clerk_id', caller.clerkUserId)");
  });

  it('agentos-approvals checks ownership and resolves with the caller\'s JWT', () => {
    const src = functionSource('agentos-approvals');
    expect(src).toContain("approval.owner_clerk_id !== caller.clerkUserId");
    // resolve_approval re-derives the actor from the request JWT claims, so it
    // must not be invoked through the bare service-role client (which carries
    // no `sub` and would refuse even the rightful owner).
    expect(src).not.toMatch(/supabase\.rpc\('resolve_approval'/);
    expect(src).toContain("rpc('resolve_approval'");
    // The caller's token is forwarded by the shared caller client.
    expect(src).toContain("getCallerClient(req)");
    const client = sharedSource('agentos-client.ts');
    expect(client).toContain("req.headers.get('authorization')");
  });

  it('agentos-tools keeps the service-role token in an outbound header only', () => {
    const src = functionSource('agentos-tools');
    const read = src.indexOf("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    expect(read).toBeGreaterThan(-1);
    const assignment = src.slice(read, read + 90);
    expect(assignment).toMatch(/^Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\) \?\? ''/);
    // It is only ever used to authorize the internal run-ai-app call.
    const usages = [...src.matchAll(/SUPABASE_SERVICE_ROLE_KEY/g)].length;
    expect(usages).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tool dispatch: unsupported integrations refuse before execution
// ---------------------------------------------------------------------------

describe('agentos-tools: unsupported guard', () => {
  it('refuses support = unsupported before the dispatch switch', () => {
    const src = functionSource('agentos-tools');
    const guard = src.indexOf("integration.support === 'unsupported'");
    const dispatch = src.indexOf('switch (body.tool)');
    expect(guard).toBeGreaterThan(-1);
    expect(dispatch).toBeGreaterThan(guard);
    expect(src.slice(guard, dispatch)).toContain("fail('unsupported'");
  });

  it('refuses unknown tools and keeps the default branch refusing', () => {
    const src = functionSource('agentos-tools');
    expect(src).toContain("fail('not_found', `Unknown tool: ${body.tool}`)");
    expect(src).toContain("fail('unsupported', `${body.tool} has no implementation in this port`)");
    expect(src).not.toContain('void allowed');
  });
});

// ---------------------------------------------------------------------------
// Queue / claim logic
// ---------------------------------------------------------------------------

describe('agentos-execute: queue contract', () => {
  const src = functionSource('agentos-execute');

  it('claims through the lease-holding RPC', () => {
    expect(src).toContain("rpc('claim_due_tasks'");
    expect(src).toContain('p_worker_id');
    expect(src).toContain('p_limit');
    expect(src).toContain('p_lease_seconds');
  });

  it('resolves the run row the claim created', () => {
    expect(src).toContain("from('execution_runs')");
    expect(src).toMatch(/\.eq\('status', 'running'\)/);
    expect(src).toMatch(/\.order\('started_at'/);
  });

  it('honours the workspace, worker, and approval policies', () => {
    expect(src).toContain('executions_paused');
    expect(src).toContain("worker.status === 'paused'");
    expect(src).toContain("worker.status === 'archived'");
    expect(src).toContain('if (claim.requires_approval)');
    expect(src).toContain('parkForApproval');
  });

  it('guards the batch budget and finishes through the queue RPCs', () => {
    expect(src).toContain('RUNTIME_LIMITS.invokeTimeoutMs');
    expect(src).toContain('batchDeadline');
    expect(src).toContain("rpc('complete_task'");
    expect(src).toContain("rpc('fail_task'");
    expect(src).toContain('usage_records');
    expect(src).toContain('computeCredits');
  });

  it('does not import unused runtime helpers', () => {
    expect(src).not.toMatch(/\bevaluateToolCall\b/);
  });
});

describe('agentos-sweep: scheduler contract', () => {
  const src = functionSource('agentos-sweep');

  it('dispatches due schedules and recovers stale runs', () => {
    expect(src).toContain("rpc('dispatch_due_schedules')");
    expect(src).toContain("rpc('recover_stale_runs')");
  });
});

// ---------------------------------------------------------------------------
// Browser service <-> edge function contract
// ---------------------------------------------------------------------------

interface Invocation {
  service: string;
  functionName: string;
  window: string;
}

/** Every functions.invoke / callAction the agentos browser services make. */
function collectInvocations(): Invocation[] {
  const invocations: Invocation[] = [];
  for (const file of readdirSync(SERVICES_DIR).filter((name) => name.endsWith('.ts'))) {
    const text = readFileSync(join(SERVICES_DIR, file), 'utf8');
    const pattern = /(?:functions\.invoke|callAction(?:<[^>]*>)?)\(\s*["']([a-zA-Z0-9_-]+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      invocations.push({
        service: file,
        functionName: match[1],
        window: text.slice(match.index, match.index + 700),
      });
    }
  }
  return invocations;
}

describe('browser services match the edge function contract', () => {
  const invocations = collectInvocations();

  it('invokes at least one agentos function per surface', () => {
    const names = new Set(invocations.map((invocation) => invocation.functionName));
    expect(names).toContain('agentos-tasks');
    expect(names).toContain('agentos-execute');
    expect(names).toContain('agentos-approvals');
    expect(names).toContain('agentos-provider-test');
    expect(names).toContain('agentos-connections');
  });

  it.each(invocations.map((invocation) => [
    `${invocation.service} -> ${invocation.functionName}`,
    invocation,
  ] as const))('%s targets a function that exists and handles the payload', (_label, invocation) => {
    expect(
      invocation.functionName.startsWith('agentos-'),
      `${invocation.service} invokes an agentos function`,
    ).toBe(true);
    const fn = functionSource(invocation.functionName);

    const action = /action:\s*["']([a-z_]+)["']/.exec(invocation.window)?.[1];
    if (action) {
      expect(fn, `${invocation.functionName} handles action "${action}"`).toContain(`'${action}'`);
    }
    if (invocation.functionName === 'agentos-execute') {
      expect(fn).toContain('body.limit');
    }
    if (invocation.functionName === 'agentos-approvals') {
      expect(fn).toContain('approval_id');
      expect(fn).toContain('decision');
    }
    if (invocation.functionName === 'agentos-provider-test') {
      expect(fn).toContain('credential_ref');
      expect(fn).toContain('model_id');
    }

    // The caller must be able to read the { data } envelope back.
    const service = readFileSync(join(SERVICES_DIR, invocation.service), 'utf8');
    expect(service).toMatch(/envelope\?\.data|response\.data/);
  });

  it('agentos-tasks returns the create envelope the service unwraps', () => {
    const tasks = functionSource('agentos-tasks');
    expect(tasks).toContain('queued_as');
    expect(tasks).toContain('ok({ task: updated, queued_as: decision })');
    expect(tasks).toContain("'create' | 'cancel' | 'retry'");
    expect(tasks).toContain('owner_clerk_id: caller.clerkUserId');
    expect(tasks).toContain('handoff_to_task_id must reference your own task');
  });

  it('agentos-connections accepts exactly the connect/revoke actions sent', () => {
    const connections = functionSource('agentos-connections');
    expect(connections).toContain("'connect' | 'revoke'");
    expect(connections).toContain("body.action === 'connect'");
    expect(connections).toContain('VALID_ISOLATION');
  });

  it('missions.callAction unwraps the envelope envelope safely', () => {
    const missions = readFileSync(join(SERVICES_DIR, 'missions.ts'), 'utf8');
    expect(missions).toContain('envelope?.data');
    expect(missions).toContain('supabase.functions.invoke(functionName, { body })');
  });
});

// ---------------------------------------------------------------------------
// Schema routing
//
// Every AgentOS object lives in the `agentos` schema, while the project also
// exposes `public`. An unqualified query therefore never reaches the AgentOS
// tables — and on this project `public.tasks` and `public.workspaces` exist, so
// an unqualified query can silently read the WRONG table. These guards make
// the schema explicit everywhere, so the regression fails here rather than on
// a live project.
// ---------------------------------------------------------------------------

describe('agentos schema routing', () => {
  const AGENTOS_SOURCE_DIRS = [
    join(ROOT, 'src', 'services', 'agentos'),
    join(ROOT, 'src', 'pages', 'agentos'),
    join(ROOT, 'src', 'components', 'agentos'),
  ];

  function agentosSourceFiles(): string[] {
    const files: string[] = [];
    for (const dir of AGENTOS_SOURCE_DIRS) {
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir, { recursive: true })) {
        const name = String(entry);
        if (!/\.(ts|tsx)$/.test(name)) continue;
        if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
        // client.ts IS the schema client; it is asserted separately.
        if (name === 'client.ts') continue;
        files.push(join(dir, name));
      }
    }
    return files;
  }

  /** Collapse whitespace so a chain broken over several lines still matches. */
  function normalize(src: string): string {
    return src.replace(/\/\/[^\n]*/g, ' ').replace(/\s+/g, ' ');
  }

  it('verifies the service credential with the platform, not a substring', () => {
    const client = sharedSource('agentos-client.ts');
    expect(client).toContain('isServiceRoleRequest');
    // The platform verifies it: the new secret key through the 'secret' mode,
    // the legacy service-role JWT through the admin endpoint, which accepts
    // only service-level credentials.
    expect(client).toContain("auth: 'secret'");
    expect(client).toContain('/auth/v1/admin/users');
  });

  it('pins the service client to the agentos schema', () => {
    const client = sharedSource('agentos-client.ts');
    expect(client).toContain("AGENTOS_SCHEMA = 'agentos'");
    expect(client).toContain('db: { schema: AGENTOS_SCHEMA }');
  });

  it('pins the browser client to the agentos schema', () => {
    const client = readFileSync(join(SERVICES_DIR, 'client.ts'), 'utf8');
    expect(client).toContain('AGENTOS_SCHEMA = "agentos"');
    expect(client).toContain('base.schema(AGENTOS_SCHEMA)');
  });

  it('never queries AgentOS tables through the unqualified public client', () => {
    const offenders: string[] = [];
    for (const file of agentosSourceFiles()) {
      const src = normalize(readFileSync(file, 'utf8'));
      if (
        /(?<!Array)(?<!agentosDb\s*)\.from\s*\(/.test(src) ||
        /(?<!Array)(?<!agentosDb\s*)\.rpc\s*\(/.test(src)
      ) {
        offenders.push(file.replace(`${ROOT}/`, ''));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('routes every AgentOS table and RPC through the scoped client', () => {
    for (const file of agentosSourceFiles()) {
      const src = normalize(readFileSync(file, 'utf8'));
      const tables = [...src.matchAll(/\.from\(\s*["']([a-z_]+)["']/g)].map((match) => match[1]);
      for (const table of tables) {
        const scoped = new RegExp(`agentosDb\\s*\\.from\\(\\s*["']${table}["']`);
        expect(scoped.test(src), `${file.replace(`${ROOT}/`, '')} -> ${table}`).toBe(true);
      }
    }
  });

  it('never builds an un-pinned Supabase client inside an edge function', () => {
    for (const name of AGENTOS_FUNCTIONS) {
      const src = functionSource(name);
      expect(src, name).not.toMatch(/createClient\(/);
      // A function that touches the database must take its client from the
      // shared helper, which pins the agentos schema.
      if (/\.from\(|\.rpc\(/.test(src)) {
        expect(src, name).toMatch(/getServiceClient|getCallerClient/);
      }
    }
  });
});
