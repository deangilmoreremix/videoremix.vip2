// Register Clerk as a third-party OIDC auth provider in Supabase.
// This is the database-level equivalent of:
//   Supabase Dashboard -> Authentication -> Sign In / Providers -> Add provider -> Clerk
// After this runs, Supabase will accept Clerk session JWTs and resolve
// (SELECT auth.jwt() ->> 'sub') to the Clerk user ID.
const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
const CLERK_DOMAIN = "clerk.auth.videoremix.vip";
const ISSUER = `https://${CLERK_DOMAIN}`;
const DISCOVERY = `${ISSUER}/.well-known/openid-configuration`;

(async () => {
  const c = new Client(cfg); await c.connect();

  // Idempotent: if 'clerk' identifier already exists, do nothing.
  const exists = await c.query("SELECT identifier, provider_type, issuer, discovery_url, enabled FROM auth.custom_oauth_providers WHERE identifier = $1", ["clerk"]);
  if (exists.rows.length > 0) {
    console.log("Clerk provider already registered:");
    console.log(JSON.stringify(exists.rows[0], null, 2));
  } else {
    const sql = `
      INSERT INTO auth.custom_oauth_providers (
        provider_type, identifier, name,
        client_id, client_secret,
        issuer, discovery_url,
        authorization_url, token_url, userinfo_url, jwks_uri,
        enabled, email_optional, pkce_enabled, skip_nonce_check,
        attribute_mapping, custom_claims_allowlist
      ) VALUES (
        'oidc', 'clerk', 'Clerk',
        'clerk', 'placeholder-secret-not-used-for-jwt-validation',
        $1, $2,
        $3, $4, $5, $6,
        true, false, true, true,
        '{"id":"sub","email":"email","name":"name","picture":"picture"}'::jsonb,
        ARRAY['sub','email','role']
      )
    `;
    const authUrl   = `${ISSUER}/oauth/authorize`;
    const tokenUrl  = `${ISSUER}/oauth/token`;
    const userInfo  = `${ISSUER}/oauth/userinfo`;
    const jwksUri   = `${ISSUER}/.well-known/jwks.json`;
    await c.query(sql, [ISSUER, DISCOVERY, authUrl, tokenUrl, userInfo, jwksUri]);
    console.log("Inserted Clerk provider row.");
  }

  const verify = await c.query("SELECT identifier, provider_type, name, issuer, discovery_url, enabled, skip_nonce_check FROM auth.custom_oauth_providers WHERE identifier = 'clerk'");
  console.log("Current Clerk provider row:");
  console.log(JSON.stringify(verify.rows[0], null, 2));
  await c.end();
})().catch(e => { console.error("Failed:", e.message); process.exit(1); });
