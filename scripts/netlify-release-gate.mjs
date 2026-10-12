#!/usr/bin/env node
/**
 * Netlify release gate — the single authoritative build/test gate for every
 * Netlify deploy (production, deploy previews, and branch/staging deploys).
 *
 * GitHub is source control + PRs only; GitHub Actions are billing-locked and
 * must NOT gate deploys. Netlify is the official build/test/preview/production
 * platform, and this script IS the gate: netlify.toml's [build] command runs
 * it, and Netlify fails the deploy on any non-zero exit code.
 *
 * Steps run IN ORDER and fail fast (first failure aborts the gate and fails
 * the deploy). No step is allowed to swallow failures (no `|| true` anywhere):
 *
 *   1. validate-env — required env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 *   2. lint         — eslint with the approved warning budget (821; currently 796)
 *   3. test         — FULL vitest suite (`npx vitest run`, all files/tests)
 *   4. test-catalog — named step: catalog integrity suite MUST exist and pass
 *                     (src/config/appRegistry.test.ts — enforces 117+13=130 catalog)
 *   5. test-security — named step: webhook provider-verification regression suite
 *                     MUST exist and pass (tests/webhook-*.test.ts)
 *   6. typescript   — `npx tsc -b` error COUNT vs recorded baseline
 *                     (scripts/tsc-baseline.json). FAILS only on REGRESSION
 *                     (count > baseline); documented legacy debt stays
 *                     non-blocking. Current baseline: 1621.
 *   7. build        — vite production build (`npm run build` -> dist/)
 *
 * Usage:
 *   node scripts/netlify-release-gate.mjs                 # full gate (what Netlify runs)
 *   node scripts/netlify-release-gate.mjs --list          # list steps
 *   node scripts/netlify-release-gate.mjs --step=<id>      # run a single step
 *
 * Env overrides (for proving/operating the tsc regression detector without
 * editing the committed baseline file):
 *   NETLIFY_GATE_TSC_BASELINE=<number>       — override the baseline count
 *   NETLIFY_GATE_TSC_BASELINE_FILE=<path>    — alternate baseline JSON file
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(ROOT);

const REPO_ROOT_LABEL = 'netlify-release-gate';

function log(msg = '') {
  process.stdout.write(`[${REPO_ROOT_LABEL}] ${msg}\n`);
}

function fail(stepLabel, detail) {
  log(`FAIL: ${stepLabel}${detail ? ` — ${detail}` : ''}`);
  log('GATE RESULT: FAIL — the deploy MUST NOT proceed.');
  process.exit(1);
}

/** Run a shell command, streaming output. Never wraps with `|| true`. */
function run(cmd) {
  const res = spawnSync(cmd, { shell: true, stdio: 'inherit' });
  if (res.error) throw res.error;
  return res.status == null ? 1 : res.status;
}

/* ------------------------------- steps ---------------------------------- */

function stepValidateEnv() {
  const code = run('npm run validate-env');
  if (code !== 0) fail('step 1/7 validate-env', `npm run validate-env exited ${code} (required env vars missing/invalid)`);
}

function stepLint() {
  // Approved budget: --max-warnings 821 (currently 796). Exits 0 at <=821 warnings;
  // any NEW error or warning beyond budget fails the gate.
  const code = run('npm run lint');
  if (code !== 0) fail('step 2/7 lint', `npm run lint exited ${code} (lint errors, or warnings above the approved 821 budget)`);
}

function stepTestFull() {
  const code = run('npx vitest run');
  if (code !== 0) fail('step 3/7 test (full vitest suite)', `npx vitest run exited ${code} — failing tests block the deploy`);
}

function stepTestCatalog() {
  // The catalog integrity suite MUST exist (assert) and pass.
  const suite = 'src/config/appRegistry.test.ts';
  if (!existsSync(suite)) {
    fail('step 4/7 test-catalog', `required suite missing: ${suite} (catalog integrity enforcement would be lost)`);
  }
  const code = run(`npx vitest run ${suite}`);
  if (code !== 0) fail('step 4/7 test-catalog', `npx vitest run ${suite} exited ${code} — catalog integrity suite (117+13=130 apps) must pass`);
}

function stepTestSecurity() {
  // Webhook security regression suites MUST exist (assert) and pass.
  const files = readdirSync('tests')
    .filter((f) => /^webhook-.*\.test\.tsx?$/.test(f))
    .sort()
    .map((f) => join('tests', f));
  if (files.length === 0) {
    fail('step 5/7 test-security', 'no tests/webhook-*.test.ts files found — provider-correct webhook verification regression suite would be lost');
  }
  log(`security regression suites: ${files.join(', ')}`);
  const code = run(`npx vitest run ${files.join(' ')}`);
  if (code !== 0) fail('step 5/7 test-security', `npx vitest run ${files.join(' ')} exited ${code} — webhook verification regressions block the deploy`);
}

function loadBaseline() {
  const envCount = process.env.NETLIFY_GATE_TSC_BASELINE;
  if (envCount != null && envCount !== '') {
    const n = Number.parseInt(envCount, 10);
    if (!Number.isInteger(n) || n < 0) {
      fail('step 6/7 typescript', `NETLIFY_GATE_TSC_BASELINE override is not a non-negative integer: ${envCount}`);
    }
    log(`tsc baseline overridden via NETLIFY_GATE_TSC_BASELINE=${n}`);
    return { count: n, source: 'env:NETLIFY_GATE_TSC_BASELINE' };
  }
  const file = process.env.NETLIFY_GATE_TSC_BASELINE_FILE || 'scripts/tsc-baseline.json';
  if (!existsSync(file)) {
    fail('step 6/7 typescript', `baseline file not found: ${file} (run scripts against scripts/tsc-baseline.json, or set NETLIFY_GATE_TSC_BASELINE)`);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    fail('step 6/7 typescript', `baseline file is not valid JSON (${file}): ${err.message}`);
  }
  const n = parsed?.baselineErrors;
  if (!Number.isInteger(n) || n < 0) {
    fail('step 6/7 typescript', `baseline file ${file} has no valid baselineErrors integer`);
  }
  return { count: n, source: file };
}

function stepTypescript() {
  // Counting method: one `error TS` line == one compiler diagnostic.
  // tsc -b exits non-zero whenever ANY error exists (expected: 1621 legacy
  // errors), so the exit code alone is NOT the verdict — the COUNT vs baseline is.
  const baseline = loadBaseline();
  const res = spawnSync('npx tsc -b', { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw res.error;
  const output = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  const errorLines = output.split('\n').filter((l) => /error TS\d+/.test(l));
  const count = errorLines.length;

  // Print bounded diagnostics so a regression is triageable from the deploy log.
  if (count > 0) {
    const head = errorLines.slice(0, 10).join('\n');
    log(`tsc reported ${count} error(s) (baseline ${baseline.count}, source ${baseline.source}). First ${Math.min(count, 10)}:`);
    process.stdout.write(`${head}\n`);
    if (count > 10) log(`... ${count - 10} more (run locally: npx tsc -b 2>&1 | grep -c 'error TS')`);
  }

  if (res.status !== 0 && count === 0) {
    // Non-zero exit with zero diagnostics means the compiler could not run
    // (config/toolchain failure) — that MUST fail the gate.
    fail('step 6/7 typescript', `npx tsc -b exited ${res.status} but reported no diagnostics — cannot verify type baseline`);
  }
  if (count > baseline.count) {
    fail('step 6/7 typescript', `type-check REGRESSION: ${count} errors > baseline ${baseline.count} (+${count - baseline.count}). Documented legacy debt is non-blocking, but growth fails the deploy.`);
  }
  log(`type-check within baseline: ${count} <= ${baseline.count} (legacy debt non-blocking, no regression)`);
}

function stepBuild() {
  const code = run('npm run build');
  if (code !== 0) fail('step 7/7 build', `npm run build exited ${code} — vite production build failed, dist/ not produced`);
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    fail('step 7/7 build', 'dist/index.html missing after build — publish directory (dist) would deploy nothing');
  }
}

/* ------------------------------- runner ---------------------------------- */

const STEPS = [
  { id: 'validate-env', name: 'validate-env (required env vars)', fn: stepValidateEnv },
  { id: 'lint', name: 'lint (approved warning budget 821)', fn: stepLint },
  { id: 'test', name: 'test — FULL vitest suite', fn: stepTestFull },
  { id: 'test-catalog', name: 'test-catalog — catalog integrity suite must exist and pass', fn: stepTestCatalog },
  { id: 'test-security', name: 'test-security — webhook verification regression suites must exist and pass', fn: stepTestSecurity },
  { id: 'typescript', name: 'typescript — tsc -b regression check vs baseline', fn: stepTypescript },
  { id: 'build', name: 'build — vite production build (dist/)', fn: stepBuild },
];

const args = process.argv.slice(2);
if (args.includes('--list') || args.includes('-l')) {
  STEPS.forEach((s, i) => log(`  ${i + 1}. ${s.id} — ${s.name}`));
  process.exit(0);
}

const onlyArg = args.find((a) => a.startsWith('--step='));
let selected = STEPS;
if (onlyArg) {
  const id = onlyArg.slice('--step='.length);
  const found = STEPS.find((s) => s.id === id);
  if (!found) {
    log(`unknown step: ${id} (use --list)`);
    process.exit(1);
  }
  selected = [found];
}

const startedAll = Date.now();
const results = [];
log(`=== Netlify release gate: ${selected.length} step(s) (fail-fast; non-zero exit fails the deploy) ===`);

for (let i = 0; i < selected.length; i += 1) {
  const step = selected[i];
  const label = selected.length === STEPS.length ? `${i + 1}/${STEPS.length}` : `step`;
  log('');
  log(`--- [${label}] ${step.id}: ${step.name} ---`);
  const t0 = Date.now();
  try {
    step.fn();
  } catch (err) {
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    log(`FAIL (after ${secs}s): [${label}] ${step.id} threw: ${err?.message ?? err}`);
    log('GATE RESULT: FAIL — the deploy MUST NOT proceed.');
    process.exit(1);
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  results.push({ id: step.id, secs });
  log(`PASS [${label}] ${step.id} (${secs}s)`);
}

const total = ((Date.now() - startedAll) / 1000).toFixed(1);
log('');
log('=== GATE SUMMARY ===');
for (const r of results) {
  log(`  PASS ${r.id} (${r.secs}s)`);
}
log(`GATE RESULT: PASS — ${results.length} step(s), ${total}s total. Deploy may proceed.`);
process.exit(0);

