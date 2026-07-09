const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
(async () => {
  const c = new Client(cfg); await c.connect();
  const cols = await c.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='auth' AND table_name='custom_oauth_providers' ORDER BY ordinal_position");
  console.log("auth.custom_oauth_providers columns:");
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) ${r.is_nullable==='NO'?'NOT NULL':''} ${r.column_default||''}`));
  const sample = await c.query("SELECT * FROM auth.custom_oauth_providers LIMIT 3");
  console.log("\nSample rows (up to 3):");
  console.log(JSON.stringify(sample.rows, null, 2));
  await c.end();
})();
