/**
 * AI Film Producer — Production UI
 * New VideoRemix Name: AI Film Producer
 * Creates cinematic scripts, shot lists, production plans, and scene breakdowns from video concepts.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Film } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AiFilmProducer({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [videoConcept, setVideoConcept] = useState("");
  const [genre, setGenre] = useState("Documentary");
  const [duration, setDuration] = useState("5-10");
  const [tone, setTone] = useState("Professional");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const genres = ["Documentary", "Narrative/Film", "Commercial", "Music Video", "Tutorial/Educational", "Corporate", "Social Media"];
  const durations = ["1-2", "3-5", "5-10", "10-20", "20+"];
  const tones = ["Professional", "Emotional", "Humorous", "Inspirational", "Dark/Moody", "Light/Whimsical"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setVideoConcept(content);
  };

  const handleRun = async () => {
    const content = (videoConcept || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      videoConcept: content,
      genre,
      duration,
      tone,
      goal: "Complete film production package with script, shot list, and production plan",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setVideoConcept("");
    setGenre("Documentary");
    setDuration("5-10");
    setTone("Professional");
    setFileContent(null);
    reset();
  };

  const finalContent = videoConcept || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Film className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Transform your video concept into a complete cinematic production package with scripts, shot lists, and production plans.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Video Concept / Requirements</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your video idea, story concept, or production requirements in detail..."
              value={videoConcept}
              onChange={setVideoConcept}
              disabled={isRunning}
              maxLength={5000}
              rows={8}
              hint="Include the core story, message, target audience, and any specific requirements. 500-3,000 characters ideal."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file with concept notes"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Genre</Label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Duration (minutes)</Label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {durations.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Tone / Style</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {tones.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating production package..." : "Run AI Film Producer"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Film Production Package" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Film Production"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}