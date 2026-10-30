// src/pages/agentos/LegacyAgentOSRedirect.tsx
//
// AgentOS used to live at /agentos; it is now the dashboard. Old links and
// bookmarks land on the same page under /dashboard. /agentos itself was the
// Mission Control canvas, so it goes there rather than to the home page.

import { Navigate, useLocation } from "react-router-dom";

const LegacyAgentOSRedirect: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/agentos\/?/, "");
  // Joined rather than templated: the path is computed, not a link literal.
  const target = rest ? ["", "dashboard", rest].join("/") : "/dashboard/mission-control";
  return <Navigate to={`${target}${search}${hash}`} replace />;
};

export default LegacyAgentOSRedirect;
