const { Client } = require("pg");
const cfg = { host: "db.bzxohkrxcwodllketcpz.supabase.co", port: 5432, database: "postgres", user: "postgres", password: "ParkerDean1980!", ssl: { rejectUnauthorized: false } };
const DEV_HOST = "quick-cheetah-70.clerk.accounts.dev";
const ISSUER = `https://${DEV_HOST}`;
const DISCOVERY = `${ISSUER}/.well-known/openid-configuration`;
(async () => {
  const c = new Client(cfg); await c.connect();
  const exists = await c.query("SELECT identifier FROM auth.custom_oauth_providers WHERE identifier='clerk-dev'");
  if (exists.rows.length) {
    console.log("clerk-dev already registered.");
  } else {
    const authUrl = `${ISSUER}/oauth/authorize`;
    const tokenUrl = `${ISSUER}/oauth/token`;
    const userInfo = `${ISSUER}/oauth/userinfo`;
    const jwks = `${ISSUER}/.well-known/jwks.json`;
    await c.query(`INSERT INTO auth.custom_oauth_providers
      (provider_type, identifier, name, client_id, client_secret,
       issuer, discovery_url, authorization_url, token_url, userinfo_url, jwks_uri,
       enabled, email_optional, pkce_enabled, skip_nonce_check,
       attribute_mapping, custom_claims_allowlist)
      VALUES ('oidc','clerk-dev','Clerk (dev)','clerk-dev','placeholder',
              $1,$2,$3,$4,$5,$6,true,false,true,true,
              '{"id":"sub","email":"email","name":"name","picture":"picture"}'::jsonb,
              ARRAY['sub','email','role'])`,
      [ISSUER, DISCOVERY, authUrl, tokenUrl, userInfo, jwks]);
    console.log("Inserted clerk-dev OIDC provider.");
  }
  const verify = await c.query("SELECT identifier, provider_type, name, issuer FROM auth.custom_oauth_providers ORDER BY identifier");
  console.log("All OIDC providers:", verify.rows);
  await c.end();
})().catch(e=>{console.error(e);process.exit(1);});
