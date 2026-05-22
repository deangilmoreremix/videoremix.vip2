/**
 * Private Company AI Assistant — Production UI
 * New VideoRemix Name: Private Company AI Assistant
 * Private AI assistant for company data, documents, and internal knowledge.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Building2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function PrivateCompanyAIAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [documents, setDocuments] = useState<string>("");
  const [query, setQuery] = useState("");
  const [queryType, setQueryType] = useState("insights");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const queryTypes = [
    { value: "insights", label: "Company Insights" },
    { value: "analysis", label: "Data Analysis" },
    { value: "report", label: "Generate Report" },
    { value: "qa", label: "Q&A from Documents" },
    { value: "summary", label: "Executive Summary" },
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setDocuments(content);
  };

  const handleRun = async () => {
    const hasContent = (companyDescription.trim() || documents.trim() || fileContent || "").trim();
    if (!hasContent || !query.trim()) return;
    
    const combinedDocs = [companyDescription, documents, fileContent].filter(Boolean).join("\n\n---\n\n");
    const inputs = {
      companyName: companyName.trim() || "Unknown Company",
      companyDescription: combinedDocs,
      query: query.trim(),
      queryType,
      goal: `Generate ${queryType} based on company data and documents`,
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setCompanyName("");
    setCompanyDescription("");
    setDocuments("");
    setQuery("");
    setQueryType("insights");
    setFileContent(null);
    reset();
  };

  const hasContent = (companyDescription.trim() || documents.trim() || fileContent || "").trim();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Query your private company data, documents, and knowledge base for insights, reports, and answers.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Company Name (optional)</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Query Type</Label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {queryTypes.map((qt) => (
                  <option key={qt.value} value={qt.value}>{qt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Company Description & Background</Label>
            <PromptTextarea
              label=""
              placeholder="Describe the company: industry, size, products/services, mission, key personnel, recent news..."
              value={companyDescription}
              onChange={setCompanyDescription}
              disabled={isRunning}
              maxLength={4000}
              rows={4}
              hint="Include relevant context about the company"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Private Documents & Internal Data</Label>
            <PromptTextarea
              label=""
              placeholder="Paste document content, internal memos, meeting notes, policy documents, or any private company data..."
              value={documents}
              onChange={setDocuments}
              disabled={isRunning}
              maxLength={6000}
              rows={6}
              hint="Include any documents, reports, or data you want to query"
            />
          </div>

          <BasicFileUpload
            label="Or upload documents (.txt, .md, .pdf)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md,.pdf"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Query</Label>
            <PromptTextarea
              label=""
              placeholder="Ask a question about the company or its documents, request an analysis, or specify what report you need..."
              value={query}
              onChange={setQuery}
              disabled={isRunning}
              maxLength={2000}
              rows={3}
              hint="Be specific about what insights or information you need"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!hasContent || !query.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing company data..." : "Run Private Company AI Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title={`${queryType.charAt(0).toUpperCase() + queryType.slice(1)} Results`} />
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