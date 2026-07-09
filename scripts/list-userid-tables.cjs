const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
(async () => {
  const c = new Client(cfg); await c.connect();
  const r = await c.query("SELECT table_name, data_type FROM information_schema.columns WHERE table_schema='public' AND column_name='user_id' ORDER BY table_name");
  r.rows.forEach(x => console.log(x.table_name, x.data_type));
  await c.end();
})();
