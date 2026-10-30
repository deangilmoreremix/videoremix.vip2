// src/components/agentos/shell/Sidebar.tsx
//
// The dashboard sidebar, after upstream's mission-control sidebar: a 56px
// icon rail that expands to 292px on hover and can be pinned open. On a phone
// it is a slide-out drawer opened from the topbar.
//
// This is the only navigation in the dashboard: every page renders inside the
// layout that owns it.

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Pin, PinOff, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  AGENTOS_NAV,
  AGENTOS_NAV_SECTIONS,
  isNavLinkActive,
  type AgentOSNavLink,
} from "../mission-control/navigation";

const PIN_KEY = "agentos.sidebar.pinned";

function readPinned(): boolean {
  try {
    return window.localStorage.getItem(PIN_KEY) === "1";
  } catch {
    return false;
  }
}

export interface SidebarProps {
  pendingApprovals: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Brand: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <Link
    to="/dashboard"
    className="flex h-14 shrink-0 items-center gap-3 px-3"
    aria-label="AgentOS home"
  >
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-agentos-brand font-display text-sm font-bold text-white shadow-[0_0_24px_hsl(345_100%_49%/0.45)]">
      A
    </span>
    <span
      className={cn(
        "whitespace-nowrap font-display text-[17px] font-semibold tracking-tight text-white transition-opacity",
        expanded ? "opacity-100" : "opacity-0",
      )}
    >
      Agent<span className="text-agentos-brand">OS</span>
    </span>
  </Link>
);

const NavItem: React.FC<{
  link: AgentOSNavLink;
  expanded: boolean;
  badge: number;
  onNavigate?: () => void;
}> = ({ link, expanded, badge, onNavigate }) => {
  const { pathname } = useLocation();
  const active = isNavLinkActive(link, pathname);
  const Icon = link.icon;

  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onNavigate}
      title={expanded ? undefined : link.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-xl px-[10px] text-[13px] transition-colors",
        active
          ? "bg-agentos-brand/15 text-white"
          : "text-white/55 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      {active ? (
        <span aria-hidden="true" className="absolute left-0 top-2 h-5 w-[3px] rounded-r-full bg-agentos-brand" />
      ) : null}
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-agentos-brand" : "")} aria-hidden="true" />
      <span className={cn("flex-1 truncate whitespace-nowrap transition-opacity", expanded ? "opacity-100" : "opacity-0")}>
        {link.label}
      </span>
      {link.showsApprovalBadge && badge > 0 ? (
        <span
          aria-label={`${badge} pending`}
          className={cn(
            "flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-agentos-brand px-1 text-[10px] font-semibold text-white",
            expanded ? "" : "absolute right-1 top-0.5 h-4 min-w-4 text-[9px]",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </NavLink>
  );
};

const NavSections: React.FC<{
  expanded: boolean;
  pendingApprovals: number;
  onNavigate?: () => void;
}> = ({ expanded, pendingApprovals, onNavigate }) => (
  <nav aria-label="Dashboard" className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-2 pb-4">
    {AGENTOS_NAV_SECTIONS.map((section) => {
      const links = AGENTOS_NAV.filter(
        (link) => link.section === section.id && (expanded || link.rail),
      );
      if (links.length === 0) return null;
      return (
        <div key={section.id}>
          <p
            className={cn(
              "mb-1 h-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-opacity",
              expanded ? "opacity-100" : "opacity-0",
            )}
          >
            {section.label}
          </p>
          <div className="space-y-0.5">
            {links.map((link) => (
              <NavItem
                key={link.id}
                link={link}
                expanded={expanded}
                badge={pendingApprovals}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      );
    })}
  </nav>
);

export const Sidebar: React.FC<SidebarProps> = ({ pendingApprovals, mobileOpen, onMobileClose }) => {
  const [pinned, setPinned] = useState(readPinned);
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.localStorage.setItem(PIN_KEY, pinned ? "1" : "0");
    } catch {
      // Pinning still works for this visit.
    }
  }, [pinned]);

  // A navigation closes the phone drawer.
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Desktop: the rail. Pinned, it takes its width in the layout; hovered,
          it floats over the content so the page does not reflow. */}
      <div
        className="relative hidden shrink-0 transition-[width] duration-200 md:block"
        style={{ width: pinned ? "var(--sidebar-open)" : "var(--sidebar-rail)" }}
      >
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(false);
          }}
          className="agentos-panel fixed inset-y-0 left-0 z-40 flex flex-col rounded-none border-y-0 border-l-0 transition-[width] duration-200"
          style={{ width: expanded ? "var(--sidebar-open)" : "var(--sidebar-rail)" }}
        >
          <div className="flex items-center justify-between">
            <Brand expanded={expanded} />
            {expanded ? (
              <button
                type="button"
                onClick={() => setPinned((value) => !value)}
                aria-pressed={pinned}
                aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
                className="mr-3 rounded-lg p-1.5 text-white/45 hover:bg-white/[0.06] hover:text-white"
              >
                {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
          <NavSections expanded={expanded} pendingApprovals={pendingApprovals} />
        </aside>
      </div>

      {/* Phone: the drawer. */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="agentos-panel agentos-float-up absolute inset-y-0 left-0 flex w-[min(292px,86vw)] flex-col rounded-none border-y-0 border-l-0">
            <div className="flex items-center justify-between">
              <Brand expanded />
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close navigation"
                className="mr-3 rounded-lg p-1.5 text-white/55 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavSections expanded pendingApprovals={pendingApprovals} onNavigate={onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
};

export default Sidebar;
