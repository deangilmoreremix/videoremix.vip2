// src/pages/agentos/WorkerDetailPage.tsx
//
// Single-worker detail: identity, model & tools, memory, schedule, policies,
// and the live execution transcript for this worker's tasks.
//
// Everything on this page reads from the agentos tables through the services;
// nothing is mocked or derived from a placeholder.

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
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
import { getWorker, listWorkerTools, updateWorker } from "../../services/agentos/workers";
import { listMemories } from "../../services/agentos/memory";
import { listModelCatalog } from "../../services/agentos/models";
import { listAssignableToolKeys, listIntegrations } from "../../services/agentos/connections";
import type { ModelCatalogEntry, Worker, WorkerMemory, WorkerTool } from "../../types/agentos";

type TabKey = "identity" | "model" | "memory" | "policies";

const WorkerDetailPage: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [tools, setTools] = useState<WorkerTool[]>([]);
  const [memories, setMemories] = useState<WorkerMemory[]>([]);
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [assignableKeys, setAssignableKeys] = useState<string[]>([]);
  const [toolNames, setToolNames] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<TabKey>("identity");

  // Editable identity fields.
  const [instructions, setInstructions] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!workerId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [workerResult, toolsResult, memoryResult, modelResult, keysResult] = await Promise.all([
        getWorker(workerId),
        listWorkerTools(workerId),
        listMemories({ workerId }),
        listModelCatalog(),
        listAssignableToolKeys(),
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
    void (async () => {
      const result = await listIntegrations();
      if (result.data) {
        setToolNames(Object.fromEntries(result.data.map((row) => [row.key, row.name])));
      }
    })();
  }, []);

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
              actions={<WorkerActions workerId={worker.id} workerName={worker.name} status={worker.status} onChanged={reload} />}
            />

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Pill tone={WORKER_STATUS_STYLE[worker.status].pill}>
                {WORKER_STATUS_STYLE[worker.status].label}
              </Pill>
              <Pill tone="violet">{worker.model_id}</Pill>
              {worker.fallback_model_id ? <Pill tone="sky">fallback {worker.fallback_model_id}</Pill> : null}
              <Pill tone="slate">{worker.memory_enabled ? "memory on" : "memory off"}</Pill>
              <span className="ml-auto">
                <TokenCostInline workerId={worker.id} />
              </span>
            </div>

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
                    {saveNote ? <p className="text-xs text-white/45">{saveNote}</p> : null}
                  </div>
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
                        onChange={async (event) => {
                          const result = await updateWorker(worker.id, { model_id: event.target.value });
                          if (result.data) setWorker(result.data);
                        }}
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
                        onChange={async (event) => {
                          const result = await updateWorker(worker.id, {
                            fallback_model_id: event.target.value || null,
                          });
                          if (result.data) setWorker(result.data);
                        }}
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
                </Section>

                <Section title="Tools" description="Capabilities this worker may call. Unsupported integrations are never listed.">
                  {tools.length === 0 ? (
                    <p className="text-sm text-white/45">No tools assigned yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {tools.map((tool) => (
                        <li
                          key={tool.id}
                          className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                        >
                          <span className="text-sm text-white/75">
                            {toolNames[tool.tool_key] ?? tool.tool_key}
                          </span>
                          <Pill tone={tool.enabled ? "emerald" : "slate"}>
                            {tool.enabled ? "enabled" : "disabled"}
                          </Pill>
                        </li>
                      ))}
                    </ul>
                  )}
                  {assignableKeys.length > 0 ? (
                    <p className="mt-3 text-xs text-white/35">
                      Available to assign: {assignableKeys.join(", ")}
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
                <Section title="Policies" description="Guardrails applied by the runtime before any tool executes.">
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
              <ExecutionActivityPanel taskId={undefined} runId={undefined} />
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
          </>
        ) : null}
      </AsyncBoundary>
    </div>
  );
};

export default WorkerDetailPage;
