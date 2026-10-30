// src/pages/agentos/AgentOSLayout.tsx
//
// The dashboard shell: SapienX AgentOS is the authenticated VideoRemix
// dashboard. Every /dashboard/* page renders inside this layout through
// <Outlet />, under one sidebar and one topbar — the site's own header and
// footer are not rendered here (src/App.tsx hides them on /dashboard).
//
// Mission Control is full-bleed: its canvas fills the viewport and the topbar
// floats over it, as upstream's does. Every other page scrolls inside a
// padded column over a fainter copy of the same grid.

import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "../../styles/agentos.css";
import { Sidebar } from "../../components/agentos/shell/Sidebar";
import { Topbar } from "../../components/agentos/shell/Topbar";
import { AgentOSThemeProvider, useAgentOSTheme } from "../../components/agentos/shell/theme";
import { CommandBar } from "../../components/agentos/mission-control/command-bar/CommandBar";
import { countPendingApprovals } from "../../services/agentos/approvals";

export interface AgentOSOutletContext {
  openCommandBar: () => void;
}

const Shell: React.FC = () => {
  const { theme } = useAgentOSTheme();
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const isCanvas = pathname.startsWith("/dashboard/mission-control");

  // The tokens are also set on <html>, so dialogs rendered in a portal
  // outside this tree are themed too. Removed when the dashboard unmounts.
  useEffect(() => {
    document.documentElement.dataset.agentosTheme = theme;
  }, [theme]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.agentosTheme;
    },
    [],
  );

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openCommandBar = useCallback(() => setCommandOpen(true), []);

  // The Human Control badge, refreshed on every navigation so a decision made
  // on one page is reflected when the operator moves on.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await countPendingApprovals();
      if (!cancelled && !result.error) setPendingApprovals(result.data ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="agentos-root relative flex min-h-screen" data-theme={theme}>
      <Sidebar
        pendingApprovals={pendingApprovals}
        mobileOpen={mobileNavOpen}
        onMobileClose={closeMobileNav}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {isCanvas ? (
          <div className="relative h-screen overflow-hidden">
            <Topbar floating onOpenMobileNav={() => setMobileNavOpen(true)} onOpenCommand={openCommandBar} />
            <Outlet context={{ openCommandBar } satisfies AgentOSOutletContext} />
          </div>
        ) : (
          <>
            <div className="agentos-page-backdrop fixed inset-0 -z-0">
              <div className="mission-canvas-backdrop">
                <div className="mission-canvas-pattern" />
              </div>
            </div>
            <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} onOpenCommand={openCommandBar} />
            <main className="relative z-10 flex-1 pb-10">
              <Outlet context={{ openCommandBar } satisfies AgentOSOutletContext} />
            </main>
          </>
        )}
      </div>

      <CommandBar open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
};

const AgentOSLayout: React.FC = () => (
  <AgentOSThemeProvider>
    <Shell />
  </AgentOSThemeProvider>
);

export default AgentOSLayout;
