/**
 * AI Bug Fixer — Production UI
 * New VideoRemix Name: AI Bug Fixer
 * Bug diagnosis, fix suggestions, and verification traces
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Bug, AlertCircle, CheckCircle2, FileCode, ArrowRight } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { ExecutionTrace } from "../../primitives/ExecutionTrace";
import { CodeBlock } from "../../primitives/CodeBlock";
import { DiffViewer } from "../../primitives/DiffViewer";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIBugFixer({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [bugDescription, setBugDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [codeFile, setCodeFile] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [stackTrace, setStackTrace] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const languages = [
    "javascript", "typescript", "python", "java", "csharp", "go", "rust", "ruby", "php", "swift", "kotlin"
  ];

  const handleRun = async () => {
    if (!bugDescription.trim() && !codeFile.trim()) return;
    await run({
      bugDescription: bugDescription.trim() || undefined,
      errorMessage: errorMessage.trim() || undefined,
      codeFile: codeFile.trim() || undefined,
      language,
      stackTrace: stackTrace.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setBugDescription("");
    setErrorMessage("");
    setCodeFile("");
    setLanguage("javascript");
    setStackTrace("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Bug className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Diagnose bugs systematically and get fixed code with explanations.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <PromptTextarea
            label="Bug Description"
            placeholder="Describe the bug: what were you trying to do, what happened instead, expected behavior..."
            value={bugDescription}
            onChange={setBugDescription}
            disabled={isRunning}
            maxLength={1000}
            rows={4}
          />

          <PromptTextarea
            label="Error Message (Optional)"
            placeholder="Paste the error message here..."
            value={errorMessage}
            onChange={setErrorMessage}
            disabled={isRunning}
            maxLength={800}
            rows={3}
          />

          <PromptTextarea
            label="Code File"
            placeholder="Paste the relevant code file or section..."
            value={codeFile}
            onChange={setCodeFile}
            disabled={isRunning}
            maxLength={6000}
            rows={10}
          />

          <PromptTextarea
            label="Stack Trace (Optional)"
            placeholder="Paste the stack trace if available..."
            value={stackTrace}
            onChange={setStackTrace}
            disabled={isRunning}
            maxLength={1500}
            rows={4}
          />

          <Button
            onClick={handleRun}
            disabled={(!bugDescription.trim() && !codeFile.trim()) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Diagnosing bug..." : "Diagnose & Fix"}
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
                <AlertCircle className="h-5 w-5" />
                Root Cause Analysis
              </h3>
              <div className="text-gray-200 whitespace-pre-wrap">{output.diagnosis}</div>
            </div>
          )}

          {output.fix && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                Recommended Fix
              </h3>
              <CodeBlock
                code={typeof output.fix === 'string' ? output.fix : JSON.stringify(output.fix, null, 2)}
                language={language}
                title="Fixed Code"
                showLineNumbers
              />
            </div>
          )}

          {output.alternativeFixes && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Alternative Fixes</h3>
              {Array.isArray(output.alternativeFixes) ? (
                <div className="space-y-3">
                  {output.alternativeFixes.map((alt: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary-600 pl-4">
                      <div className="text-gray-200">{typeof alt === 'string' ? alt : alt.description || JSON.stringify(alt)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-300 whitespace-pre-wrap">{output.alternativeFixes}</div>
              )}
            </div>
          )}

          {output.explanation && (
            <div className="rounded-xl border border-blue-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Why This Fix Works</h3>
              <div className="text-gray-200 whitespace-pre-wrap">{output.explanation}</div>
            </div>
          )}

          {output.testCase && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Test Case</h3>
              <CodeBlock
                code={typeof output.testCase === 'string' ? output.testCase : JSON.stringify(output.testCase)}
                language={language}
                title="Test Script"
                showLineNumbers
              />
            </div>
          )}

          {output.relatedBugs && (
            <div className="rounded-xl border border-yellow-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Related Bugs to Check</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.relatedBugs}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Additional Results"
          />
          <ResultActions
            onNew={handleReset}
            newLabel="Fix Another Bug"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}