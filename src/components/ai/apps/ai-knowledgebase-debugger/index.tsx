/**
 * AI Knowledgebase Debugger — Production UI
 * New VideoRemix Name: AI Knowledgebase Debugger
 * Debug and fix knowledge base issues, errors, and performance problems.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Bug } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIKnowledgebaseDebugger({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [kbDescription, setKbDescription] = useState("");
  const [issues, setIssues] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const [kbType, setKbType] = useState("general");
  const [debugMode, setDebugMode] = useState("full");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const kbTypes = [
    { value: "general", label: "General Knowledge Base" },
    { value: "rag", label: "RAG System" },
    { value: "faq", label: "FAQ / Q&A System" },
    { value: "document-search", label: "Document Search" },
    { value: "chatbot", label: "Chatbot / Assistant" },
  ];

  const debugModes = [
    { value: "quick", label: "Quick Scan" },
    { value: "standard", label: "Standard Analysis" },
    { value: "full", label: "Full Deep-Dive" },
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setIssues(content);
  };

  const handleRun = async () => {
    const hasContent = (kbDescription.trim() || issues.trim() || errorLogs.trim() || fileContent || "").trim();
    if (!hasContent) return;
    
    const inputs = {
      kbDescription: kbDescription.trim(),
      kbType,
      issues: issues.trim() || fileContent || "",
      errorLogs: errorLogs.trim(),
      debugMode,
      goal: `Perform ${debugMode} debugging analysis and provide fixes`,
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setKbDescription("");
    setIssues("");
    setErrorLogs("");
    setKbType("general");
    setDebugMode("full");
    setFileContent(null);
    reset();
  };

  const hasContent = (kbDescription.trim() || issues.trim() || errorLogs.trim() || fileContent || "").trim();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Bug className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Debug knowledge base issues, fix errors, and optimize performance for RAG, FAQ, and AI systems.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Knowledge Base Type</Label>
              <select
                value={kbType}
                onChange={(e) => setKbType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {kbTypes.map((kt) => (
                  <option key={kt.value} value={kt.value}>{kt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Debug Depth</Label>
              <select
                value={debugMode}
                onChange={(e) => setDebugMode(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {debugModes.map((dm) => (
                  <option key={dm.value} value={dm.value}>{dm.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Knowledge Base Description</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your knowledge base: what it contains, how it's structured, what technology/framework it uses, vector database, chunking strategy, retrieval method..."
              value={kbDescription}
              onChange={setKbDescription}
              disabled={isRunning}
              maxLength={4000}
              rows={4}
              hint="Include architecture details, tech stack, and configuration"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Issues & Problems</Label>
            <PromptTextarea
              label=""
              placeholder="Describe the issues you're experiencing: poor search results, irrelevant answers, missing content, slow queries, accuracy problems, hallucination issues..."
              value={issues}
              onChange={setIssues}
              disabled={isRunning}
              maxLength={4000}
              rows={4}
              hint="Be specific about what's not working as expected"
            />
          </div>

          <BasicFileUpload
            label="Or upload issue description / error logs file"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md,.log"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Error Logs (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Paste any error logs, stack traces, API responses, or debug output that might help diagnose the issue..."
              value={errorLogs}
              onChange={setErrorLogs}
              disabled={isRunning}
              maxLength={3000}
              rows={3}
              hint="Include any technical error information"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!hasContent || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Debugging knowledge base..." : "Run AI Knowledgebase Debugger"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Debugging Report & Fixes" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Debug Session"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}