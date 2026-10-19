// src/pages/agentos/AgentOSLayout.tsx
//
// The AgentOS section shell.
//
// Every /agentos/* page renders inside this layout, so the section nav (and
// the notification bell) are present on all of them. The page itself is
// rendered by the nested route through <Outlet />.

import { Outlet } from "react-router-dom";
import { AgentOSNav } from "../../components/agentos/nav";

const AgentOSLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <AgentOSNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AgentOSLayout;
