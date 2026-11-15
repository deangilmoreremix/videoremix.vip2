// src/components/agentos/mission-control/navigation.ts
//
// The AgentOS navigation model, grouped the way upstream groups it
// (components/mission-control/navigation-config.ts): Operate / Connect /
// System, plus the VideoRemix app library. It is kept outside the component
// files so fast-refresh still works and the table can be reused.

import {
  Activity,
  AppWindow,
  Bot,
  BrainCircuit,
  CalendarClock,
  ClipboardList,
  Cpu,
  FileText,
  FolderKanban,
  Gauge,
  Grid2X2,
  Inbox,
  type LucideIcon,
  ListChecks,
  Plug,
  ScrollText,
  Settings2,
  ShieldAlert,
} from "lucide-react";

export type AgentOSNavSectionId = "operate" | "connect" | "system" | "apps";

export interface AgentOSNavSection {
  id: AgentOSNavSectionId;
  label: string;
}

export interface AgentOSNavLink {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  section: AgentOSNavSectionId;
  /** Shown on the collapsed 56px rail as well as in the expanded sidebar. */
  rail: boolean;
  /** Match the path exactly (the dashboard home), not as a prefix. */
  end?: boolean;
  /** Human Control shows the live pending-approval count. */
  showsApprovalBadge?: boolean;
}

export const AGENTOS_NAV_SECTIONS: readonly AgentOSNavSection[] = [
  { id: "apps", label: "Apps" },
  { id: "operate", label: "AI workforce" },
  { id: "connect", label: "Connect" },
  { id: "system", label: "System" },
];

// Apps first: most people come to run an app. The workforce, which runs apps
// for them, follows. The rail (collapsed sidebar) keeps the five most used.
export const AGENTOS_NAV: readonly AgentOSNavLink[] = [
  { id: "home", to: "/dashboard", label: "Home", icon: Inbox, section: "apps", rail: true, end: true },
  { id: "apps", to: "/dashboard/apps", label: "App Library", icon: Grid2X2, section: "apps", rail: true },
  { id: "my-apps", to: "/dashboard/my-apps", label: "My Apps", icon: AppWindow, section: "apps", rail: false },
  { id: "mission-control", to: "/dashboard/mission-control", label: "Mission Control", icon: Gauge, section: "operate", rail: false },
  { id: "workforce", to: "/dashboard/workforce", label: "Agents", icon: Bot, section: "operate", rail: true },
  { id: "missions", to: "/dashboard/missions", label: "Missions", icon: ListChecks, section: "operate", rail: true },
  { id: "schedules", to: "/dashboard/schedules", label: "Schedules", icon: CalendarClock, section: "operate", rail: false },
  { id: "tasks", to: "/dashboard/tasks", label: "Tasks", icon: ClipboardList, section: "operate", rail: false },
  { id: "approvals", to: "/dashboard/approvals", label: "Approvals", icon: ShieldAlert, section: "operate", rail: false, showsApprovalBadge: true },
  { id: "workspaces", to: "/dashboard/workspaces", label: "Workspaces", icon: FolderKanban, section: "connect", rail: false },
  { id: "connections", to: "/dashboard/connections", label: "Integrations", icon: Plug, section: "connect", rail: false },
  { id: "memory", to: "/dashboard/memory", label: "Memory", icon: BrainCircuit, section: "connect", rail: false },
  { id: "models", to: "/dashboard/models", label: "Models", icon: Cpu, section: "system", rail: false },
  { id: "artifacts", to: "/dashboard/artifacts", label: "Files", icon: FileText, section: "system", rail: false },
  { id: "operations", to: "/dashboard/operations", label: "Operations", icon: Activity, section: "system", rail: false },
  { id: "activity", to: "/dashboard/activity", label: "Activity", icon: ScrollText, section: "system", rail: false },
  { id: "settings", to: "/dashboard/settings", label: "Settings", icon: Settings2, section: "system", rail: true },
];

/** All AgentOS base paths, used by the smoke check. */
export const AGENTOS_ROUTES: string[] = AGENTOS_NAV.map((link) => link.to);

export function isNavLinkActive(link: AgentOSNavLink, pathname: string): boolean {
  if (link.end) return pathname === link.to || pathname === `${link.to}/`;
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}

/** The label of the section the pathname belongs to, for the topbar title. */
export function currentNavLabel(pathname: string): string {
  // An app's agent page belongs to the app library, like its runner does.
  if (/^\/dashboard\/agents\//.test(pathname)) return "App Library";
  const match = [...AGENTOS_NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((link) => isNavLinkActive(link, pathname));
  return match?.label ?? "Home";
}
