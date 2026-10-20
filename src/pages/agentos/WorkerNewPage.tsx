// src/pages/agentos/WorkerNewPage.tsx
//
// Worker creation: identity, role, model, tools, knowledge, policies, schedule,
// then review. Partial state persists in localStorage so a half-finished wizard
// survives a reload.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Bot, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  PageHeader,
  Pill,
  Section,
  Spinner,
} from "../../components/agentos/ui";
import { AsyncBoundary } from "../../components/agentos/shared";
import { createWorker } from "../../services/agentos/workers";
import { listWorkspaces } from "../../services/agentos/workspaces";
import { listModelCatalog } from "../../services/agentos/models";
import { DISPATCHABLE_TOOL_KEYS, listIntegrations } from "../../services/agentos/connections";
import { listSchedules } from "../../services/agentos/schedules";
import type { Integration, ModelCatalogEntry, Workspace } from "../../types/agentos";

const STORAGE_KEY = "agentos:worker-create-draft";
const STEPS = ["Identity", "Role", "Model", "Tools", "Knowledge", "Policies", "Schedule", "Review"];

interface Draft {
  name: string;
  role: string;
  accent: string;
  instructions: string;
  goals: string;
  workspace_id: string;
  model_id: string;
  fallback_model_id: string;
  temperature: number;
  max_output_tokens: number;
  tool_keys: string[];
  memory_enabled: boolean;
  allow_web_access: boolean;
  allow_artifacts: boolean;
  denied_tools: string[];
  approval_required_actions: string[];
  allowed_app_slugs: string[];
  cron: string;
  timezone: string;
  heartbeat_enabled: boolean;
  heartbeat_prompt: string;
}

const EMPTY_DRAFT: Draft = {
  name: "",
  role: "",
  accent: "violet",
  instructions: "",
  goals: "",
  workspace_id: "",
  model_id: "gpt-4o-mini",
  fallback_model_id: "",
  temperature: 0.7,
  max_output_tokens: 2048,
  tool_keys: [],
  memory_enabled: true,
  allow_web_access: true,
  allow_artifacts: true,
  denied_tools: [],
  approval_required_actions: [],
  allowed_app_slugs: [],
  cron: "0 9 * * 1",
  timezone: "UTC",
  heartbeat_enabled: false,
  heartbeat_prompt: "",
};

const ACCENTS = ["violet", "sky", "emerald", "amber", "rose"];

function loadDraft(): Draft {
  if (typeof localStorage === "undefined") return EMPTY_DRAFT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    return EMPTY_DRAFT;
  }
}

const WorkerNewPage: React.FC = () => {
  const navigate = useNavigate();

  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [step, setStep] = useState(0);
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // A private-mode browser simply loses the draft; nothing to recover.
    }
  }, [draft]);

  const load = useCallback(async () => {
    setLoading(true);
    const [modelsResult, workspacesResult, integrationsResult, schedulesResult] =
      await Promise.all([
        listModelCatalog(),
        listWorkspaces(),
        listIntegrations(),
        listSchedules(),
      ]);
    setModels(modelsResult.data ?? []);
    setWorkspaces(workspacesResult.data ?? []);
    setIntegrations(integrationsResult.data ?? []);
    setScheduleCount(schedulesResult.data?.length ?? 0);
    setError(modelsResult.error?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback((next: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...next }));
  }, []);

  const toolNames = useMemo(
    () => new Map(integrations.map((integration) => [integration.key, integration.name])),
    [integrations],
  );

  /**
   * Only the tools the runtime can dispatch are offered.
   *
   * WHY NOT THE WHOLE CATALOG
   *   The integration directory lists sixteen entries; the runtime has a
   *   dispatch spec for five of them. Offering the rest produced a tool
   *   assignment the executor silently skips, so the operator believed the
   *   worker had a capability it could never use.
   */
  const toolKeys = useMemo(() => [...DISPATCHABLE_TOOL_KEYS], []);

  const submit = useCallback(async () => {
    if (!draft.name.trim()) {
      setSubmitError("Give the worker a name");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const result = await createWorker({
      name: draft.name,
      role: draft.role,
      instructions: draft.instructions,
      goals: draft.goals,
      workspace_id: draft.workspace_id || null,
      model_id: draft.model_id,
      fallback_model_id: draft.fallback_model_id || null,
      temperature: draft.temperature,
      max_output_tokens: draft.max_output_tokens,
      // Only the dispatchable keys are written: a draft saved in an earlier
      // session may still hold a key the runtime cannot dispatch.
      tools: draft.tool_keys
        .filter((tool_key) => DISPATCHABLE_TOOL_KEYS.includes(tool_key))
        .map((tool_key) => ({ tool_key })),
      memory_enabled: draft.memory_enabled,
      permissions: {
        allow_web_access: draft.allow_web_access,
        allow_artifacts: draft.allow_artifacts,
        denied_tools: draft.denied_tools.filter((toolKey) =>
          DISPATCHABLE_TOOL_KEYS.includes(toolKey),
        ),
        approval_required_actions: draft.approval_required_actions.filter((action) =>
          DISPATCHABLE_TOOL_KEYS.includes(action),
        ),
        allowed_app_slugs: draft.allowed_app_slugs,
      },
      heartbeat: draft.heartbeat_enabled
        ? {
            enabled: true,
            cron: draft.cron,
            timezone: draft.timezone,
            prompt: draft.heartbeat_prompt,
          }
        : { enabled: false },
      accent: draft.accent,
    });

    setSubmitting(false);

    if (result.error) {
      setSubmitError(result.error.message);
      return;
    }
    if (result.data) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore: the worker exists either way.
      }
      navigate(`/agentos/workforce/${result.data.id}`);
    }
  }, [draft, navigate]);

  const canAdvance = step === 0 ? draft.name.trim().length > 0 : true;

  return (
    <>
      <Helmet>
        <title>New worker — Workforce</title>
      </Helmet>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <PageHeader
          breadcrumbs={[
            { label: "AgentOS", to: "/agentos" },
            { label: "Workforce", to: "/agentos/workforce" },
            { label: "New" },
          ]}
          title="New worker"
          description="A digital worker has an identity, a role, a model, and its own tools."
        />

        <ol className="mb-6 flex flex-wrap gap-1.5">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
                  index === step
                    ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                    : index < step
                      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/40"
                }`}
              >
                {index < step ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                {label}
              </button>
            </li>
          ))}
        </ol>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={load}
          isEmpty={false}
          loadingRows={3}
        >
          <div className="space-y-5">
            {step === 0 ? (
              <Section title="Identity" description="What this worker is called and where it lives.">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="w-name">Name</Label>
                    <Input
                      id="w-name"
                      value={draft.name}
                      onChange={(event) => patch({ name: event.target.value })}
                      placeholder="Researcher"
                    />
                  </div>
                  <div>
                    <Label htmlFor="w-workspace">Workspace</Label>
                    <select
                      id="w-workspace"
                      value={draft.workspace_id}
                      onChange={(event) => patch({ workspace_id: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Personal (no workspace)</option>
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="w-accent">Accent</Label>
                    <div className="mt-1 flex gap-1.5">
                      {ACCENTS.map((accent) => (
                        <button
                          key={accent}
                          type="button"
                          onClick={() => patch({ accent })}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                            draft.accent === accent
                              ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                              : "border-white/10 bg-white/5 text-white/45"
                          }`}
                        >
                          {accent}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {step === 1 ? (
              <Section
                title="Role and instructions"
                description="Instructions become the system prompt, verbatim."
              >
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="w-role">Role</Label>
                    <Input
                      id="w-role"
                      value={draft.role}
                      onChange={(event) => patch({ role: event.target.value })}
                      placeholder="researcher"
                    />
                  </div>
                  <div>
                    <Label htmlFor="w-instructions">Operating instructions</Label>
                    <Textarea
                      id="w-instructions"
                      value={draft.instructions}
                      onChange={(event) => patch({ instructions: event.target.value })}
                      rows={6}
                      placeholder="You research topics and produce sourced briefs."
                    />
                  </div>
                  <div>
                    <Label htmlFor="w-goals">Goals</Label>
                    <Textarea
                      id="w-goals"
                      value={draft.goals}
                      onChange={(event) => patch({ goals: event.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </Section>
            ) : null}

            {step === 2 ? (
              <Section title="Model" description="Primary routing and a fallback for outages.">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="w-model">Primary model</Label>
                    <select
                      id="w-model"
                      value={draft.model_id}
                      onChange={(event) => patch({ model_id: event.target.value })}
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
                    <Label htmlFor="w-fallback">Fallback model</Label>
                    <select
                      id="w-fallback"
                      value={draft.fallback_model_id}
                      onChange={(event) => patch({ fallback_model_id: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                    >
                      <option value="">None</option>
                      {models
                        .filter((model) => model.id !== draft.model_id)
                        .map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.display_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="w-temp">Temperature ({draft.temperature})</Label>
                      <input
                        id="w-temp"
                        type="range"
                        min={0}
                        max={2}
                        step={0.1}
                        value={draft.temperature}
                        onChange={(event) => patch({ temperature: Number(event.target.value) })}
                        className="mt-2 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="w-max">Max output tokens</Label>
                      <Input
                        id="w-max"
                        type="number"
                        min={256}
                        step={256}
                        value={draft.max_output_tokens}
                        onChange={(event) =>
                          patch({ max_output_tokens: Number(event.target.value) || 2048 })
                        }
                      />
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {step === 3 ? (
              <Section
                title="Tools"
                description="Capabilities this worker may call. Only the tools the runtime can dispatch are offered; the rest of the integration catalog is a connected surface, not a callable tool."
              >
                <ul className="space-y-1.5">
                  {toolKeys.map((key) => {
                    const active = draft.tool_keys.includes(key);
                    return (
                      <li key={key}>
                        <label
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 transition ${
                            active
                              ? "border-violet-400/30 bg-violet-500/10"
                              : "border-white/5 bg-black/30"
                          }`}
                        >
                          <span className="text-sm text-white/75">{toolNames.get(key) ?? key}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(event) =>
                              patch({
                                tool_keys: event.target.checked
                                  ? [...draft.tool_keys, key]
                                  : draft.tool_keys.filter((value) => value !== key),
                              })
                            }
                          />
                        </label>
                      </li>
                    );
                  })}
                  {toolKeys.length === 0 ? (
                    <li className="text-sm text-white/45">No assignable integrations.</li>
                  ) : null}
                </ul>
                <p className="mt-3 text-[11px] text-white/35">
                  A key that is not dispatchable — a connected surface such as a mailbox or a
                  document store — is assigned on the worker page and marked as surface only. It
                  records the connection; it never becomes a callable tool.
                </p>
              </Section>
            ) : null}

            {step === 4 ? (
              <Section
                title="Knowledge"
                description="Memory retrieval is on by default and can be switched off here."
              >
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={draft.memory_enabled}
                    onChange={(event) => patch({ memory_enabled: event.target.checked })}
                  />
                  Retrieve durable memory at execution time
                </label>
                <p className="mt-3 text-xs text-white/35">
                  Add and edit memory entries from the{" "}
                  <button
                    type="button"
                    className="text-violet-300 underline"
                    onClick={() => navigate("/agentos/memory")}
                  >
                    Memory
                  </button>{" "}
                  page once the worker exists.
                </p>
              </Section>
            ) : null}

            {step === 5 ? (
              <Section
                title="Policies"
                description="Guardrails the runtime enforces before any tool executes."
              >
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={draft.allow_web_access}
                      onChange={(event) => patch({ allow_web_access: event.target.checked })}
                    />
                    Allow web access (gates the web_fetch tool)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={draft.allow_artifacts}
                      onChange={(event) => patch({ allow_artifacts: event.target.checked })}
                    />
                    Allow writing artifacts (gates the artifact_write tool)
                  </label>

                  <div>
                    <p className="text-xs text-white/50" id="w-denied-label">
                      Denied tools
                    </p>
                    <div
                      role="group"
                      aria-labelledby="w-denied-label"
                      className="mt-2 flex flex-wrap gap-2"
                    >
                      {toolKeys.map((key) => {
                        const denied = draft.denied_tools.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={denied}
                            onClick={() =>
                              patch({
                                denied_tools: denied
                                  ? draft.denied_tools.filter((value) => value !== key)
                                  : [...draft.denied_tools, key],
                              })
                            }
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                              denied
                                ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                                : "border-white/10 bg-white/5 text-white/50"
                            }`}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-white/35">
                      A denied tool is never offered to the model, even when it is assigned.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50" id="w-approval-label">
                      Actions that require a human approval
                    </p>
                    <div
                      role="group"
                      aria-labelledby="w-approval-label"
                      className="mt-2 flex flex-wrap gap-2"
                    >
                      {toolKeys.map((key) => {
                        const gated = draft.approval_required_actions.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={gated}
                            onClick={() =>
                              patch({
                                approval_required_actions: gated
                                  ? draft.approval_required_actions.filter((value) => value !== key)
                                  : [...draft.approval_required_actions, key],
                              })
                            }
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                              gated
                                ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                                : "border-white/10 bg-white/5 text-white/50"
                            }`}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-[11px] text-white/35">
                      The runtime matches this list against the action type of a tool call, which is
                      the tool key itself.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="w-allowed-apps">Allowed app slugs</Label>
                    <Input
                      id="w-allowed-apps"
                      value={draft.allowed_app_slugs.join(", ")}
                      onChange={(event) =>
                        patch({
                          allowed_app_slugs: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="ai-design-studio, video-clipper"
                    />
                    <p className="mt-1 text-[11px] text-white/35">
                      An empty list means every app in the catalog is allowed.
                    </p>
                  </div>
                </div>
              </Section>
            ) : null}

            {step === 6 ? (
              <Section
                title="Schedule"
                description="Store the heartbeat here. For the recurring path, create a schedule after the worker exists."
              >
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={draft.heartbeat_enabled}
                      onChange={(event) => patch({ heartbeat_enabled: event.target.checked })}
                    />
                    Enable a heartbeat
                  </label>

                  {draft.heartbeat_enabled ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="w-cron">Cron</Label>
                          <Input
                            id="w-cron"
                            value={draft.cron}
                            onChange={(event) => patch({ cron: event.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="w-tz">Timezone</Label>
                          <Input
                            id="w-tz"
                            value={draft.timezone}
                            onChange={(event) => patch({ timezone: event.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="w-heartbeat-prompt">Heartbeat prompt</Label>
                        <Textarea
                          id="w-heartbeat-prompt"
                          value={draft.heartbeat_prompt}
                          onChange={(event) => patch({ heartbeat_prompt: event.target.value })}
                          rows={2}
                        />
                      </div>
                    </>
                  ) : null}

                  <p className="text-xs text-white/35">
                    Recurring automations live on the Schedules page ({scheduleCount} configured). A
                    schedule is what actually dispatches work to a worker on a timer.
                  </p>
                </div>
              </Section>
            ) : null}

            {step === 7 ? (
              <Section title="Review" description="Confirm before creating the worker.">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Name</dt>
                    <dd className="text-white/80">{draft.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Role</dt>
                    <dd className="text-white/80">{draft.role || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Workspace</dt>
                    <dd className="text-white/80">
                      {draft.workspace_id
                        ? workspaces.find((w) => w.id === draft.workspace_id)?.name ?? "—"
                        : "Personal"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Model</dt>
                    <dd className="text-white/80">
                      {draft.model_id}
                      {draft.fallback_model_id ? ` → ${draft.fallback_model_id}` : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Tools</dt>
                    <dd className="text-white/80">
                      {draft.tool_keys.length === 0
                        ? "none"
                        : draft.tool_keys.map((key) => toolNames.get(key) ?? key).join(", ")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Memory</dt>
                    <dd className="text-white/80">{draft.memory_enabled ? "on" : "off"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-white/40">Heartbeat</dt>
                    <dd className="text-white/80">
                      {draft.heartbeat_enabled ? `${draft.cron} (${draft.timezone})` : "off"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {draft.approval_required_actions.length > 0 ? (
                    <Pill tone="amber">
                      approval: {draft.approval_required_actions.join(", ")}
                    </Pill>
                  ) : null}
                  {draft.denied_tools.length > 0 ? (
                    <Pill tone="rose">denied: {draft.denied_tools.join(", ")}</Pill>
                  ) : null}
                  {draft.allowed_app_slugs.length > 0 ? (
                    <Pill tone="violet">apps: {draft.allowed_app_slugs.join(", ")}</Pill>
                  ) : (
                    <Pill tone="slate">apps: all</Pill>
                  )}
                </div>

                {submitError ? <p className="mt-4 text-sm text-rose-300">{submitError}</p> : null}

                <Button className="mt-4" disabled={submitting} onClick={() => void submit()}>
                  <Bot className="mr-2 h-4 w-4" aria-hidden="true" />
                  {submitting ? "Creating…" : "Create worker"}
                </Button>
              </Section>
            ) : null}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={step === 0 || submitting}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  disabled={!canAdvance || submitting}
                  onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        </AsyncBoundary>

        {loading ? (
          <div className="mt-4 flex justify-center">
            <Spinner />
          </div>
        ) : null}
      </div>
    </>
  );
};

export default WorkerNewPage;
