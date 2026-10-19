// src/components/agentos/nav/AgentOSNav.tsx
//
// The AgentOS section nav.
//
// WHY THIS EXISTS
//   The AgentOS pages were a set of isolated URLs with no link between them:
//   nothing in the product pointed at /agentos at all, and no page pointed at
//   another. A user could only reach the workforce by typing a path, and
//   could not get from a mission to the run that executed it.
//
//   This bar is the section's navigation: every AgentOS page renders it, the
//   active entry is marked for assistive technology, and the notification bell
//   lives here so it is present on every page of the section.

import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { NotificationBell } from "../notifications";
import type { ComponentType } from "react";
import {
  Activity,
  Boxes,
  CalendarClock,
  CheckCheck,
  Cpu,
  LayoutDashboard,
  Plug,
  ShieldCheck,
  Users,
  Waypoints,
} from "lucide-react";

interface NavEntry {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  /** Match the entry exactly as well as under it (/agentos is the canvas). */
  end?: boolean;
}

const ENTRIES: NavEntry[] = [
  { to: "/agentos", label: "Mission control", icon: LayoutDashboard, end: true },
  { to: "/agentos/workforce", label: "Workforce", icon: Users },
  { to: "/agentos/workspaces", label: "Workspaces", icon: Boxes },
  { to: "/agentos/missions", label: "Missions", icon: Waypoints },
  { to: "/agentos/schedules", label: "Schedules", icon: CalendarClock },
  { to: "/agentos/approvals", label: "Approvals", icon: CheckCheck },
  { to: "/agentos/operations", label: "Operations", icon: Cpu },
  { to: "/agentos/models", label: "Models", icon: ShieldCheck },
  { to: "/agentos/connections", label: "Connections", icon: Plug },
  { to: "/agentos/memory", label: "Memory", icon: Waypoints },
  { to: "/agentos/artifacts", label: "Artifacts", icon: Boxes },
  { to: "/agentos/activity", label: "Activity", icon: Activity },
];

export const AgentOSNav: React.FC = () => {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  return (
    <nav
      aria-label="AgentOS"
      className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-6"
    >
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.end}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white/80",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{entry.label}</span>
                  {/* The active entry is announced, not just coloured. */}
                  {isActive ? <span className="sr-only">(current section)</span> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {ownerId ? <NotificationBell ownerId={ownerId} /> : null}
    </nav>
  );
};
