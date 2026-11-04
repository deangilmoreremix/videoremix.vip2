// src/pages/agentos/DashboardHomePage.tsx
//
// Route: /dashboard — the operator's home, after upstream's dashboard page
// (components/operations/dashboard-page-content.tsx): what the workforce is,
// what it is doing, what is waiting on a human, and how the work is going.
// Below it, the VideoRemix apps the account owns, one click from launch.
//
// Every number is counted from the user's own rows (RLS-scoped); nothing is
// a placeholder.

import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  AppWindow,
  ArrowRight,
  Bot,
  CircleAlert,
  ClipboardList,
  Gauge,
  Play,
  Plus,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUserAccess } from "../../hooks/useUserAccess";
import { APP_REGISTRY } from "../../config/appRegistry";
import OnboardingWizard from "../../components/onboarding/OnboardingWizard";
import {
  MISSION_STATUS_STYLE,
  Pill,
  Section,
  Spinner,
  Stat,
  StatusDot,
  WORKER_STATUS_STYLE,
} from "../../components/agentos/ui";
import { relativeTime } from "../../components/agentos/format";
import { listWorkers } from "../../services/agentos/workers";
import { listMissions, listTasks } from "../../services/agentos/missions";
import { listApprovals } from "../../services/agentos/approvals";
import type { Approval, Mission, Task, TaskStatus, Worker } from "../../types/agentos";
import { dashboardAppTarget } from "../../config/appTargets";

interface HomeData {
  workers: Worker[];
  missions: Mission[];
  tasks: Task[];
  approvals: Approval[];
}

const HEALTH_ORDER: TaskStatus[] = [
  "running",
  "queued",
  "waiting_approval",
  "blocked",
  "pending",
  "failed",
  "completed",
  "cancelled",
];

const HEALTH_BAR: Record<TaskStatus, string> = {
  running: "bg-sky-400",
  queued: "bg-white/40",
  waiting_approval: "bg-amber-400",
  blocked: "bg-amber-600",
  pending: "bg-white/20",
  failed: "bg-rose-500",
  completed: "bg-emerald-400",
  cancelled: "bg-white/10",
};

const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccessToApp } = useUserAccess();
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    setShowOnboarding(Boolean(user && !user.user_metadata?.onboarding_completed));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [workers, missions, tasks, approvals] = await Promise.all([
        listWorkers(),
        listMissions({ limit: 50 }),
        listTasks({ limit: 200 }),
        listApprovals({ status: "pending", limit: 20 }),
      ]);
      if (cancelled) return;
      const failure = [workers, missions, tasks, approvals].find((result) => result.error);
      if (failure?.error) setError(failure.error.message);
      setData({
        workers: workers.data ?? [],
        missions: missions.data ?? [],
        tasks: tasks.data ?? [],
        approvals: approvals.data ?? [],
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const facts = useMemo(() => {
    if (!data) return null;
    const byStatus = new Map<TaskStatus, number>();
    for (const task of data.tasks) byStatus.set(task.status, (byStatus.get(task.status) ?? 0) + 1);
    const live = (byStatus.get("running") ?? 0) + (byStatus.get("queued") ?? 0);
    const issues = (byStatus.get("failed") ?? 0) + (byStatus.get("blocked") ?? 0);
    const activeWorkers = data.workers.filter((worker) => worker.status === "active").length;
    const activeMissions = data.missions.filter((mission) =>
      ["planned", "active", "blocked"].includes(mission.status),
    ).length;
    const tasksByWorker = new Map<string, Task[]>();
    for (const task of data.tasks) {
      if (!task.assigned_worker_id) continue;
      const list = tasksByWorker.get(task.assigned_worker_id) ?? [];
      list.push(task);
      tasksByWorker.set(task.assigned_worker_id, list);
    }
    return { byStatus, live, issues, activeWorkers, activeMissions, tasksByWorker };
  }, [data]);

  const ownedApps = useMemo(
    () => APP_REGISTRY.filter((app) => hasAccessToApp(app.slug)).slice(0, 6),
    [hasAccessToApp],
  );

  const firstName = (user?.user_metadata?.first_name as string | undefined) ?? null;

  return (
    <>
      <Helmet>
        <title>Home — SapienX AgentOS</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-agentos-brand">
              AI workforce
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {firstName ? `Welcome back, ${firstName}.` : "Run your AI workforce like a company."}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Build agents, give them work, and keep a human in control of what matters.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/mission-control"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
            >
              <Gauge className="h-4 w-4" aria-hidden="true" /> Mission Control
            </Link>
            <Link
              to="/dashboard/workforce/new"
              className="bg-agentos-brand inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)] hover:brightness-110"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> New agent
            </Link>
          </div>
        </div>

        {error ? (
          <div role="alert" className="mb-6 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200">
            Some of your workforce could not be loaded: {error}
          </div>
        ) : null}

        {!data || !facts ? (
          <Spinner label="Loading your workforce…" />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Agents" value={data.workers.length} hint={`${facts.activeWorkers} active`} />
              <Stat label="Missions in flight" value={facts.activeMissions} tone="violet" hint={`${data.missions.length} total`} />
              <Stat label="Work running" value={facts.live} tone="sky" hint="running or queued tasks" />
              <Stat
                label="Needs attention"
                value={data.approvals.length + facts.issues}
                tone={data.approvals.length + facts.issues > 0 ? "amber" : "emerald"}
                hint={`${data.approvals.length} approvals · ${facts.issues} failed or blocked`}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="space-y-5 xl:col-span-2">
                <Section
                  title="Human Control"
                  description="Actions your agents are waiting for you to approve."
                  actions={
                    <Link to="/dashboard/approvals" className="text-xs text-agentos-brand-soft hover:underline">
                      Open inbox
                    </Link>
                  }
                  contentClassName="p-0"
                >
                  {data.approvals.length === 0 ? (
                    <p className="flex items-center gap-2 px-5 py-6 text-sm text-white/45">
                      <ShieldAlert className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      Nothing is waiting on you.
                    </p>
                  ) : (
                    <ul className="divide-y divide-white/[0.06]">
                      {data.approvals.slice(0, 5).map((approval) => {
                        const worker = data.workers.find((entry) => entry.id === approval.worker_id);
                        return (
                          <li key={approval.id}>
                            <Link
                              to="/dashboard/approvals"
                              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]"
                            >
                              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm text-white">
                                  {approval.action_type.replace(/_/g, " ")}
                                </span>
                                <span className="block truncate text-xs text-white/40">
                                  {worker?.name ?? "An agent"} · {approval.reason || "no reason given"}
                                </span>
                              </span>
                              <span className="text-[11px] text-white/35">{relativeTime(approval.requested_at)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>

                <Section
                  title="Workforce"
                  description="Your agents and what each is working on."
                  actions={
                    <Link to="/dashboard/workforce" className="text-xs text-agentos-brand-soft hover:underline">
                      All agents
                    </Link>
                  }
                  contentClassName="p-0"
                >
                  {data.workers.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Bot className="mx-auto h-8 w-8 text-white/25" aria-hidden="true" />
                      <p className="mt-3 text-sm text-white">You have no agents yet.</p>
                      <p className="mt-1 text-xs text-white/45">
                        Create your first digital worker, then give it a task.
                      </p>
                      <Link
                        to="/dashboard/workforce/new"
                        className="bg-agentos-brand mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" /> Create an agent
                      </Link>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/[0.06]">
                      {data.workers.slice(0, 6).map((worker) => {
                        const tasks = facts.tasksByWorker.get(worker.id) ?? [];
                        const current = tasks.find((task) => task.status === "running" || task.status === "queued");
                        const style = WORKER_STATUS_STYLE[worker.status];
                        return (
                          <li key={worker.id}>
                            <Link
                              to={`/dashboard/workforce/${worker.id}`}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-agentos-brand/15 font-display text-sm font-semibold text-agentos-brand-soft">
                                {worker.name.slice(0, 1).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="truncate text-sm font-medium text-white">{worker.name}</span>
                                  <StatusDot tone={style.tone} title={worker.status} />
                                </span>
                                <span className="block truncate text-xs text-white/40">
                                  {current ? `Working on: ${current.title}` : worker.role || "No role set"}
                                </span>
                              </span>
                              <span className="hidden text-[11px] tabular-nums text-white/35 sm:inline">
                                {tasks.length} tasks
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Section>
              </div>

              <div className="space-y-5">
                <Section title="Task health" description={`${data.tasks.length} recent tasks`}>
                  {data.tasks.length === 0 ? (
                    <p className="text-sm text-white/45">No tasks yet. Instruct an agent with ⌘K.</p>
                  ) : (
                    <>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                        {HEALTH_ORDER.map((status) => {
                          const count = facts.byStatus.get(status) ?? 0;
                          if (!count) return null;
                          return (
                            <span
                              key={status}
                              className={HEALTH_BAR[status]}
                              style={{ width: `${(count / data.tasks.length) * 100}%` }}
                            />
                          );
                        })}
                      </div>
                      <ul className="mt-4 space-y-1.5">
                        {HEALTH_ORDER.filter((status) => facts.byStatus.get(status)).map((status) => (
                          <li key={status} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-white/60">
                              <span className={`h-2 w-2 rounded-full ${HEALTH_BAR[status]}`} aria-hidden="true" />
                              {status.replace("_", " ")}
                            </span>
                            <span className="tabular-nums text-white">{facts.byStatus.get(status)}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/dashboard/tasks"
                        className="mt-4 inline-flex items-center gap-1 text-xs text-agentos-brand-soft hover:underline"
                      >
                        <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" /> All tasks
                      </Link>
                    </>
                  )}
                  {facts.issues > 0 ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-300">
                      <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      {facts.issues} failed or blocked
                    </p>
                  ) : null}
                </Section>

                <Section
                  title="Missions"
                  actions={
                    <Link to="/dashboard/missions/new" className="text-xs text-agentos-brand-soft hover:underline">
                      New mission
                    </Link>
                  }
                  contentClassName="p-0"
                >
                  {data.missions.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-white/45">No missions yet.</p>
                  ) : (
                    <ul className="divide-y divide-white/[0.06]">
                      {data.missions.slice(0, 5).map((mission) => (
                        <li key={mission.id}>
                          <Link
                            to={`/dashboard/missions/${mission.id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]"
                          >
                            <Waypoints className="h-4 w-4 shrink-0 text-agentos-accent" aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate text-sm text-white">{mission.title}</span>
                            <Pill tone={MISSION_STATUS_STYLE[mission.status].pill}>{mission.status}</Pill>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </div>
            </div>

            <Section
              className="mt-5"
              title="My Apps"
              description="Your unlocked VideoRemix and Awesome LLM apps, ready to run."
              actions={
                <Link
                  to="/dashboard/apps"
                  className="inline-flex items-center gap-1 text-xs text-agentos-brand-soft hover:underline"
                >
                  App Library <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              }
            >
              {ownedApps.length === 0 ? (
                <p className="text-sm text-white/45">
                  No apps are unlocked on this account yet.{" "}
                  <Link to="/dashboard/apps" className="text-agentos-brand-soft hover:underline">
                    Browse the library
                  </Link>
                  .
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ownedApps.map((app) => (
                    <li key={app.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          const target = dashboardAppTarget(app);
                          if (target.kind === "external") {
                            window.open(target.destination, "_blank", "noopener,noreferrer");
                          } else {
                            navigate(target.destination);
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left hover:border-agentos-brand/40 hover:bg-white/[0.03]"
                      >
                        <AppWindow className="h-4 w-4 shrink-0 text-agentos-brand" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm text-white">{app.name}</span>
                        <Play className="h-3.5 w-3.5 text-white/35" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </div>

      {showOnboarding ? (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboarding(false);
            navigate("/dashboard", { replace: true });
          }}
        />
      ) : null}
    </>
  );
};

export default DashboardHomePage;
