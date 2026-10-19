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
--   ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public';
--   NOTIFY pgrst, 'reload config';
--
-- ORDERING NOTE
--   `agentos` is appended LAST on purpose. PostgREST resolves an unqualified
--   table name against the first exposed schema that has it, so `public` must
--   stay first — otherwise the AgentOS `tasks` / `workspaces` tables would
--   shadow the app's own same-named public tables.

BEGIN;

DO $$
DECLARE
  existing_config text;
  current_list text := '';
  updated_list text;
BEGIN
  -- Read the role-level PostgREST setting, if the platform already set one.
  SELECT string_agg(value, ', ')
    INTO existing_config
  FROM pg_db_role_setting s
  JOIN pg_roles r ON r.oid = s.setrole
  CROSS JOIN LATERAL unnest(s.setconfig) AS value
  WHERE r.rolname = 'authenticator'
    AND value LIKE 'pgrst.db_schemas=%';

  IF existing_config IS NOT NULL THEN
    current_list := substring(existing_config FROM 'pgrst\.db_schemas=(.*)$');
  END IF;

  IF current_list = '' THEN
    -- No role-level setting yet: use the project's known exposed schemas.
    updated_list := 'public, graphql_public, agentos';
  ELSIF current_list ~ '(^|[[:space:],])agentos([[:space:],]|$)' THEN
    updated_list := current_list;
  ELSE
    updated_list := current_list || ', agentos';
  END IF;

  EXECUTE format('ALTER ROLE authenticator SET pgrst.db_schemas = %L', updated_list);
END $$;

-- Ask PostgREST to re-read its configuration. The notification is delivered
-- when this transaction commits.
NOTIFY pgrst, 'reload config';

COMMIT;

-- Report the effective value for the operator's log.
SELECT
  r.rolname AS role,
  unnest(s.setconfig) AS setting
FROM pg_db_role_setting s
JOIN pg_roles r ON r.oid = s.setrole
WHERE r.rolname = 'authenticator'
  AND unnest(s.setconfig) LIKE 'pgrst.db_schemas=%';
