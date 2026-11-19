// src/components/apps/UpstreamAppRoute.tsx
//
// Loads an app's upstream spec and draws it. Its own chunk, so the specs of
// all 117 apps load only when an app page opens.

import type { ReactNode } from "react";
import { getUpstreamSpec } from "../../config/upstreamAppSpecs";
import { UpstreamAppPage } from "./UpstreamAppPage";

const UpstreamAppRoute: React.FC<{ slug: string; fallback: ReactNode }> = ({ slug, fallback }) => {
  const spec = getUpstreamSpec(slug);
  // key: a new app gets fresh inputs and results.
  return spec ? <UpstreamAppPage key={slug} spec={spec} /> : <>{fallback}</>;
};

export default UpstreamAppRoute;
