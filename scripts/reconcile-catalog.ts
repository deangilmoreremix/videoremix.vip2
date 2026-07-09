/**
 * reconcile-catalog.ts
 *
 * Single source-of-truth reconciliation between:
 *   1. Supabase  -> products_catalog (slug, name, apps_granted) + user_app_access (granted slugs)
 *   2. Frontend  -> src/data/appsData.ts (id, name, url slug)
 *   3. Contract  -> implemented app slugs in src/components/ai/apps/registry.ts
 *
 * Prints a drift report. Use --write to regenerate src/data/appsData.ts from
 * products_catalog (keeping app metadata aligned to the DB).
 *
 * Env: requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";
import { fileURLToPath } from "url";

// Node 20 has no global WebSocket; polyfill for supabase-js realtime init.
if (!(globalThis as any).WebSocket) (globalThis as any).WebSocket = WebSocket as any;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const url =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase env (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { disabled: true },
});

function extractAppsData() {
  const f = path.join(ROOT, "src/data/appsData.ts");
  const t = fs.readFileSync(f, "utf8");
  const re = /id:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"[^}]*?url:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  const rows: { id: string; name: string; urlSlug: string }[] = [];
  while ((m = re.exec(t))) {
    const urlSlug =
      (m[3].match(/\/ai-runner\/([^"/]+)/) || [])[1] ||
      (m[3].match(/\/agent\/([^"/]+)/) || [])[1] ||
      "";
    rows.push({ id: m[1], name: m[2], urlSlug });
  }
  return rows;
}

function extractRegistrySlugs() {
  const f = path.join(ROOT, "src/components/ai/apps/registry.ts");
  const t = fs.readFileSync(f, "utf8");
  return new Set([...t.matchAll(/"([a-z0-9-]+)":\s*\(\)\s*=>/g)].map((x) => x[1]));
}

async function main() {
  console.log("→ Connecting to Supabase:", url);

  const { data: catalog, error: cErr } = await supabase
    .from("products_catalog")
    .select("slug, name, description, apps_granted, is_active");
  if (cErr) {
    console.error("products_catalog query failed:", cErr.message);
    process.exit(1);
  }

  const { data: access, error: aErr } = await supabase
    .from("user_app_access")
    .select("app_slug");
  if (aErr) {
    console.error("user_app_access query failed:", aErr.message);
    process.exit(1);
  }

  const dbSlugs = new Set((catalog || []).map((p: any) => p.slug));
  const grantedSlugs = new Set((access || []).map((a: any) => a.app_slug));
  const appsGranted = new Set<string>();
  for (const p of catalog || []) {
    for (const s of p.apps_granted || []) appsGranted.add(s);
  }

  const apps = extractAppsData();
  const registry = extractRegistrySlugs();
  const feUrlSlugs = new Set(apps.map((a) => a.urlSlug).filter(Boolean));
  const feIds = new Set(apps.map((a) => a.id));

  const nameCount: Record<string, number> = {};
  for (const a of apps) nameCount[a.name] = (nameCount[a.name] || 0) + 1;
  const dupNames = Object.entries(nameCount).filter(([, v]) => v > 1);

  const idMismatch = apps.filter((a) => a.urlSlug && a.id !== a.urlSlug);
  const feNotInRegistry = [...feUrlSlugs].filter((s) => !registry.has(s));

  // App slugs that products actually grant (apps_granted jsonb) vs implemented registry.
  const productGrantsNotImplemented = [...appsGranted].filter((s) => !registry.has(s));
  const accessGrantsNotImplemented = [...grantedSlugs].filter((s) => !registry.has(s));
  // Implemented apps that nothing in products_catalog grants.
  const implementedWithNoProduct = [...registry].filter(
    (s) => !appsGranted.has(s)
  );

  console.log("\n================ RECONCILIATION REPORT ================\n");
  console.log(`Supabase products_catalog rows : ${catalog?.length ?? 0}`);
  console.log(`Supabase user_app_access slugs : ${grantedSlugs.size}`);
  console.log(`Frontend appsData rows         : ${apps.length}`);
  console.log(`Implemented registry slugs      : ${registry.size}\n`);

  console.log("--- DUPLICATE DISPLAY NAMES (frontend) ---");
  console.log(`count: ${dupNames.length}`);
  dupNames.slice(0, 15).forEach(([n, c]) => console.log(`  • ${n} (${c}×)`));

  console.log("\n--- id !== url-slug MISMATCHES (frontend) ---");
  console.log(`count: ${idMismatch.length}`);
  idMismatch.slice(0, 15).forEach((a) =>
    console.log(`  • id="${a.id}"  →  /ai-runner/${a.urlSlug}`)
  );

  console.log("\n--- PRODUCT apps_granted NOT IN REGISTRY (broken product grants) ---");
  console.log(`count: ${productGrantsNotImplemented.length}`);
  productGrantsNotImplemented.slice(0, 20).forEach((s) => console.log(`  • ${s}`));

  console.log("\n--- user_app_access SLUGS NOT IN REGISTRY (broken access rows) ---");
  console.log(`count: ${accessGrantsNotImplemented.length}`);
  accessGrantsNotImplemented.slice(0, 20).forEach((s) => console.log(`  • ${s}`));

  console.log("\n--- IMPLEMENTED APPS WITH NO PRODUCT GRANTING THEM ---");
  console.log(`count: ${implementedWithNoProduct.length}`);
  implementedWithNoProduct.slice(0, 20).forEach((s) => console.log(`  • ${s}`));

  console.log("\n--- FRONTEND SLUGS NOT IN REGISTRY (orphan UI entries) ---");
  console.log(`count: ${feNotInRegistry.length}`);
  feNotInRegistry.slice(0, 20).forEach((s) => console.log(`  • ${s}`));

  // Summary verdict
  const totalIssues =
    dupNames.length +
    idMismatch.length +
    productGrantsNotImplemented.length +
    accessGrantsNotImplemented.length +
    implementedWithNoProduct.length +
    feNotInRegistry.length;
  console.log("\n========================================================");
  console.log(totalIssues === 0 ? "✅ No drift detected." : `⚠️  ${totalIssues} drift issues found.`);
  console.log("========================================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
