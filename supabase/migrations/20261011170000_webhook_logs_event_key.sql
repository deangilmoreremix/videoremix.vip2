-- webhook_logs event key: atomic webhook idempotency
--
-- CONTEXT (Subagent 2's request, adapted to the ACTUAL schema)
--   The requested index was `webhook_logs_provider_event_key ON webhook_logs
--   (provider, event_id)`. Verified against this repo's DDL
--   (20251003151741_create_purchase_management_system.sql and
--   supabase_schema.sql), `webhook_logs` has NO `provider` column - the
--   provider column IS `platform` (CHECK platform IN
--   ('paykickstart','stripe','zaxxa')) - and NO `event_id` column. The table
--   is (id, platform, event_type, webhook_payload, processing_status,
--   error_message, retry_count, processed_at, created_at).
--
--   This migration therefore:
--     1. adds the missing `event_id` column,
--     2. backfills it from the event identifiers already stored inside
--        webhook_payload (the same fields _shared/webhookGuard.ts extracts:
--        event_id / eventId / transaction_id / order_id / id, including the
--        nested `data.*` variants) - a log-parsing operation, NOT a money
--        decision,
--     3. de-duplicates so the unique index can be created (for any duplicated
--        (platform, event_id) pair the EARLIEST row by id keeps the key; later
--        rows - historical processing artifacts - keep NULL and stay inert,
--        because NULLs are distinct in a Postgres unique index),
--     4. creates the unique index under the requested name
--        webhook_logs_provider_event_key ON webhook_logs (platform, event_id).
--
--   With this index in place, the insert-or-detect claim in
--   webhookGuard.claimWebhookEvent() becomes atomic: a concurrent duplicate
--   delivery hits Postgres error 23505 instead of both insert branches
--   succeeding.
--
--   Grants are ADDITIONALLY protected by the purchases table's
--   UNIQUE (platform, platform_transaction_id) constraint: even if the
--   webhook_logs claim raced, _shared/purchaseProcessor.ts re-checks for an
--   existing purchase before granting, so entitlements cannot be double-granted.
--
-- DEPLOY ORDER: any time; independent of the credit/identity migrations.
-- Handlers that want to rely on atomic claiming must populate `event_id` at
-- insert time (the webhook_logs insert in webhookGuard.claimWebhookEvent is
-- owned by Subagent 2's module; this migration only provides the constraint).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS, backfill only touches NULL rows,
-- dedupe is stable, CREATE UNIQUE INDEX IF NOT EXISTS. Safe to re-run.

BEGIN;

ALTER TABLE public.webhook_logs
  ADD COLUMN IF NOT EXISTS event_id text;

-- Backfill event ids already present inside the stored payloads.
UPDATE public.webhook_logs
SET event_id = NULLIF(
  COALESCE(
    webhook_payload->>'event_id',
    webhook_payload->>'eventId',
    webhook_payload->>'transaction_id',
    webhook_payload->>'order_id',
    webhook_payload->>'id',
    webhook_payload->'data'->>'event_id',
    webhook_payload->'data'->>'eventId',
    webhook_payload->'data'->>'transaction_id',
    webhook_payload->'data'->>'order_id',
    webhook_payload->'data'->>'id'
  ),
  ''
)
WHERE event_id IS NULL;

-- Keep only the earliest row per (platform, event_id); NULL out the rest so
-- the unique index can be created on legacy data with duplicate deliveries.
UPDATE public.webhook_logs w
SET event_id = NULL
WHERE w.event_id IS NOT NULL
  AND w.id <> (
    SELECT min(w2.id)
    FROM public.webhook_logs w2
    WHERE w2.platform = w.platform
      AND w2.event_id = w.event_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS webhook_logs_provider_event_key
  ON public.webhook_logs (platform, event_id);

COMMENT ON INDEX public.webhook_logs_provider_event_key IS
  'Atomic webhook idempotency key (provider = platform column + parsed event id). Grant double-spend is additionally prevented by purchases UNIQUE (platform, platform_transaction_id).';

COMMIT;
