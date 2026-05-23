/**
 * GitHub Repo Assistant — Production UI
 * New VideoRemix Name: GitHub Repo Assistant
 * Repository analysis, README generation, and contributor insights
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Github, Star, GitBranch, Users, FileCode, BookOpen, AlertCircle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function GitHubRepoAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [task, setTask] = useState("analyze");
  const [focusArea, setFocusArea] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!repoUrl.trim()) return;
    await run({
      repoUrl: repoUrl.trim(),
      task,
      focusArea: focusArea.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setRepoUrl("");
    setTask("analyze");
    setFocusArea("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Github className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Analyze GitHub repositories, generate README content, and explore contributors.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Repository URL</Label>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="e.g. https://github.com/facebook/react"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Task</Label>
              <select
                value={task}
                onChange={(e) => setTask(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="analyze">Full Analysis</option>
                <option value="readme">Generate README</option>
                <option value="contributors">Analyze Contributors</option>
                <option value="issues">Review Issues</option>
                <option value="analyze-code">Code Architecture</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Focus Area (Optional)</Label>
              <Input
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder="e.g. testing, documentation, performance"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!repoUrl.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing repository..." : "Analyze Repository"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {output.repoOverview && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-500" />
                Repository Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {output.repoOverview.stars && (
                  <div className="text-center p-3 bg-black rounded-lg">
                    <Star className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{output.repoOverview.stars}</div>
                    <div className="text-xs text-gray-500">Stars</div>
                  </div>
                )}
                {output.repoOverview.language && (
                  <div className="text-center p-3 bg-black rounded-lg">
                    <FileCode className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{output.repoOverview.language}</div>
                    <div className="text-xs text-gray-500">Language</div>
                  </div>
                )}
                {output.repoOverview.forks && (
                  <div className="text-center p-3 bg-black rounded-lg">
                    <GitBranch className="h-5 w-5 text-green-400 mx-auto mb-1" />
                    <div className="text-xl font-bold text-white">{output.repoOverview.forks}</div>
                    <div className="text-xs text-gray-500">Forks</div>
                  </div>
                )}
                {output.repoOverview.lastUpdate && (
                  <div className="text-center p-3 bg-black rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                    <div className="text-sm font-bold text-white">{output.repoOverview.lastUpdate}</div>
                    <div className="text-xs text-gray-500">Last Update</div>
                  </div>
                )}
              </div>
              {output.repoOverview.description && (
                <p className="mt-4 text-gray-300">{output.repoOverview.description}</p>
              )}
            </div>
          )}

          {output.readme && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">README Summary</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.readme}</div>
            </div>
          )}

          {output.structure && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Repository Structure</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.structure}</div>
            </div>
          )}

          {output.contributors && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                Top Contributors
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.contributors}</div>
            </div>
          )}

          {output.issues && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Open Issues Summary</h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.issues}</div>
            </div>
          )}

          {output.codeInsights && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                Code Architecture
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap">{output.codeInsights}</div>
            </div>
          )}

          <StructuredResult
            result={output}
            title="Additional Results"
          />
          <ResultActions
            onNew={handleReset}
            newLabel="Analyze Another"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}