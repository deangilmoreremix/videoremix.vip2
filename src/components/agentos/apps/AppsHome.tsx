// src/components/agentos/apps/AppsHome.tsx
//
// The top of the dashboard home: find an app, add your key once, run it.
// Below it the home page keeps the AI workforce overview.

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppWindow, ArrowRight, Check, KeyRound, Search, X } from "lucide-react";
import { getAppMeta, type AppMeta } from "../../../config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../../../config/agentRegistry";
import { APP_CATEGORIES, categoryLabel, searchApps } from "../../../config/appCategories";
import { getStoredKey, storeKey } from "../../../lib/userApiKeys";
import {
  dismissGetStarted,
  getRecentApps,
  hasRunAnApp,
  isGetStartedDismissed,
} from "../../../lib/recentApps";
import { cn } from "../../../lib/utils";

/** Where an app opens in the dashboard (the same rule as the App Library). */
function appPath(app: AppMeta): string {
  return AGENT_PAGE_SLUGS.has(app.slug) ? `/dashboard/agents/${app.slug}` : `/dashboard/apps/${app.slug}`;
}

export const AppsHome: React.FC<{ openApp: (app: AppMeta) => void }> = ({ openApp }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [keySaved, setKeySaved] = useState(() => Boolean(getStoredKey("openai")));
  const [keyDraft, setKeyDraft] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(isGetStartedDismissed);
  const recent = useMemo(
    () => getRecentApps().map((slug) => getAppMeta(slug)).filter((app): app is AppMeta => Boolean(app)),
    [],
  );
  const ran = hasRunAnApp();
  const results = useMemo(() => searchApps(query), [query]);

  const steps = [
    { done: keySaved, label: "Add your OpenAI key" },
    { done: recent.length > 0, label: "Pick an app" },
    { done: ran, label: "Run it" },
  ];
  const showGetStarted = !dismissed && steps.some((step) => !step.done);

  const saveKey = () => {
    const key = keyDraft.trim();
    if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(key)) {
      setKeyError("That doesn't look like an OpenAI key. It starts with sk-.");
      return;
    }
    storeKey("openai", key);
    setKeyDraft("");
    setKeyError(null);
    setKeySaved(true);
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="find-app" className="agentos-card rounded-2xl p-5 sm:p-6">
        <h2 id="find-app" className="font-display text-xl font-semibold text-white">
          What do you want to do?
        </h2>
        <p className="mt-1 text-sm text-white/50">Search 117 AI apps by what they do.</p>
        <form
          role="search"
          className="relative mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (results[0]) openApp(results[0]);
          }}
        >
          <label htmlFor="home-app-search" className="sr-only">
            Search apps
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
          <input
            id="home-app-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. turn a blog into a podcast, research a company, chat with a PDF"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:border-agentos-brand/60 focus:outline-none"
          />
        </form>
        {query.trim() ? (
          results.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">
              No app matches. Try other words, or{" "}
              <Link to="/dashboard/apps" className="text-agentos-brand-soft hover:underline">
                browse all apps
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {results.map((app) => (
                <li key={app.slug}>
                  <button
                    type="button"
                    onClick={() => openApp(app)}
                    className="flex w-full items-start gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left hover:border-agentos-brand/40 hover:bg-white/[0.03]"
                  >
                    <AppWindow className="mt-0.5 h-4 w-4 shrink-0 text-agentos-brand" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm text-white">{app.name}</span>
                      <span className="block truncate text-xs text-white/45">{app.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      {showGetStarted ? (
        <section aria-labelledby="get-started" className="agentos-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="get-started" className="font-display text-lg font-semibold text-white">
                Get started in 3 steps
              </h2>
              <p className="mt-1 text-sm text-white/50">
                The apps run on your own OpenAI key, so you only pay OpenAI for what you use.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                dismissGetStarted();
                setDismissed(true);
              }}
              className="rounded-lg p-1 text-white/40 hover:text-white"
              aria-label="Hide the getting started steps"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.label}
                className={cn(
                  "rounded-xl border p-4",
                  step.done ? "border-emerald-400/25 bg-emerald-500/[0.06]" : "border-white/10",
                )}
              >
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-xs",
                      step.done ? "bg-emerald-500 text-white" : "border border-white/20 text-white/60",
                    )}
                  >
                    {step.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                  </span>
                  {step.label}
                  {step.done ? <span className="sr-only">(done)</span> : null}
                </p>
                {index === 0 && !step.done ? (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveKey();
                    }}
                  >
                    <label htmlFor="home-openai-key" className="sr-only">
                      Your OpenAI API key
                    </label>
                    <input
                      id="home-openai-key"
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={keyDraft}
                      onChange={(event) => setKeyDraft(event.target.value)}
                      placeholder="sk-…"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:border-agentos-brand/60 focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-agentos-brand-soft hover:underline"
                      >
                        Get a key
                      </a>
                      <button
                        type="submit"
                        className="bg-agentos-brand inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                      >
                        <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Save on this device
                      </button>
                    </div>
                    {keyError ? (
                      <p role="alert" className="text-xs text-rose-300">
                        {keyError}
                      </p>
                    ) : null}
                  </form>
                ) : null}
                {index === 1 && !step.done ? (
                  <p className="mt-3 text-xs text-white/50">Search above, or choose a category below.</p>
                ) : null}
                {index === 2 && !step.done ? (
                  <p className="mt-3 text-xs text-white/50">Fill in the app's form and press Run. Results appear on the same page.</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section aria-labelledby="recent-apps">
          <h2 id="recent-apps" className="mb-3 text-sm font-semibold text-white">
            Recently used
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((app) => (
              <li key={app.slug}>
                <Link
                  to={appPath(app)}
                  onClick={(event) => {
                    event.preventDefault();
                    openApp(app);
                  }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 hover:border-agentos-brand/40 hover:bg-white/[0.03]"
                >
                  <AppWindow className="h-4 w-4 shrink-0 text-agentos-brand" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{app.name}</span>
                    <span className="block truncate text-[11px] text-white/40">{categoryLabel(app.category)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="app-categories">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="app-categories" className="text-sm font-semibold text-white">
            Browse by category
          </h2>
          <Link to="/dashboard/apps" className="inline-flex items-center gap-1 text-xs text-agentos-brand-soft hover:underline">
            All 117 apps <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {APP_CATEGORIES.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/apps?category=${category.id}`)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left text-sm text-white/80 hover:border-agentos-brand/40 hover:bg-white/[0.03]"
              >
                <span className="min-w-0 truncate">{category.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-white/40">{category.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AppsHome;
