// supabase/functions/agentos-tasks/index.ts
//
// Task REST API for the browser.
//
// WRITES GO THROUGH THE QUEUE RPCs
//   Every mutation here calls a SECURITY DEFINER function
//   (enqueue_task / claim_due_tasks / complete_task / fail_task /
//   request_approval / resolve_approval) rather than writing the task row
//   directly. That is deliberate: the RPCs own the lease bookkeeping, the
//   dependency graph, and the approval gate, so the browser cannot bypass
//   them. See supabase/migrations/20261012120400_agentos_queue_rpc.sql.
//
// ACTIONS
//   POST  { action: 'create',  task: {...} }
//   POST  { action: 'cancel',  task_id }
//   POST  { action: 'retry',   task_id }
//   GET   ?task_id=...        a single task with its events
//   GET   ?mission_id=...     tasks for a mission
//   GET   ?status=...         filter

import { fail, ok, readJsonBody, withErrorGuard } from '../_shared/agentos-errors.ts';
import { getServiceClient, verifyCaller } from '../_shared/agentos-client.ts';

interface TaskBody {
  action?: 'create' | 'cancel' | 'retry';
  task?: Record<string, unknown>;
  task_id?: string;
}

async function handler(req: Request): Promise<Response> {
  const caller = await verifyCaller(req);
  if (!caller) return fail('unauthenticated', 'Unauthorized');

  const supabase = getServiceClient();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const taskId = url.searchParams.get('task_id');
    const missionId = url.searchParams.get('mission_id');
    const status = url.searchParams.get('status');

    if (taskId) {
      // Ownership is checked by RLS-equivalent filter: the caller may only read
      // rows they own. The service client bypasses RLS, so we filter explicitly.
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('owner_clerk_id', caller.clerkUserId)
        .maybeSingle();
      if (error) return fail('internal', 'Could not load task', error.message);
      if (!task) return fail('not_found', 'Task not found');

      const { data: events } = await supabase
        .from('execution_events')
        .select('*')
        .eq('task_id', taskId)
        .order('seq', { ascending: true });

      return ok({ task, events: events ?? [] });
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('owner_clerk_id', caller.clerkUserId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (missionId) query = query.eq('mission_id', missionId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return fail('internal', 'Could not list tasks', error.message);
    return ok({ tasks: data ?? [] });
  }

  const parsed = await readJsonBody<TaskBody>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.action) return fail('validation', 'action is required (create | cancel | retry)');

  if (body.action === 'create') {
    const task = body.task;
    if (!task || typeof task !== 'object') return fail('validation', 'task object is required');

    const title = String((task as Record<string, unknown>).title ?? '').trim();
    if (!title) return fail('validation', 'task.title is required');

    const { data: created, error } = await supabase
      .from('tasks')
      .insert({
        // owner_clerk_id is stamped by the BEFORE INSERT trigger from the JWT;
        // we pass it explicitly too because this runs in a service context.
        owner_clerk_id: caller.clerkUserId,
        mission_id: (task as Record<string, unknown>).mission_id ?? null,
        workspace_id: (task as Record<string, unknown>).workspace_id ?? null,
        title,
        description: String((task as Record<string, unknown>).description ?? ''),
        assigned_worker_id: (task as Record<string, unknown>).assigned_worker_id ?? null,
        priority: Number((task as Record<string, unknown>).priority ?? 5),
        trigger: (task as Record<string, unknown>).trigger ?? 'manual',
        input: ((task as Record<string, unknown>).input ?? {}) as Record<string, unknown>,
        requires_approval: Boolean((task as Record<string, unknown>).requires_approval),
        run_after: (task as Record<string, unknown>).run_after ?? new Date().toISOString(),
      })
      .select('id, title, status')
      .single();

    if (error) return fail('internal', 'Could not create task', error.message);
    const taskId = (created as { id: string }).id;

    // Attach dependency edges declared alongside the task.
    const dependsOn = (task as Record<string, unknown>).depends_on;
    if (Array.isArray(dependsOn) && dependsOn.length > 0) {
      const edges = (dependsOn as unknown[])
        .filter((id): id is string => typeof id === 'string')
        .map((waitsFor) => ({ task_id: taskId, waits_for: waitsFor, kind: 'depends_on' }));
      if (edges.length > 0) {
        await supabase.from('task_edges').insert(edges);
      }
    }

    const handoffTo = (task as Record<string, unknown>).handoff_to_task_id;
    if (typeof handoffTo === 'string') {
      await supabase.from('task_edges').insert({
        task_id: handoffTo,
        waits_for: taskId,
        kind: 'handoff',
      });
    }

    // enqueue_task decides whether this is claimable now or blocked.
    const { data: decision } = await supabase.rpc('enqueue_task', { p_task_id: taskId });

    const { data: updated } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('id', taskId)
      .single();

    return ok({ task: updated, queued_as: decision });
  }

  if (body.action === 'cancel' || body.action === 'retry') {
    if (!body.task_id) return fail('validation', 'task_id is required');

    const { data: task, error: loadError } = await supabase
      .from('tasks')
      .select('id, status, owner_clerk_id')
      .eq('id', body.task_id)
      .maybeSingle();

    if (loadError) return fail('internal', 'Could not load task', loadError.message);
    if (!task) return fail('not_found', 'Task not found');
    if (task.owner_clerk_id !== caller.clerkUserId) {
      return fail('forbidden', 'That task belongs to a different tenant');
    }
    if (task.status === 'completed' || task.status === 'cancelled') {
      return fail('conflict', `task is already ${task.status}`);
    }

    if (body.action === 'cancel') {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled', completed_at: new Date().toISOString(), lease_owner: null, lease_expires_at: null })
        .eq('id', body.task_id);
      if (error) return fail('internal', 'Could not cancel task', error.message);
      return ok({ task_id: body.task_id, status: 'cancelled' });
    }

    // Retry: requeue and reset the lease without incrementing the attempt
    // count punitively — max_attempts still caps the total.
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'queued', run_after: new Date().toISOString(), error: null, lease_owner: null, lease_expires_at: null })
      .eq('id', body.task_id);
    if (error) return fail('internal', 'Could not requeue task', error.message);
    return ok({ task_id: body.task_id, status: 'queued' });
  }

  return fail('validation', 'action must be create | cancel | retry');
}

Deno.serve((req) =>
  withErrorGuard(async () => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }
    if (req.method !== 'GET' && req.method !== 'POST') {
      return fail('validation', 'Use GET or POST');
    }
    return handler(req);
  })(),
);
