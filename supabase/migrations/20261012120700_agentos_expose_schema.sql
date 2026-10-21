-- 20261012120700_agentos_expose_schema.sql
--
-- Expose the `agentos` schema to PostgREST.
--
-- WHY
--   The AgentOS port puts every table, function and RPC in a dedicated
--   `agentos` schema so it never collides with the app's existing `public`
--   tables (`public.tasks`, `public.workspaces`, `public.conversations`,
--   `public.messages` and `public.notifications` all pre-date the port and
--   still exist).
--
--   PostgREST only serves the schemas a project exposes. This project exposes
--   `public, graphql_public` — verified live: an AgentOS request came back
--   with PGRST106 "Invalid schema: agentos. Only the following schemas are
--   exposed: public, graphql_public", and the live schema cache held 280
--   public definitions and zero agentos ones.
--
--   The application now pins every AgentOS query to the `agentos` schema
--   (supabase-js sends it as the Accept-Profile / Content-Profile header), so
--   exposing the schema is the only remaining step. Nothing else changes:
--   the RLS policies, grants and RPCs are already schema-qualified.
--
-- WHAT ACTUALLY WORKS ON A SUPABASE PROJECT
--   Two settings decide what PostgREST serves, and a project has BOTH:
--
--     * `pgrst.db_schemas` — the modern (plural) list. This is the one the
--       platform's "Exposed schemas" setting writes.
--     * `pgrst.db_schema`  — the legacy (singular) list, which this project
--       also carries: `public, bba` (the `bba` schema belongs to another
--       feature and must stay reachable).
--
--   Setting only the plural one is NOT enough: the profile is then accepted
--   (PGRST106 becomes PGRST205) but the table lookup still fails, because the
--   search path comes from the singular key.
--
--   And a config reload is not a schema-cache reload. PostgREST v12+ answers
--   `NOTIFY pgrst, 'reload config'` by re-reading its configuration, and
--   `NOTIFY pgrst, 'reload schema'` by re-reading the schema cache. Without
--   the second notification the new schema's tables stay invisible: the
--   request comes back PGRST205 "Could not find the table 'agentos.workers'".
--
--   So this migration sets both keys (appending `agentos` to whatever each
--   already holds, so nothing else is lost) and sends both notifications.
--
-- HOW TO APPLY
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/migrations/20261012120700_agentos_expose_schema.sql
--
--   PLATFORM ALTERNATIVE (equivalent, and the supported UI path):
--   Dashboard -> Settings -> API -> Exposed schemas -> add `agentos`.
--
--   VERIFY AFTER APPLYING:
--   scripts/agentos-verify-exposure.sh
--
-- ROLLBACK
--   ALTER ROLE authenticator RESET pgrst.db_schemas;
--   ALTER ROLE authenticator RESET pgrst.db_schema;
--   NOTIFY pgrst, 'reload config';
--   NOTIFY pgrst, 'reload schema';
--
-- ORDERING NOTE
--   `agentos` is appended LAST on purpose. PostgREST resolves an unqualified
--   table name against the first exposed schema that has it, so `public` must
--   stay first — otherwise the AgentOS `tasks` / `workspaces` tables would
--   shadow the app's own same-named public tables.

BEGIN;

DO $$
DECLARE
  existing_schemas text;
  existing_schema text;
  updated_schemas text;
  updated_schema text;
BEGIN
  -- The `authenticator` role exists on every Supabase project. It does not
  -- exist on a bare Postgres (a local scratch cluster, for instance), and
  -- ALTER ROLE on a missing role would abort the whole migration, so the
  -- exposure step is skipped there and left to the operator.
  IF to_regrole('authenticator') IS NULL THEN
    RAISE NOTICE 'agentos: role "authenticator" not found; skipping the PostgREST exposure step.';
    RETURN;
  END IF;

  -- Read the role-level settings the platform already set, so the schemas
  -- this project already serves are preserved.
  SELECT
    max(value) FILTER (WHERE value LIKE 'pgrst.db_schemas=%'),
    max(value) FILTER (WHERE value LIKE 'pgrst.db_schema=%')
  INTO existing_schemas, existing_schema
  FROM pg_db_role_setting s
  JOIN pg_roles r ON r.oid = s.setrole
  CROSS JOIN LATERAL unnest(s.setconfig) AS value
  WHERE r.rolname = 'authenticator';

  -- split_part, not substring: `substring(x from 'pattern')` returns the first
  -- CAPTURE GROUP, and NULL when the pattern does not match — so a project
  -- with no such setting produced NULL here, and the ALTER ROLE below was
  -- then issued with a NULL value. The value after the first '=' is what is
  -- wanted.
  existing_schemas := split_part(COALESCE(existing_schemas, ''), '=', 2);
  existing_schema := split_part(COALESCE(existing_schema, ''), '=', 2);

  -- `ALTER ROLE ... SET x = NULL` is stored as the literal text 'NULL'.
  IF existing_schemas IS NULL OR btrim(existing_schemas) = '' OR upper(btrim(existing_schemas)) = 'NULL' THEN
    existing_schemas := '';
  END IF;
  IF existing_schema IS NULL OR btrim(existing_schema) = '' OR upper(btrim(existing_schema)) = 'NULL' THEN
    existing_schema := '';
  END IF;

  -- Append `agentos` to each list, if it is not there already.
  IF existing_schemas = '' THEN
    updated_schemas := 'public, graphql_public, agentos';
  ELSIF existing_schemas ~ '(^|[[:space:],])agentos([[:space:],]|$)' THEN
    updated_schemas := existing_schemas;
  ELSE
    updated_schemas := existing_schemas || ', agentos';
  END IF;

  IF existing_schema = '' THEN
    updated_schema := 'public, graphql_public, agentos';
  ELSIF existing_schema ~ '(^|[[:space:],])agentos([[:space:],]|$)' THEN
    updated_schema := existing_schema;
  ELSE
    updated_schema := existing_schema || ', agentos';
  END IF;

  EXECUTE format('ALTER ROLE authenticator SET pgrst.db_schemas = %L', updated_schemas);
  EXECUTE format('ALTER ROLE authenticator SET pgrst.db_schema = %L', updated_schema);
END $$;

-- Reload the configuration AND the schema cache. The notifications are
-- delivered when this transaction commits.
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Report the effective values for the operator's log.
SELECT
  r.rolname AS role,
  cfg.setting
FROM pg_db_role_setting s
JOIN pg_roles r ON r.oid = s.setrole
CROSS JOIN LATERAL unnest(s.setconfig) AS cfg(setting)
WHERE r.rolname = 'authenticator'
  AND cfg.setting LIKE 'pgrst.%'
ORDER BY cfg.setting;
