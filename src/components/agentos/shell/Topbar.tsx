// src/components/agentos/shell/Topbar.tsx
//
// The floating topbar, after upstream's mission-control-shell.topbar: a title
// pill on the left, and the operator's controls on the right — the command
// palette, notifications, the theme toggle and the account menu.

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Command, LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { NotificationBell } from "../notifications";
import { currentNavLabel } from "../mission-control/navigation";
import { useAgentOSTheme } from "./theme";
import { cn } from "../../../lib/utils";

export interface TopbarProps {
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
  /** Mission Control floats the bar over its canvas instead of above the page. */
  floating?: boolean;
}

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white";

const AccountMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const email = user?.email ?? "";
  const initial = (email[0] ?? "U").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-agentos-brand to-agentos-accent text-sm font-semibold text-white"
      >
        {initial}
      </button>
      {open ? (
        <div
          role="menu"
          className="agentos-panel agentos-float-up absolute right-0 top-11 z-50 w-60 rounded-2xl p-1.5"
        >
          {email ? <p className="truncate px-3 py-2 text-xs text-white/45">{email}</p> : null}
          <Link
            role="menuitem"
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            <UserRound className="h-4 w-4" /> Profile
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate("/", { replace: true });
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
};

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileNav, onOpenCommand, floating }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useAgentOSTheme();
  const { pathname } = useLocation();
  const title = currentNavLabel(pathname);

  return (
    <header
      className={cn(
        "pointer-events-none z-30 flex items-center justify-between gap-3 px-3 py-3 sm:px-5",
        floating ? "absolute inset-x-0 top-0" : "sticky top-0",
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <button type="button" onClick={onOpenMobileNav} aria-label="Open navigation" className={cn(iconButton, "agentos-panel md:hidden")}>
          <Menu className="h-4 w-4" />
        </button>
        <div className="agentos-panel flex h-10 items-center gap-2 rounded-full px-4">
          <span className="relative flex h-2 w-2">
            <span className="agentos-pulse-ring absolute inline-flex h-full w-full rounded-full bg-agentos-brand" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-agentos-brand" />
          </span>
          <span className="whitespace-nowrap font-display text-sm font-semibold text-white">{title}</span>
        </div>
      </div>

      <div className="agentos-panel pointer-events-auto flex items-center gap-1 rounded-full p-1">
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden h-9 items-center gap-2 rounded-xl px-3 text-xs text-white/55 hover:bg-white/[0.07] hover:text-white sm:flex"
        >
          <Command className="h-3.5 w-3.5" />
          Command
          <kbd className="rounded border border-white/15 px-1 font-mono text-[10px] text-white/45">⌘K</kbd>
        </button>
        <button type="button" onClick={onOpenCommand} aria-label="Open command bar" className={cn(iconButton, "sm:hidden")}>
          <Command className="h-4 w-4" />
        </button>
        {user?.id ? <NotificationBell ownerId={user.id} /> : null}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className={iconButton}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <AccountMenu />
      </div>
    </header>
  );
};

export default Topbar;
