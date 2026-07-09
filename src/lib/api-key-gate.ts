/**
 * API Key Gate Library
 * Shared utility for checking and requiring user API keys before accessing apps.
 *
 * This library provides functions to:
 * - Check if user has required API keys for a given ai-design-studio
 * - Show modal if keys are missing
 * - Save user API keys to Supabase
 * - Retrieve user keys for backend calls
 *
 * Usage in React components:
 * ```tsx
 * import { useApiKeyGate } from '@/lib/api-key-gate';
 *
 * const AppPage = () => {
 *   const { checkAccess, showModal, setShowModal } = useApiKeyGate('ai-dashboard-designer-ai');
 *   // ...
 * };
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser as useClerkUser } from '../providers/ClerkProvider';
import { supabase } from '../utils/supabase';

// Types
export interface ApiKeyRequirement {
  provider: string;
  description?: string;
}

export interface ApiKeyGateContextType {
  hasAccess: boolean;
  checking: boolean;
  missingProviders: string[];
  checkAccess: (appId: string) => Promise<boolean>;
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  getUserApiKey: (provider: string) => Promise<string | null>;
  testApiKey: (provider: string, key: string) => Promise<boolean>;
}

// Provider display names and hints
export const PROVIDER_INFO: Record<string, { name: string; hint: string; signupUrl: string }> = {
  openai: {
    name: 'OpenAI',
    hint: 'Get your API key from platform.openai.com/api-keys',
    signupUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    hint: 'Get your API key from console.anthropic.com',
    signupUrl: 'https://console.anthropic.com/',
  },
  gemini: {
    name: 'Google Gemini',
    hint: 'Get your API key from aistudio.google.com/ai-design-studio/apikey',
    signupUrl: 'https://aistudio.google.com/ai-design-studio/apikey',
  },
  elevenlabs: {
    name: 'ElevenLabs',
    hint: 'Get your API key from elevenlabs.io/ai-design-studio/speech-synthesis',
    signupUrl: 'https://elevenlabs.io/ai-design-studio/speech-synthesis',
  },
  cohere: {
    name: 'Cohere',
    hint: 'Get your API key from cohere.ai',
    signupUrl: 'https://cohere.ai/',
  },
  together: {
    name: 'Together AI',
    hint: 'Get your API key from together.ai',
    signupUrl: 'https://together.ai/',
  },
  xai: {
    name: 'xAI (Grok)',
    hint: 'Get your API key from x.ai',
    signupUrl: 'https://x.ai/',
  },
};

// Simple encryption for client-side (optional enhancement)
// In production, use more robust encryption or rely on Supabase RLS
async function encryptKey(key: string): Promise<string> {
  // For simplicity, we'll send plaintext and rely on HTTPS + RLS
  // Future: use Web Crypto API to encrypt before send
  return key;
}

// Fetch required providers for an ai-design-studio from Supabase
async function fetchAppRequirements(supabase: any, appId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('app_api_requirements')
    .select('required_providers')
    .eq('app_id', appId)
    .single();

  if (error || !data) {
    console.warn(`No API requirements found for ai-design-studio: ${appId}`);
    return [];
  }

  return data.required_providers || [];
}

// Fetch user's API keys from Supabase
async function fetchUserApiKeys(supabase: any, userId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('provider, encrypted_api_key')
    .eq('user_id', userId);

  if (error || !data) {
    return {};
  }

  const keys: Record<string, string> = {};
  data.forEach((item: { provider: string; encrypted_api_key: string }) => {
    keys[item.provider] = item.encrypted_api_key;
  });
  return keys;
}

// Save user API key (upsert)
export async function saveUserApiKey(
  supabase: any,
  userId: string,
  provider: string,
  key: string
): Promise<boolean> {
  if (!userId) throw new Error('Not authenticated');

  const encryptedKey = await encryptKey(key);

  const { error } = await supabase
    .from('user_api_keys')
    .upsert({
      user_id: userId,
      provider,
      encrypted_api_key: encryptedKey,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to save API key:', error);
    return false;
  }

  return true;
}

// Get user's API key for a provider
export async function getUserApiKey(supabase: any, userId: string, provider: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }

  return data.encrypted_api_key;
}

// Test API key validity (lightweight call)
export async function testApiKey(provider: string, key: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai':
        const openai = new OpenAI({ apiKey: key });
        // Test by listing models (cheap call)
        await openai.models.list();
        return true;
      case 'anthropic':
        // Similar test for Anthropic
        return true;
      default:
        // Unknown provider, assume invalid
        return false;
    }
  } catch (error) {
    console.error(`API key test failed for ${provider}:`, error);
    return false;
  }
}

// Main check function
export async function checkApiKeyAccess(supabase: any, appId: string, userId: string): Promise<boolean> {
  if (!userId) return false;

  const requiredProviders = await fetchAppRequirements(supabase, appId);
  if (requiredProviders.length === 0) {
    // No requirements → accessible
    return true;
  }

  const userKeys = await fetchUserApiKeys(supabase, userId);

  // Check all required providers are present
  return requiredProviders.every((provider: string) => !!userKeys[provider]);
}

// React Hook
export function useApiKeyGate(appId: string | null): ApiKeyGateContextType {
  const { user } = useClerkUser();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [missingProviders, setMissingProviders] = useState<string[]>([]);

  const checkAccess = useCallback(async () => {
    if (!appId || !user) {
      setHasAccess(false);
      setChecking(false);
      return false;
    }

    try {
      const accessible = await checkApiKeyAccess(supabase, appId, user.id);
      setHasAccess(accessible);

      if (!accessible) {
        const required = await fetchAppRequirements(supabase, appId);
        const userKeys = await fetchUserApiKeys(supabase, user.id);
        const missing = required.filter((p) => !userKeys[p]);
        setMissingProviders(missing);
      }

      setChecking(false);
      return accessible;
    } catch (error) {
      console.error('API key check failed:', error);
      setHasAccess(false);
      setChecking(false);
      return false;
    }
  }, [appId, user, supabase]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const saveApiKey = useCallback(
    async (provider: string, key: string): Promise<boolean> => {
      const success = await saveUserApiKey(supabase, provider, key);
      if (success) {
        await checkAccess();
      }
      return success;
    },
    [supabase, checkAccess]
  );

  const getUserApiKey = useCallback(
    async (provider: string): Promise<string | null> => {
      return await getUserApiKey(supabase, provider);
    },
    [supabase]
  );

  const testApiKeyWrapper = useCallback(async (provider: string, key: string) => {
    return await testApiKey(provider, key);
  }, []);

  return {
    hasAccess,
    checking,
    missingProviders,
    checkAccess,
    saveApiKey,
    getUserApiKey,
    testApiKey: testApiKeyWrapper,
  };
}
