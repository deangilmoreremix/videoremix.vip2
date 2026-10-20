// src/pages/agentos/MemoryPage.tsx
//
// Memory: worker-scoped and workspace-scoped durable context, with search and
// editing.
//
// The ranking shown here is a UI preview. The runtime performs the real
// retrieval when a task executes (worker identity + task + top-K memories,
// ranked by importance × recency, keyword when pgvector is absent).
//
// WHY THE SEARCH RESULT SET IS ITS OWN STATE
//   The list and the search results are two different sets of rows, and the
//   scope filter has to apply to both. Keeping them in one array meant the
//   "worker" tab could show workspace memories after a search, and the empty
//   state could not tell "you have no memory" from "your search matched
//   nothing" once the search box was edited. The applied query is tracked
//   separately from the text in the box, so the empty state always describes
//   the rows that are actually on screen.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { BrainCircuit, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  ConfirmDialog,
  EmptyState,
  FilterGroup,
  Modal,
  PageHeader,
  Pill,
  SearchInput,
  Section,
} from "../../components/agentos/ui";
import { absoluteTime, machineTime, relativeTime } from "../../components/agentos/format";
import { createMemory, deleteMemory, listMemories, searchMemories, updateMemory } from "../../services/agentos/memory";
import { listWorkers } from "../../services/agentos/workers";
import { listWorkspaces } from "../../services/agentos/workspaces";
import type { MemoryKind, WorkerMemory, Worker, Workspace } from "../../types/agentos";

const KINDS: MemoryKind[] = ["fact", "preference", "note", "knowledge", "file", "summary"];

const IMPORTANCE_LABEL = ["", "lowest", "low", "normal", "high", "critical"];

const SCOPES: Array<{ value: "all" | "worker" | "workspace"; label: string }> = [
  { value: "all", label: "All" },
  { value: "worker", label: "Worker" },
  { value: "workspace", label: "Workspace" },
];

const FIELD_CLASS =
  "mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50";

/**
 * Tags are stored as a text array. The form edits them as one comma-separated
 * line, because a chip editor for a field nobody uses is a chip editor nobody
 * fills in.
 */
function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<WorkerMemory[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkerMemory[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "worker" | "workspace">("all");
  const [searching, setSearching] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [draftKind, setDraftKind] = useState<MemoryKind>("note");
  const [draftScope, setDraftScope] = useState<"worker" | "workspace">("worker");
  const [draftWorkerId, setDraftWorkerId] = useState("");
  const [draftWorkspaceId, setDraftWorkspaceId] = useState("");
  const [draftImportance, setDraftImportance] = useState(3);
  const [draftTags, setDraftTags] = useState("");
  const [draftSource, setDraftSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [editing, setEditing] = useState<WorkerMemory | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImportance, setEditImportance] = useState(3);
  const [editKind, setEditKind] = useState<MemoryKind>("note");
  const [editTags, setEditTags] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<WorkerMemory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    const needle = query.trim();
    if (!needle) return;

    setSearching(true);
    setSearchError(null);
    const result = await searchMemories({
      query: needle,
      limit: 50,
      importanceMin: 1,
    });
    setSearching(false);

    if (result.error) {
      // The previous result set stays on screen; the failure is reported
      // next to the search box instead of replacing the whole page.
      setSearchError(result.error.message);
      return;
    }
    setAppliedQuery(needle);
    setSearchResults((result.data ?? []) as WorkerMemory[]);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setAppliedQuery("");
    setSearchResults(null);
    setSearchError(null);
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
      tags: splitTags(draftTags),
      source: draftSource.trim() || undefined,
    });
    setSaving(false);
    if (result.error) {
      setDialogError(result.error.message);
      return;
    }
    setDialogOpen(false);
    setDraftContent("");
    setDraftImportance(3);
    setDraftTags("");
    setDraftSource("");
    reload();
  }, [draftContent, draftKind, draftScope, draftWorkerId, draftWorkspaceId, draftImportance, draftTags, draftSource, reload]);

  const submitEdit = useCallback(async () => {
    if (!editing) return;
    if (!editContent.trim()) {
      setEditError("Memory content cannot be empty");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    const result = await updateMemory(editing.id, {
      content: editContent,
      importance: editImportance,
      kind: editKind,
      tags: splitTags(editTags),
      source: editSource.trim() || "manual",
    });
    setEditSaving(false);
    if (result.error) {
      setEditError(result.error.message);
      return;
    }
    setEditing(null);
    reload();
  }, [editing, editContent, editImportance, editKind, editTags, editSource, reload]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteMemory(pendingDelete.id);
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error.message);
      return;
    }
    setPendingDelete(null);
    reload();
  }, [pendingDelete, reload]);

  // The scope filter applies to the list and to the search results alike, so
  // the "worker" tab can never show a workspace memory.
  const visible = useMemo(() => {
    const source = searchResults ?? memories;
    if (scope === "all") return source;
    return source.filter((memory) => memory.scope === scope);
  }, [memories, searchResults, scope]);

  const hasSearch = appliedQuery.trim().length > 0;

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
          <SearchInput
            id="memory-search"
            label="Search memory"
            value={query}
            onChange={setQuery}
            onSubmit={() => void runSearch()}
            placeholder="Search memory"
            className="min-w-[240px] flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={searching || !query.trim()}
            onClick={() => void runSearch()}
          >
            {searching ? "Searching…" : "Search"}
          </Button>
          {query || hasSearch ? (
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              Clear
            </Button>
          ) : null}
          <FilterGroup
            label="Filter memory by scope"
            options={SCOPES}
            value={scope}
            onChange={setScope}
          />
        </div>

        {searchError ? (
          <p role="alert" className="mb-4 text-sm text-rose-300">
            Search failed: {searchError}
          </p>
        ) : null}

        {hasSearch ? (
          <p className="mb-4 text-xs text-white/40">
            {visible.length} memor{visible.length === 1 ? "y" : "ies"} match
            {scope === "all" ? "" : ` the ${scope} scope`} for “{appliedQuery}”.
          </p>
        ) : null}

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          loadingRows={3}
          empty={
            <EmptyState
              icon={BrainCircuit}
              title={hasSearch ? "No memories match that search" : "No memory yet"}
              description={
                hasSearch
                  ? `Nothing matched “${appliedQuery}”. Try different words, or widen the scope filter.`
                  : "Add a fact, a preference, or a knowledge note and it will be available to the worker it belongs to."
              }
              action={
                hasSearch ? null : (
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
                      <Pill tone="slate" title="Where this memory came from">
                        source: {memory.source || "manual"}
                      </Pill>
                      {memory.hit_count > 0 ? (
                        <Pill tone="slate">used {memory.hit_count}×</Pill>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">
                      {memory.content}
                    </p>
                    <p className="mt-1.5 text-[11px] text-white/30">
                      added{" "}
                      <time dateTime={machineTime(memory.created_at)} title={absoluteTime(memory.created_at)}>
                        {relativeTime(memory.created_at)}
                      </time>{" "}
                      · source {memory.source}
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
                        setEditKind(memory.kind);
                        setEditTags((memory.tags ?? []).join(", "));
                        setEditSource(memory.source ?? "");
                        setEditError(null);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(memory);
                      }}
                      aria-label={`Delete memory: ${memory.content.slice(0, 40)}`}
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
              className={FIELD_CLASS}
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
                className={FIELD_CLASS}
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
                className={FIELD_CLASS}
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
              className={FIELD_CLASS}
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
            <label className="text-xs text-white/50" htmlFor="mem-source">
              Source
            </label>
            <input
              id="mem-source"
              value={draftSource}
              onChange={(event) => setDraftSource(event.target.value)}
              placeholder="manual"
              className={FIELD_CLASS}
            />
            <p className="mt-1 text-[11px] text-white/35">
              Where this memory came from — a person, a document, or a run.
            </p>
          </div>

          <div>
            <label className="text-xs text-white/50" htmlFor="mem-tags">
              Tags (comma-separated)
            </label>
            <input
              id="mem-tags"
              value={draftTags}
              onChange={(event) => setDraftTags(event.target.value)}
              placeholder="pricing, competitor"
              className={FIELD_CLASS}
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

          {dialogError ? (
            <p role="alert" className="text-sm text-rose-300">
              {dialogError}
            </p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setEditError(null);
          }
        }}
        title="Edit memory"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="sm" disabled={editSaving} onClick={() => void submitEdit()}>
              {editSaving ? "Saving…" : "Save changes"}
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
            <label className="text-xs text-white/50" htmlFor="edit-kind">
              Kind
            </label>
            <select
              id="edit-kind"
              value={editKind}
              onChange={(event) => setEditKind(event.target.value as MemoryKind)}
              className={FIELD_CLASS}
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-white/35">
              The kinds the database accepts: {KINDS.join(", ")}.
            </p>
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="edit-source">
              Source
            </label>
            <input
              id="edit-source"
              value={editSource}
              onChange={(event) => setEditSource(event.target.value)}
              placeholder="manual"
              className={FIELD_CLASS}
            />
            <p className="mt-1 text-[11px] text-white/35">
              Where this memory came from — a person, a document, or a run.
            </p>
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="edit-tags">
              Tags (comma-separated)
            </label>
            <input
              id="edit-tags"
              value={editTags}
              onChange={(event) => setEditTags(event.target.value)}
              placeholder="pricing, competitor"
              className={FIELD_CLASS}
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

          {editError ? (
            <p role="alert" className="text-sm text-rose-300">
              {editError}
            </p>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        title="Delete this memory?"
        description={
          pendingDelete
            ? `“${pendingDelete.content.slice(0, 120)}” will be removed for everyone it was shared with. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete memory"
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
};

export default MemoryPage;
