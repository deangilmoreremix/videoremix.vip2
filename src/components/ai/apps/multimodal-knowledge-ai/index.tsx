/**
 * Multimodal Knowledge AI — Production UI
 * New VideoRemix Name: Multimodal Knowledge AI
 * Multi-modal knowledge base that processes text, images, audio, and video content.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Layers } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function MultimodalKnowledgeAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [contentType, setContentType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [query, setQuery] = useState("");
  const [synthesisLevel, setSynthesisLevel] = useState("comprehensive");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const contentTypes = [
    { value: "text", label: "Text Documents" },
    { value: "images", label: "Images & Visuals" },
    { value: "audio", label: "Audio Content" },
    { value: "video", label: "Video Content" },
    { value: "mixed", label: "Mixed Media (All)" },
  ];

  const synthesisLevels = [
    { value: "brief", label: "Brief Summary" },
    { value: "standard", label: "Standard Overview" },
    { value: "comprehensive", label: "Comprehensive Analysis" },
    { value: "detailed", label: "Deep Dive" },
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setTextContent(content);
  };

  const handleRun = async () => {
    const hasContent = (textContent.trim() || imageDescription.trim() || audioTranscript.trim() || videoDescription.trim() || fileContent || "").trim();
    if (!hasContent || !query.trim()) return;
    
    const inputs = {
      contentType,
      textContent: textContent.trim() || fileContent || "",
      imageDescription: imageDescription.trim(),
      audioTranscript: audioTranscript.trim(),
      videoDescription: videoDescription.trim(),
      query: query.trim(),
      synthesisLevel,
      goal: `Provide ${synthesisLevel} synthesis and answers from multimodal content`,
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setContentType("text");
    setTextContent("");
    setImageDescription("");
    setAudioTranscript("");
    setVideoDescription("");
    setQuery("");
    setSynthesisLevel("comprehensive");
    setFileContent(null);
    reset();
  };

  const hasContent = (textContent.trim() || imageDescription.trim() || audioTranscript.trim() || videoDescription.trim() || fileContent || "").trim();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Layers className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Query across multiple content formats — text, images, audio, and video — for comprehensive answers and synthesis.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Content Type</Label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {contentTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Synthesis Depth</Label>
              <select
                value={synthesisLevel}
                onChange={(e) => setSynthesisLevel(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {synthesisLevels.map((sl) => (
                  <option key={sl.value} value={sl.value}>{sl.label}</option>
                ))}
              </select>
            </div>
          </div>

          {(contentType === "text" || contentType === "mixed") && (
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Text Content</Label>
              <PromptTextarea
                label=""
                placeholder="Paste articles, documents, reports, web content, or any text to analyze..."
                value={textContent}
                onChange={setTextContent}
                disabled={isRunning}
                maxLength={5000}
                rows={5}
                hint="Include any text-based content you want to query"
              />
            </div>
          )}

          {(contentType === "images" || contentType === "mixed") && (
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Image Descriptions</Label>
              <PromptTextarea
                label=""
                placeholder="Describe images, screenshots, diagrams, charts, or visual content (or paste extracted image text/metadata)..."
                value={imageDescription}
                onChange={setImageDescription}
                disabled={isRunning}
                maxLength={3000}
                rows={3}
                hint="Describe visual elements or paste extracted content"
              />
            </div>
          )}

          {(contentType === "audio" || contentType === "mixed") && (
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Audio Content / Transcripts</Label>
              <PromptTextarea
                label=""
                placeholder="Paste podcast transcripts, audio transcriptions, voice memos, or spoken content..."
                value={audioTranscript}
                onChange={setAudioTranscript}
                disabled={isRunning}
                maxLength={5000}
                rows={4}
                hint="Include audio transcripts or spoken content"
              />
            </div>
          )}

          {(contentType === "video" || contentType === "mixed") && (
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Video Content / Descriptions</Label>
              <PromptTextarea
                label=""
                placeholder="Describe video content, paste video transcripts, YouTube descriptions, or video metadata..."
                value={videoDescription}
                onChange={setVideoDescription}
                disabled={isRunning}
                maxLength={3000}
                rows={3}
                hint="Describe video content or paste video transcripts"
              />
            </div>
          )}

          <BasicFileUpload
            label="Upload content file (.txt, .md)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Query</Label>
            <PromptTextarea
              label=""
              placeholder="Ask a question that synthesizes information across all provided content formats..."
              value={query}
              onChange={setQuery}
              disabled={isRunning}
              maxLength={2000}
              rows={3}
              hint="Ask comprehensive questions that span multiple content types"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!hasContent || !query.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Synthesizing across formats..." : "Run Multimodal Knowledge AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Multimodal Synthesis Results" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Synthesis"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}