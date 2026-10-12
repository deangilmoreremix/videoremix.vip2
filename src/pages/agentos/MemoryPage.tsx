// src/pages/agentos/MemoryPage.tsx
//
// Memory: worker-scoped and workspace-scoped durable context, with search and
// editing.
//
// The ranking shown here is a UI preview. The runtime performs the real
// retrieval when a task executes (worker identity + task + top-K memories,
// ranked by importance × recency, keyword when pgvector is absent).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { BrainCircuit, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { AsyncBoundary } from "../../components/agentos/shared";
import { EmptyState, PageHeader, Pill, Section } from "../../components/agentos/ui";
import { Modal } from "../../components/agentos/ui/Modal";
import { createMemory, deleteMemory, listMemories, searchMemories, updateMemory } from "../../services/agentos/memory";
import { listWorkers } from "../../services/agentos/workers";
import { listWorkspaces } from "../../services/agentos/workspaces";
import type { MemoryKind, WorkerMemory, Worker, Workspace } from "../../types/agentos";

const KINDS: MemoryKind[] = ["fact", "preference", "note", "knowledge", "file", "summary"];

const IMPORTANCE_LABEL = ["", "lowest", "low", "normal", "high", "critical"];

const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<WorkerMemory[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "worker" | "workspace">("all");
  const [searching, setSearching] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [draftKind, setDraftKind] = useState<MemoryKind>("note");
  const [draftScope, setDraftScope] = useState<"worker" | "workspace">("worker");
  const [draftWorkerId, setDraftWorkerId] = useState("");
  const [draftWorkspaceId, setDraftWorkspaceId] = useState("");
  const [draftImportance, setDraftImportance] = useState(3);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [editing, setEditing] = useState<WorkerMemory | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImportance, setEditImportance] = useState(3);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [memoriesResult, workersResult, workspacesResult] = await Promise.all([
        listMemories({ limit: 200 }),
        listWorkers(),
        listWorkspaces(),
      ]);
      if (cancelled) return;
      setMemories(memoriesResult.data ?? []);
      setWorkers(workersResult.data ?? []);
      setWorkspaces(workspacesResult.data ?? []);
      setError(memoriesResult.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const workerNameById = useMemo(
    () => new Map(workers.map((worker) => [worker.id, worker.name])),
    [workers],
  );
  const workspaceNameById = useMemo(
    () => new Map(workspaces.map((workspace) => [workspace.id, workspace.name])),
    [workspaces],
  );

  const scopeLabel = useCallback(
    (memory: WorkerMemory) => {
      if (memory.scope === "worker" && memory.worker_id) {
        return workerNameById.get(memory.worker_id) ?? "unknown worker";
      }
      if (memory.scope === "workspace" && memory.workspace_id) {
        return workspaceNameById.get(memory.workspace_id) ?? "unknown workspace";
      }
      return "orphaned";
    },
    [workerNameById, workspaceNameById],
  );

  const runSearch = useCallback(async () => {
    setSearching(true);
    const result = await searchMemories({
      query,
      limit: 50,
      importanceMin: 1,
    });
    if (result.error) {
      setError(result.error.message);
    } else {
      setError(null);
      setMemories((result.data ?? []) as WorkerMemory[]);
    }
    setSearching(false);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    reload();
  }, [reload]);

  const submitCreate = useCallback(async () => {
    if (!draftContent.trim()) {
      setDialogError("Add the content of this memory");
      return;
    }
    if (draftScope === "worker" && !draftWorkerId) {
      setDialogError("Choose a worker for worker-scoped memory");
      return;
    }
    if (draftScope === "workspace" && !draftWorkspaceId) {
      setDialogError("Choose a workspace for workspace-scoped memory");
      return;
    }

    setSaving(true);
    setDialogError(null);
    const result = await createMemory({
      content: draftContent,
      kind: draftKind,
      scope: draftScope,
      worker_id: draftScope === "worker" ? draftWorkerId : undefined,
      workspace_id: draftScope === "workspace" ? draftWorkspaceId : undefined,
      importance: draftImportance,
    });
    setSaving(false);
    if (result.error) {
      setDialogError(result.error.message);
      return;
    }
    setDialogOpen(false);
    setDraftContent("");
    setDraftImportance(3);
    reload();
  }, [draftContent, draftKind, draftScope, draftWorkerId, draftWorkspaceId, draftImportance, reload]);

  const submitEdit = useCallback(async () => {
    if (!editing) return;
    const result = await updateMemory(editing.id, {
      content: editContent,
      importance: editImportance,
    });
    if (result.error) {
      setDialogError(result.error.message);
      return;
    }
    setEditing(null);
    reload();
  }, [editing, editContent, editImportance, reload]);

  const remove = useCallback(
    async (memoryId: string) => {
      await deleteMemory(memoryId);
      reload();
    },
    [reload],
  );

  const visible = useMemo(
    () => (scope === "all" ? memories : memories.filter((memory) => memory.scope === scope)),
    [memories, scope],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm text-white/40">Loading memory…</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Memory — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <PageHeader
          title="Memory"
          description="Durable context attached to a worker or a workspace. Retrieved at execution time."
          actions={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Add memory
            </Button>
          }
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void runSearch();
              }}
              placeholder="Search memory"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-violet-400/40 focus:outline-none"
            />
          </div>
          <Button variant="outline" size="sm" disabled={searching || !query.trim()} onClick={() => void runSearch()}>
            {searching ? "Searching…" : "Search"}
          </Button>
          {query ? (
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              Clear
            </Button>
          ) : null}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            {(["all", "worker", "workspace"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScope(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                  scope === option ? "bg-violet-500/20 text-violet-200" : "text-white/50 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <AsyncBoundary
          loading={false}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          empty={
            <EmptyState
              icon={BrainCircuit}
              title={query ? "No memories match that search" : "No memory yet"}
              description={
                query
                  ? "Try different words."
                  : "Add a fact, a preference, or a knowledge note and it will be available to the worker it belongs to."
              }
              action={
                query ? null : (
                  <Button size="sm" onClick={() => setDialogOpen(true)}>
                    Add memory
                  </Button>
                )
              }
            />
          }
        >
          <div className="space-y-3">
            {visible.map((memory) => (
              <Section key={memory.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="sky">{memory.kind}</Pill>
                      <Pill tone={memory.scope === "worker" ? "violet" : "emerald"}>
                        {memory.scope}: {scopeLabel(memory)}
                      </Pill>
                      <Pill tone="slate">{IMPORTANCE_LABEL[memory.importance]} importance</Pill>
                      {memory.hit_count > 0 ? (
                        <Pill tone="slate">used {memory.hit_count}×</Pill>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">
                      {memory.content}
                    </p>
                    <p className="mt-1.5 text-[11px] text-white/30">
                      added {new Date(memory.created_at).toLocaleString()} · source {memory.source}
                      {(memory.tags ?? []).length > 0 ? ` · ${memory.tags.join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(memory);
                        setEditContent(memory.content);
                        setEditImportance(memory.importance);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => void remove(memory.id)}
                      aria-label="Delete memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </AsyncBoundary>
      </div>

      <Modal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Add memory"
        description="Worker memory follows that worker everywhere. Workspace memory is shared with the team."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving} onClick={() => void submitCreate()}>
              {saving ? "Saving…" : "Save memory"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50" htmlFor="mem-scope">
              Scope
            </label>
            <select
              id="mem-scope"
              value={draftScope}
              onChange={(event) => setDraftScope(event.target.value as "worker" | "workspace")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="worker">Worker</option>
              <option value="workspace">Workspace</option>
            </select>
          </div>

          {draftScope === "worker" ? (
            <div>
              <label className="text-xs text-white/50" htmlFor="mem-worker">
                Worker
              </label>
              <select
                id="mem-worker"
                value={draftWorkerId}
                onChange={(event) => setDraftWorkerId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="">Choose a worker…</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-white/50" htmlFor="mem-workspace">
                Workspace
              </label>
              <select
                id="mem-workspace"
                value={draftWorkspaceId}
                onChange={(event) => setDraftWorkspaceId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="">Choose a workspace…</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-white/50" htmlFor="mem-kind">
              Kind
            </label>
            <select
              id="mem-kind"
              value={draftKind}
              onChange={(event) => setDraftKind(event.target.value as MemoryKind)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/50" htmlFor="mem-content">
              Content
            </label>
            <Textarea
              id="mem-content"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              rows={4}
              placeholder="Prefers plain language, no jargon."
            />
          </div>

          <div>
            <label className="text-xs text-white/50" htmlFor="mem-importance">
              Importance ({IMPORTANCE_LABEL[draftImportance]})
            </label>
            <input
              id="mem-importance"
              type="range"
              min={1}
              max={5}
              step={1}
              value={draftImportance}
              onChange={(event) => setDraftImportance(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>

          {dialogError ? <p className="text-sm text-rose-300">{dialogError}</p> : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Edit memory"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void submitEdit()}>
              Save changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50" htmlFor="edit-content">
              Content
            </label>
            <Textarea
              id="edit-content"
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="edit-importance">
              Importance ({IMPORTANCE_LABEL[editImportance]})
            </label>
            <input
              id="edit-importance"
              type="range"
              min={1}
              max={5}
              step={1}
              value={editImportance}
              onChange={(event) => setEditImportance(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MemoryPage;
