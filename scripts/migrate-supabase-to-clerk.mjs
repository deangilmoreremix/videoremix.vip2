// Migrate Supabase auth users into Clerk.
//
// Constraints handled:
//  - Supabase passwords are one-way hashes and CANNOT be read. Every user is
//    created in Clerk with a temporary password (TEMP_PASSWORD) and must reset it.
//  - Existing Clerk users (by email) are skipped to avoid duplicates.
//  - Targets whatever Clerk instance CLERK_SECRET_KEY points at (test or prod).
//
// Usage:
//   DRY_RUN=1 node scripts/migrate-supabase-to-clerk.mjs   # count only, no writes
//   node scripts/migrate-supabase-to-clerk.mjs             # perform the migration
//
// Set TEMP_PASSWORD to override the default temporary password.

import fs from "node:fs";
import path from "node:path";

// ---- Minimal .env loader -------------------------------------------------
function loadEnv(file = ".env") {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const CLERK_BASE = "https://api.clerk.com/v1";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEMP_PASSWORD = process.env.TEMP_PASSWORD || "VideoRemix2026";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

if (!CLERK_SECRET) { console.error("Missing CLERK_SECRET_KEY"); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Missing Supabase URL/key"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clerkFetch(pathname, { method = "GET", body } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(CLERK_BASE + pathname, {
      method,
      headers: {
        Authorization: `Bearer ${CLERK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      const retry = Number(res.headers.get("retry-after") || "2");
      console.warn(`  rate limited, waiting ${retry}s`);
      await sleep(retry * 1000);
      continue;
    }
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    return { status: res.status, json };
  }
  throw new Error("Clerk request failed after retries");
}

async function getAllClerkEmails() {
  const emails = new Set();
  let offset = 0;
  const limit = 100;
  while (true) {
    const { json } = await clerkFetch(`/users?limit=${limit}&offset=${offset}`);
    const users = json || [];
    if (!Array.isArray(users) || users.length === 0) break;
    for (const u of users) {
      for (const e of u.email_addresses || []) emails.add(e.email_address.toLowerCase());
    }
    if (users.length < limit) break;
    offset += limit;
  }
  return emails;
}

async function getAllSupabaseUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY },
    });
    const json = await res.json();
    const batch = json.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function createClerkUser(email) {
  if (DRY_RUN) return { status: "dry-run" };
  const { status, json } = await clerkFetch("/users", {
    method: "POST",
    body: {
      email_address: [email],
      password: TEMP_PASSWORD,
      skip_password_checks: true,
      email_verified: true,
    },
  });
  if (status >= 200 && status < 300) return { status: "created", id: json.id };
  const msg = json?.errors?.[0]?.message || json?.message || JSON.stringify(json).slice(0, 200);
  if (status === 422 && /already/i.test(msg)) return { status: "exists" };
  return { status: "error", message: msg };
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE migration"}`);
  console.log(`Clerk key: ${CLERK_SECRET.slice(0, 12)}...`);
  console.log(`Temp password: ${TEMP_PASSWORD}`);

  console.log("Fetching existing Clerk users...");
  const clerkEmails = await getAllClerkEmails();
  console.log(`  Clerk users: ${clerkEmails.size}`);

  console.log("Fetching Supabase users...");
  const supaUsers = await getAllSupabaseUsers();
  console.log(`  Supabase users: ${supaUsers.length}`);

  const emailsToCreate = [];
  const skippedNoEmail = 0;
  for (const u of supaUsers) {
    const email = (u.email || "").toLowerCase().trim();
    if (!email) { continue; }
    if (clerkEmails.has(email)) { continue; }
    emailsToCreate.push(email);
  }

  console.log(`To create in Clerk: ${emailsToCreate.length}`);
  if (DRY_RUN) { console.log("DRY RUN complete."); return; }

  let created = 0, exists = 0, errors = 0;
  const errorRows = [];
  for (let i = 0; i < emailsToCreate.length; i++) {
    const email = emailsToCreate[i];
    const r = await createClerkUser(email);
    if (r.status === "created") created++;
    else if (r.status === "exists") exists++;
    else { errors++; errorRows.push(`${email}: ${r.message}`); }
    if ((i + 1) % 25 === 0 || i + 1 === emailsToCreate.length) {
      console.log(`  progress ${i + 1}/${emailsToCreate.length} (created=${created} exists=${exists} errors=${errors})`);
      await sleep(500);
    }
  }

  console.log("\n=== Done ===");
  console.log(`Created: ${created}`);
  console.log(`Already existed: ${exists}`);
  console.log(`Errors: ${errors}`);
  if (errorRows.length) {
    fs.writeFileSync("migration-errors.log", errorRows.join("\n"));
    console.log("Errors written to migration-errors.log");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
