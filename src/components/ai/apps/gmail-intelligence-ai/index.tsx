/**
 * Gmail Intelligence AI — Production UI
 * New VideoRemix Name: Gmail Intelligence AI
 * AI email assistant with inbox intelligence, drafts, summaries, and smart replies.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Mail } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function GmailIntelligenceAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [emailContext, setEmailContext] = useState("");
  const [task, setTask] = useState("draft");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("professional");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const tasks = ["draft", "reply", "summarize", "smart-reply", "follow-up"];
  const tones = ["professional", "friendly", "formal", "casual", "persuasive"];

  const handleRun = async () => {
    const context = emailContext.trim();
    if (!context) return;
    const inputs = {
      emailContext: context,
      task,
      recipient: recipient.trim(),
      subject: subject.trim(),
      tone,
      goal: task === "summarize" ? "Summarize the email thread and extract key action items" : "Generate email draft, summary, or smart reply",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setEmailContext("");
    setTask("draft");
    setRecipient("");
    setSubject("");
    setTone("professional");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Mail className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">AI-powered email assistant. Draft emails, summarize threads, generate smart replies, and compose follow-ups.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Email / Thread Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste email content, thread snippets, or the context you need help with..."
              value={emailContext}
              onChange={setEmailContext}
              disabled={isRunning}
              maxLength={5000}
              rows={8}
              hint="Paste the emails you want to draft, reply to, or summarize."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Task</Label>
              <select
                value={task}
                onChange={(e) => setTask(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                <option value="draft">New Email Draft</option>
                <option value="reply">Reply to Email</option>
                <option value="summarize">Summarize Thread</option>
                <option value="smart-reply">Smart Reply</option>
                <option value="follow-up">Follow-up Email</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Tone</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {tones.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Recipient (optional)</Label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. john@company.com, Hi team, etc."
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Subject / Topic (optional)</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line or topic you want to address..."
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!emailContext.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Processing email..." : "Run Gmail Intelligence AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Email Assistant Result" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Email Task"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}