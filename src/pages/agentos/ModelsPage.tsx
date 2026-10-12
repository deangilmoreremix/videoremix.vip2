// src/pages/agentos/ModelsPage.tsx
//
// Model catalog and provider configuration.
//
// BYOK is read-only from the browser: a credential is sent once to the
// provider-test endpoint and only the returned credential_ref is displayed.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Cpu, KeyRound, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AsyncBoundary } from "../../components/agentos/shared";
import { EmptyState, PageHeader, Pill, Section, Spinner } from "../../components/agentos/ui";
import { Modal } from "../../components/agentos/ui/Modal";
import {
  createProviderConfig,
  deleteProviderConfig,
  listModelCatalog,
  listProviderConfigs,
  retestProviderConfig,
} from "../../services/agentos/models";
import type { ModelCatalogEntry, ProviderConfig, ProviderMode } from "../../types/agentos";

const CAPABILITY_LABELS: Record<string, string> = {
  text: "text",
  vision: "vision",
  tools: "tools",
  reasoning: "reasoning",
  audio: "audio",
  embeddings: "embeddings",
};

const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
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

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [modelsResult, providersResult] = await Promise.all([
        listModelCatalog(),
        listProviderConfigs(),
      ]);
      if (cancelled) return;
      setModels(modelsResult.data ?? []);
      setProviders(providersResult.data ?? []);
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
    reload();
  }, [provider, mode, label, credential, reload]);

  const retest = useCallback(
    async (providerConfig: ProviderConfig) => {
      setTestBusy(providerConfig.id);
      await retestProviderConfig(providerConfig.id);
      setTestBusy(null);
      reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (providerConfig: ProviderConfig) => {
      await deleteProviderConfig(providerConfig.id);
      reload();
    },
    [reload],
  );

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
          description="The routable model catalog and the providers a worker may be routed through."
        />

        <div className="mb-5 max-w-md">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter models by name, id or provider"
          />
        </div>

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
                        {model.context_window.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/35">In / 1K</dt>
                      <dd className="tabular-nums text-white/60">{model.credit_rate_in}</dd>
                    </div>
                    <div>
                      <dt className="text-white/35">Out / 1K</dt>
                      <dd className="tabular-nums text-white/60">{model.credit_rate_out}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </AsyncBoundary>
        </Section>

        <Section
          title="Providers"
          description="Credentials never leave the server. This page shows references only."
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
              description="Runs use the platform key by default. Add a BYOK provider to route some workers through your own account."
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
                  </div>
                  <div className="flex shrink-0 gap-2">
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
                      onClick={() => void remove(providerConfig)}
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

          {dialogError ? <p className="text-sm text-rose-300">{dialogError}</p> : null}
        </div>
      </Modal>
    </>
  );
};

export default ModelsPage;
