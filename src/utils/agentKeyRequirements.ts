/**
 * Agent API Key Requirements
 *
 * Defines which API keys are required for each agent.
 * Maps agent slugs to their required key configurations.
 */

// Canonical API key types supported by the system
export type ApiKeyType =
  | "OPENAI_API_KEY";

// Human-readable label for each key type
export const API_KEY_LABELS: Record<ApiKeyType, string> = {
  OPENAI_API_KEY: "OpenAI API Key",
};

// Description of what each key is used for
export const API_KEY_DESCRIPTIONS: Record<ApiKeyType, string> = {
  OPENAI_API_KEY: "Used for GPT-4, GPT-3.5, and other OpenAI models",
};

// Aggregate all supported key types
export const ALL_API_KEY_TYPES: ApiKeyType[] = [
  "OPENAI_API_KEY",
];

// Mapping from agent slug to required API key types
// Derived from analyzing form fields across all agent pages
export const AGENT_KEY_REQUIREMENTS: Record<string, ApiKeyType[]> = {
  // Default fallback for agents without explicit requirements
  "default": ["OPENAI_API_KEY"],
};

export interface AgentKeyRequirements {
  agentSlug: string;
  requiredKeys: ApiKeyType[];
}

export const AVAILABLE_API_KEYS: Record<string, { name: string; description: string; key: string }> = {
  OPENAI_API_KEY: { name: 'OpenAI', description: 'GPT-4', key: import.meta.env.VITE_OPENAI_API_KEY ?? '' },
};

/**
 * Get required API key types for a given agent slug
 */
export function getAgentKeyRequirements(agentSlug: string): AgentKeyRequirements {
  const slug = agentSlug.toLowerCase();
  return {
    agentSlug: AGENT_KEY_REQUIREMENTS[slug] ? slug : 'default',
    requiredKeys: AGENT_KEY_REQUIREMENTS[slug] || AGENT_KEY_REQUIREMENTS['default'] || [],
  };
}

/**
 * Check whether the supplied storedKeys satisfy the required keys for an agent.
 */
export function checkAgentKeys(
  agentSlug: string,
  storedKeys: Record<string, string>
): { hasAllKeys: boolean; missingKeys: ApiKeyType[] } {
  const requiredKeys = getAgentKeyRequirements(agentSlug).requiredKeys;
  const missingKeys = requiredKeys.filter((key) => !storedKeys[key]?.trim());
  return {
    hasAllKeys: missingKeys.length === 0,
    missingKeys,
  };
}
