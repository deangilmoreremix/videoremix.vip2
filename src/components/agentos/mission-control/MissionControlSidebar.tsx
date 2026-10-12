// src/components/agentos/mission-control/MissionControlSidebar.tsx
//
// AgentOS navigation. Links point at the routes that actually exist; anything
// the port does not build is absent rather than disabled.

import { NavLink } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { cn } from "../../../lib/utils";
import { AGENTOS_NAV } from "./navigation";

export interface MissionControlSidebarProps {
  pendingApprovalCount?: number;
}

export const MissionControlSidebar: React.FC<MissionControlSidebarProps> = ({
  pendingApprovalCount,
}) => (
  <aside className="flex h-full w-[236px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b0d]">
    <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-4">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-600 text-white">
        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">AgentOS</p>
        <p className="text-[11px] text-white/35">SapienX</p>
      </div>
    </div>

    <nav className="flex-1 overflow-y-auto p-2" aria-label="AgentOS">
      <ul className="space-y-0.5">
        {AGENTOS_NAV.map((link) => {
          const Icon = link.icon;
          const badge = link.showsApprovalBadge ? pendingApprovalCount : undefined;
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-white/55 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{link.label}</span>
                {badge && badge > 0 ? (
                  <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                    {badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>

    <div className="border-t border-white/5 px-4 py-3">
      <NavLink
        to="/dashboard"
        className="text-[11px] text-white/35 transition hover:text-white/60"
      >
        Back to SapienX dashboard
      </NavLink>
    </div>
  </aside>
);

export default MissionControlSidebar;
