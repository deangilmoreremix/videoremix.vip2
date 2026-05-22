/**
 * TEMPLATE: How to create a new AI App UI for the 95 apps
 *
 * Copy this file into src/components/ai/apps/[your-slug]/index.tsx
 * Then register the import in registry.ts (add to both map and productionReadySlugs for Batch X)
 *
 * LESSONS FROM BATCH 1 CLEANUP (apply these):
 * - Always include " * New VideoRemix Name: Exact Name" comment at top
 * - Destructure onReset from AIAppProps; pass { onResult, onError, onReset } to useRunAIApp
 * - Use ResultActions primitive for all "New XXX" / optional Clear buttons (reduces drift)
 * - Error strategy: runner-only — never render {error} locally in app (forward only via onError; runner uses ErrorState)
 * - No window.location.reload() ever — use reset() + local state clears if needed for "Clear All"
 * - Prefer primitives: StructuredResult, PromptTextarea, BasicFileUpload, ResultActions, ErrorState/LoadingState where fits
 * - Runner provides stable useCallback handlers; keep your local handlers simple
 * - Keep form visible (disabled) during run; show result toggle on output presence
 * - After edit, run tsc and verify in /ai-app/:slug
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "./useRunAIApp"; // adjust if copying to subdir
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";

export default function YourAppName({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [inputValue, setInputValue] = useState("");
 
  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });


  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!inputValue.trim()) return;
    await run({
      prompt: inputValue,
      // add any other fields your app needs
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">{appName}</h2>
        <p className="mt-1 text-gray-400">Describe what you need below. (Error strategy: do not render local {`{error}`}; runner shows via ErrorState.)</p>
      </div>

      {/* === CUSTOM FORM FIELDS GO HERE === */}
      {/* Examples: textareas (use PromptTextarea), file (BasicFileUpload), selects, etc. */}
      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Your Request</label>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your request..."
          className="w-full rounded-lg border border-gray-700 bg-black p-4 text-white"
          rows={6}
          disabled={isRunning}
        />

        <Button
          onClick={handleRun}
          disabled={!inputValue.trim() || isRunning}
          className="mt-4 w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"
        >
          {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
          {isRunning ? "Running..." : "Run " + appName}
        </Button>
      </div>

      {/* Output area - use StructuredResult + ResultActions (never reload, always reset + onReset) */}
      {output && (
        <div className="space-y-4">
          <StructuredResult result={output} title="Results" />
          <ResultActions onNew={() => reset()} newLabel="New Run" />
        </div>
      )}
    </div>
  );
}
