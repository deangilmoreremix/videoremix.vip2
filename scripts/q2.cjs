const { Client } = require("pg");
(async () => {
  const c = new Client({ host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query("SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'auth.custom_oauth_providers'::regclass AND contype='c'");
  r.rows.forEach(x => console.log(x.conname, '\n  ', x.def));
  await c.end();
})();
