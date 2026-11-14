-- AgentOS: the user's own provider key, for agents that run while they are away
--
-- WHY
--   Users run the apps with their own OpenAI key. In the browser it is kept on
--   the device (src/lib/userApiKeys.ts). An agent, though, runs on the server —
--   from a schedule, a mission or the queue — with no browser open, so it
--   needs the owner's key server-side. The owner opts in ("Let my agents use
--   this key"); the key is stored encrypted in Supabase Vault and used only to
--   authenticate that owner's agent runs and the apps those agents call.
--
--   The earlier "bring your own key" path only minted a credential_ref and
--   stored the key nowhere, so agents quietly ran on the platform key.
--
-- SECURITY
--   * The key itself lives only in the vault. agentos.user_provider_keys holds
--     the vault secret id and a short hint (the last four characters) so the
--     owner can see which key is saved.
--   * store/read/delete are SECURITY DEFINER and executable by service_role
--     only: the agentos-user-keys edge function writes on behalf of the
--     verified caller, and the executor reads at run time. No client role can
--     call them, and the plaintext is never selectable through PostgREST.
--   * An owner can read only their own hint row (RLS on current_clerk_id()).

CREATE TABLE IF NOT EXISTS agentos.user_provider_keys (
  owner_clerk_id text NOT NULL,
  provider       text NOT NULL CHECK (provider IN ('openai', 'xai')),
  secret_id      uuid NOT NULL,
  key_hint       text NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_clerk_id, provider)
);

ALTER TABLE agentos.user_provider_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_provider_keys_owner_read ON agentos.user_provider_keys;
CREATE POLICY user_provider_keys_owner_read ON agentos.user_provider_keys
  FOR SELECT TO authenticated
  USING (owner_clerk_id = agentos.current_clerk_id());

REVOKE ALL ON agentos.user_provider_keys FROM PUBLIC, anon, authenticated;
-- The secret id is not useful to a client; only the hint is exposed.
GRANT SELECT (owner_clerk_id, provider, key_hint, updated_at) ON agentos.user_provider_keys TO authenticated;
GRANT ALL ON agentos.user_provider_keys TO service_role;

CREATE OR REPLACE FUNCTION agentos.user_key_secret_name(p_owner text, p_provider text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$ SELECT 'agentos_user_key:' || p_owner || ':' || p_provider $$;

CREATE OR REPLACE FUNCTION agentos.store_user_key(p_owner text, p_provider text, p_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_key  text := btrim(COALESCE(p_key, ''));
  v_name text;
  v_id   uuid;
  v_hint text;
BEGIN
  IF p_owner IS NULL OR btrim(p_owner) = '' THEN
    RAISE EXCEPTION 'owner is required';
  END IF;
  IF p_provider NOT IN ('openai', 'xai') THEN
    RAISE EXCEPTION 'unsupported provider %', p_provider;
  END IF;
  IF length(v_key) < 20 THEN
    RAISE EXCEPTION 'that does not look like an API key';
  END IF;

  v_name := agentos.user_key_secret_name(p_owner, p_provider);
  v_hint := '…' || right(v_key, 4);

  SELECT secret_id INTO v_id
    FROM agentos.user_provider_keys
   WHERE owner_clerk_id = p_owner AND provider = p_provider;

  IF v_id IS NULL THEN
    v_id := vault.create_secret(v_key, v_name, 'AgentOS: an owner''s own provider key');
  ELSE
    PERFORM vault.update_secret(v_id, v_key, v_name, 'AgentOS: an owner''s own provider key');
  END IF;

  INSERT INTO agentos.user_provider_keys (owner_clerk_id, provider, secret_id, key_hint, updated_at)
  VALUES (p_owner, p_provider, v_id, v_hint, now())
  ON CONFLICT (owner_clerk_id, provider)
  DO UPDATE SET secret_id = EXCLUDED.secret_id, key_hint = EXCLUDED.key_hint, updated_at = now();

  RETURN v_hint;
END;
$$;

CREATE OR REPLACE FUNCTION agentos.read_user_key(p_owner text, p_provider text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$ SELECT agentos.vault_secret(agentos.user_key_secret_name(p_owner, p_provider)) $$;

CREATE OR REPLACE FUNCTION agentos.delete_user_key(p_owner text, p_provider text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_id uuid;
BEGIN
  DELETE FROM agentos.user_provider_keys
   WHERE owner_clerk_id = p_owner AND provider = p_provider
  RETURNING secret_id INTO v_id;

  IF v_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION agentos.store_user_key(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.read_user_key(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION agentos.delete_user_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION agentos.store_user_key(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.read_user_key(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION agentos.delete_user_key(text, text) TO service_role;
