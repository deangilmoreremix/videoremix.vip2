/**
 * Python Fixer AI — Production UI
 * New VideoRemix Name: Python Fixer AI
 * Python debugging with diagnosis, fixed code, and execution traces
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Bug, CheckCircle2, AlertTriangle, Code2, Zap } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { ExecutionTrace } from "../../primitives/ExecutionTrace";
import { CodeBlock } from "../../primitives/CodeBlock";
import { DiffViewer } from "../../primitives/DiffViewer";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function PythonFixerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [pythonCode, setPythonCode] = useState("");
  const [errorTraceback, setErrorTraceback] = useState("");
  const [pythonVersion, setPythonVersion] = useState("3.11");
  const [focusArea, setFocusArea] = useState("bug");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!pythonCode.trim()) return;
    await run({
      pythonCode: pythonCode.trim(),
      errorTraceback: errorTraceback.trim() || undefined,
      pythonVersion,
      focusArea,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setPythonCode("");
    setErrorTraceback("");
    setPythonVersion("3.11");
    setFocusArea("bug");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Bug className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Debug and optimize Python code with AI-powered diagnosis and fixes.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Python Version</Label>
              <select
                value={pythonVersion}
                onChange={(e) => setPythonVersion(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="3.8">Python 3.8</option>
                <option value="3.9">Python 3.9</option>
                <option value="3.10">Python 3.10</option>
                <option value="3.11">Python 3.11</option>
                <option value="3.12">Python 3.12</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Focus Area</Label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="bug">Bug Fix</option>
                <option value="performance">Performance</option>
                <option value="readability">Readability</option>
              </select>
            </div>
          </div>

          <PromptTextarea
            label="Python Code"
            placeholder="Paste your Python code here..."
            value={pythonCode}
            onChange={setPythonCode}
            disabled={isRunning}
            maxLength={8000}
            rows={12}
          />

          <PromptTextarea
            label="Error Traceback (Optional)"
            placeholder="Paste the full error traceback if you have one..."
            value={errorTraceback}
            onChange={setErrorTraceback}
            disabled={isRunning}
            maxLength={1500}
            rows={4}
          />

          <Button
            onClick={handleRun}
            disabled={!pythonCode.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Fixing Python code..." : "Fix Python Code"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}

          {output.diagnosis && (
            <div className="rounded-xl border border-red-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Root Cause Diagnosis
              </h3>
              <div className="text-gray-200 whitespace-pre-wrap">{output.diagnosis}</div>
            </div>
          )}

          {output.fixedCode && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Fixed Code
              </h3>
              <CodeBlock
                code={typeof output.fixedCode === 'string' ? output.fixedCode : JSON.stringify(output.fixedCode)}
                language="python"
                title="Fixed Python Code"
                showLineNumbers
              />
            </div>
          )}

          {output.changes && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Changes Made</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.changes}</div>
            </div>
          )}

          {output.pythonicAlternatives && (
            <div className="rounded-xl border border-blue-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Pythonic Alternatives
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.pythonicAlternatives}</div>
            </div>
          )}

          {output.testApproach && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Test Approach</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.testApproach}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Additional Results"
          />
          <ResultActions
            onNew={handleReset}
            newLabel="Fix Another"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}