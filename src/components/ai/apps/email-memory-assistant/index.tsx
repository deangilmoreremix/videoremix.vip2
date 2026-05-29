/**
 * Email Memory Assistant — Production UI (Overflow App)
 * New VideoRemix Name: Email Memory Assistant
 * Builds and queries a persistent memory from your email threads and conversations.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Mail, Search } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { PromptTextarea } from "../../primitives/PromptTextarea";

export default function EmailMemoryAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [emailContent, setEmailContent] = useState("");
  const [query, setQuery] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [context, setContext] = useState(""); // for additional notes

  const { run, isRunning, output, error, reset, lastInputs } = useRunAIApp(appId, {
    onResult,
    onError,
    onReset,
    enableMultiTurn: true,
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) {
      setEmailContent(prev => prev ? prev + `\n\n--- NEW EMAIL THREAD ---\n\n${content}` : content);
    }
  };

  const handleRun = async () => {
    const content = (emailContent || fileContent || "").trim();
    if (!content && !query.trim()) return;
    await run({
      emailContent: content,
      query: query.trim(),
      additionalContext: context.trim(),
      goal: "Build or query email memory for summaries, action items, people, dates, and follow-ups",
    });
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setEmailContent("");
    setQuery("");
    setFileContent(null);
    setContext("");
    reset();
  };

  const quickChips = [
    "Summarize all threads involving Acme Corp or key clients",
    "List every action item and deadline mentioned in the last 60 days",
    "Who promised what, and what is still outstanding?",
    "Extract all important dates, meetings, and follow-up reminders",
    "Draft 3 professional follow-up emails based on the memory",
  ];

  const handleQuick = async (q: string) => {
    await run({
      ...(lastInputs || {}),
      query: q,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary-500/10 p-2">
          <Mail className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{appName}</h2>
          <p className="text-sm text-gray-400 -mt-0.5">Your AI that never forgets an email</p>
        </div>
      </div>

      <p className="text-gray-400 max-w-3xl">
        Upload or paste email threads, builds a living memory across conversations. Ask anything — "what did we agree with the client last month?", "find all action items", "who owes me a response?". Multi-turn: keep adding emails and refining the memory.
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Email Threads / Conversations</Label>
            <PromptTextarea
              value={emailContent}
              onChange={setEmailContent}
              placeholder="Paste email threads, mbox excerpts, or forwarded conversations here (or use upload below)..."
              disabled={isRunning}
              minRows={6}
            />
          </div>

          <BasicFileUpload
            label="Upload email files (.eml, .txt, .mbox, .pdf exports)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".eml,.txt,.mbox,.pdf,.msg"
            multiple
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Additional Context or Notes (optional)</Label>
            <PromptTextarea
              value={context}
              onChange={setContext}
              placeholder="Any extra context, previous summaries, or instructions for how to organize the memory..."
              disabled={isRunning}
              minRows={2}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Your Question or Command</Label>
            <PromptTextarea
              value={query}
              onChange={setQuery}
              placeholder="e.g. Summarize everything with Sarah from DesignCo, list open action items, or find mentions of the Q3 deadline"
              disabled={isRunning}
              minRows={2}
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={(!emailContent.trim() && !fileContent && !query.trim()) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            {isRunning ? "Searching memory..." : "Query / Update Email Memory"}
          </Button>

          <p className="text-xs text-gray-500">Multi-turn enabled — add more emails in follow-ups and use the quick chips below results for common memory queries.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Email Memory Results" />

          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleQuick(chip)}
                disabled={isRunning}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-700 hover:bg-gray-800 text-gray-300 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          <ResultActions onNew={handleReset} newLabel="New Memory Query" onClear={handleClearAll} clearLabel="Clear Memory & Start Fresh" />
        </div>
      )}
    </div>
  );
}
