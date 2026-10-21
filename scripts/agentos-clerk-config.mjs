#!/usr/bin/env node
// scripts/agentos-clerk-config.mjs
//
// Reads and updates the Clerk instance's URL settings and allowed origins.
//
// WHY THIS EXISTS
//   The instance is configured with URLs that do not exist:
//   `home_url`, `sign_in_url` and `after_sign_in_url` all point at
//   https://auth.videoremix.vip, which has no DNS record. The sign-in flow
//   therefore navigates away from the app into nowhere, and the account
//   portal and the redirect emails go to the same dead host.
//
//   The app itself no longer depends on those settings (the ClerkProvider
//   declares signInUrl / signUpUrl / the fallbacks), but the instance should
//   still be correct: the emails, the account portal and any other client
//   use them.
//
//   The instance secret key is needed, and it is only in the Clerk dashboard
//   (Clerk -> API Keys -> Secret key) or in the platform's function secrets
//   (which belong to a different, development instance). So the key is read
//   from the environment and never written anywhere.
//
// Usage:
//   export CLERK_SECRET_KEY=sk_live_...
//   node scripts/agentos-clerk-config.mjs            # show the current settings
//   node scripts/agentos-clerk-config.mjs --apply     # correct them
//   node scripts/agentos-clerk-config.mjs --apply --allow-origin https://kilo-agentos-port-completion--videoremix.netlify.app
//
// The origin the app is served from is always allowed: `videoremix.vip` and
// its subdomains. The deploy preview and local development are added with
// --allow-origin (repeatable).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLERK_API = "https://api.clerk.com/v1/instance";
const EXPECTED_INSTANCE = "videoremix.vip";

const APP_ORIGIN = "https://videoremix.vip";

const DESIRED = {
  home_url: `${APP_ORIGIN}/`,
  sign_in_url: `${APP_ORIGIN}/signin`,
  sign_up_url: `${APP_ORIGIN}/signup`,
  after_sign_in_url: `${APP_ORIGIN}/dashboard`,
  after_sign_up_url: `${APP_ORIGIN}/dashboard`,
  after_sign_out_url: `${APP_ORIGIN}/`,
};

function readSecret() {
  if (process.env.CLERK_SECRET_KEY) return process.env.CLERK_SECRET_KEY.trim();

  // Fall back to the project's .env, which is not tracked.
  try {
    const env = readFileSync(join(ROOT, ".env"), "utf8");
    const match = env.match(/^CLERK_SECRET_KEY=(.*)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    // no .env
  }
  return "";
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const extraOrigins = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--allow-origin" && args[i + 1]) extraOrigins.push(args[i + 1]);
  }

  const secret = readSecret();
  if (!secret) {
    console.error("CLERK_SECRET_KEY is required.");
    console.error("  export CLERK_SECRET_KEY=sk_live_...   (Clerk -> API Keys -> Secret key)");
    process.exit(2);
  }

  const headers = { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" };

  const current = await fetch(CLERK_API, { headers });
  if (!current.ok) {
    console.error(`The Clerk API refused the key (HTTP ${current.status}):`);
    console.error((await current.text()).slice(0, 300));
    process.exit(1);
  }
  const instance = await current.json();

  const frontendApi = String(instance?.frontend_api ?? "");
  if (frontendApi && !frontendApi.includes(EXPECTED_INSTANCE)) {
    console.error(`Refusing: this key belongs to ${frontendApi}, not to ${EXPECTED_INSTANCE}.`);
    process.exit(1);
  }

  console.log(`Clerk instance: ${instance?.id} (${frontendApi || "unknown host"})`);
  console.log("");
  console.log("current URLs:");
  for (const [key, value] of Object.entries(DESIRED)) {
    console.log(`  ${key.padEnd(20)} ${instance?.[key] ?? "(unset)"}`);
  }
  console.log(`  ${"allowed_origins".padEnd(20)} ${JSON.stringify(instance?.allowed_origins ?? null)}`);

  if (!apply) {
    console.log("");
    console.log("Nothing changed. Re-run with --apply to correct them.");
    return;
  }

  // The app's own origin is always allowed, plus whatever was asked for.
  const origins = new Set([`${APP_ORIGIN}`, `${APP_ORIGIN}/`]);
  for (const origin of extraOrigins) origins.add(origin);
  for (const origin of instance?.allowed_origins ?? []) {
    if (typeof origin === "string" && origin !== APP_ORIGIN) origins.add(origin);
  }

  const body = { ...DESIRED, allowed_origins: [...origins] };

  const response = await fetch(CLERK_API, { method: "PATCH", headers, body: JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) {
    console.error(`The Clerk API refused the change (HTTP ${response.status}):`);
    console.error(text.slice(0, 400));
    process.exit(1);
  }

  const updated = JSON.parse(text);
  console.log("");
  console.log("updated:");
  for (const [key, value] of Object.entries(DESIRED)) {
    console.log(`  ${key.padEnd(20)} ${updated?.[key] ?? "(unset)"}`);
  }
  console.log(`  ${"allowed_origins".padEnd(20)} ${JSON.stringify(updated?.allowed_origins ?? null)}`);
  console.log("");
  console.log("The Clerk dashboard shows the same values under Settings -> URLs and");
  console.log("Settings -> Allowed origins.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
