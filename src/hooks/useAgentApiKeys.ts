import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { checkAgentKeys, getAgentKeyRequirements, AgentKeyRequirements, AVAILABLE_API_KEYS } from "../utils/agentKeyRequirements";
import { Loader2, AlertCircle, Settings } from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * Hook to check if an agent has all required API keys configured.
 * Provides a banner message and navigation helper if keys are missing.
 */
export function useAgentApiKeys(agentSlug: string) {
  const navigate = useNavigate();

  const checkKeys = useCallback(async (): Promise<{
    hasAllKeys: boolean;
    missingKeys: string[];
    requirements: AgentKeyRequirements;
    storedKeys: Record<string, string>;
  }> => {
    // Get stored keys from Supabase + localStorage
    const storedKeys: Record<string, string> = {};

    // Try Supabase first
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_settings")
          .select("api_keys")
          .eq("user_id", user.id)
          .single();

        if (data?.api_keys) {
          Object.assign(storedKeys, data.api_keys);
        }
      }
    } catch (error) {
      console.error("Error fetching keys from Supabase:", error);
    }

    // Merge with localStorage (locally stored keys override if present)
    Object.values(AVAILABLE_API_KEYS).forEach(({ key }) => {
      const localStorageValue = localStorage.getItem(`api_key_${key}`);
      if (localStorageValue) {
        storedKeys[key] = localStorageValue;
      }
    });

    const result = checkAgentKeys(agentSlug, storedKeys);
    const requirements = getAgentKeyRequirements(agentSlug);

    return {
      hasAllKeys: result.hasAllKeys,
      missingKeys: result.missingKeys,
      requirements,
      storedKeys,
    };
  }, [agentSlug]);

  const openApiSettings = useCallback(() => {
    navigate("/settings/api");
  }, [navigate]);

  const getMissingKeyNames = useCallback(
    (missingKeys: string[], requirements: AgentKeyRequirements): string[] => {
      return missingKeys.map((key) => {
        const config = requirements.keysConfig[key] || AVAILABLE_API_KEYS[key];
        return config?.name || key;
      });
    },
    []
  );

  return {
    checkKeys,
    openApiSettings,
    getMissingKeyNames,
  };
}

export default useAgentApiKeys;
