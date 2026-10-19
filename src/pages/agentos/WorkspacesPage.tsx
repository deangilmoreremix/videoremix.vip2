// src/pages/agentos/WorkspacesPage.tsx
//
// Workspace list: owned workspaces plus any the caller is a member of, with
// search and a create action that opens the workspace wizard.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AsyncBoundary } from "../../components/agentos/shared";
import { EmptyState, Modal, PageHeader, Pill, SearchInput } from "../../components/agentos/ui";
import { listWorkspaces } from "../../services/agentos/workspaces";
import type { Workspace } from "../../types/agentos";

const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [instructions, setInstructions] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await listWorkspaces();
      if (cancelled) return;
      if (result.error) {
        setError(result.error.message);
        setWorkspaces([]);
      } else {
        setError(null);
        setWorkspaces(result.data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return workspaces;
    return workspaces.filter((workspace) =>
      [workspace.name, workspace.description, workspace.goals]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [workspaces, query]);

  const createWorkspace = useCallback(async () => {
    if (!name.trim()) {
      setCreateError("Give the workspace a name");
      return;
    }
    setCreating(true);
    setCreateError(null);
    const { createWorkspace: create } = await import("../../services/agentos/workspaces");
    const result = await create({
      name,
      description,
      goals,
      instructions,
    });
    setCreating(false);
    if (result.error) {
      setCreateError(result.error.message);
      return;
    }
    if (result.data) navigate(`/agentos/workspaces/${result.data.id}`);
  }, [name, description, goals, instructions, navigate]);

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Workspaces — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageHeader
          title="Workspaces"
          description="Shared context for a team of workers: goals, instructions, policies, and membership."
          actions={
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New workspace
            </button>
          }
        />

        <div className="mb-5">
          <SearchInput
            id="workspaces-search"
            label="Search workspaces"
            value={query}
            onChange={setQuery}
            placeholder="Search workspaces"
            className="max-w-md"
          />
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          loadingRows={3}
          empty={
            <EmptyState
              icon={FolderKanban}
              title={query ? "No workspaces match that search" : "No workspaces yet"}
              description={
                query
                  ? "Try a different name, description or goal."
                  : "A workspace groups workers under shared goals, instructions, and access policies."
              }
              action={
                query ? null : (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New workspace
                  </button>
                )
              }
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => navigate(`/agentos/workspaces/${workspace.id}`)}
                className="group rounded-2xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-violet-400/30 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
                    <FolderKanban className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Users className="h-4 w-4 text-white/25" aria-hidden="true" />
                </div>
                <p className="mt-3 font-medium text-white group-hover:text-violet-200">
                  {workspace.name}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-white/50">
                  {workspace.description || workspace.goals || "No description yet."}
                </p>
                {workspace.policies && Object.keys(workspace.policies).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workspace.policies.executions_paused ? <Pill tone="rose">executions paused</Pill> : null}
                    {workspace.policies.approval_required_tools?.length ? (
                      <Pill tone="amber">
                        {workspace.policies.approval_required_tools.length} gated tool
                        {workspace.policies.approval_required_tools.length === 1 ? "" : "s"}
                      </Pill>
                    ) : null}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </AsyncBoundary>

        {showCreate ? (
          <Modal
            open={showCreate}
            onOpenChange={setShowCreate}
            title="New workspace"
            description="You are added as the workspace owner automatically."
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => void createWorkspace()}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create workspace"}
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50" htmlFor="ws-name">
                  Name
                </label>
                <input
                  id="ws-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                  placeholder="Marketing Team"
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="ws-description">
                  Description
                </label>
                <input
                  id="ws-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="ws-goals">
                  Goals
                </label>
                <textarea
                  id="ws-goals"
                  value={goals}
                  onChange={(event) => setGoals(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="ws-instructions">
                  Operating instructions
                </label>
                <textarea
                  id="ws-instructions"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50"
                />
              </div>
              {createError ? (
                <p role="alert" className="text-sm text-rose-300">
                  {createError}
                </p>
              ) : null}
            </div>
          </Modal>
        ) : null}
      </div>
    </>
  );
};

export default WorkspacesPage;
