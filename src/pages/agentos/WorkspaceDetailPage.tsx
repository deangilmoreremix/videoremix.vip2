// src/pages/agentos/WorkspaceDetailPage.tsx
//
// Single workspace: overview, members, policies, workers, missions.
// Membership management is owner-only (the RLS policy enforces it server-side;
// this page only hides the affordance for non-owners so the failure is obvious).

import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Bot, Target } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AsyncBoundary } from "../../components/agentos/shared";
import { EmptyState, PageHeader, Pill, Section, Spinner } from "../../components/agentos/ui";
import {
  getWorkspace,
  inviteMember,
  listWorkspaceMembers,
  removeMember,
  updateMemberRole,
} from "../../services/agentos/workspaces";
import { listWorkers } from "../../services/agentos/workers";
import { listMissions } from "../../services/agentos/missions";
import type { Mission, Worker, Workspace, WorkspaceMember, WorkspaceRole } from "../../types/agentos";

type TabKey = "overview" | "members" | "policies" | "workers" | "missions";

const ROLES: Array<{ value: Exclude<WorkspaceRole, "owner">; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const WorkspaceDetailPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<TabKey>("overview");

  const [inviteId, setInviteId] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<WorkspaceRole, "owner">>("member");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [workspaceResult, membersResult, workersResult, missionsResult] = await Promise.all([
        getWorkspace(workspaceId),
        listWorkspaceMembers(workspaceId),
        listWorkers({ workspaceId }),
        listMissions(),
      ]);

      if (cancelled) return;

      if (workspaceResult.error || !workspaceResult.data) {
        setError(workspaceResult.error?.message ?? "Workspace not found");
        setLoading(false);
        return;
      }

      setWorkspace(workspaceResult.data);
      setMembers(membersResult.data ?? []);
      setWorkers(workersResult.data ?? []);
      // Only show missions that belong to this workspace.
      setMissions((missionsResult.data ?? []).filter((mission) => mission.workspace_id === workspaceId));
      setError(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, reloadKey]);

  const isOwner = workspace?.owner_clerk_id === user?.id;

  const submitInvite = useCallback(async () => {
    if (!workspaceId) return;
    setInviteBusy(true);
    setInviteError(null);
    const result = await inviteMember({
      workspaceId,
      memberClerkId: inviteId,
      role: inviteRole,
    });
    setInviteBusy(false);
    if (result.error) {
      setInviteError(result.error.message);
      return;
    }
    setInviteId("");
    reload();
  }, [workspaceId, inviteId, inviteRole, reload]);

  const changeRole = useCallback(
    async (memberClerkId: string, role: Exclude<WorkspaceRole, "owner">) => {
      if (!workspaceId) return;
      const result = await updateMemberRole({ workspaceId, memberClerkId, role });
      if (result.error) {
        setInviteError(result.error.message);
        return;
      }
      reload();
    },
    [workspaceId, reload],
  );

  const dropMember = useCallback(
    async (memberClerkId: string) => {
      if (!workspaceId) return;
      const result = await removeMember({ workspaceId, memberClerkId });
      if (result.error) {
        setInviteError(result.error.message);
        return;
      }
      reload();
    },
    [workspaceId, reload],
  );

  if (!workspaceId) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <AsyncBoundary
        loading={false}
        error={error}
        onRetry={reload}
        isEmpty={!workspace}
        empty={<p className="text-white/50">Workspace not found.</p>}
      >
        {workspace ? (
          <>
            <Helmet>
              <title>{workspace.name} — Workspaces</title>
            </Helmet>

            <PageHeader
              breadcrumbs={[
                { label: "AgentOS", to: "/agentos" },
                { label: "Workspaces", to: "/agentos/workspaces" },
                { label: workspace.name },
              ]}
              title={workspace.name}
              description={workspace.description || "No description"}
            />

            <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                <TabsTrigger value="workers">Workers</TabsTrigger>
                <TabsTrigger value="missions">Missions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="pt-4">
                <Section title="Goals and instructions" description="Shared context for every worker in this workspace.">
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-white/45">Goals</p>
                      <p className="mt-1 whitespace-pre-wrap text-white/75">
                        {workspace.goals || "No goals set."}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/45">Operating instructions</p>
                      <p className="mt-1 whitespace-pre-wrap text-white/75">
                        {workspace.instructions || "No instructions set."}
                      </p>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value="members" className="space-y-4 pt-4">
                <Section
                  title="Members"
                  description={
                    isOwner
                      ? "Invite by Clerk user id. The owner role is immutable."
                      : "Only the workspace owner can change membership."
                  }
                >
                  {members.length === 0 ? (
                    <p className="text-sm text-white/45">No members recorded.</p>
                  ) : (
                    <ul className="space-y-2">
                      {members.map((member) => (
                        <li
                          key={member.member_clerk_id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/80">
                              {member.member_clerk_id}
                              {member.member_clerk_id === user?.id ? " (you)" : ""}
                            </p>
                            <p className="text-[11px] text-white/35">
                              joined {new Date(member.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOwner && member.role !== "owner" ? (
                              <select
                                value={member.role}
                                onChange={(event) =>
                                  void changeRole(
                                    member.member_clerk_id,
                                    event.target.value as Exclude<WorkspaceRole, "owner">,
                                  )
                                }
                                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                              >
                                {ROLES.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Pill tone={member.role === "owner" ? "violet" : "slate"}>
                                {member.role}
                              </Pill>
                            )}
                            {isOwner && member.role !== "owner" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void dropMember(member.member_clerk_id)}
                              >
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isOwner ? (
                    <div className="mt-5 border-t border-white/5 pt-4">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[240px] flex-1">
                          <label className="text-xs text-white/50" htmlFor="invite-id">
                            Clerk user id
                          </label>
                          <input
                            id="invite-id"
                            value={inviteId}
                            onChange={(event) => setInviteId(event.target.value)}
                            placeholder="user_…"
                            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <select
                          value={inviteRole}
                          onChange={(event) =>
                            setInviteRole(event.target.value as Exclude<WorkspaceRole, "owner">)
                          }
                          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                        >
                          {ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" disabled={inviteBusy} onClick={() => void submitInvite()}>
                          {inviteBusy ? "Adding…" : "Invite"}
                        </Button>
                      </div>
                      {inviteError ? <p className="mt-2 text-sm text-rose-300">{inviteError}</p> : null}
                    </div>
                  ) : null}
                </Section>
              </TabsContent>

              <TabsContent value="policies" className="pt-4">
                <Section title="Policies" description="Guardrails applied by the runtime to every worker here.">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-white/45">Executions</dt>
                      <dd className="mt-0.5 text-white/75">
                        {workspace.policies.executions_paused ? "paused" : "enabled"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Mission credit ceiling</dt>
                      <dd className="mt-0.5 tabular-nums text-white/75">
                        {workspace.policies.mission_credit_ceiling?.toLocaleString() ?? "unlimited"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Approval-gated tools</dt>
                      <dd className="mt-0.5 text-white/75">
                        {(workspace.policies.approval_required_tools ?? []).join(", ") || "none"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Allowed models</dt>
                      <dd className="mt-0.5 text-white/75">
                        {(workspace.policies.allowed_models ?? []).join(", ") || "any"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-white/45">Allowed app slugs</dt>
                      <dd className="mt-0.5 text-white/75">
                        {(workspace.policies.allowed_app_slugs ?? []).join(", ") || "any"}
                      </dd>
                    </div>
                  </dl>
                </Section>
              </TabsContent>

              <TabsContent value="workers" className="pt-4">
                <Section title="Workers in this workspace" description="Workers whose workspace_id matches.">
                  {workers.length === 0 ? (
                    <EmptyState
                      icon={Bot}
                      title="No workers in this workspace"
                      description="Create a worker and assign it to this workspace."
                      action={
                        <Button size="sm" onClick={() => navigate("/agentos/workforce/new")}>
                          New worker
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="space-y-2">
                      {workers.map((worker) => (
                        <li key={worker.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/agentos/workforce/${worker.id}`)}
                            className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 text-left hover:border-violet-400/30"
                          >
                            <span className="text-sm text-white/80">{worker.name}</span>
                            <span className="flex items-center gap-2">
                              <Pill tone="violet">{worker.model_id}</Pill>
                              <Pill tone="slate">{worker.status}</Pill>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </TabsContent>

              <TabsContent value="missions" className="pt-4">
                <Section title="Missions in this workspace" description="Grouped work assigned to the workers above.">
                  {missions.length === 0 ? (
                    <EmptyState
                      icon={Target}
                      title="No missions yet"
                      description="Create a mission to group tasks and assign them to workers."
                      action={
                        <Button size="sm" onClick={() => navigate("/agentos/missions/new")}>
                          New mission
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="space-y-2">
                      {missions.map((mission) => (
                        <li key={mission.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/agentos/missions/${mission.id}`)}
                            className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 text-left hover:border-violet-400/30"
                          >
                            <span className="text-sm text-white/80">{mission.title}</span>
                            <Pill tone="sky">{mission.status}</Pill>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </AsyncBoundary>
    </div>
  );
};

export default WorkspaceDetailPage;
