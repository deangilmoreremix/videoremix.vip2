// src/pages/agentos/AppsPage.tsx
//
// Routes: /dashboard/apps and /dashboard/my-apps — the VideoRemix app library
// inside the AgentOS dashboard.
//
// The library holds the 117 Awesome LLM apps (github.com/deangilmoreremix/
// awesome-llm-apps, converted to run in this app) and the VideoRemix extras.
// An Awesome LLM app opens inside the dashboard at /dashboard/apps/:slug (the
// AI app runner) or /dashboard/agents/:slug (the agent pages), so the
// operator never leaves the shell; an external VideoRemix app opens in a new
// tab. Awesome LLM apps are free to every signed-in user (they run on the
// user's own key); a locked VideoRemix app still offers the purchase.

import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppWindow, ExternalLink, KeyRound, LockKeyhole, Play } from "lucide-react";
import {
  APP_REGISTRY,
  AWESOME_LLM_APP_COUNT,
  TOTAL_APP_COUNT,
  VIDEOREMIX_EXTRA_APP_COUNT,
  type AppMeta,
} from "../../config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../../config/agentRegistry";
import { hasConvertedPage } from "../../config/convertedAppPages";
import { useUserAccess } from "../../hooks/useUserAccess";
import { HireAgentButton } from "../../components/agentos/apps/HireAgentButton";
import { APP_CATEGORIES } from "../../config/appCategories";
import { getStoredKey } from "../../lib/userApiKeys";
import { cn } from "../../lib/utils";
import { EmptyState, FilterGroup, PageHeader, Pill, SearchInput, Spinner } from "../../components/agentos/ui";

export type AppsSurface = "apps" | "my-apps";

type FamilyFilter = "all" | "awesome-llm" | "external";

const FAMILY_FILTERS: Array<{ value: FamilyFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "awesome-llm", label: "Awesome LLM" },
  { value: "external", label: "VideoRemix" },
];

/** Where an app opens from inside the dashboard. */
export function dashboardAppTarget(app: AppMeta): { kind: "route" | "external"; destination: string } {
  if (app.family === "external") {
    const destination = app.externalUrl || app.url;
    if (destination) return { kind: "external", destination };
  }
  if (AGENT_PAGE_SLUGS.has(app.slug)) {
    return { kind: "route", destination: `/dashboard/agents/${app.slug}` };
  }
  return { kind: "route", destination: `/dashboard/apps/${app.slug}` };
}

const AppsPage: React.FC<{ surface: AppsSurface }> = ({ surface }) => {
  const navigate = useNavigate();
  const { hasAccessToApp, loading } = useUserAccess();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FamilyFilter>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const setCategory = (next: string) =>
    setSearchParams(next ? { category: next } : {}, { replace: true });
  const hasKey = Boolean(getStoredKey("openai"));

  const ownedApps = useMemo(
    () => APP_REGISTRY.filter((app) => hasAccessToApp(app.slug)),
    [hasAccessToApp],
  );

  const visible = useMemo(() => {
    const source = surface === "my-apps" ? ownedApps : APP_REGISTRY;
    const needle = query.trim().toLowerCase();
    return source.filter((app) => {
      if (family !== "all" && app.family !== family) return false;
      if (category && app.category !== category) return false;
      if (!needle) return true;
      return [app.name, app.description, app.category, app.group]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [surface, ownedApps, query, family, category]);

  const launch = (app: AppMeta) => {
    const target = dashboardAppTarget(app);
    if (target.kind === "external") {
      window.open(target.destination, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(target.destination);
  };

  const title = surface === "my-apps" ? "My Apps" : "App Library";

  return (
    <>
      <Helmet>
        <title>{title} — SapienX AgentOS</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title={title}
          description={
            surface === "my-apps"
              ? `${ownedApps.length} apps are unlocked on your account. They open right here in the dashboard.`
              : `${TOTAL_APP_COUNT} apps: ${AWESOME_LLM_APP_COUNT} Awesome LLM apps and ${VIDEOREMIX_EXTRA_APP_COUNT} VideoRemix apps.`
          }
        />

        {!hasKey ? (
          <p className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
            <KeyRound className="h-4 w-4 shrink-0 text-agentos-brand" aria-hidden="true" />
            The apps run on your own OpenAI key. Add it once and every app uses it.
            <Link to="/dashboard/settings" className="font-medium text-agentos-brand-soft hover:underline">
              Add your key in Settings
            </Link>
          </p>
        ) : null}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterGroup
            label="Source"
            options={FAMILY_FILTERS}
            value={family}
            onChange={(value) => setFamily(value as FamilyFilter)}
          />
          <SearchInput
            id="apps-search"
            label="Search apps"
            value={query}
            onChange={setQuery}
            placeholder="Search apps…"
            className="sm:w-72"
          />
        </div>

        <div role="group" aria-label="Category" className="-mx-1 mb-5 flex flex-wrap gap-1.5">
          {[{ id: "", label: "All categories", count: 0 }, ...APP_CATEGORIES].map((entry) => (
            <button
              key={entry.id || "all"}
              type="button"
              aria-pressed={category === entry.id}
              onClick={() => setCategory(entry.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                category === entry.id
                  ? "border-agentos-brand/60 bg-agentos-brand/15 text-white"
                  : "border-white/10 text-white/60 hover:bg-white/[0.04]",
              )}
            >
              {entry.label}
              {entry.count ? <span className="ml-1.5 tabular-nums text-white/40">{entry.count}</span> : null}
            </button>
          ))}
        </div>

        {loading && surface === "my-apps" ? (
          <Spinner label="Loading your app access…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={AppWindow}
            title={surface === "my-apps" && !query ? "No apps are unlocked yet" : "No matching apps"}
            description={
              surface === "my-apps" && !query
                ? "Browse the App Library to find an app to unlock."
                : "Try a different search or source."
            }
            action={
              surface === "my-apps" ? (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/apps")}
                  className="bg-agentos-brand rounded-xl px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  Open the App Library
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((app) => {
              const owned = hasAccessToApp(app.slug);
              const external = app.family === "external";
              return (
                <li key={app.slug} className="relative">
                  <button
                    type="button"
                    onClick={() => launch(app)}
                    className="agentos-card group flex h-full w-full flex-col rounded-2xl p-5 text-left transition hover:border-agentos-brand/40 hover:shadow-[var(--shadow-glow)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-agentos-brand/20 bg-agentos-brand/10">
                        {external ? (
                          <ExternalLink className="h-5 w-5 text-agentos-brand" aria-hidden="true" />
                        ) : (
                          <AppWindow className="h-5 w-5 text-agentos-brand" aria-hidden="true" />
                        )}
                      </span>
                      <Pill tone={owned ? "emerald" : "slate"}>
                        {owned ? (external ? "Unlocked" : "Free") : "Locked"}
                      </Pill>
                    </div>
                    <h3 className="mt-5 font-medium text-white">{app.name}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">{app.description}</p>
                    <div
                      className={`mt-auto flex items-center justify-between pt-5 text-xs text-white/40 ${
                        external ? "" : "pr-28"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {external ? "VideoRemix app" : "Awesome LLM"}
                        {hasConvertedPage(app.slug) || AGENT_PAGE_SLUGS.has(app.slug) ? (
                          <Pill tone="violet">React app</Pill>
                        ) : null}
                      </span>
                      {external ? (
                        owned ? (
                          <Play className="h-4 w-4 group-hover:text-white" aria-hidden="true" />
                        ) : (
                          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                        )
                      ) : null}
                    </div>
                  </button>
                  {external ? null : (
                    <HireAgentButton slug={app.slug} compact className="absolute bottom-4 right-4" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default AppsPage;
