// src/pages/agentos/SettingsPage.tsx
//
// Route: /dashboard/settings — the operator's preferences for the dashboard
// and the places their account and model settings live.

import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, Coins, Cpu, Moon, Plug, Sun, UserRound } from "lucide-react";
import { PageHeader, Section } from "../../components/agentos/ui";
import { useAgentOSTheme, type AgentOSTheme } from "../../components/agentos/shell/theme";
import { cn } from "../../lib/utils";
import { forgetKey, getStoredKey, type KeyProvider } from "../../lib/userApiKeys";
import {
  getAgentKeyStatus,
  removeAgentKey,
  saveAgentKey,
  type AgentKeyStatus,
} from "../../services/agentos/agentKeys";

const THEMES: Array<{ value: AgentOSTheme; label: string; icon: typeof Sun }> = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];

const LINKS = [
  { to: "/dashboard/models", label: "Models & provider keys", hint: "Choose models and bring your own API key.", icon: Cpu },
  { to: "/dashboard/connections", label: "Integrations", hint: "Connect the accounts your agents may use.", icon: Plug },
  { to: "/profile", label: "Profile", hint: "Your name, email and password.", icon: UserRound },
  { to: "/credits", label: "Plan & billing", hint: "Your plan and purchases.", icon: Coins },
];

const PROVIDERS: Array<{ id: KeyProvider; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "xai", label: "xAI (Grok)" },
];

const mask = (key: string) => (key.length > 10 ? `${key.slice(0, 5)}…${key.slice(-4)}` : "saved");

/**
 * "Let my agents use this key": agents run on the server, often while the
 * browser is closed, so they need the owner's key stored server-side. It is
 * opt-in, encrypted in Supabase Vault, and never shown again (only a hint).
 */
const AgentKeySection: React.FC = () => {
  const [status, setStatus] = useState<AgentKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [draft, setDraft] = useState("");
  const deviceKey = getStoredKey("openai");

  useEffect(() => {
    let cancelled = false;
    void getAgentKeyStatus().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.ok) setStatus(result.status);
      else setMessage({ tone: "error", text: result.message });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (key: string) => {
    if (!key.trim()) return;
    setBusy(true);
    setMessage(null);
    const result = await saveAgentKey(key.trim());
    setBusy(false);
    if (result.ok) {
      setStatus(result.status);
      setDraft("");
      setMessage({ tone: "ok", text: "Saved. Your agents now run on this key." });
    } else {
      setMessage({ tone: "error", text: result.message });
    }
  };

  const remove = async () => {
    setBusy(true);
    setMessage(null);
    const result = await removeAgentKey();
    setBusy(false);
    if (result.ok) {
      setStatus(result.status);
      setMessage({ tone: "ok", text: "Removed. Agents stop running until you add a key again." });
    } else {
      setMessage({ tone: "error", text: result.message });
    }
  };

  return (
    <Section
      title="Let my agents use this key"
      description="Agents run on the server, also while this browser is closed, so they need your OpenAI key there. It is checked with OpenAI, stored encrypted, used only for your agents' runs, and never shown again."
      className="mt-5"
    >
      {loading ? (
        <p className="text-sm text-white/50">Checking…</p>
      ) : status?.saved ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-white">
            <Bot className="h-4 w-4 text-agentos-brand" aria-hidden="true" />
            Agents use your OpenAI key <span className="font-mono text-white/50">{status.hint}</span>
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06] disabled:opacity-50"
          >
            Stop using this key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {deviceKey ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(deviceKey)}
              className="bg-agentos-brand rounded-xl px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Checking the key…" : `Use my saved key ${mask(deviceKey)} for agents`}
            </button>
          ) : null}
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void save(draft);
            }}
          >
            <label htmlFor="agent-openai-key" className="sr-only">
              OpenAI API key for your agents
            </label>
            <input
              id="agent-openai-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={deviceKey ? "Or paste a different key: sk-…" : "Paste your OpenAI API key: sk-…"}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:border-agentos-brand/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/[0.06] disabled:opacity-50"
            >
              {busy ? "Checking…" : "Save for agents"}
            </button>
          </form>
          <p className="text-xs text-white/40">
            No key yet?{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-agentos-brand hover:underline"
            >
              Create one at OpenAI
            </a>
            .
          </p>
        </div>
      )}
      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={cn("mt-3 text-sm", message.tone === "error" ? "text-red-400" : "text-emerald-400")}
        >
          {message.text}
        </p>
      ) : null}
    </Section>
  );
};

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useAgentOSTheme();
  const [keys, setKeys] = useState(() =>
    Object.fromEntries(PROVIDERS.map(({ id }) => [id, getStoredKey(id)])) as Record<KeyProvider, string>,
  );

  return (
    <>
      <Helmet>
        <title>Settings — SapienX AgentOS</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader title="Settings" description="How the dashboard looks, and where everything else is configured." />

        <Section title="Appearance" description="Saved in this browser.">
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition",
                  theme === value
                    ? "border-agentos-brand/60 bg-agentos-brand/10 text-white"
                    : "border-white/10 text-white/60 hover:bg-white/[0.04]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title="Your API keys"
          description="The apps run on your own provider keys. They are saved in this browser only and sent only with your runs."
          className="mt-5"
          contentClassName="p-0"
        >
          <ul className="divide-y divide-white/[0.06]">
            {PROVIDERS.map(({ id, label }) => (
              <li key={id} className="flex items-center justify-between gap-3 px-5 py-4">
                <span className="min-w-0">
                  <span className="block text-sm text-white">{label}</span>
                  <span className="block font-mono text-xs text-white/45">
                    {keys[id] ? mask(keys[id]) : "Not saved. You are asked for it when you run an app."}
                  </span>
                </span>
                {keys[id] ? (
                  <button
                    type="button"
                    onClick={() => {
                      forgetKey(id);
                      setKeys((current) => ({ ...current, [id]: "" }));
                    }}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06]"
                  >
                    Forget key
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <AgentKeySection />

        <Section title="Account and workforce" className="mt-5" contentClassName="p-0">
          <ul className="divide-y divide-white/[0.06]">
            {LINKS.map(({ to, label, hint, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.03]">
                  <Icon className="h-4 w-4 shrink-0 text-agentos-brand" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white">{label}</span>
                    <span className="block text-xs text-white/45">{hint}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/30" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
};

export default SettingsPage;
