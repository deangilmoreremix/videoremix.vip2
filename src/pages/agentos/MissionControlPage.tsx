// src/pages/agentos/MissionControlPage.tsx
//
// Route: /agentos and /agentos/mission-control — the interactive Mission
// Control canvas.

import { Helmet } from "react-helmet-async";
import { MissionControlShell } from "../../components/agentos/mission-control";

const MissionControlPage: React.FC = () => (
  <>
    <Helmet>
      <title>Mission Control — SapienX AgentOS</title>
    </Helmet>
    <MissionControlShell />
  </>
);

export default MissionControlPage;
