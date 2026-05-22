/**
 * AI Dictation Assistant — Production UI
 * New VideoRemix Name: AI Dictation Assistant
 * Turns spoken ideas, notes, or dictation into organized text, summaries, emails, and documents.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Mic } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIDictationAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [dictationContent, setDictationContent] = useState("");
  const [outputFormat, setOutputFormat] = useState("organized_text");
  const [tone, setTone] = useState("professional");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const outputFormats = [
    { value: "organized_text", label: "Organized Text Document" },
    { value: "summary", label: "Executive Summary" },
    { value: "email", label: "Professional Email" },
    { value: "meeting_notes", label: "Meeting Notes Format" },
    { value: "report", label: "Full Report / Document" },
  ];

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual & Conversational" },
    { value: "persuasive", label: "Persuasive & Engaging" },
    { value: "technical", label: "Technical & Detailed" },
    { value: "friendly", label: "Friendly & Warm" },
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setDictationContent(content);
  };

  const handleRun = async () => {
    const content = (dictationContent || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      spokenDictation: content,
      outputFormat,
      tone,
      goal: "Transform spoken ideas into polished, organized output",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setDictationContent("");
    setOutputFormat("organized_text");
    setTone("professional");
    setFileContent(null);
    reset();
  };

  const finalContent = dictationContent || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Mic className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Convert spoken ideas, voice notes, or raw dictation into polished text, summaries, emails, and documents.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Spoken Dictation / Notes</Label>
            <PromptTextarea
              label=""
              placeholder="Paste your spoken notes, transcription, or dictation here. Include all ideas, points, and details you want organized..."
              value={dictationContent}
              onChange={setDictationContent}
              disabled={isRunning}
              maxLength={5000}
              rows={8}
              hint="Include as much detail as possible for best results. Can include rough ideas, bullet points, or full transcription."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file (auto-fills content)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Output Format</Label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {outputFormats.map((fmt) => (
                  <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Tone & Style</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Processing dictation..." : "Run AI Dictation Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Dictation Output" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Dictation"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}