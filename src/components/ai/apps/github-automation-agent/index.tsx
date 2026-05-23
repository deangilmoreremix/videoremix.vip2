/**
 * GitHub Automation Agent — Production UI
 * New VideoRemix Name: GitHub Automation Agent
 * Generate GitHub Actions workflows and automation scripts
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Github, Code2, Settings, Key, BookOpen, Copy, CheckCircle2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { CodeBlock } from "../../primitives/CodeBlock";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function GitHubAutomationAgent({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [automationGoal, setAutomationGoal] = useState("automation");
  const [repoContext, setRepoContext] = useState("");
  const [triggers, setTriggers] = useState("");
  const [copied, setCopied] = useState(false);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!repoContext.trim()) return;
    await run({
      automationGoal,
      repoContext: repoContext.trim(),
      triggers: triggers.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setAutomationGoal("automation");
    setRepoContext("");
    setTriggers("");
    reset();
  };

  const handleCopyScript = () => {
    if (output?.automationScript) {
      navigator.clipboard.writeText(typeof output.automationScript === 'string' ? output.automationScript : JSON.stringify(output.automationScript));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Github className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Generate GitHub Actions workflows, automation scripts, and setup instructions.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Automation Goal</Label>
            <select
              value={automationGoal}
              onChange={(e) => setAutomationGoal(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
            >
              <option value="create-issue">Create Issue Automation</option>
              <option value="pr-template">PR Template Automation</option>
              <option value="release-workflow">Release Workflow</option>
              <option value="automation">General Automation</option>
            </select>
          </div>

          <PromptTextarea
            label="Repository Context"
            placeholder="Describe your repository: tech stack, current setup, what you want to automate..."
            value={repoContext}
            onChange={setRepoContext}
            disabled={isRunning}
            maxLength={1500}
            rows={5}
            hint="Provide context about the repository structure and what you want to automate."
          />

          <PromptTextarea
            label="Triggers (Optional)"
            placeholder="Describe the events that should trigger this automation: push, pull_request, issue_comment, etc."
            value={triggers}
            onChange={setTriggers}
            disabled={isRunning}
            maxLength={800}
            rows={3}
          />

          <Button
            onClick={handleRun}
            disabled={!repoContext.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating automation..." : "Generate Automation"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {output.automationScript && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary-500" />
                  Automation Script
                </h3>
                <Button
                  onClick={handleCopyScript}
                  variant="outline"
                  size="sm"
                  className="border-gray-700"
                >
                  {copied ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Copied!</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                </Button>
              </div>
              <CodeBlock
                code={typeof output.automationScript === 'string' ? output.automationScript : JSON.stringify(output.automationScript, null, 2)}
                language="yaml"
                title="GitHub Actions Workflow"
                showLineNumbers
              />
            </div>
          )}

          {output.triggerConfig && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Trigger Configuration
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.triggerConfig}</div>
            </div>
          )}

          {output.requiredSecrets && (
            <div className="rounded-xl border border-yellow-900/50 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Required Secrets
              </h3>
              {Array.isArray(output.requiredSecrets) ? (
                <div className="space-y-2">
                  {output.requiredSecrets.map((secret: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-500">•</span>
                      <code className="bg-black px-2 py-1 rounded text-yellow-400 text-sm">{secret}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-300 whitespace-pre-wrap">{output.requiredSecrets}</div>
              )}
            </div>
          )}

          {output.setupInstructions && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-400" />
                Setup Instructions
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.setupInstructions}</div>
            </div>
          )}

          {output.exampleUsage && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Example Usage</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.exampleUsage}</div>
            </div>
          )}

          {output.limitations && (
            <div className="rounded-xl border border-gray-700 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-gray-400 mb-3">Known Limitations</h3>
              <div className="text-gray-400 whitespace-pre-wrap">{output.limitations}</div>
            </div>
          )}

          <ResultActions
            onNew={handleReset}
            newLabel="New Automation"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}