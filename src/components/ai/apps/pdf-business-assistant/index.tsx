/**
 * PDF Business Assistant — Production UI
 * New VideoRemix Name: PDF Business Assistant
 * Chat with PDFs, summarize documents, and extract key business information.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, FileText } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function PDFBusinessAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [pdfContent, setPdfContent] = useState("");
  const [query, setQuery] = useState("");
  const [analysisType, setAnalysisType] = useState("summary");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const analysisTypes = ["summary", "key-points", "qa-extraction", "full-analysis"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setPdfContent(content);
  };

  const handleRun = async () => {
    const content = (pdfContent || fileContent || "").trim();
    if (!content) return;
    const inputs = {
      pdfContent: content,
      query: query.trim() || "Provide a comprehensive summary and key insights",
      analysisType,
      goal: "Extract answers, summaries, and key information from the PDF",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setPdfContent("");
    setQuery("");
    setAnalysisType("summary");
    setFileContent(null);
    reset();
  };

  const finalContent = pdfContent || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Upload any PDF document, ask questions, and get instant summaries, key points, and extracted information.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">PDF Document Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste the text content extracted from your PDF here (copy text from PDF, use a PDF-to-text converter, or upload a .txt/.md version)..."
              value={pdfContent}
              onChange={setPdfContent}
              disabled={isRunning}
              maxLength={8000}
              rows={10}
              hint="Copy text directly from PDF or use a converter tool. For best results, include all text content."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file of your document"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Analysis Type</Label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
            >
              <option value="summary">Quick Summary</option>
              <option value="key-points">Key Points Extraction</option>
              <option value="qa-extraction">Q&A Extraction</option>
              <option value="full-analysis">Full Document Analysis</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Specific Question / Query (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Ask a specific question about the PDF content, or leave blank for a general summary..."
              value={query}
              onChange={setQuery}
              disabled={isRunning}
              maxLength={800}
              rows={3}
              hint="Ask anything about the document — facts, explanations, comparisons, recommendations."
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing PDF..." : "Analyze PDF Document"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="PDF Analysis Results" />
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