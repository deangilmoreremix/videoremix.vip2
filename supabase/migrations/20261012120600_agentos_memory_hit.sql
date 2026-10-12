-- AgentOS: memory usage counter.
--
-- The runtime calls this when a memory contributed to an execution, so recency
-- ranking improves over time. It is SECURITY DEFINER and guarded by the same
-- owner predicate as every other AgentOS read, so a caller can only bump their
-- own memories.

BEGIN;

CREATE OR REPLACE FUNCTION agentos.increment_memory_hit(p_memory_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner text;
  v_actor text := agentos.current_clerk_id();
BEGIN
  SELECT owner_clerk_id INTO v_owner FROM agentos.memories WHERE id = p_memory_id;
  IF v_owner IS NULL THEN
    RETURN;
  END IF;

  IF v_actor IS NOT NULL AND v_owner <> v_actor THEN
    RAISE EXCEPTION 'agentos.increment_memory_hit: not the owner of this memory'
      USING ERRCODE = '42501';
  END IF;

  UPDATE agentos.memories
    SET hit_count = hit_count + 1,
        last_used_at = now(),
        updated_at = now()
    WHERE id = p_memory_id;
END;
$$;

GRANT EXECUTE ON FUNCTION agentos.increment_memory_hit(uuid) TO authenticated;

COMMIT;
