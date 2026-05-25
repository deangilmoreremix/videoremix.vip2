# Simple AI Agent Template

## Overview
Template for basic AI agents that follow a simple prompt-response pattern with single-step processing.

## Files Structure
```
templates/simple-ai-agent/
├── function.ts          # Netlify function template
├── input-form.tsx       # Input form component
├── results-page.tsx     # Results display page
├── spec-template.md     # Specification template
└── implementation-guide.md # Quick customization guide
```

## Function Template (function.ts)
```typescript
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface SimpleAgentInput {
  primaryInput: string;
  secondaryInput?: string;
  options?: Record<string, any>;
  userId?: string;
}

interface SimpleAgentResult {
  id: string;
  primaryInput: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  result: string;
  metadata?: Record<string, any>;
  processingTime: number;
  error?: string;
}

// CUSTOMIZE: Replace with your agent's specific prompt
function buildAgentPrompt(input: SimpleAgentInput): string {
  return `Your custom agent prompt here using:
  - Primary Input: ${input.primaryInput}
  - Secondary Input: ${input.secondaryInput || 'Not provided'}
  - Options: ${JSON.stringify(input.options || {})}
  `;
}

// CUSTOMIZE: Replace with your agent's result processing
function processAgentResult(response: any): string {
  return response.content[0]?.text || 'No result generated';
}

async function runSimpleAgent(input: SimpleAgentInput): Promise<SimpleAgentResult> {
  const startTime = Date.now();

  try {
    const prompt = buildAgentPrompt(input);

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const result = processAgentResult(response);
    const processingTime = Date.now() - startTime;

    return {
      id: `simple_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primaryInput: input.primaryInput,
      timestamp: new Date().toISOString(),
      status: 'completed',
      result,
      processingTime,
      metadata: { model: 'claude-3-opus', tokens: response.usage?.input_tokens }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      id: `simple_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primaryInput: input.primaryInput,
      timestamp: new Date().toISOString(),
      status: 'error',
      result: '',
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const input: SimpleAgentInput = JSON.parse(event.body);

    if (!input.primaryInput?.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Primary input is required' })
      };
    }

    // Save to database
    const resultId = `simple_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'simple_ai_agent', // CUSTOMIZE: Change this
      user_id: input.userId || null,
      input_data: input,
      output_data: { id: resultId, status: 'processing' },
      status: 'processing'
    });

    // Run agent
    const finalResult = await runSimpleAgent(input);

    // Update database
    await supabase.from('ai_agent_runs').update({
      output_data: finalResult,
      status: finalResult.status
    }).eq('id', resultId);

    return { statusCode: 200, body: JSON.stringify(finalResult) };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}
```

## Input Form Template (input-form.tsx)
```typescript
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const simpleAgentSchema = z.object({
  primaryInput: z.string().min(1, "Primary input is required"),
  secondaryInput: z.string().optional(),
});

type SimpleAgentForm = z.infer<typeof simpleAgentSchema>;

interface SimpleAgentFormProps {
  onSubmit: (data: SimpleAgentForm) => Promise<void>;
  isProcessing: boolean;
  currentStage?: number;
  error?: string;
  agentConfig: {
    name: string;
    description: string;
    primaryLabel: string;
    secondaryLabel?: string;
    placeholder: string;
    secondaryPlaceholder?: string;
  };
}

const SimpleAgentForm: React.FC<SimpleAgentFormProps> = ({
  onSubmit,
  isProcessing,
  error,
  agentConfig
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch } = useForm<SimpleAgentForm>({
    resolver: zodResolver(simpleAgentSchema)
  });

  const primaryInput = watch('primaryInput');
  const inputLength = primaryInput?.length || 0;

  const handleFormSubmit = async (data: SimpleAgentForm) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-500 rounded-2xl"
        >
          <CheckCircle className="h-8 w-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{agentConfig.name}</h2>
          <p className="text-lg text-gray-300">{agentConfig.description}</p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        </motion.div>
      )}

      {isProcessing && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Processing Your Request</h3>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-blue-400">AI Analysis in Progress</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!isProcessing && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Input Details</h3>
              <span className={`text-xs ${inputLength > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {inputLength} characters
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryInput" className="text-white font-medium">
                {agentConfig.primaryLabel} *
              </Label>
              <Textarea
                id="primaryInput"
                placeholder={agentConfig.placeholder}
                className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 min-h-[120px] resize-none"
                {...register('primaryInput')}
              />
            </div>

            {agentConfig.secondaryLabel && (
              <div className="space-y-2">
                <Label htmlFor="secondaryInput" className="text-white font-medium">
                  {agentConfig.secondaryLabel} (Optional)
                </Label>
                <Textarea
                  id="secondaryInput"
                  placeholder={agentConfig.secondaryPlaceholder}
                  className="bg-gray-900/50 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 min-h-[80px] resize-none"
                  {...register('secondaryInput')}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || inputLength === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-500 hover:to-purple-400 text-white font-medium px-8 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Generate Results</span>
                </>
              )}
            </Button>
          </div>
        </motion.form>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p className="text-center text-sm text-gray-400">
          Takes 30-60 seconds to generate comprehensive AI-powered results
        </p>
      </motion.div>
    </div>
  );
};

export default SimpleAgentForm;
```

## Results Page Template (results-page.tsx)
```typescript
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import SimpleAgentForm from "../../components/agents/SimpleAgentForm";

interface SimpleAgentResult {
  id: string;
  primaryInput: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  result: string;
  metadata?: Record<string, any>;
  processingTime: number;
  error?: string;
}

interface SimpleAgentPageProps {
  agentConfig: {
    name: string;
    description: string;
    primaryLabel: string;
    secondaryLabel?: string;
    placeholder: string;
    secondaryPlaceholder?: string;
    functionName: string; // Netlify function name
    seoTitle: string;
    seoDescription: string;
    gradient: string; // Tailwind gradient classes
    icon: React.ComponentType<{ className?: string }>;
  };
}

const SimpleAgentPage: React.FC<SimpleAgentPageProps> = ({ agentConfig }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SimpleAgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAgentSubmit = async (formData: {
    primaryInput: string;
    secondaryInput?: string;
  }) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/.netlify/functions/${agentConfig.functionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: SimpleAgentResult = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Processing failed');
      }

      setResult(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  return (
    <>
      <Helmet>
        <title>{agentConfig.seoTitle}</title>
        <meta name="description" content={agentConfig.seoDescription} />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <SimpleAgentForm
            onSubmit={handleAgentSubmit}
            isProcessing={isProcessing}
            error={error || undefined}
            agentConfig={agentConfig}
          />

          {result && result.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Results</h3>
                  <div className="text-sm text-gray-400">
                    Generated in {Math.round(result.processingTime / 1000)}s
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-6">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                      {result.result}
                    </pre>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                  <div className="flex space-x-3">
                    <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Copy to Clipboard
                    </button>
                    <button className="text-green-400 hover:text-green-300 text-sm font-medium">
                      Download as Text
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default SimpleAgentPage;
```