const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
(async () => {
  const c = new Client(cfg); await c.connect();
  const r = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position");
  r.rows.forEach(x => console.log(x.column_name, x.data_type));
  await c.end();
})();
