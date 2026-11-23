// src/pages/agentos/DashboardAgentRoute.tsx
//
// Route: /dashboard/agents/:id. An app whose agent page no longer matches
// upstream opens the upstream screen at /dashboard/apps/:id instead, so old
// links keep working (src/config/appScreens.ts).

import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getAppMeta } from "../../config/appRegistry";
import { appScreen, dashboardAppPath } from "../../config/appScreens";

const DashboardAgentRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { id = "" } = useParams<{ id: string }>();
  if (getAppMeta(id)?.family === "awesome-llm" && appScreen(id) !== "agent-page") {
    return <Navigate to={dashboardAppPath(id)} replace />;
  }
  return <>{children}</>;
};

export default DashboardAgentRoute;
