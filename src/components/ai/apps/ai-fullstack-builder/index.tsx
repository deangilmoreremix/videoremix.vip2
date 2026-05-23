/**
 * AI Fullstack Builder — Production UI
 * New VideoRemix Name: AI Fullstack Builder
 * Full-stack app generation with project structure and deployment guide
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Layers, FolderTree, Database, Code2, Rocket, GitBranch } from "lucide-react";
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

export default function AIFullstackBuilder({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [appDescription, setAppDescription] = useState("");
  const [requiredFeatures, setRequiredFeatures] = useState("");
  const [preferredStack, setPreferredStack] = useState("");
  const [deploymentTarget, setDeploymentTarget] = useState("vercel");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!appDescription.trim()) return;
    await run({
      appDescription: appDescription.trim(),
      requiredFeatures: requiredFeatures.trim() || undefined,
      preferredStack: preferredStack.trim() || undefined,
      deploymentTarget,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setAppDescription("");
    setRequiredFeatures("");
    setPreferredStack("");
    setDeploymentTarget("vercel");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Generate complete full-stack applications with project structure, tech stack, and deployment guide.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <PromptTextarea
            label="Application Description"
            placeholder="Describe your application: what it does, target users, core functionality..."
            value={appDescription}
            onChange={setAppDescription}
            disabled={isRunning}
            maxLength={1800}
            rows={6}
            hint="Be specific about the main features and user flows."
          />

          <PromptTextarea
            label="Required Features"
            placeholder="List specific features: user auth, API endpoints, database models, integrations..."
            value={requiredFeatures}
            onChange={setRequiredFeatures}
            disabled={isRunning}
            maxLength={1500}
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Preferred Tech Stack (Optional)</Label>
              <Input
                value={preferredStack}
                onChange={(e) => setPreferredStack(e.target.value)}
                placeholder="e.g. Next.js, PostgreSQL, Prisma or leave empty"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Deployment Target</Label>
              <select
                value={deploymentTarget}
                onChange={(e) => setDeploymentTarget(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="vercel">Vercel</option>
                <option value="aws">AWS</option>
                <option value="netlify">Netlify</option>
                <option value="cloudflare">Cloudflare Pages</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!appDescription.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Building your app..." : "Generate Fullstack App"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}

          {output.projectStructure && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary-500" />
                Project Structure
              </h3>
              <pre className="bg-black rounded p-4 text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {typeof output.projectStructure === 'string' ? output.projectStructure : JSON.stringify(output.projectStructure, null, 2)}
              </pre>
            </div>
          )}

          {output.techStack && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                Tech Stack
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.techStack}</div>
            </div>
          )}

          {output.databaseSchema && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                Database Schema
              </h3>
              <pre className="bg-black rounded p-4 text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {typeof output.databaseSchema === 'string' ? output.databaseSchema : JSON.stringify(output.databaseSchema, null, 2)}
              </pre>
            </div>
          )}

          {output.apiEndpoints && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">API Endpoints</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.apiEndpoints}</div>
            </div>
          )}

          {output.deploymentGuide && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-purple-400" />
                Deployment Guide
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.deploymentGuide}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Full Project Details"
            onDownload={() => {
              const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `fullstack-project-${Date.now()}.json`; a.click();
            }}
          />
          <ResultActions
            onNew={handleReset}
            newLabel="New Project"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}