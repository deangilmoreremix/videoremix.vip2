import React, { useState } from 'react';
import X from 'lucide-react/dist/esm/icons/x.js';
import Eye from 'lucide-react/dist/esm/icons/eye.js';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off.js';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link.js';
import Check from 'lucide-react/dist/esm/icons/check.js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { PROVIDER_INFO, type ApiKeyGateContextType } from './api-key-gate';
import { useApiKeyGate } from './api-key-gate';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from './ui/use-toast';

interface APIKeyRequiredModalProps {
  /** List of providers required (e.g. ['openai', 'elevenlabs']) */
  providers: string[];
  /** Optional: app name for display */
  appName?: string;
  /** Callback when all keys are provided */
  onSuccess?: () => void;
}

/**
 * Modal shown when user lacks required API keys.
 * Allows user to add missing keys securely.
 */
export const APIKeyRequiredModal: React.FC<APIKeyRequiredModalProps> = ({
  providers,
  appName,
  onSuccess,
}) => {
  const supabase = useSupabaseClient();
  const { saveApiKey, testApiKey, missingProviders } = useApiKeyGate(appName || '');
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [tested, setTested] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const requiredProviders = providers.length > 0 ? providers : missingProviders;

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (provider: string, value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleTestKey = async (provider: string) => {
    const key = keys[provider] || '';
    if (!key.trim()) return;

    setTesting((prev) => ({ ...prev, [provider]: true }));
    try {
      const valid = await testApiKey(provider, key);
      setTested((prev) => ({ ...prev, [provider]: valid }));
      if (valid) {
        toast({
          title: 'API Key Valid',
          description: `${PROVIDER_INFO[provider]?.name || provider} key is valid!`,
        });
      } else {
        toast({
          title: 'Invalid API Key',
          description: 'The key you provided is not valid. Please check and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setTesting((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSaveKey = async (provider: string) => {
    const key = keys[provider] || '';
    if (!key.trim()) return;

    setSaving(true);
    try {
      const success = await saveApiKey(provider, key);
      if (success) {
        toast({
          title: 'API Key Saved',
          description: 'Your API key has been saved securely.',
        });
        // Clear the key from local state after saving
        setKeys((prev) => ({ ...prev, [provider]: '' }));
        setTested((prev) => ({ ...prev, [provider]: false }));
      } else {
        toast({
          title: 'Save Failed',
          description: 'Could not save API key. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const allKeysSaved = requiredProviders.every(
    (p) => !keys[p]?.trim() && tested[p] // saved & tested
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-white">Add API Key{appName && ` for ${appName}`}</CardTitle>
              {appName && (
                <p className="text-gray-400 mt-2">
                  This app requires the following API key(s) to function:
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => {
                // Close modal logic handled by parent
                window.location.reload(); // Simple: reload to re-check access
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-gray-300">
            Your API keys are stored encrypted in Supabase and are only used to power this app
            directly with the provider. You pay the provider directly (e.g., OpenAI) — no middleman.
          </p>

          {requiredProviders.map((provider) => {
            const info = PROVIDER_INFO[provider];
            if (!info) return null;

            return (
              <div key={provider} className="border border-gray-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium text-white">{info.name}</Label>
                    <p className="text-sm text-gray-400 mt-1">{info.hint}</p>
                  </div>
                  <a
                    href={info.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Get Key <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Input
                      type={showKeys[provider] ? 'text' : 'password'}
                      placeholder={`Enter ${info.name} API key`}
                      value={keys[provider] || ''}
                      onChange={(e) => handleKeyChange(provider, e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400"
                      onClick={() => toggleKeyVisibility(provider)}
                    >
                      {showKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <Button
                    onClick={() => handleTestKey(provider)}
                    disabled={testing[provider] || !keys[provider]?.trim()}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    {testing[provider] ? 'Testing...' : 'Test'}
                  </Button>

                  <Button
                    onClick={() => handleSaveKey(provider)}
                    disabled={saving || !keys[provider]?.trim() || !tested[provider]}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>

                {tested[provider] && (
                  <div className={`flex items-center text-sm ${tested[provider] ? 'text-green-400' : 'text-red-400'}`}>
                    {tested[provider] ? <Check className="h-4 w-4 mr-1" /> : null}
                    {tested[provider] ? 'Key is valid and ready to use' : 'Key test failed'}
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-primary-900/30 border border-primary-500/30 rounded-lg p-4">
            <p className="text-sm text-primary-200">
              <strong>Note:</strong> Your API key is stored securely and only used server-side.
              We never share it with third parties. You can revoke it anytime from the provider's dashboard.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => window.location.reload()}
              disabled={!allKeysSaved}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Continue to App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
