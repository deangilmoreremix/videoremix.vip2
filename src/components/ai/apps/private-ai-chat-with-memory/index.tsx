/**
 * Private AI Chat with Memory — Production UI (Batch 5)
 * New VideoRemix Name: Private AI Chat with Memory
 * Personal assistant that remembers everything across all your conversations.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, MessageCircle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function PrivateAIChatWithMemory({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [userMessage, setUserMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState("");
  const [longTermMemory, setLongTermMemory] = useState("");
  const [userPreferences, setUserPreferences] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!userMessage.trim()) return;

    const inputs = {
      userMessage: userMessage.trim(),
      conversationHistory: conversationHistory.trim() || undefined,
      longTermMemory: longTermMemory.trim() || undefined,
      userPreferences: userPreferences.trim() || undefined,
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setUserMessage("");
    setConversationHistory("");
    setLongTermMemory("");
    setUserPreferences("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Your private, memory-augmented ChatGPT clone. Remembers every conversation and preference for truly personalized assistance.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Your Message"
            placeholder="Ask anything — the AI will use all stored context."
            value={userMessage}
            onChange={setUserMessage}
            disabled={isRunning}
            maxLength={2000}
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PromptTextarea
              label="Recent Conversation History (optional)"
              placeholder="Paste last few exchanges for short-term continuity..."
              value={conversationHistory}
              onChange={setConversationHistory}
              disabled={isRunning}
              maxLength={3000}
              rows={4}
            />
            <PromptTextarea
              label="Long-Term Memory Snapshot (optional)"
              placeholder="Key facts the AI has learned about you and your work..."
              value={longTermMemory}
              onChange={setLongTermMemory}
              disabled={isRunning}
              maxLength={3000}
              rows={4}
            />
          </div>

          <PromptTextarea
            label="User Preferences / Custom Instructions (optional)"
            placeholder="Tone, style, things you always want remembered (e.g. 'always be concise', 'I prefer tables')"
            value={userPreferences}
            onChange={setUserPreferences}
            disabled={isRunning}
            maxLength={1500}
            rows={3}
          />

          <Button
            onClick={handleRun}
            disabled={!userMessage.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Thinking with full memory..." : "Run Private AI Chat with Memory"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Memory-Augmented Chat Response" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Message"
            onClear={handleClearAll}
            clearLabel="Clear This Session"
          />
        </div>
      )}
    </div>
  );
}
