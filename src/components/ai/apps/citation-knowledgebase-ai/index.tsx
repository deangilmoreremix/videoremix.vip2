/**
 * Citation Knowledgebase AI — Production UI
 * New VideoRemix Name: Citation Knowledgebase AI
 * Build knowledge bases with citations, get cited answers and source summaries.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, BookOpen } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function CitationKnowledgebaseAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [sources, setSources] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const [citations, setCitations] = useState("");
  const [citationStyle, setCitationStyle] = useState("academic");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const citationStyles = ["academic", "apa", "mla", "chicago", " ieee", "harvard"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setSources(content);
  };

  const handleRun = async () => {
    const content = (sources || fileContent || "").trim();
    if (!content && !researchTopic.trim()) return;
    const inputs = {
      sources: content,
      researchTopic: researchTopic.trim(),
      citations: citations.trim(),
      citationStyle,
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setSources("");
    setResearchTopic("");
    setCitations("");
    setCitationStyle("academic");
    setFileContent(null);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Build knowledge bases with proper citations, get cited answers, source summaries, and bibliographies.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Topic / Question</Label>
            <Input
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              placeholder="What do you want to research?"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Sources & Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste source material, articles, research papers, or reference content here..."
              value={sources}
              onChange={setSources}
              disabled={isRunning}
              maxLength={10000}
              rows={8}
              hint="Include all sources you want cited in the response"
            />
          </div>

          <BasicFileUpload
            label="Or upload source documents (.txt, .md)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Existing Citations (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Paste any existing citations you want integrated (DOI, URLs, titles, authors...)"
              value={citations}
              onChange={setCitations}
              disabled={isRunning}
              maxLength={2000}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Citation Style</Label>
            <select
              value={citationStyle}
              onChange={(e) => setCitationStyle(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
            >
              {citationStyles.map((style) => <option key={style} value={style}>{style.toUpperCase()}</option>)}
            </select>
          </div>

          <Button
            onClick={handleRun}
            disabled={(!sources.trim() && !fileContent && !researchTopic.trim()) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Building knowledge base..." : "Run Citation Knowledgebase AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Cited Research" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Research"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}