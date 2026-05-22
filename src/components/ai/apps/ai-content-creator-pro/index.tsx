/**
 * AI Content Creator Pro — Production UI
 * New VideoRemix Name: AI Content Creator Pro
 * One-stop generator for social posts, emails, captions, articles, scripts, and promos.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Wand2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIContentCreatorPro({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("LinkedIn Post");
  const [tone, setTone] = useState("Professional & Confident");
  const [variants, setVariants] = useState("3");
  const [extraInstructions, setExtraInstructions] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const types = ["LinkedIn Post", "Twitter/X Thread", "Email Newsletter", "Blog Article", "Instagram Caption", "YouTube Script", "Cold Email", "Press Release"];
  const tones = ["Professional & Confident", "Witty & Conversational", "Inspirational", "Direct & Challenger", "Story-Driven", "Data-Backed"];

  const handleRun = async () => {
    if (!topic.trim()) return;
    const inputs = {
      topic: topic.trim(),
      contentType,
      tone,
      variantsCount: parseInt(variants, 10),
      extraInstructions: extraInstructions.trim() || undefined,
      brandVoice: "clear, benefit-focused, modern",
    };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Wand2 className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Generate 2–6 distinct, high-converting variants of any content type in seconds — social, email, long-form, or video.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Topic or Offer</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. New AI feature that cuts video editing time by 70%"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Content Type</Label>
              <select value={contentType} onChange={e=>setContentType(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Tone</Label>
              <select value={tone} onChange={e=>setTone(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                {tones.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Variants</Label>
              <select value={variants} onChange={e=>setVariants(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} variants</option>)}
              </select>
            </div>
          </div>

          <PromptTextarea
            label="Extra Instructions (optional)"
            placeholder="e.g. Focus on ROI, include customer quote, keep under 200 words..."
            value={extraInstructions}
            onChange={setExtraInstructions}
            disabled={isRunning}
            maxLength={600}
            rows={2}
          />

          <Button
            onClick={handleRun}
            disabled={!topic.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Creating content variants..." : "Run AI Content Creator Pro"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Content Variants & Strategy" />
          <ResultActions onNew={() => reset()} newLabel="Create More Content" />
        </div>
      )}
    </div>
  );
}
