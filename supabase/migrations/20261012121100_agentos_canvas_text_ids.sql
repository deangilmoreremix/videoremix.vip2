-- 20261012121100_agentos_canvas_text_ids.sql
--
-- The canvas stores its nodes under a STABLE KEY, not a surrogate uuid: the
-- browser builds ids like `worker:<uuid>`, `mission:<uuid>`,
-- `model:<uuid>`, `runtime:<uuid>`, and an edge id like
-- `edge:worker:<uuid>->mission:<uuid>`.
--
-- The table was declared with `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`,
-- so every canvas write failed:
--   * `saveCanvasNode` upserted 'worker:<uuid>' -> invalid input syntax for
--     type uuid (PGRST201);
--   * `saveCanvasEdge` wrote 'edge:worker:...' -> the same, and even when it
--     parsed, source_node_id / target_node_id could not resolve to a
--     canvas_nodes row.
-- The canvas was therefore never persisted: the layout was re-derived on every
-- load and a drag was lost on refresh.
--
-- The id columns become text, which is what the application has always
-- written. `ref_id` stays uuid: it holds the real worker / mission / run id.
--
-- No data is lost: the columns only ever held values that could not be
-- inserted in the first place, and any row that does exist is converted with
-- a plain ::text cast.

BEGIN;

-- Drop the edge -> node foreign keys first: the referenced column type
-- changes underneath them.
ALTER TABLE agentos.canvas_edges
  DROP CONSTRAINT IF EXISTS canvas_edges_source_node_id_fkey;
ALTER TABLE agentos.canvas_edges
  DROP CONSTRAINT IF EXISTS canvas_edges_target_node_id_fkey;

-- The nodes.
ALTER TABLE agentos.canvas_nodes
  ALTER COLUMN id TYPE text USING id::text;

-- The edges: their own id, and the two endpoints.
ALTER TABLE agentos.canvas_edges
  ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE agentos.canvas_edges
  ALTER COLUMN source_node_id TYPE text USING source_node_id::text;
ALTER TABLE agentos.canvas_edges
  ALTER COLUMN target_node_id TYPE text USING target_node_id::text;

-- Re-create the foreign keys, now text -> text.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'canvas_edges_source_node_id_fkey'
      AND conrelid = 'agentos.canvas_edges'::regclass
  ) THEN
    ALTER TABLE agentos.canvas_edges
      ADD CONSTRAINT canvas_edges_source_node_id_fkey
      FOREIGN KEY (source_node_id) REFERENCES agentos.canvas_nodes (id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'canvas_edges_target_node_id_fkey'
      AND conrelid = 'agentos.canvas_edges'::regclass
  ) THEN
    ALTER TABLE agentos.canvas_edges
      ADD CONSTRAINT canvas_edges_target_node_id_fkey
      FOREIGN KEY (target_node_id) REFERENCES agentos.canvas_nodes (id) ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON COLUMN agentos.canvas_nodes.id IS
  'Stable canvas key, e.g. worker:<uuid>. The referenced entity is in ref_id.';
COMMENT ON COLUMN agentos.canvas_edges.id IS
  'Stable canvas key, e.g. edge:worker:<uuid>->mission:<uuid>.';

COMMIT;
