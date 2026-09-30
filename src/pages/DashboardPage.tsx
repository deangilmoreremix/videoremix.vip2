import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  AppWindow,
  Bot,
  ChevronRight,
  CircleDot,
  Command,
  ExternalLink,
  Grid2X2,
  LayoutDashboard,
  LockKeyhole,
  Play,
  Search,
  Settings,
  Sparkles,
  UserRoundCheck,
  WandSparkles,
} from "lucide-react";
import { APP_REGISTRY, type AppMeta } from "../config/appRegistry";
import { useUserAccess } from "../hooks/useUserAccess";
import { useAuth } from "../context/AuthContext";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";

type Surface = "overview" | "my-apps" | "apps";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccessToApp, loading: accessLoading } = useUserAccess();

  const [surface, setSurface] = useState<Surface>("overview");
  const [query, setQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboardingCompleted = user?.user_metadata?.onboarding_completed;
    setShowOnboarding(Boolean(user && !onboardingCompleted));
  }, [user]);

  const ownedApps = useMemo(
    () => APP_REGISTRY.filter((app) => hasAccessToApp(app.slug)),
    [hasAccessToApp],
  );

  const filteredApps = useMemo(() => {
    const source = surface === "my-apps" ? ownedApps : APP_REGISTRY;
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return source;

    return source.filter((app) =>
      [app.name, app.description, app.category, app.group]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [ownedApps, query, surface]);

  const internalCount = useMemo(
    () => APP_REGISTRY.filter((app) => app.family === "internal").length,
    [],
  );
  const externalCount = APP_REGISTRY.length - internalCount;

  const launchApp = (app: AppMeta) => {
    if (!hasAccessToApp(app.slug)) {
      navigate("/apps");
      return;
    }

    if (app.family === "external") {
      const destination = app.externalUrl || app.url;
      if (destination) {
        window.open(destination, "_blank", "noopener,noreferrer");
        return;
      }
    }

    navigate(`/ai-runner/${app.slug}`);
  };

  const nav = [
    { id: "overview" as const, label: "Command Center", icon: LayoutDashboard },
    { id: "my-apps" as const, label: "My Apps", icon: UserRoundCheck },
    { id: "apps" as const, label: "App Library", icon: Grid2X2 },
  ];

  const renderAppCard = (app: AppMeta) => {
    const owned = hasAccessToApp(app.slug);

    return (
      <button
        key={app.slug}
        onClick={() => launchApp(app)}
        className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-left hover:bg-white/[.05] hover:border-white/20 transition group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-400/15 flex items-center justify-center">
            {app.family === "external" ? (
              <ExternalLink className="h-5 w-5 text-indigo-400" />
            ) : (
              <Bot className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <span
            className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-1 ${
              owned
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-white/45 bg-white/5"
            }`}
          >
            {owned ? "Owned" : "Locked"}
          </span>
        </div>

        <h3 className="font-medium mt-5">{app.name}</h3>
        <p className="text-xs leading-5 text-white/40 mt-2 line-clamp-2">
          {app.description}
        </p>

        <div className="flex items-center justify-between mt-5 text-xs text-white/35">
          <span>{app.family === "external" ? "VideoRemix app" : app.category}</span>
          {owned ? (
            <Play className="h-4 w-4 group-hover:text-white" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      <Helmet>
        <title>Command Center | VideoRemix.vip</title>
        <meta
          name="description"
          content="Manage your VideoRemix apps, personalization tools, and AI capabilities from one command center."
        />
      </Helmet>

      <div className="min-h-screen bg-[#07090d] text-white">
        <div className="flex min-h-screen">
          <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/10 bg-[#0a0d12] p-4 flex-col">
            <div className="flex items-center gap-3 px-3 py-4 mb-5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Command className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">VideoRemix</div>
                <div className="text-xs text-white/40">AI Command Center</div>
              </div>
            </div>

            <nav className="space-y-1">
              {nav.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setSurface(id);
                    setQuery("");
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    surface === id
                      ? "bg-white/10 text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}

              <button
                onClick={() => navigate("/personalizer")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 hover:bg-white/5 hover:text-white"
              >
                <WandSparkles className="h-4 w-4" />
                Personalizer
              </button>
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4">
              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 hover:bg-white/5 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07090d]/90 backdrop-blur-xl px-5 lg:px-8 py-4">
              <div className="max-w-[1500px] mx-auto flex items-center gap-4">
                <div className="lg:hidden flex gap-1 overflow-x-auto">
                  {nav.map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSurface(id);
                        setQuery("");
                      }}
                      className={`p-2 rounded-lg ${surface === id ? "bg-white/10" : ""}`}
                      aria-label={id}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                  <button
                    onClick={() => navigate("/personalizer")}
                    className="p-2 rounded-lg"
                    aria-label="Personalizer"
                  >
                    <WandSparkles className="h-4 w-4" />
                  </button>
                </div>

                <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
                  <CircleDot className="h-3.5 w-3.5" />
                  {accessLoading ? "Syncing account" : "Account ready"}
                </div>
              </div>
            </header>

            <div className="max-w-[1500px] mx-auto p-5 lg:p-8">
              {surface === "overview" && (
                <>
                  <div className="mb-8">
                    <div className="text-xs uppercase tracking-[.25em] text-indigo-400 mb-3">
                      Command Center
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight">
                      Everything you own. One dashboard.
                    </h1>
                    <p className="mt-3 text-white/50 max-w-2xl">
                      Launch your VideoRemix apps, open the personalization system,
                      and discover additional tools without switching between competing dashboards.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    {[
                      ["My apps", ownedApps.length, UserRoundCheck],
                      ["App library", APP_REGISTRY.length, AppWindow],
                      ["AI apps", internalCount, Bot],
                      ["Connected apps", externalCount, ExternalLink],
                    ].map(([label, value, Icon]: any) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/[.035] p-5"
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-white/45">{label}</div>
                          <Icon className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-semibold mt-5">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid xl:grid-cols-3 gap-5">
                    <section className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[.025] overflow-hidden">
                      <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
                        <div>
                          <h2 className="font-semibold">My Apps</h2>
                          <p className="text-xs text-white/40 mt-1">
                            Apps currently available to your account
                          </p>
                        </div>
                        <button
                          onClick={() => setSurface("my-apps")}
                          className="text-xs text-indigo-400 flex items-center gap-1"
                        >
                          View all
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {accessLoading ? (
                        <div className="p-8 text-sm text-white/45">Loading your app access…</div>
                      ) : ownedApps.length > 0 ? (
                        <div className="divide-y divide-white/5">
                          {ownedApps.slice(0, 7).map((app) => (
                            <button
                              key={app.slug}
                              onClick={() => launchApp(app)}
                              className="w-full p-4 flex items-center gap-4 hover:bg-white/[.035] text-left"
                            >
                              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-400/15 flex items-center justify-center">
                                {app.family === "external" ? (
                                  <ExternalLink className="h-4 w-4 text-indigo-400" />
                                ) : (
                                  <Bot className="h-4 w-4 text-indigo-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate">{app.name}</div>
                                <div className="text-xs text-white/35">Owned</div>
                              </div>
                              <Play className="h-4 w-4 text-white/30" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8">
                          <div className="text-sm font-medium">No apps are linked to this account yet.</div>
                          <p className="text-xs text-white/40 mt-2">
                            Open the library to browse the VideoRemix catalog.
                          </p>
                          <button
                            onClick={() => setSurface("apps")}
                            className="mt-4 text-sm text-indigo-400"
                          >
                            Browse app library
                          </button>
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <h2 className="font-semibold">Personalizer</h2>
                      </div>
                      <p className="text-sm text-white/45 mt-3">
                        Open the VideoRemix personalization workspace directly from your command center.
                      </p>
                      <button
                        onClick={() => navigate("/personalizer")}
                        className="mt-6 w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 transition px-4 py-3 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <WandSparkles className="h-4 w-4" />
                        Open Personalizer
                      </button>
                    </section>
                  </div>
                </>
              )}

              {(surface === "my-apps" || surface === "apps") && (
                <>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
                    <div>
                      <div className="text-xs uppercase tracking-[.25em] text-indigo-400 mb-2">
                        {surface === "my-apps" ? "My Apps" : "App Library"}
                      </div>
                      <h1 className="text-3xl font-semibold">
                        {surface === "my-apps" ? "Your applications" : "VideoRemix applications"}
                      </h1>
                      <p className="text-sm text-white/45 mt-2">
                        {surface === "my-apps"
                          ? `${ownedApps.length} apps currently available to your account.`
                          : `${APP_REGISTRY.length} applications in the canonical VideoRemix registry.`}
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search apps..."
                        className="w-full md:w-72 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400/50"
                      />
                    </div>
                  </div>

                  {filteredApps.length > 0 ? (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredApps.map(renderAppCard)}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-10 text-center">
                      <AppWindow className="h-8 w-8 text-white/25 mx-auto" />
                      <h2 className="font-medium mt-4">
                        {surface === "my-apps" ? "No owned apps found" : "No matching apps"}
                      </h2>
                      <p className="text-sm text-white/40 mt-2">
                        {surface === "my-apps"
                          ? "Your account does not currently have access to an app matching this view."
                          : "Try a different search term."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>

        {showOnboarding && (
          <OnboardingWizard
            onComplete={() => {
              setShowOnboarding(false);
              window.history.replaceState({}, "", "/dashboard");
            }}
          />
        )}
      </div>
    </>
  );
};

export default DashboardPage;
