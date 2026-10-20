// src/pages/agentos/WorkerDetailPage.tsx
//
// Single-worker detail: identity, model & tools, memory, policies,
// and the live execution transcript for this worker's tasks.
//
// Everything on this page reads from the agentos tables through the services;
// nothing is mocked or derived from a placeholder.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  PageHeader,
  Pill,
  Section,
  Spinner,
  WORKER_STATUS_STYLE,
} from "../../components/agentos/ui";
import { AsyncBoundary } from "../../components/agentos/shared";
import { ExecutionActivityPanel, TokenCostInline } from "../../components/agentos/runtime";
import { WorkerActions } from "../../components/agentos/workers";
import {
  ConversationComposer,
  ConversationList,
  ConversationThread,
} from "../../components/agentos/conversations";
import type { SendWorkerMessageResult } from "../../services/agentos/conversations";
import {
  getWorker,
  listWorkerTools,
  replaceWorkerTools,
  updateWorker,
} from "../../services/agentos/workers";
import { listMemories } from "../../services/agentos/memory";
import { listRuns } from "../../services/agentos/runtime";
import { listRoutableModels } from "../../services/agentos/models";
import {
  DISPATCHABLE_TOOL_KEYS,
  listAssignableToolKeys,
  listIntegrations,
} from "../../services/agentos/connections";
import type {
  ExecutionRun,
  Integration,
  ModelCatalogEntry,
  Worker,
  WorkerHeartbeat,
  WorkerKnowledgeRef,
  WorkerMemory,
  WorkerPermissions,
  WorkerTool,
} from "../../types/agentos";

type TabKey = "identity" | "model" | "memory" | "policies";

/** The kinds a knowledge source may have (mirrors WorkerKnowledgeRef). */
const KNOWLEDGE_KINDS: WorkerKnowledgeRef["kind"][] = ["note", "file", "url", "memory"];

const WorkerDetailPage: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [tools, setTools] = useState<WorkerTool[]>([]);
  const [memories, setMemories] = useState<WorkerMemory[]>([]);
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [assignableKeys, setAssignableKeys] = useState<string[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [runs, setRuns] = useState<ExecutionRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<TabKey>("identity");

  // Editable identity fields.
  const [instructions, setInstructions] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  // Tool assignment: one boolean per tool key. `true` means the row in
  // agentos.worker_tools has enabled = true, which is what the executor reads
  // before it offers the tool to the model.
  const [toolEnabled, setToolEnabled] = useState<Record<string, boolean>>({});
  const [toolsSaving, setToolsSaving] = useState(false);
  const [toolsNote, setToolsNote] = useState<string | null>(null);

  // Permission editor. The runtime enforces these keys before it offers a
  // tool to the model, so they were never editable — the column stayed `{}`
  // and the guardrails the runtime reads could not be set at all.
  const [permissions, setPermissions] = useState<WorkerPermissions>({});
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [permissionsNote, setPermissionsNote] = useState<string | null>(null);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  // Knowledge editor: the sources handed to the worker with the prompt.
  const [knowledge, setKnowledge] = useState<WorkerKnowledgeRef[]>([]);
  const [knowledgeDraft, setKnowledgeDraft] = useState<{
    name: string;
    kind: WorkerKnowledgeRef["kind"];
    ref: string;
  }>({ name: "", kind: "url", ref: "" });
  const [knowledgeSaving, setKnowledgeSaving] = useState(false);
  const [knowledgeNote, setKnowledgeNote] = useState<string | null>(null);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);

  // Heartbeat editor: the recurring prompt configuration on the worker row.
  const [heartbeat, setHeartbeat] = useState<WorkerHeartbeat>({ enabled: false });
  const [heartbeatSaving, setHeartbeatSaving] = useState(false);
  const [heartbeatNote, setHeartbeatNote] = useState<string | null>(null);
  const [heartbeatError, setHeartbeatError] = useState<string | null>(null);

  // The app slug the operator is typing.
  const [slugInput, setSlugInput] = useState("");

  // Conversations with this worker. The panel owns the list and the thread;
  // the page only remembers which thread is open and when something changed.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationRefreshKey, setConversationRefreshKey] = useState(0);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);

  const refreshConversations = useCallback(
    () => setConversationRefreshKey((key) => key + 1),
    [],
  );

  const handleConversationSent = useCallback((result: SendWorkerMessageResult) => {
    // The message may have opened a thread of its own, so the open thread
    // follows it and both views refresh.
    setConversationId(result.conversation.id);
    setConversationRefreshKey((key) => key + 1);
    setThreadRefreshKey((key) => key + 1);
  }, []);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!workerId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [workerResult, toolsResult, memoryResult, modelResult, keysResult, runsResult] =
        await Promise.all([
          getWorker(workerId),
          listWorkerTools(workerId),
          listMemories({ workerId }),
          listRoutableModels(),
          listAssignableToolKeys(),
          listRuns({ workerId, limit: 20 }),
        ]);

      if (cancelled) return;

      if (workerResult.error || !workerResult.data) {
        setError(workerResult.error?.message ?? "Worker not found");
        setLoading(false);
        return;
      }

      setWorker(workerResult.data);
      setInstructions(workerResult.data.instructions ?? "");
      setGoals(workerResult.data.goals ?? "");
      setTools(toolsResult.data ?? []);

      // The editors start from what is persisted, not from a blank: a switch
      // must show the state the runtime is actually enforcing.
      setPermissions(workerResult.data.permissions ?? {});
      setKnowledge(workerResult.data.knowledge ?? []);
      setHeartbeat(workerResult.data.heartbeat ?? { enabled: false });

      // The execution panel needs a run to show. Default to the most recent
      // one so the panel is never empty for a worker that has run.
      const workerRuns = runsResult.data ?? [];
      setRuns(workerRuns);
      setSelectedRunId((current) => current ?? workerRuns[0]?.id ?? null);
      setToolEnabled(
        Object.fromEntries((toolsResult.data ?? []).map((tool) => [tool.tool_key, tool.enabled])),
      );
      setMemories(memoryResult.data ?? []);
      setModels(modelResult.data ?? []);
      setAssignableKeys(keysResult.data ?? []);
      setError(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [workerId, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await listIntegrations();
      if (cancelled) return;
      if (result.data) setIntegrations(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const integrationByKey = useMemo(
    () => new Map(integrations.map((integration) => [integration.key, integration])),
    [integrations],
  );

  /**
   * Every key this worker can hold a row for: the assignable catalog plus any
   * tool it already has that has since left the catalog. Dropping an unknown
   * key on save would silently revoke a capability the operator never chose
   * to remove.
   */
  const toolKeys = useMemo(() => {
    const keys = new Set(assignableKeys);
    for (const tool of tools) keys.add(tool.tool_key);
    return [...keys].sort();
  }, [assignableKeys, tools]);

  /** The keys that already have a row for this worker. */
  const assignedKeys = useMemo(
    () => new Set(tools.map((tool) => tool.tool_key)),
    [tools],
  );

  const saveIdentity = useCallback(async () => {
    if (!worker) return;
    setSaving(true);
    setSaveNote(null);
    const result = await updateWorker(worker.id, { instructions, goals });
    setSaving(false);
    if (result.error) {
      setSaveNote(`Could not save: ${result.error.message}`);
      return;
    }
    setSaveNote("Saved");
    if (result.data) setWorker(result.data);
  }, [worker, instructions, goals]);

  const saveModel = useCallback(
    async (patch: { model_id?: string; fallback_model_id?: string | null }) => {
      if (!worker) return;
      setSaveNote(null);
      const result = await updateWorker(worker.id, patch);
      if (result.error) {
        setSaveNote(`Could not update the model: ${result.error.message}`);
        return;
      }
      if (result.data) setWorker(result.data);
      setSaveNote("Model updated");
    },
    [worker],
  );

  const toggleTool = useCallback((toolKey: string) => {
    setToolEnabled((current) => ({ ...current, [toolKey]: !current[toolKey] }));
    setToolsNote(null);
  }, []);

  const saveTools = useCallback(async () => {
    if (!worker) return;
    setToolsSaving(true);
    setToolsNote(null);

    // A tool the worker already holds a row for keeps its row when it is
    // switched off, so "assigned but off" stays distinguishable from "never
    // assigned". A tool that was never assigned gets no row at all.
    const rows = toolKeys
      .filter((toolKey) => toolEnabled[toolKey] || assignedKeys.has(toolKey))
      .map((toolKey) => ({
        tool_key: toolKey,
        enabled: toolEnabled[toolKey] ?? false,
      }));

    const result = await replaceWorkerTools(worker.id, rows);
    setToolsSaving(false);
    if (result.error) {
      setToolsNote(`Could not save the tools: ${result.error.message}`);
      return;
    }
    const enabledCount = rows.filter((row) => row.enabled).length;
    setToolsNote(
      `Saved. ${enabledCount} tool${enabledCount === 1 ? "" : "s"} enabled${
        rows.length - enabledCount > 0
          ? `, ${rows.length - enabledCount} switched off`
          : ""
      }.`,
    );
    reload();
  }, [worker, toolKeys, toolEnabled, assignedKeys, reload]);

  /**
   * Save the runtime's guardrails for this worker.
   *
   * WHY THIS WRITES THE WHOLE BLOCK
   *   `permissions` is one jsonb column, so a partial update is not possible:
   *   the editor always writes the complete set of keys the runtime reads.
   */
  const savePermissions = useCallback(async () => {
    if (!worker) return;
    setPermissionsSaving(true);
    setPermissionsNote(null);
    setPermissionsError(null);

    const result = await updateWorker(worker.id, { permissions });
    setPermissionsSaving(false);
    if (result.error) {
      setPermissionsError(`Could not save the permissions: ${result.error.message}`);
      return;
    }
    if (result.data) setWorker(result.data);
    setPermissionsNote("Permissions saved");
  }, [worker, permissions]);

  const saveKnowledge = useCallback(async () => {
    if (!worker) return;
    setKnowledgeSaving(true);
    setKnowledgeNote(null);
    setKnowledgeError(null);

    const result = await updateWorker(worker.id, { knowledge });
    setKnowledgeSaving(false);
    if (result.error) {
      setKnowledgeError(`Could not save the knowledge sources: ${result.error.message}`);
      return;
    }
    if (result.data) setWorker(result.data);
    setKnowledgeNote("Knowledge sources saved");
  }, [worker, knowledge]);

  const saveHeartbeat = useCallback(async () => {
    if (!worker) return;
    setHeartbeatSaving(true);
    setHeartbeatNote(null);
    setHeartbeatError(null);

    const result = await updateWorker(worker.id, { heartbeat });
    setHeartbeatSaving(false);
    if (result.error) {
      setHeartbeatError(`Could not save the heartbeat: ${result.error.message}`);
      return;
    }
    if (result.data) setWorker(result.data);
    setHeartbeatNote("Heartbeat saved");
  }, [worker, heartbeat]);

  /** Add or remove one entry of a string list held in the editor state. */
  const toggleListEntry = useCallback(
    (list: string[], entry: string): string[] =>
      list.includes(entry) ? list.filter((value) => value !== entry) : [...list, entry],
    [],
  );

  /**
   * Bring an archived worker back. The archive flag is a separate column from
   * the status, so both are cleared — otherwise the worker would still be
   * hidden by the `archived_at IS NULL` filters.
   */
  const unarchive = useCallback(async () => {
    if (!worker) return;
    setSaving(true);
    setSaveNote(null);
    const result = await updateWorker(worker.id, { status: "active", archived_at: null });
    setSaving(false);
    if (result.error) {
      setSaveNote(`Could not restore the worker: ${result.error.message}`);
      return;
    }
    if (result.data) setWorker(result.data);
    setSaveNote("Worker restored");
    reload();
  }, [worker, reload]);

  if (!workerId) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Spinner label="Loading worker…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <AsyncBoundary
        loading={false}
        error={error}
        onRetry={reload}
        isEmpty={!worker}
        empty={<p className="text-white/50">Worker not found.</p>}
      >
        {worker ? (
          <>
            <Helmet>
              <title>{worker.name} — Workforce</title>
            </Helmet>

            <PageHeader
              breadcrumbs={[
                { label: "AgentOS", to: "/agentos" },
                { label: "Workforce", to: "/agentos/workforce" },
                { label: worker.name },
              ]}
              title={worker.name}
              description={worker.role || "No role set"}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {worker.archived_at ? (
                    <Button variant="outline" size="sm" disabled={saving} onClick={() => void unarchive()}>
                      Un-archive
                    </Button>
                  ) : null}
                  <WorkerActions
                    workerId={worker.id}
                    workerName={worker.name}
                    status={worker.status}
                    onChanged={reload}
                  />
                </div>
              }
            />

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Pill tone={WORKER_STATUS_STYLE[worker.status].pill}>
                {WORKER_STATUS_STYLE[worker.status].label}
              </Pill>
              {worker.archived_at ? <Pill tone="amber">archived</Pill> : null}
              <Pill tone="violet">{worker.model_id}</Pill>
              {worker.fallback_model_id ? <Pill tone="sky">fallback {worker.fallback_model_id}</Pill> : null}
              <Pill tone="slate">{worker.memory_enabled ? "memory on" : "memory off"}</Pill>
              <span className="ml-auto">
                <TokenCostInline workerId={worker.id} />
              </span>
            </div>

            {worker.archived_at ? (
              <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-200/80">
                This worker is archived. It is hidden from the default lists and excluded from
                execution until it is restored.
              </p>
            ) : null}

            <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
              <TabsList>
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="model">Model &amp; tools</TabsTrigger>
                <TabsTrigger value="memory">Memory</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="space-y-4 pt-4">
                <Section
                  title="Operating instructions"
                  description="What this worker is and how it should behave. Sent verbatim as the system prompt."
                  actions={
                    <Button size="sm" onClick={() => void saveIdentity()} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="worker-instructions">Instructions</Label>
                      <Textarea
                        id="worker-instructions"
                        value={instructions}
                        onChange={(event) => setInstructions(event.target.value)}
                        rows={6}
                        placeholder="You research topics and produce sourced briefs."
                      />
                    </div>
                    <div>
                      <Label htmlFor="worker-goals">Goals</Label>
                      <Textarea
                        id="worker-goals"
                        value={goals}
                        onChange={(event) => setGoals(event.target.value)}
                        rows={3}
                        placeholder="Deliver weekly competitor briefs."
                      />
                    </div>
                    {saveNote ? (
                      <p role="status" className="text-xs text-white/45">
                        {saveNote}
                      </p>
                    ) : null}
                  </div>
                </Section>

                <Section
                  title="Knowledge"
                  description="Reference material handed to the worker with the prompt. Saved onto the worker record."
                  actions={
                    <Button
                      size="sm"
                      disabled={knowledgeSaving}
                      onClick={() => void saveKnowledge()}
                    >
                      {knowledgeSaving ? "Saving…" : "Save sources"}
                    </Button>
                  }
                >
                  {knowledge.length === 0 ? (
                    <p className="text-sm text-white/45">
                      No knowledge sources attached to this worker.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {knowledge.map((entry, index) => (
                        <li
                          key={`${entry.name}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-white/80">{entry.name}</p>
                            {entry.ref ? (
                              <p className="mt-0.5 break-all text-[11px] text-white/35">{entry.ref}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill tone="sky">{entry.kind}</Pill>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                              onClick={() =>
                                setKnowledge((current) => current.filter((_, position) => position !== index))
                              }
                              aria-label={`Remove the knowledge source ${entry.name}`}
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 border-t border-white/5 pt-4">
                    <p className="text-xs text-white/50">Add a source</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
                      <div>
                        <Label htmlFor="knowledge-name">Name</Label>
                        <Input
                          id="knowledge-name"
                          value={knowledgeDraft.name}
                          onChange={(event) =>
                            setKnowledgeDraft({ ...knowledgeDraft, name: event.target.value })
                          }
                          placeholder="Competitor pricing page"
                        />
                      </div>
                      <div>
                        <Label htmlFor="knowledge-kind">Kind</Label>
                        <select
                          id="knowledge-kind"
                          value={knowledgeDraft.kind}
                          onChange={(event) =>
                            setKnowledgeDraft({
                              ...knowledgeDraft,
                              kind: event.target.value as WorkerKnowledgeRef["kind"],
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          {KNOWLEDGE_KINDS.map((kind) => (
                            <option key={kind} value={kind}>
                              {kind}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label htmlFor="knowledge-ref">Reference</Label>
                      <Input
                        id="knowledge-ref"
                        value={knowledgeDraft.ref}
                        onChange={(event) =>
                          setKnowledgeDraft({ ...knowledgeDraft, ref: event.target.value })
                        }
                        placeholder="https://example.com/pricing"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        const name = knowledgeDraft.name.trim();
                        if (!name) {
                          setKnowledgeError("Give the source a name");
                          return;
                        }
                        setKnowledgeError(null);
                        setKnowledge((current) => [
                          ...current,
                          {
                            name,
                            kind: knowledgeDraft.kind,
                            ...(knowledgeDraft.ref.trim() ? { ref: knowledgeDraft.ref.trim() } : {}),
                          },
                        ]);
                        setKnowledgeDraft({ name: "", kind: knowledgeDraft.kind, ref: "" });
                        setKnowledgeNote("Source added — save to persist it");
                      }}
                    >
                      Add source
                    </Button>
                  </div>

                  {knowledgeError ? (
                    <p role="alert" className="mt-3 text-sm text-rose-300">
                      {knowledgeError}
                    </p>
                  ) : null}
                  {knowledgeNote ? (
                    <p role="status" className="mt-3 text-xs text-white/45">
                      {knowledgeNote}
                    </p>
                  ) : null}
                </Section>
              </TabsContent>

              <TabsContent value="model" className="space-y-4 pt-4">
                <Section title="Model" description="Routing and fallback for this worker's executions.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="worker-model">Primary model</Label>
                      <select
                        id="worker-model"
                        value={worker.model_id}
                        onChange={(event) => void saveModel({ model_id: event.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.display_name} ({model.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="worker-fallback">Fallback model</Label>
                      <select
                        id="worker-fallback"
                        value={worker.fallback_model_id ?? ""}
                        onChange={(event) =>
                          void saveModel({
                            fallback_model_id: event.target.value || null,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                      >
                        <option value="">None</option>
                        {models
                          .filter((model) => model.id !== worker.model_id)
                          .map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.display_name} ({model.id})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {saveNote ? (
                    <p role="status" className="mt-3 text-xs text-white/45">
                      {saveNote}
                    </p>
                  ) : null}
                </Section>

                <Section
                  title="Tools"
                  description="What this worker may call. Only the tools the runtime can dispatch are offered; a key that is already assigned but no longer dispatchable is kept and marked. The executor reads these rows before it offers a tool to the model, so a tool that is off is never offered."
                  actions={
                    <Button size="sm" disabled={toolsSaving} onClick={() => void saveTools()}>
                      {toolsSaving ? "Saving…" : "Save tools"}
                    </Button>
                  }
                >
                  {toolKeys.length === 0 ? (
                    <p className="text-sm text-white/45">
                      No tools are available to assign in this deployment.
                    </p>
                  ) : (
                    <div role="group" aria-label="Worker tools">
                      <ul className="space-y-2">
                        {toolKeys.map((toolKey) => {
                          const integration = integrationByKey.get(toolKey);
                          const enabled = toolEnabled[toolKey] ?? false;
                          const dispatchable = DISPATCHABLE_TOOL_KEYS.includes(toolKey);
                          return (
                            <li
                              key={toolKey}
                              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                                enabled
                                  ? "border-violet-400/25 bg-black/30"
                                  : "border-white/5 bg-black/20"
                              }`}
                            >
                              <div className="min-w-0">
                                <p
                                  className={`text-sm ${enabled ? "text-white/85" : "text-white/40"}`}
                                >
                                  {integration?.name ?? toolKey}
                                </p>
                                <p className="mt-0.5 text-[11px] text-white/30">
                                  {toolKey}
                                  {integration?.category ? ` · ${integration.category}` : ""}
                                </p>
                                {!dispatchable ? (
                                  <p className="mt-1 text-[11px] text-amber-300/80">
                                    Surface only — the runtime has no tool dispatch for this key, so
                                    assigning it records the connection but offers no callable tool.
                                  </p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                aria-pressed={enabled}
                                onClick={() => toggleTool(toolKey)}
                                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                                  enabled
                                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                    : "border-white/15 bg-white/5 text-white/45"
                                }`}
                              >
                                {enabled ? "on" : "off"}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {toolsNote ? (
                    <p role="status" className="mt-3 text-xs text-white/45">
                      {toolsNote}
                    </p>
                  ) : null}
                </Section>
              </TabsContent>

              <TabsContent value="memory" className="space-y-4 pt-4">
                <Section
                  title="Durable memory"
                  description="Context attached to this worker. Retrieved at execution time and shown in the transcript."
                >
                  {memories.length === 0 ? (
                    <p className="text-sm text-white/45">
                      No memory yet. Add context under{" "}
                      <button
                        type="button"
                        className="text-violet-300 underline"
                        onClick={() => navigate("/agentos/memory")}
                      >
                        Memory
                      </button>
                      .
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {memories.map((memory) => (
                        <li
                          key={memory.id}
                          className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <Pill tone="sky">{memory.kind}</Pill>
                            <span className="text-[11px] text-white/35">
                              importance {memory.importance}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-white/70">{memory.content}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </TabsContent>

              <TabsContent value="policies" className="space-y-4 pt-4">
                <Section
                  title="Permissions"
                  description="Enforced by the runtime before a tool is offered to the model. A denied tool is never offered; a gated action parks the task until a human approves it."
                  actions={
                    <Button
                      size="sm"
                      disabled={permissionsSaving}
                      onClick={() => void savePermissions()}
                    >
                      {permissionsSaving ? "Saving…" : "Save permissions"}
                    </Button>
                  }
                >
                  <div className="space-y-5">
                    <div role="group" aria-label="Capability switches" className="space-y-2">
                      <button
                        type="button"
                        aria-pressed={permissions.allow_web_access !== false}
                        onClick={() =>
                          setPermissions({
                            ...permissions,
                            allow_web_access: permissions.allow_web_access === false,
                          })
                        }
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                          permissions.allow_web_access !== false
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                            : "border-white/10 bg-black/40 text-white/60"
                        }`}
                      >
                        Web access
                        <span className="ml-2 text-[11px] text-white/40">
                          {permissions.allow_web_access !== false
                            ? "on — the web_fetch tool may run"
                            : "off — the web_fetch tool is refused"}
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-pressed={permissions.allow_artifacts !== false}
                        onClick={() =>
                          setPermissions({
                            ...permissions,
                            allow_artifacts: permissions.allow_artifacts === false,
                          })
                        }
                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                          permissions.allow_artifacts !== false
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                            : "border-white/10 bg-black/40 text-white/60"
                        }`}
                      >
                        Artifacts
                        <span className="ml-2 text-[11px] text-white/40">
                          {permissions.allow_artifacts !== false
                            ? "on — the artifact_write tool may run"
                            : "off — the artifact_write tool is refused"}
                        </span>
                      </button>
                    </div>

                    <div>
                      <p className="text-xs text-white/50" id="worker-denied-tools-label">
                        Denied tools
                      </p>
                      <div
                        role="group"
                        aria-labelledby="worker-denied-tools-label"
                        className="mt-2 flex flex-wrap gap-2"
                      >
                        {DISPATCHABLE_TOOL_KEYS.map((toolKey) => {
                          const denied = (permissions.denied_tools ?? []).includes(toolKey);
                          return (
                            <button
                              key={toolKey}
                              type="button"
                              aria-pressed={denied}
                              onClick={() =>
                                setPermissions({
                                  ...permissions,
                                  denied_tools: toggleListEntry(
                                    permissions.denied_tools ?? [],
                                    toolKey,
                                  ),
                                })
                              }
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                                denied
                                  ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                                  : "border-white/10 bg-white/5 text-white/50"
                              }`}
                            >
                              {toolKey}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-[11px] text-white/35">
                        A denied tool is never offered to the model, even when it is assigned on the
                        Model &amp; tools tab.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50" id="worker-approval-actions-label">
                        Actions that require a human approval
                      </p>
                      <div
                        role="group"
                        aria-labelledby="worker-approval-actions-label"
                        className="mt-2 flex flex-wrap gap-2"
                      >
                        {DISPATCHABLE_TOOL_KEYS.map((toolKey) => {
                          const gated = (permissions.approval_required_actions ?? []).includes(
                            toolKey,
                          );
                          return (
                            <button
                              key={toolKey}
                              type="button"
                              aria-pressed={gated}
                              onClick={() =>
                                setPermissions({
                                  ...permissions,
                                  approval_required_actions: toggleListEntry(
                                    permissions.approval_required_actions ?? [],
                                    toolKey,
                                  ),
                                })
                              }
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                                gated
                                  ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                                  : "border-white/10 bg-white/5 text-white/50"
                              }`}
                            >
                              {toolKey}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-[11px] text-white/35">
                        The runtime matches this list against the action type of a tool call, which is
                        the tool key itself. A gated action parks the task for approval instead of
                        running.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50" id="worker-app-slugs-label">
                        Allowed app slugs
                      </p>
                      {(permissions.allowed_app_slugs ?? []).length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {(permissions.allowed_app_slugs ?? []).map((slug) => (
                            <li key={slug}>
                              <button
                                type="button"
                                onClick={() =>
                                  setPermissions({
                                    ...permissions,
                                    allowed_app_slugs: toggleListEntry(
                                      permissions.allowed_app_slugs ?? [],
                                      slug,
                                    ),
                                  })
                                }
                                className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-[11px] text-violet-200"
                                aria-label={`Remove ${slug} from the allowed apps`}
                              >
                                {slug} ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[11px] text-white/35">
                          Every app in the catalog is allowed.
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        <div className="min-w-[200px] flex-1">
                          <Label htmlFor="worker-app-slug">App slug</Label>
                          <Input
                            id="worker-app-slug"
                            value={slugInput}
                            onChange={(event) => setSlugInput(event.target.value)}
                            placeholder="ai-design-studio"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const slug = slugInput.trim();
                            if (!slug) {
                              setPermissionsError("Enter an app slug");
                              return;
                            }
                            setPermissionsError(null);
                            setPermissions({
                              ...permissions,
                              allowed_app_slugs: toggleListEntry(
                                permissions.allowed_app_slugs ?? [],
                                slug,
                              ),
                            });
                            setSlugInput("");
                          }}
                        >
                          Add app
                        </Button>
                      </div>
                      <p className="mt-1 text-[11px] text-white/35">
                        An empty list means every app in the catalog is allowed. A list restricts this
                        worker to the apps you name.
                      </p>
                    </div>
                  </div>

                  {permissionsError ? (
                    <p role="alert" className="mt-4 text-sm text-rose-300">
                      {permissionsError}
                    </p>
                  ) : null}
                  {permissionsNote ? (
                    <p role="status" className="mt-4 text-xs text-white/45">
                      {permissionsNote}
                    </p>
                  ) : null}
                </Section>

                <Section
                  title="Heartbeat"
                  description="The recurring prompt configuration stored on this worker."
                  actions={
                    <Button
                      size="sm"
                      disabled={heartbeatSaving}
                      onClick={() => void saveHeartbeat()}
                    >
                      {heartbeatSaving ? "Saving…" : "Save heartbeat"}
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <button
                      type="button"
                      aria-pressed={heartbeat.enabled === true}
                      onClick={() =>
                        setHeartbeat({ ...heartbeat, enabled: !heartbeat.enabled })
                      }
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        heartbeat.enabled
                          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                          : "border-white/10 bg-black/40 text-white/60"
                      }`}
                    >
                      Heartbeat
                      <span className="ml-2 text-[11px] text-white/40">
                        {heartbeat.enabled
                          ? "on — the worker runs on this schedule"
                          : "off — the worker only runs when it is given a task"}
                      </span>
                    </button>

                    {heartbeat.enabled ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="worker-heartbeat-cron">Cron</Label>
                            <Input
                              id="worker-heartbeat-cron"
                              value={heartbeat.cron ?? ""}
                              onChange={(event) =>
                                setHeartbeat({ ...heartbeat, cron: event.target.value })
                              }
                              placeholder="0 9 * * 1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="worker-heartbeat-timezone">Timezone</Label>
                            <Input
                              id="worker-heartbeat-timezone"
                              value={heartbeat.timezone ?? ""}
                              onChange={(event) =>
                                setHeartbeat({ ...heartbeat, timezone: event.target.value })
                              }
                              placeholder="UTC"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="worker-heartbeat-prompt">Heartbeat prompt</Label>
                          <Textarea
                            id="worker-heartbeat-prompt"
                            value={heartbeat.prompt ?? ""}
                            onChange={(event) =>
                              setHeartbeat({ ...heartbeat, prompt: event.target.value })
                            }
                            rows={3}
                            placeholder="Check the pipeline and report anything overdue."
                          />
                        </div>
                      </>
                    ) : null}
                  </div>

                  {heartbeatError ? (
                    <p role="alert" className="mt-4 text-sm text-rose-300">
                      {heartbeatError}
                    </p>
                  ) : null}
                  {heartbeatNote ? (
                    <p role="status" className="mt-4 text-xs text-white/45">
                      {heartbeatNote}
                    </p>
                  ) : null}
                </Section>

                <Section
                  title="Runtime summary"
                  description="Settings the runtime reads from this worker record."
                >
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-white/45">Web access</dt>
                      <dd className="text-white/75">
                        {worker.permissions?.allow_web_access === false ? "blocked" : "allowed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Artifacts</dt>
                      <dd className="text-white/75">
                        {worker.permissions?.allow_artifacts === false ? "blocked" : "allowed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Denied tools</dt>
                      <dd className="text-white/75">
                        {(worker.permissions?.denied_tools ?? []).join(", ") || "none"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Approval-gated actions</dt>
                      <dd className="text-white/75">
                        {(worker.permissions?.approval_required_actions ?? []).join(", ") || "none"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Allowed apps</dt>
                      <dd className="text-white/75">
                        {(worker.permissions?.allowed_app_slugs ?? []).join(", ") || "all"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Temperature</dt>
                      <dd className="text-white/75">{worker.temperature}</dd>
                    </div>
                  </dl>
                </Section>
              </TabsContent>
            </Tabs>

            <Section
              title="Recent execution"
              description="Live transcript of this worker's tasks, straight from the execution events table."
              className="mt-6"
            >
              {runs.length === 0 ? (
                <p className="text-sm text-white/45">
                  This worker has not run yet. Give it a task and the transcript appears here.
                </p>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <label
                      className="text-xs text-white/50"
                      htmlFor="worker-run-picker"
                    >
                      Run
                    </label>
                    <select
                      id="worker-run-picker"
                      value={selectedRunId ?? ""}
                      onChange={(event) => setSelectedRunId(event.target.value || null)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                    >
                      {runs.map((run) => (
                        <option key={run.id} value={run.id}>
                          {new Date(run.started_at).toLocaleString()} —{" "}
                          {run.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ExecutionActivityPanel runId={selectedRunId ?? undefined} />
                </>
              )}
              <p className="mt-2 text-xs text-white/35">
                Open a task from the{" "}
                <button
                  type="button"
                  className="text-violet-300 underline"
                  onClick={() => navigate("/agentos/missions")}
                >
                  missions
                </button>{" "}
                view to see its full transcript.
              </p>
            </Section>

            <Section
              title="Conversations"
              description="Talk to this worker. Every message becomes a task, and the worker answers when the queue runs it."
              className="mt-6"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                <ConversationList
                  workerId={worker.id}
                  selectedConversationId={conversationId}
                  onSelect={(conversation) => setConversationId(conversation?.id ?? null)}
                  refreshKey={conversationRefreshKey}
                />
                <div className="space-y-4">
                  <ConversationThread
                    conversationId={conversationId}
                    refreshKey={threadRefreshKey}
                    onChanged={refreshConversations}
                  />
                  <ConversationComposer
                    workerId={worker.id}
                    conversationId={conversationId}
                    workspaceId={worker.workspace_id}
                    onSent={handleConversationSent}
                  />
                </div>
              </div>
            </Section>
          </>
        ) : null}
      </AsyncBoundary>
    </div>
  );
};

export default WorkerDetailPage;
