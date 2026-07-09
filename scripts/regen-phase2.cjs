// Regenerate Phase 2 from REMOTE truth (tables/columns) + schema file (policies for the 17 existing tables).
const { Client } = require("pg");
const fs = require("fs");
const MAPPING = JSON.parse(fs.readFileSync("/tmp/uuid_to_clerk.json","utf8"));
const TABLES = ["access_revocation_log","accounts","admin_profiles","api_keys","conversations","creations","notifications","purchases","sessions","stripe_entitlements","subscription_status","task_assignees","thumbnails","user_app_access","user_roles","workflows","workspace_members"];
const SCHEMA = fs.readFileSync("supabase_schema.sql","utf8");

function extractPolicies(tableSet) {
  // Find CREATE POLICY ... ON "public"."<table>" ... ;
  const re = /CREATE POLICY\s+"([^"]+)"\s+ON\s+(?:"public"\.)?"(\w+)"\s+([\s\S]*?);\s*\n/g;
  const out = [];
  let m;
  while ((m = re.exec(SCHEMA)) !== null) {
    const name = m[1], tbl = m[2], body = m[3];
    if (!tableSet.has(tbl)) continue;
    // Normalize whitespace
    const b = body.replace(/\s+/g, " ").trim();
    out.push({ name, table: tbl, body: b });
  }
  return out;
}

function rewrite(expr) {
  return expr
    .replace(/\(\s*SELECT\s+"auth"\."uid"\(\)\s*AS\s+"uid"\s*\)/gi, "(SELECT auth.jwt() ->> 'sub')")
    .replace(/"auth"\."uid"\(\)/g, "(SELECT auth.jwt() ->> 'sub')")
    .replace(/\bauth\.uid\(\)/g, "(SELECT auth.jwt() ->> 'sub')");
}

(async () => {
  const c = new Client({ host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } });
  await c.connect();
  const colRes = await c.query("SELECT table_name, data_type FROM information_schema.columns WHERE table_schema='public' AND column_name='user_id' AND table_name = ANY($1)", [TABLES]);
  const colTypes = Object.fromEntries(colRes.rows.map(r => [r.table_name, r.data_type]));
  await c.end();

  const tableSet = new Set(TABLES);
  const policies = extractPolicies(tableSet);
  console.log("Policies extracted from schema for", TABLES.length, "tables:", policies.length);

  const lines = [];
  lines.push("-- Phase 2 (regenerated): full alignment from remote truth + schema-file policies.");
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");
  lines.push("-- 1. Mapping");
  lines.push("CREATE TEMP TABLE _uuid_clerk_map (supabase_uuid uuid PRIMARY KEY, clerk_user_id text NOT NULL);");
  const rows = Object.entries(MAPPING).map(([s,c]) => `('${s}','${c}')`);
  lines.push("INSERT INTO _uuid_clerk_map (supabase_uuid, clerk_user_id) VALUES");
  lines.push(rows.join(",\n") + ";");
  lines.push("");
  lines.push("-- 2a. Drop FKs on user_id");
  lines.push("DO $$ DECLARE r record; c int := 0; BEGIN");
  lines.push("  FOR r IN SELECT c.conname, cl.relname AS tbl FROM pg_constraint c");
  lines.push("    JOIN pg_class cl ON cl.oid = c.conrelid");
  lines.push("    JOIN pg_namespace n ON n.oid = cl.relnamespace");
  lines.push("    JOIN unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord) ON true");
  lines.push("    JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = u.attnum");
  lines.push("    WHERE n.nspname='public' AND c.contype='f' AND a.attname='user_id'");
  lines.push("  LOOP EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tbl, r.conname); c := c+1; END LOOP;");
  lines.push("  RAISE NOTICE 'Dropped % FKs.', c;");
  lines.push("END $$;");
  lines.push("");
  lines.push("-- 2b. Re-key user_id");
  for (const t of TABLES) {
    if (colTypes[t] === "uuid") {
      lines.push(`ALTER TABLE public.${t} ALTER COLUMN user_id TYPE text USING user_id::text;`);
    }
    lines.push(`UPDATE public.${t} SET user_id = m.clerk_user_id FROM _uuid_clerk_map m WHERE public.${t}.user_id = m.supabase_uuid::text;`);
  }
  lines.push("");
  lines.push("-- 3. RLS policies (recreated from schema, rewritten for Clerk JWT `sub`)");
  // Dedupe by (table, name) keeping first
  const seen = new Set();
  for (const p of policies) {
    const key = p.table + "|" + p.name;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`-- ${p.table}: ${p.name}`);
    lines.push(`DROP POLICY IF EXISTS "${p.name}" ON "public"."${p.table}";`);
    lines.push(`CREATE POLICY "${p.name}" ON "public"."${p.table}" ${rewrite(p.body)};`);
    lines.push("");
  }
  lines.push("COMMIT;");
  lines.push("DROP TABLE IF EXISTS _uuid_clerk_map;");
  fs.writeFileSync("supabase/migrations/20260709030000_clerk_full_alignment_phase2.sql", lines.join("\n"));
  console.log("Wrote:", lines.join("\n").length, "bytes");
})().catch(e => { console.error(e); process.exit(1); });
