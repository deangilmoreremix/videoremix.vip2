/**
 * Visual Document AI — Production UI
 * New VideoRemix Name: Visual Document AI
 * Chat with visual documents, charts, and diagrams to extract insights.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Image } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function VisualDocumentAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [documentDescription, setDocumentDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [documentType, setDocumentType] = useState("chart");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const documentTypes = ["chart", "graph", "diagram", "infographic", "screenshot", "photo", "table", "other"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setDocumentDescription(content);
  };

  const handleRun = async () => {
    if (!documentDescription.trim() && !fileContent) return;
    const inputs = {
      documentDescription: documentDescription.trim() || fileContent || "",
      documentType,
      question: question.trim() || "Describe what you see and extract key insights",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setDocumentDescription("");
    setQuestion("");
    setDocumentType("chart");
    setFileContent(null);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Image className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Chat with visual documents, charts, diagrams, and images to extract insights and understanding.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Document Type</Label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
            >
              {documentTypes.map((type) => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Visual Description</Label>
            <PromptTextarea
              label=""
              placeholder="Describe the visual content in detail... (e.g. 'A bar chart showing Q1-Q4 sales data: Q1=$45k, Q2=$62k, Q3=$58k, Q4=$78k')"
              value={documentDescription}
              onChange={setDocumentDescription}
              disabled={isRunning}
              maxLength={5000}
              rows={6}
              hint="Be as detailed as possible for better analysis"
            />
          </div>

          <BasicFileUpload
            label="Or upload an image file (screenshot, chart image, diagram)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".png,.jpg,.jpeg,.gif,.svg,.webp"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Question</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. 'What trends do you see?', 'Analyze the data patterns', 'What insights can I draw from this?'"
              value={question}
              onChange={setQuestion}
              disabled={isRunning}
              maxLength={500}
              rows={3}
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={(!documentDescription.trim() && !fileContent) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing visual document..." : "Run Visual Document AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Visual Analysis" />
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