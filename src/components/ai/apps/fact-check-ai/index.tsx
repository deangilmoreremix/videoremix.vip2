/**
 * Fact Check AI — Production UI (Batch 5)
 * New VideoRemix Name: Fact Check AI
 * Verifies claims with evidence, sources, verdict, and related misinformation detection.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, ShieldCheck } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function FactCheckAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [claimToVerify, setClaimToVerify] = useState("");
  const [context, setContext] = useState("");
  const [urgency, setUrgency] = useState<"quick" | "standard" | "thorough">("standard");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!claimToVerify.trim()) return;

    const inputs = {
      claimToVerify: claimToVerify.trim(),
      context: context.trim() || undefined,
      urgency,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setClaimToVerify("");
    setContext("");
    setUrgency("standard");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Real-time fact verification. Returns clear verdict, source-by-source evidence, detailed analysis, and detection of related misinformation using live web search.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Claim or Statement to Verify</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. 'AI models will replace 80% of software engineers by 2028'"
              value={claimToVerify}
              onChange={setClaimToVerify}
              disabled={isRunning}
              maxLength={1200}
              rows={3}
              hint="Paste the exact claim. The more specific, the better."
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Context (where/when the claim was made)</Label>
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Viral LinkedIn post by @username, March 2026"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Verification Urgency</Label>
            <div className="flex gap-2">
              {(["quick", "standard", "thorough"] as const).map((u) => (
                <Button key={u} type="button" variant={urgency === u ? "default" : "outline"} onClick={() => setUrgency(u)} disabled={isRunning} className="flex-1 capitalize">
                  {u}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!claimToVerify.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Verifying claim against reliable sources..." : "Run Fact Check AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Fact Check Report" />
          <ResultActions
            onNew={handleReset}
            newLabel="Check Another Claim"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}
