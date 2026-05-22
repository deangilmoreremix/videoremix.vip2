/**
 * Business Knowledgebase AI — Production UI
 * New VideoRemix Name: Business Knowledgebase AI
 * Train AI on documents, websites, FAQs, and internal info. Ask questions and get insights.
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

export default function BusinessKnowledgebaseAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessInfo, setBusinessInfo] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [faqContent, setFaqContent] = useState("");
  const [query, setQuery] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setBusinessInfo(content);
  };

  const handleRun = async () => {
    const content = (documentContent || fileContent || "").trim();
    if (!content && !businessInfo.trim()) return;
    const inputs = {
      businessInfo: businessInfo.trim(),
      documentContent: content,
      faqContent: faqContent.trim(),
      query: query.trim(),
      goal: "Provide Q&A pairs, search results, and actionable insights from the knowledge base",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setBusinessInfo("");
    setDocumentContent("");
    setFaqContent("");
    setQuery("");
    setFileContent(null);
    reset();
  };

  const hasContent = businessInfo.trim() || documentContent.trim() || fileContent;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Train AI on your business documents, websites, FAQs, and internal knowledge. Ask questions and get intelligent answers.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Business / Organization Info</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your business, services, products, mission, and key information..."
              value={businessInfo}
              onChange={setBusinessInfo}
              disabled={isRunning}
              maxLength={4000}
              rows={5}
              hint="Core business context that AI will use as background knowledge."
            />
          </div>

          <BasicFileUpload
            label="Upload knowledge base documents (.txt, .md, .pdf)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md,.pdf"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Document / Knowledge Base Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste content from your knowledge base, internal docs, product guides, or training materials..."
              value={documentContent}
              onChange={setDocumentContent}
              disabled={isRunning}
              maxLength={6000}
              rows={8}
              hint="Upload or paste the documents you want AI to learn from. 2,000–5,000 characters ideal."
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">FAQs (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Paste frequently asked questions and their answers here..."
              value={faqContent}
              onChange={setFaqContent}
              disabled={isRunning}
              maxLength={2000}
              rows={4}
              hint="Common Q&A pairs help the AI understand how to respond to typical queries."
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Question / Query</Label>
            <PromptTextarea
              label=""
              placeholder="Ask a question about your business, documents, or knowledge base..."
              value={query}
              onChange={setQuery}
              disabled={isRunning}
              maxLength={1000}
              rows={3}
              hint="What do you want to know or find in your knowledge base?"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!hasContent || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Training & searching knowledge base..." : "Train & Query Knowledge Base"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Knowledge Base Insights" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Query"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}