/**
 * Private ChatGPT Clone — Production UI (Batch 5)
 * New VideoRemix Name: Private ChatGPT Clone
 * Fully personalized ChatGPT with your own knowledge base, instructions, and style preferences.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Bot } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function PrivateChatGPTClone({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [userMessage, setUserMessage] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [stylePreference, setStylePreference] = useState("helpful, concise, professional with occasional wit");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!userMessage.trim()) return;

    const inputs = {
      userMessage: userMessage.trim(),
      customInstructions: customInstructions.trim() || undefined,
      knowledgeBase: knowledgeBase.trim() || undefined,
      stylePreference: stylePreference.trim(),
    };

    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setUserMessage("");
    setCustomInstructions("");
    setKnowledgeBase("");
    setStylePreference("helpful, concise, professional with occasional wit");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Bot className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Your completely private, fully customized ChatGPT clone. Define your own system prompt, upload your knowledge, and choose your preferred response style.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Your Message"
            placeholder="Ask your private AI anything..."
            value={userMessage}
            onChange={setUserMessage}
            disabled={isRunning}
            maxLength={2000}
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PromptTextarea
              label="Custom Instructions (your personal system prompt)"
              placeholder="e.g. You are my strategic advisor. Always challenge my assumptions. Use data when possible."
              value={customInstructions}
              onChange={setCustomInstructions}
              disabled={isRunning}
              maxLength={2000}
              rows={5}
            />
            <PromptTextarea
              label="Your Personal Knowledge Base"
              placeholder="Paste your notes, past decisions, company info, writing samples, etc."
              value={knowledgeBase}
              onChange={setKnowledgeBase}
              disabled={isRunning}
              maxLength={4000}
              rows={5}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Style Preference</Label>
            <PromptTextarea
              label=""
              value={stylePreference}
              onChange={setStylePreference}
              disabled={isRunning}
              maxLength={300}
              rows={2}
              hint="How do you want it to sound?"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!userMessage.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Consulting your private model..." : "Run Private ChatGPT Clone"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Your Private AI Response" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Message"
            onClear={handleClearAll}
            clearLabel="Reset Personalization"
          />
        </div>
      )}
    </div>
  );
}
