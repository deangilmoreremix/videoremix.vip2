import { aiBreakupRecoveryAgentSpec } from "./appSpecs/ai-breakup-recovery-agent";

export type AppRegistryEntry = {
  spec: (typeof registry)[string]["spec"];
  route: (typeof registry)[string]["route"];
};

export const registry = {
  "ai-breakup-recovery-agent": {
    spec: aiBreakupRecoveryAgentSpec,
    route: "/apps/ai-breakup-recovery-agent",
  },
} satisfies Record<string, AppRegistryEntry>;

export function getAppSpec(appId: string) {
  const entry = registry[appId];
  if (!entry) return null;
  return entry.spec;
}

export function getAppRoute(appId: string) {
  return registry[appId]?.route ?? `/apps/${appId}`;
}

export function listAppIds() {
  return Object.keys(registry);
}
