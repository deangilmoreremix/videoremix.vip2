import React, { useState, useEffect } from "react";
import { Play, Loader2, Copy } from "lucide-react";
import type { AIAppProps } from "./types";
import { useRunAIApp } from "./useRunAIApp";
import { ResultActions } from "../primitives/ResultActions";

/**
 * Generic fallback UI for any of the 95 AI apps that don't have a custom
 * implementation yet (i.e. not yet registered in registry.ts).
 *
 * Fully compatible with AIAppProps (appId, appName, onResult?, onError?).
 * Uses the central run-ai-app Edge Function.
 *
 * When a custom component is implemented for a slug, it is registered and
 * this fallback is no longer used for that app.
 */
export const GenericAIApp: React.FC<AIAppProps> = ({ appId, appName, onResult, onError, onRunningChange, onReset }) => {
  const [input, setInput] = useState("");
 
  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });


  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!input.trim()) return;
    await run({ prompt: input.trim() });
  };

  const handleCopy = () => {
    if (!output) return;
    const text = typeof output === "string" ? output : JSON.stringify(output, null, 2);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{appName}</h2>
        <p className="mt-1 text-gray-400">
          Enter your request below. The AI will process it using the latest models and return professional-grade output.
        </p>
      </div>

      {/* Input Area */}
      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Your Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you need... (e.g. 'Research 5 enterprise prospects in fintech and draft personalized outreach')"
          className="min-h-[140px] w-full resize-y rounded-lg border border-gray-700 bg-black p-4 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          disabled={isRunning}
        />

        <button
          onClick={handleRun}
          disabled={!input.trim() || isRunning}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Running {appName}...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Run {appName}
            </>
          )}
        </button>
      </div>

      {/* Output Area - runner-only error strategy: no local {error} render here (runner shows ErrorState) */}
      {output && (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-200">Result</h3>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            )}
          </div>
 
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-gray-200 text-sm">
            {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
          </div>
 
          <div className="mt-4">
            <ResultActions onNew={() => reset()} newLabel={`New ${appName}`} />
          </div>
        </div>
      )}


      {/* Future enhancements note */}
      <p className="text-center text-xs text-gray-600">
        This is the base interface. Specific apps will have richer controls (file uploads, multi-step wizards, image previews, audio players, structured tables, etc.) matching the original demos.
      </p>
    </div>
  );
};
