const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const cfg = {
  host: "db.bzxohkrxcwodllketcpz.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "ParkerDean1980!",
  ssl: { rejectUnauthorized: false },
};

async function run() {
  const client = new Client(cfg);
  await client.connect();
  console.log("Connected to remote Postgres.");

  const files = [
    "supabase/migrations/20260709020000_clerk_supabase_alignment.sql",
    "supabase/migrations/20260709030000_clerk_full_alignment_phase2.sql",
  ];

  for (const f of files) {
    const sql = fs.readFileSync(path.resolve(f), "utf8");
    console.log(`\n--- Applying ${path.basename(f)} (${sql.length} bytes) ---`);
    try {
      await client.query(sql);
      console.log(`OK ${path.basename(f)}`);
    } catch (err) {
      console.error(`FAILED ${path.basename(f)}:`, err.message);
      // continue to try the next file? No, abort to be safe.
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\nAll migrations applied successfully.");
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
