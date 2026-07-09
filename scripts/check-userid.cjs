const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
const TABLES = ["access_revocation_log","admin_profiles","profiles","purchases","stripe_entitlements","subscription_status","user_app_access","user_roles"];
(async () => {
  const c = new Client(cfg); await c.connect();
  for (const t of TABLES) {
    const r = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='user_id'", [t]);
    const uid = r.rows[0];
    console.log(t.padEnd(28), uid ? uid.data_type : "NO user_id COLUMN");
  }
  await c.end();
})();
