/**
 * AI Music Idea Generator — Production UI
 * New VideoRemix Name: AI Music Idea Generator
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Music } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIMusicIdeaGenerator({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [theme, setTheme] = useState("");
  const [tempo, setTempo] = useState("medium");
  const [instrumentation, setInstrumentation] = useState("");

  const { run, isRunning, output, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!genre.trim()) return;
    await run({ genre: genre.trim(), mood: mood.trim(), theme: theme.trim(), tempo, instrumentation: instrumentation.trim() });
  };

  const tempos = ["slow", "medium", "fast", "very-fast"];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Music className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Generate creative music ideas, chord progressions, and arrangement suggestions tailored to your genre and mood.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Genre *</Label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Pop, Rock, Jazz, Lo-fi, Electronic"
              disabled={isRunning}
              className="bg-black border-gray-700"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Mood</Label>
            <Input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g., Energetic, Calm, Melancholic, Uplifting"
              disabled={isRunning}
              className="bg-black border-gray-700"
            />
          </div>
          <PromptTextarea
            label="Theme / Concept"
            placeholder="What is the song about? (e.g., summer love, overcoming adversity, road trip adventure)"
            value={theme}
            onChange={setTheme}
            disabled={isRunning}
            rows={3}
          />
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Tempo</Label>
            <select value={tempo} onChange={(e) => setTempo(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
              {tempos.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <PromptTextarea
            label="Instrumentation (optional)"
            placeholder="Specific instruments you want featured (e.g., acoustic guitar, synth pads, brass section)"
            value={instrumentation}
            onChange={setInstrumentation}
            disabled={isRunning}
            rows={2}
          />
          <Button onClick={handleRun} disabled={!genre.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating music ideas..." : "Generate Music Ideas"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <StructuredResult result={output} title="Music Ideas & Arrangement" />
          <ResultActions onNew={() => reset()} newLabel="Generate New Ideas" />
        </div>
      )}
    </div>
  );
}
