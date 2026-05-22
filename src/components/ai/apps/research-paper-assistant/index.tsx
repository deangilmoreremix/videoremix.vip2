/**
 * Research Paper Assistant — Production UI
 * New VideoRemix Name: Research Paper Assistant
 * Understand, summarize, and extract insights from research papers and academic content.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, GraduationCap } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function ResearchPaperAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [paperContent, setPaperContent] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [focusArea, setFocusArea] = useState("summary");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const focusAreas = ["summary", "key-findings", "methodology", "citations", "full-analysis"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setPaperContent(content);
  };

  const handleRun = async () => {
    const content = (paperContent || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      paperContent: content,
      researchQuestion: researchQuestion.trim() || "Provide a comprehensive understanding of this research paper",
      focusArea,
      goal: "Extract summary, key findings, and insights from the research paper",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setPaperContent("");
    setResearchQuestion("");
    setFocusArea("summary");
    setFileContent(null);
    reset();
  };

  const finalContent = paperContent || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Upload or paste research paper content, ask questions, and get instant summaries, key findings, and academic insights.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Paper Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste the full text of the research paper here (abstract, introduction, methods, results, discussion, references)..."
              value={paperContent}
              onChange={setPaperContent}
              disabled={isRunning}
              maxLength={8000}
              rows={10}
              hint="Include all available sections. More content = better analysis. 2,000–6,000 characters ideal."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file of your paper"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Focus Area</Label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
            >
              <option value="summary">Paper Summary</option>
              <option value="key-findings">Key Findings</option>
              <option value="methodology">Methodology Review</option>
              <option value="citations">Citation Analysis</option>
              <option value="full-analysis">Full Analysis</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Research Question / Goal</Label>
            <Input
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              placeholder="e.g. What are the main conclusions? How does this relate to [topic]?"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing research paper..." : "Analyze Research Paper"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Research Paper Analysis" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Analysis"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}