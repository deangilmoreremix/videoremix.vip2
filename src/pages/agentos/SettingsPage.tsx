// src/pages/agentos/SettingsPage.tsx
//
// Route: /dashboard/settings — the operator's preferences for the dashboard
// and the places their account and model settings live.

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Coins, Cpu, Moon, Plug, Sun, UserRound } from "lucide-react";
import { PageHeader, Section } from "../../components/agentos/ui";
import { useAgentOSTheme, type AgentOSTheme } from "../../components/agentos/shell/theme";
import { cn } from "../../lib/utils";
import { forgetKey, getStoredKey, type KeyProvider } from "../../lib/userApiKeys";

const THEMES: Array<{ value: AgentOSTheme; label: string; icon: typeof Sun }> = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
];

const LINKS = [
  { to: "/dashboard/models", label: "Models & provider keys", hint: "Choose models and bring your own API key.", icon: Cpu },
  { to: "/dashboard/connections", label: "Integrations", hint: "Connect the accounts your agents may use.", icon: Plug },
  { to: "/profile", label: "Profile", hint: "Your name, email and password.", icon: UserRound },
  { to: "/credits", label: "Credits & billing", hint: "Your plan and the credits your agents spend.", icon: Coins },
];

const PROVIDERS: Array<{ id: KeyProvider; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "xai", label: "xAI (Grok)" },
];

const mask = (key: string) => (key.length > 10 ? `${key.slice(0, 5)}…${key.slice(-4)}` : "saved");

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
