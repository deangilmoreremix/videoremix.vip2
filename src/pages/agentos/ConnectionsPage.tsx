// src/pages/agentos/ConnectionsPage.tsx
//
// Connected work surfaces.
//
// The directory only ever lists supported and limited integrations. Anything
// the port does not wire — OpenClaw in particular — is absent rather than
// present-and-disabled, so it can never look like a working tool.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plug, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AsyncBoundary } from "../../components/agentos/shared";
import {
  ConfirmDialog,
  EmptyState,
  FilterGroup,
  PageHeader,
  Pill,
  SearchInput,
  Section,
} from "../../components/agentos/ui";
import { Modal } from "../../components/agentos/ui/Modal";
import {
  connectAccount,
  deleteConnection,
  listConnectedAccounts,
  listIntegrations,
  revokeAccount,
} from "../../services/agentos/connections";
import type { ConnectedAccount, Integration } from "../../types/agentos";

type SupportTab = "all" | "supported" | "limited";

const SUPPORT_TABS: Array<{ value: SupportTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "supported", label: "Supported" },
  { value: "limited", label: "Limited" },
];

const SUPPORT_TONE: Record<string, "emerald" | "amber" | "rose"> = {
  supported: "emerald",
  limited: "amber",
  unsupported: "rose",
};

const HEALTH_TONE: Record<string, "slate" | "emerald" | "amber" | "rose"> = {
  unknown: "slate",
  healthy: "emerald",
  degraded: "amber",
  failed: "rose",
};

const ConnectionsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<SupportTab>("all");
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [label, setLabel] = useState("");
  const [credential, setCredential] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<ConnectedAccount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConnectedAccount | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [integrationsResult, accountsResult] = await Promise.all([
        listIntegrations(),
        // Revoked accounts stay visible: a revoked row is the one that can be
        // deleted outright, and hiding it would leave no way to remove it.
        listConnectedAccounts({ includeRevoked: true }),
      ]);
      if (cancelled) return;
      setIntegrations(integrationsResult.data ?? []);
      setAccounts(accountsResult.data ?? []);
      setError(
        integrationsResult.error?.message ??
          accountsResult.error?.message ??
          null,
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return integrations.filter((integration) => {
      // Unsupported integrations are never shown, even if one somehow arrives.
      if (integration.support === "unsupported") return false;
      if (tab !== "all" && integration.support !== tab) return false;
      if (!needle) return true;
      return [integration.name, integration.description, integration.category]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [integrations, tab, query]);

  const accountCount = useCallback(
    (integrationKey: string) =>
      accounts.filter((account) => account.integration_key === integrationKey)
        .length,
    [accounts],
  );

  const openConnect = useCallback((integration: Integration) => {
    setConnecting(integration);
    setLabel(integration.name);
    setCredential("");
    setScopes(integration.capabilities ?? []);
    setDialogError(null);
  }, []);

  const submitConnect = useCallback(async () => {
    if (!connecting) return;
    setSaving(true);
    setDialogError(null);
    const result = await connectAccount({
      integration_key: connecting.key,
      account_label: label || connecting.name,
      scopes,
      credential: credential || undefined,
    });
    setSaving(false);
    if (result.error) {
      setDialogError(result.error.message);
      return;
    }
    setConnecting(null);
    reload();
  }, [connecting, label, scopes, credential, reload]);

  const revoke = useCallback(async () => {
    if (!confirmRevoke) return;
    setSaving(true);
    setRevokeError(null);
    const result = await revokeAccount(confirmRevoke.id);
    setSaving(false);
    if (result.error) {
      setRevokeError(`Could not revoke ${confirmRevoke.account_label}: ${result.error.message}`);
      return;
    }
    setStatus(`${confirmRevoke.account_label} revoked`);
    setConfirmRevoke(null);
    reload();
  }, [confirmRevoke, reload]);

  const remove = useCallback(async () => {
    if (!confirmDelete) return;
    setSaving(true);
    setDeleteError(null);
    const result = await deleteConnection(confirmDelete.id);
    setSaving(false);
    if (result.error) {
      setDeleteError(`Could not delete ${confirmDelete.account_label}: ${result.error.message}`);
      return;
    }
    setStatus(`${confirmDelete.account_label} deleted`);
    setConfirmDelete(null);
    reload();
  }, [confirmDelete, reload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-white/40">Loading connections…</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Connections — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageHeader
          title="Connected surfaces"
          description="Integrations a worker may call. Credentials are stored server-side; this page shows references and scopes only."
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              id="connection-search"
              label="Search integrations"
              value={query}
              onChange={setQuery}
              placeholder="Search integrations"
            />
          </div>
          <FilterGroup
            label="Filter integrations by support level"
            options={SUPPORT_TABS}
            value={tab}
            onChange={setTab}
          />
        </div>

        {status ? (
          <p role="status" className="mb-4 text-sm text-white/60">
            {status}
          </p>
        ) : null}

        <AsyncBoundary
          loading={false}
          error={error}
          onRetry={reload}
          isEmpty={visible.length === 0}
          empty={
            <EmptyState
              icon={Plug}
              title="No integrations match"
              description="Try a different search or support level."
            />
          }
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((integration) => {
              const count = accountCount(integration.key);
              return (
                <div
                  key={integration.key}
                  className="flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white">{integration.name}</p>
                    <Pill tone={SUPPORT_TONE[integration.support]}>
                      {integration.support}
                    </Pill>
                  </div>
                  <p className="mt-1.5 flex-1 text-xs text-white/50">
                    {integration.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(integration.capabilities ?? []).map((capability) => (
                      <Pill key={capability} tone="sky">
                        {capability}
                      </Pill>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-white/35">
                      {count === 0 ? "not connected" : `${count} connected`}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openConnect(integration)}
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </AsyncBoundary>

        <Section
          title="Connected accounts"
          description="Revoking removes the authorization record. The credential itself is discarded, not returned. A revoked account can be deleted outright."
          className="mt-8"
        >
          {accounts.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No connected accounts"
              description="Connect an integration above to authorize a worker to use it."
            />
          ) : (
            <ul className="space-y-2">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-white/80">
                        {account.account_label}
                      </p>
                      <Pill
                        tone={
                          account.status === "connected" ? "emerald" : "slate"
                        }
                      >
                        {account.status}
                      </Pill>
                      <Pill tone={HEALTH_TONE[account.health_status]}>
                        {account.health_status}
                      </Pill>
                      <Pill tone="slate">{account.isolation}</Pill>
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {account.integration_key}
                      {account.credential_ref
                        ? ` · ref ${account.credential_ref.slice(0, 18)}…`
                        : ""}
                      {account.last_checked_at
                        ? ` · checked ${new Date(account.last_checked_at).toLocaleString()}`
                        : ""}
                      {account.revoked_at
                        ? ` · revoked ${new Date(account.revoked_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {account.status === "connected" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                        onClick={() => {
                          setRevokeError(null);
                          setConfirmRevoke(account);
                        }}
                        aria-label={`Revoke ${account.account_label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                        onClick={() => {
                          setDeleteError(null);
                          setConfirmDelete(account);
                        }}
                        aria-label={`Delete ${account.account_label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <ConfirmDialog
        open={confirmRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRevoke(null);
        }}
        title={confirmRevoke ? `Revoke ${confirmRevoke.account_label}?` : "Revoke account"}
        description="Revoking discards the credential and removes the authorization record. Workers can no longer use this surface."
        confirmLabel="Revoke account"
        busy={saving}
        error={revokeError}
        onConfirm={() => void revoke()}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={confirmDelete ? `Delete ${confirmDelete.account_label}?` : "Delete connection"}
        description="The authorization record is removed from the database. Only an account that is no longer connected can be deleted, and this cannot be undone."
        confirmLabel="Delete connection"
        busy={saving}
        error={deleteError}
        onConfirm={() => void remove()}
      />

      {connecting ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setConnecting(null);
          }}
          title={`Connect ${connecting.name}`}
          description="Only the scopes this integration advertises can be requested."
          footer={
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConnecting(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saving}
                onClick={() => void submitConnect()}
              >
                {saving ? "Connecting…" : "Connect"}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50" htmlFor="conn-label">
                Account label
              </label>
              <Input
                id="conn-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>

            <div>
              <p className="text-xs text-white/50">Scopes</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(connecting.capabilities ?? []).map((capability) => {
                  const active = scopes.includes(capability);
                  return (
                    <button
                      key={capability}
                      type="button"
                      onClick={() =>
                        setScopes((current) =>
                          active
                            ? current.filter((scope) => scope !== capability)
                            : [...current, capability],
                        )
                      }
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                        active
                          ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                          : "border-white/10 bg-white/5 text-white/50"
                      }`}
                    >
                      {capability}
                    </button>
                  );
                })}
                {(connecting.capabilities ?? []).length === 0 ? (
                  <p className="text-xs text-white/35">No scopes required.</p>
                ) : null}
              </div>
            </div>

            {connecting.auth_type !== "none" ? (
              <div>
                <label
                  className="text-xs text-white/50"
                  htmlFor="conn-credential"
                >
                  Credential (optional)
                </label>
                <Input
                  id="conn-credential"
                  type="password"
                  value={credential}
                  onChange={(event) => setCredential(event.target.value)}
                  autoComplete="off"
                />
                <p className="mt-1 text-[11px] text-white/35">
                  Sent once. Only a reference is stored.
                </p>
              </div>
            ) : null}

            {dialogError ? (
              <p className="text-sm text-rose-300">{dialogError}</p>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
};

export default ConnectionsPage;
