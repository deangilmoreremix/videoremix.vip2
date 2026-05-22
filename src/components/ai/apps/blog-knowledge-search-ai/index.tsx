/**
 * Blog Knowledge Search AI — Production UI
 * New VideoRemix Name: Blog Knowledge Search AI
 * Search and chat with blog content, extract relevant sections and summaries.
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
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function BlogKnowledgeSearchAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [blogUrl, setBlogUrl] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setBlogContent(content);
  };

  const handleRun = async () => {
    const content = (blogContent || fileContent || "").trim();
    if (!content && !blogUrl.trim()) return;
    const inputs = {
      blogUrl: blogUrl.trim(),
      blogContent: content,
      searchQuery: searchQuery.trim() || "Summarize and extract key information",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setBlogUrl("");
    setBlogContent("");
    setSearchQuery("");
    setFileContent(null);
    reset();
  };

  const finalContent = blogContent || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Search and chat with blog content, extract relevant sections, answers, and summaries.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Blog URL (optional)</Label>
            <Input
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              placeholder="https://example.com/blog/post"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Blog / Article Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste blog content or article text here..."
              value={blogContent}
              onChange={setBlogContent}
              disabled={isRunning}
              maxLength={8000}
              rows={8}
              hint="For best results, include the full article body"
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">What are you looking for?</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. 'What are the main arguments about X?', 'Find sections about pricing', 'Extract advice about Y'"
              value={searchQuery}
              onChange={setSearchQuery}
              disabled={isRunning}
              maxLength={500}
              rows={3}
              hint="Be specific to get the most relevant results"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={(!finalContent.trim() && !blogUrl.trim()) || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Searching blog content..." : "Run Blog Knowledge Search AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Search Results" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Search"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}