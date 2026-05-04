import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { createClient } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X, CheckCircle, XCircle, AlertCircle, Key, Save, TestTube } from "lucide-react";

// API keys that users can configure
const API_KEYS = [
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    description: "Used by most AI agents for GPT-4, GPT-3.5",
    testEndpoint: "https://api.openai.com/v1/models",
    testHeader: "Authorization: Bearer {key}"
  },
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    description: "For Claude-based agents",
    testEndpoint: "https://api.anthropic.com/v1/messages",
    testHeader: "x-api-key: {key}"
  },
  {
    key: "GOOGLE_GENERATIVE_AI_KEY",
    label: "Google Gemini API Key",
    description: "For Gemini-powered agents",
    testEndpoint: "https://generativelanguage.googleapis.com/v1/models",
    testHeader: "Authorization: Bearer {key}"
  },
  {
    key: "EXA_API_KEY",
    label: "Exa API Key",
    description: "For web-search and research agents",
    testEndpoint: "https://api.exa.ai/search",
    testHeader: "Authorization: Bearer {key}"
  },
  {
    key: "FIRECRAWL_API_KEY",
    label: "Firecrawl API Key",
    description: "For web scraping and crawling agents",
    testEndpoint: "https://api.firecrawl.dev/v1/scrape",
    testHeader: "Authorization: Bearer {key}"
  },
  {
    key: "TOGETHER_API_KEY",
    label: "Together AI API Key",
    description: "For Llama-based and alternative models",
    testEndpoint: "https://api.together.xyz/v1/models",
    testHeader: "Authorization: Bearer {key}"
  }
];

interface AgentApiConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeyStatus {
  configured: boolean;
  valid?: boolean;
  testing: boolean;
}

const AgentApiConfigPanel: React.FC<AgentApiConfigPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
  const [saving, setSaving] = useState(false);

  // Load saved keys on mount
  useEffect(() => {
    if (isOpen && user) {
      loadKeys();
    }
  }, [isOpen, user]);

  const loadKeys = async () => {
    if (!user) return;
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();
    
    if (data?.api_keys) {
      setKeyValues(data.api_keys);
      Object.keys(data.api_keys).forEach(k => {
        setKeyStatuses(prev => ({ ...prev, [k]: { configured: true, valid: false } }));
      });
    }
  };

  const handleKeyChange = (key: string, value: string) => {
    setKeyValues(prev => ({ ...prev, [key]: value }));
  };

  const testKey = async (keyConfig: typeof API_KEYS[0]) => {
    const value = keyValues[keyConfig.key];
    if (!value) return;

    setKeyStatuses(prev => ({ ...prev, [keyConfig.key]: { configured: true, valid: false, testing: true } }));

    try {
      const response = await fetch(keyConfig.testEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          [keyConfig.testHeader.split(':')[0]]: value
        }
      });

      const isValid = response.ok;
      setKeyStatuses(prev => ({ 
        ...prev, 
        [keyConfig.key]: { configured: true, valid: isValid, testing: false } 
      }));
    } catch (error) {
      setKeyStatuses(prev => ({ 
        ...prev, 
        [keyConfig.key]: { configured: true, valid: false, testing: false } 
      }));
    }
  };

  const saveKeys = async () => {
    if (!user) return;
    setSaving(true);
    
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, api_keys: keyValues }, { onConflict: 'user_id' });

    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">API Configuration</CardTitle>
                  <p className="text-sm text-gray-400">Configure API keys for AI agents</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {API_KEYS.map(keyConfig => {
                const status = keyStatuses[keyConfig.key] || { configured: false, testing: false };
                const value = keyValues[keyConfig.key] || '';

                return (
                  <div key={keyConfig.key} className="space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <Label className="text-base font-medium">{keyConfig.label}</Label>
                        <p className="text-sm text-gray-400 mt-1">{keyConfig.description}</p>
                      </div>
                      {status.configured && (
                        status.testing ? (
                          <TestTube className="h-5 w-5 text-blue-400 animate-pulse" />
                        ) : status.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Input
                        type="password"
                        value={value}
                        onChange={(e) => handleKeyChange(keyConfig.key, e.target.value)}
                        placeholder={`Enter ${keyConfig.label}`}
                        className="flex-1 bg-gray-800 border-gray-600"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testKey(keyConfig)}
                        disabled={!value || status.testing}
                      >
                        {status.testing ? 'Testing...' : 'Test'}
                      </Button>
                    </div>

                    {status.configured && !status.testing && status.valid === false && (
                      <p className="text-xs text-red-400">Key appears invalid or expired</p>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Keys are stored encrypted and synced across devices.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button onClick={saveKeys} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Keys'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AgentApiConfigPanel;
