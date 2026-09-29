import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  Activity, AppWindow, Bot, BriefcaseBusiness, ChevronRight, CircleDot,
  Command, LayoutDashboard, ListTodo, Play, Search, Settings, Sparkles,
  Users, Workflow, Zap,
} from "lucide-react";
import { INTERNAL_AI_APP_SLUGS } from "../config/internalAIApps";

type Surface = "overview" | "workforce" | "missions" | "operations" | "apps";

const titleFromSlug = (slug: string) =>
  slug.split("-").map((word) => word === "ai" ? "AI" : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [surface, setSurface] = useState<Surface>("overview");
  const [query, setQuery] = useState("");
  const workers = useMemo(() => Array.from(INTERNAL_AI_APP_SLUGS).map((slug) => ({
    slug, name: titleFromSlug(slug), status: "ready" as const,
  })), []);
  const filtered = workers.filter((worker) => worker.name.toLowerCase().includes(query.toLowerCase()));

  const nav = [
    { id: "overview" as const, label: "Command Center", icon: LayoutDashboard },
    { id: "workforce" as const, label: "Workforce", icon: Users },
    { id: "missions" as const, label: "Missions", icon: ListTodo },
    { id: "operations" as const, label: "Operations", icon: Workflow },
    { id: "apps" as const, label: "All Apps", icon: AppWindow },
  ];

  return (
    <>
      <Helmet>
        <title>AI Workforce | VideoRemix.vip</title>
        <meta name="description" content="Operate your VideoRemix AI workforce from one command center." />
      </Helmet>
      <div className="min-h-screen bg-[#07090d] text-white pt-20">
        <div className="flex min-h-[calc(100vh-5rem)]">
          <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/10 bg-[#0a0d12] p-4 flex-col">
            <div className="flex items-center gap-3 px-3 py-4 mb-5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Command className="h-5 w-5" />
              </div>
              <div><div className="font-semibold">VideoRemix</div><div className="text-xs text-white/40">AI Workforce OS</div></div>
            </div>
            <nav className="space-y-1">
              {nav.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setSurface(id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${surface === id ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </nav>
            <div className="mt-auto border-t border-white/10 pt-4">
              <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/55 hover:bg-white/5 hover:text-white">
                <Settings className="h-4 w-4" /> Settings
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <header className="sticky top-20 z-20 border-b border-white/10 bg-[#07090d]/90 backdrop-blur-xl px-5 lg:px-8 py-4">
              <div className="max-w-[1500px] mx-auto flex items-center gap-4">
                <div className="lg:hidden flex gap-1 overflow-x-auto">
                  {nav.map(({ id, icon: Icon }) => <button key={id} onClick={() => setSurface(id)} className={`p-2 rounded-lg ${surface === id ? "bg-white/10" : ""}`}><Icon className="h-4 w-4" /></button>)}
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400"><CircleDot className="h-3.5 w-3.5" /> System ready</div>
              </div>
            </header>

            <div className="max-w-[1500px] mx-auto p-5 lg:p-8">
              {surface === "overview" && (
                <>
                  <div className="mb-8">
                    <div className="text-xs uppercase tracking-[.25em] text-indigo-400 mb-3">Command Center</div>
                    <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight">Run your AI workforce.</h1>
                    <p className="mt-3 text-white/50 max-w-2xl">Launch specialized workers, organize missions, and see your VideoRemix AI capabilities from one operating surface.</p>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    {[
                      ["Digital workers", workers.length, Bot],
                      ["Ready now", workers.length, Zap],
                      ["Active missions", 0, BriefcaseBusiness],
                      ["Live operations", 0, Activity],
                    ].map(([label, value, Icon]: any) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                        <div className="flex justify-between items-start"><div className="text-sm text-white/45">{label}</div><Icon className="h-4 w-4 text-indigo-400" /></div>
                        <div className="text-3xl font-semibold mt-5">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid xl:grid-cols-3 gap-5">
                    <section className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[.025] overflow-hidden">
                      <div className="p-5 border-b border-white/10 flex items-center justify-between">
                        <div><h2 className="font-semibold">Workforce</h2><p className="text-xs text-white/40 mt-1">Your ready-to-run AI specialists</p></div>
                        <button onClick={() => setSurface("workforce")} className="text-xs text-indigo-400 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="divide-y divide-white/5">
                        {workers.slice(0, 7).map((worker) => (
                          <button key={worker.slug} onClick={() => navigate(`/ai-app/${worker.slug}`)} className="w-full p-4 flex items-center gap-4 hover:bg-white/[.035] text-left">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-400/15 flex items-center justify-center"><Bot className="h-4 w-4 text-indigo-400" /></div>
                            <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{worker.name}</div><div className="text-xs text-white/35">Ready</div></div>
                            <Play className="h-4 w-4 text-white/30" />
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-400" /><h2 className="font-semibold">Mission control</h2></div>
                      <p className="text-sm text-white/45 mt-3">Missions will let you group workers around a business outcome while preserving each app's existing experience.</p>
                      <div className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-center">
                        <BriefcaseBusiness className="h-6 w-6 text-white/25 mx-auto mb-3" />
                        <div className="text-sm">No active missions</div><div className="text-xs text-white/35 mt-1">Mission orchestration is the next integration layer.</div>
                      </div>
                    </section>
                  </div>
                </>
              )}

              {(surface === "workforce" || surface === "apps") && (
                <>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
                    <div><div className="text-xs uppercase tracking-[.25em] text-indigo-400 mb-2">{surface === "workforce" ? "Workforce" : "Applications"}</div><h1 className="text-3xl font-semibold">{surface === "workforce" ? "Digital workers" : "All AI apps"}</h1><p className="text-sm text-white/45 mt-2">{workers.length} capabilities connected to VideoRemix.</p></div>
                    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-white/30" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search workforce..." className="w-full md:w-72 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400/50" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((worker) => (
                      <button key={worker.slug} onClick={() => navigate(`/ai-app/${worker.slug}`)} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-left hover:bg-white/[.05] hover:border-white/20 transition group">
                        <div className="flex items-start justify-between"><div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-400/15 flex items-center justify-center"><Bot className="h-5 w-5 text-indigo-400" /></div><span className="text-[10px] uppercase tracking-wider text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-1">Ready</span></div>
                        <h3 className="font-medium mt-5">{worker.name}</h3><div className="flex items-center justify-between mt-4 text-xs text-white/35"><span>VideoRemix worker</span><ChevronRight className="h-4 w-4 group-hover:text-white" /></div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {(surface === "missions" || surface === "operations") && (
                <div>
                  <div className="text-xs uppercase tracking-[.25em] text-indigo-400 mb-2">{surface}</div>
                  <h1 className="text-3xl font-semibold capitalize">{surface}</h1>
                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-12 text-center">
                    {surface === "missions" ? <BriefcaseBusiness className="h-9 w-9 mx-auto text-indigo-400" /> : <Workflow className="h-9 w-9 mx-auto text-indigo-400" />}
                    <h2 className="font-semibold mt-4">{surface === "missions" ? "Mission orchestration" : "Runtime operations"}</h2>
                    <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">{surface === "missions" ? "This surface will coordinate multiple existing VideoRemix workers around a goal." : "This surface will show real runs, status, retries, schedules, and execution history from your existing backend."}</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
export default DashboardPage;
