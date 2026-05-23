/**
 * AI Code Review Pro — Production UI
 * New VideoRemix Name: AI Code Review Pro
 * Code review with severity scoring, issues table, and code snippets
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Code2, Shield, Zap, Eye, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { ExecutionTrace } from "../../primitives/ExecutionTrace";
import { CodeBlock } from "../../primitives/CodeBlock";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AICodeReviewPro({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [codeToReview, setCodeToReview] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [focusArea, setFocusArea] = useState<string[]>(["best-practices"]);
  const [repositoryContext, setRepositoryContext] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const languages = [
    "javascript", "typescript", "python", "java", "csharp", "go", "rust", "ruby", "php", "swift", "kotlin", "cpp", "c"
  ];

  const focusAreas = [
    { value: "security", label: "Security" },
    { value: "performance", label: "Performance" },
    { value: "readability", label: "Readability" },
    { value: "best-practices", label: "Best Practices" },
  ];

  const handleFocusAreaChange = (value: string) => {
    setFocusArea(prev =>
      prev.includes(value)
        ? prev.filter(f => f !== value)
        : [...prev, value]
    );
  };

  const handleRun = async () => {
    if (!codeToReview.trim()) return;
    await run({
      codeToReview: codeToReview.trim(),
      language,
      focusArea,
      repositoryContext: repositoryContext.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setCodeToReview("");
    setLanguage("javascript");
    setFocusArea(["best-practices"]);
    setRepositoryContext("");
    reset();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-900/50 text-red-400 border-red-700";
      case "major": return "bg-orange-900/50 text-orange-400 border-orange-700";
      case "minor": return "bg-yellow-900/50 text-yellow-400 border-yellow-700";
      default: return "bg-gray-700/50 text-gray-400 border-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Code2 className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Comprehensive code review with severity scoring, issues analysis, and improvement suggestions.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Focus Areas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {focusAreas.map(area => (
                  <button
                    key={area.value}
                    type="button"
                    onClick={() => handleFocusAreaChange(area.value)}
                    disabled={isRunning}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      focusArea.includes(area.value)
                        ? "bg-primary-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PromptTextarea
            label="Code to Review"
            placeholder="Paste your code here for comprehensive review..."
            value={codeToReview}
            onChange={setCodeToReview}
            disabled={isRunning}
            maxLength={8000}
            rows={12}
            hint="The more context you provide, the better the review."
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Repository Context (Optional)</Label>
            <Input
              value={repositoryContext}
              onChange={(e) => setRepositoryContext(e.target.value)}
              placeholder="e.g. React, Node.js, PostgreSQL - any relevant tech context"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!codeToReview.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Reviewing code..." : "Run Code Review"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}

          {output.overallAssessment && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-5xl font-bold ${getScoreColor(output.overallAssessment.score || 5)}`}>
                  {output.overallAssessment.score || "?"}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Overall Assessment</div>
                  <div className="text-gray-400">{output.overallAssessment.summary || "Code review complete"}</div>
                </div>
              </div>
            </div>
          )}

          {output.issues && Array.isArray(output.issues) && output.issues.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Issues Found ({output.issues.length})
              </h3>
              <div className="space-y-3">
                {output.issues.map((issue: any, i: number) => (
                  <div key={i} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                        {issue.severity || "unknown"}
                      </span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{issue.issue || issue.location || "Issue"}</div>
                        {issue.location && (
                          <div className="text-gray-500 text-sm mt-1">Location: {issue.location}</div>
                        )}
                        {issue.suggestion && (
                          <div className="text-gray-300 text-sm mt-2">Suggestion: {issue.suggestion}</div>
                        )}
                        {issue.codeSnippet && (
                          <div className="mt-3">
                            <CodeBlock
                              code={typeof issue.codeSnippet === 'string' ? issue.codeSnippet : JSON.stringify(issue.codeSnippet)}
                              language={language}
                              showLineNumbers
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {output.positiveNotes && (
            <div className="rounded-xl border border-green-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                What's Done Well
              </h3>
              <ul className="space-y-2">
                {Array.isArray(output.positiveNotes) ? output.positiveNotes.map((note: string, i: number) => (
                  <li key={i} className="text-gray-300 pl-3 border-l-2 border-green-700">{note}</li>
                )) : (
                  <li className="text-gray-300">{output.positiveNotes}</li>
                )}
              </ul>
            </div>
          )}

          {output.securityConcerns && (
            <div className="rounded-xl border border-red-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Concerns
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.securityConcerns}</div>
            </div>
          )}

          {output.performanceTips && (
            <div className="rounded-xl border border-blue-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Tips
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.performanceTips}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Additional Review Results"
          />
          <ResultActions
            onNew={handleReset}
            newLabel="New Review"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}