// src/components/agentos/mission-control/navigation.ts
//
// The AgentOS navigation model, kept outside the component file so fast-refresh
// still works and so the route table can be reused (for example by a mobile
// nav) without importing a component.

import {
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  type LucideIcon,
  ListChecks,
  Plug,
  Users,
} from "lucide-react";

export interface AgentOSNavLink {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Approvals shows a live pending count in the sidebar badge. */
  showsApprovalBadge?: boolean;
}

export const AGENTOS_NAV: AgentOSNavLink[] = [
  { to: "/agentos/mission-control", label: "Mission Control", icon: LayoutDashboard },
  { to: "/agentos/workforce", label: "Workforce", icon: Users },
  { to: "/agentos/workspaces", label: "Workspaces", icon: FolderKanban },
  { to: "/agentos/missions", label: "Missions", icon: ListChecks },
  { to: "/agentos/schedules", label: "Schedules", icon: CalendarClock },
  { to: "/agentos/approvals", label: "Approvals", icon: CheckCircle2, showsApprovalBadge: true },
  { to: "/agentos/operations", label: "Operations", icon: LayoutDashboard },
  { to: "/agentos/models", label: "Models", icon: Cpu },
  { to: "/agentos/connections", label: "Connections", icon: Plug },
  { to: "/agentos/memory", label: "Memory", icon: BrainCircuit },
];

/** All AgentOS base paths, used by the smoke check. */
export const AGENTOS_ROUTES: string[] = AGENTOS_NAV.map((link) => link.to);
