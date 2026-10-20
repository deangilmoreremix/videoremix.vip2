// src/pages/agentos/AgentOSLayout.tsx
//
// The AgentOS section shell.
//
// Every /agentos/* page renders inside this layout, so the section nav (and
// the notification bell) are present on all of them. The page itself is
// rendered by the nested route through <Outlet />.

import { Outlet } from "react-router-dom";
import { AgentOSNav } from "../../components/agentos/nav";
import SpecialFooter from "../../components/SpecialFooter";

const AgentOSLayout: React.FC = () => {
  return (
    // pt-16 clears the app's fixed header (h-16), which is rendered on every
    // route including this section.
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white pt-16">
      <AgentOSNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <SpecialFooter />
    </div>
  );
};

export default AgentOSLayout;
