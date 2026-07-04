/**
 * AI Video Script Producer — Production UI
 * New VideoRemix Name: AI Video Script Producer
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Video } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIVideoScriptProducer({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [topic, setTopic] = useState("");
  const [videoLength, setVideoLength] = useState("5");
  const [style, setStyle] = useState("talking-head");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");

  const { run, isRunning, output, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const styles = [
    { value: "talking-head", label: "Talking Head" },
    { value: "explainer", label: "Explainer" },
    { value: "interview", label: "Interview" },
    { value: "demo", label: "Product Demo" },
    { value: "tutorial", label: "Tutorial" },
    { value: "vlog", label: "Vlog" },
  ];

  const tones = ["professional", "casual", "humorous", "educational", "inspirational", "dramatic"];

  const handleRun = async () => {
    if (!topic.trim()) return;
    await run({
      topic: topic.trim(),
      videoLengthMin: parseInt(videoLength),
      style,
      audience: audience.trim(),
      tone,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Video className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Generate a complete video script with hook, intro, body, call-to-action, and shot suggestions.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Video Topic *"
            placeholder="What is the video about? Be specific about the subject matter."
            value={topic}
            onChange={setTopic}
            disabled={isRunning}
            rows={3}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Video Length (minutes)</Label>
              <Input
                type="number"
                value={videoLength}
                onChange={(e) => setVideoLength(e.target.value)}
                min="1"
                max="60"
                disabled={isRunning}
                className="bg-black border-gray-700"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Video Style</Label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Tone</Label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
              {tones.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <PromptTextarea
            label="Target Audience (optional)"
            placeholder="Who is the intended viewer? (e.g., small business owners, Gen Z, enterprise IT managers)"
            value={audience}
            onChange={setAudience}
            disabled={isRunning}
            rows={2}
          />
          <Button onClick={handleRun} disabled={!topic.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Producing script..." : "Produce Video Script"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <StructuredResult result={output} title="Complete Video Script" />
          <ResultActions onNew={() => reset()} newLabel="Write Another Script" />
        </div>
      )}
    </div>
  );
}
