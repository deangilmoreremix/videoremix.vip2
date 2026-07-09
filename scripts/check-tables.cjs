const { Client } = require("pg");
const cfg = {
  host: "db.bzxohkrxcwodllketcpz.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "ParkerDean1980!",
  ssl: { rejectUnauthorized: false },
};
const TABLES = ["access_revocation_log","admin_analytics_events","admin_profiles","agent_executions","audit_log","calendar_availability","calendar_events","calendar_integrations","feature_analytics","feature_ratings","import_records","import_user_records","profiles","purchases","stripe_entitlements","subscription_status","subscriptions","user_achievements","user_app_access","user_dashboard_preferences","user_feature_interactions","user_management_audit","user_roles","videos"];
(async () => {
  const c = new Client(cfg); await c.connect();
  const r = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1)",
    [TABLES]
  );
  const existing = r.rows.map(x => x.table_name);
  const missing = TABLES.filter(t => !existing.includes(t));
  console.log("EXISTING:", existing.length, existing.join(","));
  console.log("MISSING:", missing.length, missing.join(","));
  await c.end();
})();
