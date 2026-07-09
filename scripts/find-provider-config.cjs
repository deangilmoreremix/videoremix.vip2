const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
(async () => {
  const c = new Client(cfg); await c.connect();
  // List tables in the auth schema (auth.*) related to providers / OIDC
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='auth' AND (table_name ILIKE '%provider%' OR table_name ILIKE '%oidc%' OR table_name ILIKE '%saml%' OR table_name ILIKE '%identity%' OR table_name ILIKE '%config%') ORDER BY table_name");
  console.log("Relevant auth.* tables:");
  r.rows.forEach(x => console.log(" -", x.table_name));
  await c.end();
})();
