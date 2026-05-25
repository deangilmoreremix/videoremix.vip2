import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRequiredKeysForAgent, ApiKeyType } from "../utils/agentKeyRequirements";
import { supabase } from "../utils/supabase";

export interface ApiKeyStatus {
  keyType: ApiKeyType;
  value: string | null;
  isValid: boolean;
  checked: boolean;
}

/**
 * Hook to check if required API keys are configured for an agent
 * and provide actions to open settings.
 */
export function useAgentKeyCheck(agentSlug?: string) {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Check if all required keys for an agent are present
   */
  const checkKeys = useCallback(
    async (agentIdentifier?: string): Promise<{
      allPresent: boolean;
      missingKeys: ApiKeyType[];
      storedKeys: Record<ApiKeyType, string | null>;
    }> => {
      const slug = agentIdentifier || agentSlug;
      if (!slug) {
        return { allPresent: true, missingKeys: [], storedKeys: {} };
      }

      const requiredKeys = getRequiredKeysForAgent(slug);
      if (requiredKeys.length === 0) {
        return { allPresent: true, missingKeys: [], storedKeys: {} };
      }

      // Fetch stored keys from Supabase (with localStorage fallback)
      const storedKeys: Record<ApiKeyType, string | null> = {} as any;

      for (const keyType of requiredKeys) {
        const value = await getStoredApiKey(keyType);
        storedKeys[keyType] = value;
      }

      const missingKeys = requiredKeys.filter((keyType) => !storedKeys[keyType]);

      return {
        allPresent: missingKeys.length === 0,
        missingKeys,
        storedKeys,
      };
    },
    [agentSlug],
  );

  /**
   * Open the API settings panel
   */
  const openSettings = useCallback(() => {
    navigate("/settings/api");
  }, [navigate]);

  /**
   * Before allowing an action, check keys and show friendly message if missing
   */
  const requireKeys = useCallback(
    async (
      agentIdentifier?: string,
    ): Promise<{
      allowed: boolean;
      missingKeys: ApiKeyType[];
      openSettings: () => void;
    }> => {
      const result = await checkKeys(agentIdentifier);
      return {
        allowed: result.allPresent,
        missingKeys: result.missingKeys,
        openSettings,
      };
    },
    [checkKeys, openSettings],
  );

  return {
    checkKeys,
    requireKeys,
    openSettings,
  };
}

/**
 * Retrieve stored API key for a given type
 * Checks Supabase user_settings table first, then localStorage fallback
 */
export async function getStoredApiKey(keyType: ApiKeyType): Promise<string | null> {
  const storageKey = `agent_api_key_${keyType}`;

  // Try localStorage first (fast, no auth needed)
  try {
    const localValue = localStorage.getItem(storageKey);
    if (localValue) {
      return localValue;
    }
  } catch (e) {
    // localStorage not available
  }

  // Try Supabase if user is authenticated
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .single();

      if (!error && data?.settings?.[keyType]) {
        return data.settings[keyType];
      }
    }
  } catch (e) {
    console.error("Error fetching API key from Supabase:", e);
  }

  return null;
}

/**
 * Save API key to both localStorage and Supabase
 */
export async function saveApiKey(
  keyType: ApiKeyType,
  value: string,
): Promise<{ success: boolean; error?: string }> {
  const storageKey = `agent_api_key_${keyType}`;

  // Always save to localStorage
  try {
    if (value) {
      localStorage.setItem(storageKey, value);
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }

  // Try to sync with Supabase if user is logged in
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // First, get existing settings
      const { data: existing, error: fetchError } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows returned, that's ok
        console.error("Error fetching existing settings:", fetchError);
      }

      const currentSettings = existing?.settings || {};

      // Update the specific key
      const newSettings = {
        ...currentSettings,
        [keyType]: value,
      };

      // Upsert the settings
      const { error: upsertError } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            settings: newSettings,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

      if (upsertError) {
        console.error("Error saving to Supabase:", upsertError);
        return { success: false, error: upsertError.message };
      }
    }
  } catch (e) {
    console.error("Error syncing with Supabase:", e);
    return { success: false, error: String(e) };
  }

  return { success: true };
}
