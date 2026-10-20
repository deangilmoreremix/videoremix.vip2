// src/pages/agentos/ModelsPage.tsx
//
// Model catalog and provider configuration.
//
// BYOK is read-only from the browser: a credential is sent once to the
// provider-test endpoint and only the returned credential_ref is displayed.
//
// WHAT THIS PAGE DOES NOT CLAIM
//   A BYOK credential is stored as a reference, and this port has no secret
//   store behind that reference: the runtime always calls the provider with
//   the platform key. The copy on this page says so — a provider that cannot
//   be routed through is described as not routable rather than as a working
//   alternative to the platform key.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Calculator, Cpu, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Pill,
  SearchInput,
  Section,
  Spinner,
} from "../../components/agentos/ui";
import { Modal } from "../../components/agentos/ui/Modal";
import { formatCredits, formatDecimal, formatInteger } from "../../components/agentos/format";
import {
  createProviderConfig,
  deleteProviderConfig,
  estimateCredits,
  listModelCatalog,
  listProviderConfigs,
  retestProviderConfig,
  testProvider,
  updateProviderConfig,
} from "../../services/agentos/models";
import { listWorkspaces } from "../../services/agentos/workspaces";
import type { ModelCatalogEntry, ProviderConfig, ProviderMode, Workspace } from "../../types/agentos";

const CAPABILITY_LABELS: Record<string, string> = {
  text: "text",
  vision: "vision",
  tools: "tools",
  reasoning: "reasoning",
  audio: "audio",
  embeddings: "embeddings",
};

interface ProviderDraft {
  id: string;
  label: string;
  provider: string;
  mode: ProviderMode;
  credentialRef: string | null;
  modelIds: string[];
  isDefault: boolean;
  enabled: boolean;
  workspaceId: string;
}

interface EstimateDraft {
  modelId: string;
  promptTokens: string;
  completionTokens: string;
}

const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState<string | null>(null);

  const [provider, setProvider] = useState("openai");
  const [mode, setMode] = useState<ProviderMode>("platform");
  const [label, setLabel] = useState("");
  const [credential, setCredential] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  // Provider configuration.
  const [draft, setDraft] = useState<ProviderDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProviderConfig | null>(null);

  // Cost estimate.
  const [estimate, setEstimate] = useState<EstimateDraft | null>(null);
  const [estimateResult, setEstimateResult] = useState<string | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateBusy, setEstimateBusy] = useState(false);

  // A dry-run probe: asks the provider whether it answers right now, without
  // recording anything. The Test button on the list is the one that persists
  // the outcome onto the configuration.
  const [probeBusy, setProbeBusy] = useState(false);
  const [probeNote, setProbeNote] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [modelsResult, providersResult, workspacesResult] = await Promise.all([
        listModelCatalog(),
        listProviderConfigs(),
        listWorkspaces(),
      ]);
      if (cancelled) return;
      setModels(modelsResult.data ?? []);
      setProviders(providersResult.data ?? []);
      setWorkspaces(workspacesResult.data ?? []);
      setError(modelsResult.error?.message ?? providersResult.error?.message ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const visibleModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((model) =>
      [model.id, model.display_name, model.provider, model.family]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [models, query]);

  const save = useCallback(async () => {
    setSaving(true);
    setDialogError(null);
    const result = await createProviderConfig({
      provider,
      mode,
      label: label || provider,
      // The workspace the provider is shared with. Writing it is what lets
      // the workspace-scoped RLS policy apply.
      workspace_id: workspaceId || null,
      credential: mode === "byok" ? credential : undefined,
    });
    setSaving(false);
    if (result.error) {
      setDialogError(result.error.message);
      return;
    }
    setDialogOpen(false);
    setCredential("");
    setLabel("");
    setWorkspaceId("");
    setStatus("Provider added");
    reload();
  }, [provider, mode, label, credential, workspaceId, reload]);

  const retest = useCallback(
    async (providerConfig: ProviderConfig) => {
      setTestBusy(providerConfig.id);
      setStatus(null);
      setActionError(null);
      const result = await retestProviderConfig(providerConfig.id);
      setTestBusy(null);
      if (result.error) {
        setActionError(`Could not test ${providerConfig.label}: ${result.error.message}`);
        return;
      }
      const note = result.data?.last_test_note ?? "";
      if (result.data?.status === "active") {
        setStatus(`${providerConfig.label} passed the readiness test`);
      } else if (result.data?.status === "error") {
        setStatus(`${providerConfig.label} failed the readiness test: ${note}`);
      } else {
        // The probe could not run (for example: the credential is stored as a
        // reference and this deployment has no secret store behind it). That
        // is not a failure of the provider, so it is not reported as one.
        setStatus(
          `${providerConfig.label} was not tested: ${note || "the provider could not be probed"}`,
        );
      }
      reload();
    },
    [reload],
  );

  const remove = useCallback(async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setDeleteError(null);
    const result = await deleteProviderConfig(confirmDelete.id);
    setSaving(false);
    if (result.error) {
      setDeleteError(`Could not delete ${confirmDelete.label}: ${result.error.message}`);
      return;
    }
    setStatus(`${confirmDelete.label} deleted`);
    setConfirmDelete(null);
    reload();
  }, [confirmDelete, reload]);

  const openProviderDraft = useCallback((providerConfig: ProviderConfig) => {
    setDraft({
      id: providerConfig.id,
      label: providerConfig.label,
      provider: providerConfig.provider,
      mode: providerConfig.mode,
      credentialRef: providerConfig.credential_ref,
      modelIds: providerConfig.model_ids ?? [],
      isDefault: providerConfig.is_default,
      enabled: providerConfig.status !== "disabled",
      workspaceId: providerConfig.workspace_id ?? "",
    });
    setDraftError(null);
    setActionError(null);
    setProbeNote(null);
  }, []);

  const saveProviderDraft = useCallback(async () => {
    if (!draft) return;
    if (!draft.label.trim()) {
      setDraftError("Give the provider a label");
      return;
    }

    setSaving(true);
    setDraftError(null);
    const result = await updateProviderConfig(draft.id, {
      label: draft.label.trim(),
      model_ids: draft.modelIds,
      is_default: draft.isDefault,
      enabled: draft.enabled,
      workspace_id: draft.workspaceId || null,
    });
    setSaving(false);

    if (result.error) {
      setDraftError(`Could not update the provider: ${result.error.message}`);
      return;
    }
    if (result.data) {
      setProviders((current) =>
        current.map((row) => (row.id === result.data!.id ? result.data! : row)),
      );
    }
    setDraft(null);
    setStatus("Provider updated");
    reload();
  }, [draft, reload]);

  const openEstimate = useCallback((model: ModelCatalogEntry) => {
    setEstimate({ modelId: model.id, promptTokens: "1000", completionTokens: "500" });
    setEstimateResult(null);
    setEstimateError(null);
  }, []);

  const runEstimate = useCallback(async () => {
    if (!estimate) return;
    const promptTokens = Number(estimate.promptTokens);
    const completionTokens = Number(estimate.completionTokens);
    if (!Number.isFinite(promptTokens) || promptTokens < 0) {
      setEstimateError("Enter a prompt token count of zero or more");
      return;
    }
    if (!Number.isFinite(completionTokens) || completionTokens < 0) {
      setEstimateError("Enter a completion token count of zero or more");
      return;
    }

    setEstimateBusy(true);
    setEstimateError(null);
    setEstimateResult(null);
    const result = await estimateCredits({
      modelId: estimate.modelId,
      promptTokens: Math.round(promptTokens),
      completionTokens: Math.round(completionTokens),
    });
    setEstimateBusy(false);

    if (result.error) {
      setEstimateError(result.error.message);
      return;
    }
    setEstimateResult(formatCredits(result.data));
  }, [estimate]);

  const probeProvider = useCallback(async () => {
    if (!draft) return;
    setProbeBusy(true);
    setProbeNote(null);
    const result = await testProvider({
      provider: draft.provider,
      mode: draft.mode,
      credential_ref: draft.credentialRef ?? undefined,
    });
    setProbeBusy(false);

    if (result.error) {
      // "not configured" is not a failed probe: the reference cannot be
      // resolved because this deployment has no secret store behind it.
      setProbeNote(
        result.error.code === "not_configured"
          ? `Not tested: ${result.error.message}`
          : `Probe failed: ${result.error.message}`,
      );
      return;
    }
    if (!result.data?.ok) {
      setProbeNote(`Probe failed: ${result.data?.error ?? "the provider did not answer"}`);
      return;
    }
    setProbeNote("Probe succeeded. Nothing was changed — use Test to record the result.");
  }, [draft]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Spinner label="Loading model catalog…" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Models — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader
          title="Models"
          description="The model catalog the runtime can call, and the provider credentials configured for your account."
        />

        <div className="mb-5 max-w-md">
          <SearchInput
            id="model-search"
            label="Filter models"
            value={query}
            onChange={setQuery}
            placeholder="Filter models by name, id or provider"
          />
        </div>

        {status ? (
          <p role="status" className="mb-4 text-sm text-white/60">
            {status}
          </p>
        ) : null}
        {actionError ? (
          <p role="alert" className="mb-4 text-sm text-rose-300">
            {actionError}
          </p>
        ) : null}

        <Section
          title="Model catalog"
          description="Credit rates mirror the runtime's billing table, so the price shown here is the price charged."
          className="mb-8"
        >
          <AsyncBoundary
            loading={false}
            error={error}
            onRetry={reload}
            isEmpty={visibleModels.length === 0}
            empty={
              <EmptyState
                icon={Cpu}
                title="No models match that filter"
                description="Try a different name, id or provider."
              />
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {visibleModels.map((model) => (
                <div key={model.id} className="rounded-xl border border-white/5 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{model.display_name}</p>
                    <Pill tone="slate">{model.provider}</Pill>
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/35">{model.id}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(model.capabilities ?? []).map((capability) => (
                      <Pill key={capability} tone="sky">
                        {CAPABILITY_LABELS[capability] ?? capability}
                      </Pill>
                    ))}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <dt className="text-white/35">Context</dt>
                      <dd className="tabular-nums text-white/60">
                        {formatInteger(model.context_window)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/35">In / 1K</dt>
                      <dd className="tabular-nums text-white/60">
                        {formatDecimal(model.credit_rate_in)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/35">Out / 1K</dt>
                      <dd className="tabular-nums text-white/60">
                        {formatDecimal(model.credit_rate_out)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEstimate(model)}
                      aria-label={`Estimate the cost of ${model.display_name}`}
                    >
                      <Calculator className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      Estimate cost
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AsyncBoundary>
        </Section>

        <Section
          title="Providers"
          description="A credential is stored as an opaque reference, never in the browser. Platform-mode providers run on the platform key. A BYOK provider is not routable until a secret store is wired behind its reference."
          actions={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Add provider
            </Button>
          }
        >
          {providers.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No providers configured"
              description="Runs use the platform key by default. You can still store a BYOK credential here, but it stays a reference until a secret store is wired — it does not route runs yet."
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  Add provider
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {providers.map((providerConfig) => (
                <li
                  key={providerConfig.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-white/80">{providerConfig.label}</p>
                      <Pill tone="violet">{providerConfig.provider}</Pill>
                      <Pill tone={providerConfig.mode === "byok" ? "sky" : "slate"}>
                        {providerConfig.mode}
                      </Pill>
                      <Pill
                        tone={
                          providerConfig.status === "active"
                            ? "emerald"
                            : providerConfig.status === "error"
                              ? "rose"
                              : "slate"
                        }
                      >
                        {providerConfig.status}
                      </Pill>
                      {providerConfig.is_default ? <Pill tone="amber">default</Pill> : null}
                      {providerConfig.mode === "byok" ? (
                        <Pill tone="amber" title="No secret store is wired behind the reference yet">
                          not routable
                        </Pill>
                      ) : null}
                      {providerConfig.workspace_id ? (
                        <Pill tone="violet">
                          workspace:{" "}
                          {workspaces.find((w) => w.id === providerConfig.workspace_id)?.name ??
                            providerConfig.workspace_id}
                        </Pill>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {providerConfig.credential_ref
                        ? `ref ${providerConfig.credential_ref.slice(0, 18)}…`
                        : "platform key"}
                      {providerConfig.last_test_at
                        ? ` · tested ${new Date(providerConfig.last_test_at).toLocaleString()}`
                        : ""}
                      {providerConfig.last_test_note ? ` · ${providerConfig.last_test_note}` : ""}
                    </p>
                    {providerConfig.mode === "byok" ? (
                      <p className="mt-0.5 text-[11px] text-white/35">
                        The credential is stored as a reference. Nothing in this deployment can
                        resolve it to a key yet, so this provider does not route runs.
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-white/35">
                      models:{" "}
                      {(providerConfig.model_ids ?? []).length > 0
                        ? providerConfig.model_ids.join(", ")
                        : "all in the catalog"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProviderDraft(providerConfig)}
                      aria-label={`Edit ${providerConfig.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={testBusy === providerConfig.id}
                      onClick={() => void retest(providerConfig)}
                    >
                      {testBusy === providerConfig.id ? "Testing…" : "Test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => {
                        setDeleteError(null);
                        setConfirmDelete(providerConfig);
                      }}
                      aria-label={`Delete ${providerConfig.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {draft ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
          title="Provider configuration"
          description="Rename the provider, choose which models it serves, and decide whether it is the default route."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={saving} onClick={() => void saveProviderDraft()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50" htmlFor="provider-label">
                Label
              </label>
              <Input
                id="provider-label"
                value={draft.label}
                onChange={(event) => setDraft({ ...draft, label: event.target.value })}
              />
            </div>

            <div>
              <p className="text-xs text-white/50" id="provider-models-label">
                Models served by this provider
              </p>
              <div
                role="group"
                aria-labelledby="provider-models-label"
                className="mt-2 flex flex-wrap gap-2"
              >
                {models.map((model) => {
                  const active = draft.modelIds.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          modelIds: active
                            ? draft.modelIds.filter((id) => id !== model.id)
                            : [...draft.modelIds, model.id],
                        })
                      }
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                        active
                          ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                          : "border-white/10 bg-white/5 text-white/50"
                      }`}
                    >
                      {model.display_name}
                    </button>
                  );
                })}
                {models.length === 0 ? (
                  <p className="text-xs text-white/35">The model catalog is empty.</p>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-white/35">
                An empty selection means every model in the catalog.
              </p>
            </div>

            <div>
              <label className="text-xs text-white/50" htmlFor="provider-workspace">
                Share with a workspace
              </label>
              <select
                id="provider-workspace"
                value={draft.workspaceId}
                onChange={(event) => setDraft({ ...draft, workspaceId: event.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="">Personal (no workspace)</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-white/35">
                A workspace-scoped provider is visible to that workspace&apos;s members.
              </p>
            </div>

            <div role="group" aria-label="Provider routing" className="space-y-2">
              <button
                type="button"
                aria-pressed={draft.isDefault}
                onClick={() => setDraft({ ...draft, isDefault: !draft.isDefault })}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  draft.isDefault
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                    : "border-white/10 bg-black/40 text-white/60"
                }`}
              >
                Default provider
                <span className="ml-2 text-[11px] text-white/40">
                  {draft.isDefault
                    ? "on — this provider is the default route"
                    : "off — another provider is the default"}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={draft.enabled}
                onClick={() => setDraft({ ...draft, enabled: !draft.enabled })}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  draft.enabled
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-black/40 text-white/60"
                }`}
              >
                Enabled
                <span className="ml-2 text-[11px] text-white/40">
                  {draft.enabled
                    ? draft.mode === "byok"
                      ? "on — enabled for this account, but a BYOK credential does not route runs until a secret store is wired"
                      : "on — the runtime may route through this provider with the platform key"
                    : "off — the runtime must not route through this provider"}
                </span>
              </button>
            </div>

            {draftError ? (
              <p role="alert" className="text-sm text-rose-300">
                {draftError}
              </p>
            ) : null}

            <div className="border-t border-white/5 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={probeBusy}
                  onClick={() => void probeProvider()}
                >
                  {probeBusy ? "Probing…" : "Probe provider"}
                </Button>
                <span className="text-[11px] text-white/35">
                  Asks the provider whether it answers now. Nothing is recorded. A BYOK reference
                  cannot be resolved without a secret store, so the probe reports that it is not
                  configured rather than failing.
                </span>
              </div>
              {probeNote ? (
                <p role="status" className="mt-2 text-xs text-white/55">
                  {probeNote}
                </p>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}

      {estimate ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setEstimate(null);
          }}
          title="Cost estimate"
          description="Priced from the same credit rates the runtime charges."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEstimate(null)}>
                Close
              </Button>
              <Button size="sm" disabled={estimateBusy} onClick={() => void runEstimate()}>
                {estimateBusy ? "Estimating…" : "Estimate"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Model <span className="text-white/85">{estimate.modelId}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/50" htmlFor="estimate-prompt">
                  Prompt tokens
                </label>
                <Input
                  id="estimate-prompt"
                  type="number"
                  min={0}
                  value={estimate.promptTokens}
                  onChange={(event) =>
                    setEstimate({ ...estimate, promptTokens: event.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-white/50" htmlFor="estimate-completion">
                  Completion tokens
                </label>
                <Input
                  id="estimate-completion"
                  type="number"
                  min={0}
                  value={estimate.completionTokens}
                  onChange={(event) =>
                    setEstimate({ ...estimate, completionTokens: event.target.value })
                  }
                />
              </div>
            </div>

            {estimateResult ? (
              <p role="status" className="text-sm text-violet-200">
                Estimated cost: {estimateResult} credits
              </p>
            ) : null}
            {estimateError ? (
              <p role="alert" className="text-sm text-rose-300">
                {estimateError}
              </p>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={confirmDelete ? `Delete ${confirmDelete.label}?` : "Delete provider"}
        description="The provider configuration and its credential reference are removed. Workers routed through it will fall back to the default provider. This cannot be undone."
        confirmLabel="Delete provider"
        busy={saving}
        error={deleteError}
        onConfirm={() => void remove()}
      />

      <Modal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Add provider"
        description="Platform mode uses the server-side key. BYOK sends your credential once and stores only a reference."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? "Verifying…" : "Add provider"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50" htmlFor="prov-provider">
              Provider
            </label>
            <select
              id="prov-provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="prov-mode">
              Mode
            </label>
            <select
              id="prov-mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as ProviderMode)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="platform">Platform key</option>
              <option value="byok">Bring your own key</option>
            </select>
            <p className="mt-1 text-[11px] text-white/35">
              {mode === "platform"
                ? "The platform key on the server runs the models. Nothing is stored against your account."
                : "Your credential is verified once and stored as a reference. This deployment has no secret store behind that reference yet, so a BYOK provider does not route runs."}
            </p>
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="prov-label">
              Label
            </label>
            <Input
              id="prov-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="My OpenAI key"
            />
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="prov-workspace">
              Share with a workspace
            </label>
            <select
              id="prov-workspace"
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">Personal (no workspace)</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-white/35">
              A workspace-scoped provider is visible to that workspace&apos;s members.
            </p>
          </div>
          {mode === "byok" ? (
            <div>
              <label className="text-xs text-white/50" htmlFor="prov-credential">
                API key
              </label>
              <Input
                id="prov-credential"
                type="password"
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                placeholder="sk-…"
                autoComplete="off"
              />
              <p className="mt-1 text-[11px] text-white/35">
                Sent once for verification. Never stored, never shown again.
              </p>
            </div>
          ) : null}

          {dialogError ? (
            <p role="alert" className="text-sm text-rose-300">
              {dialogError}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

export default ModelsPage;
