/**
 * Codebase Chat AI — Production UI
 * New VideoRemix Name: Codebase Chat AI
 * Chat with codebases, understand structure, and find relevant code snippets.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Code2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function CodebaseChatAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [codebaseDescription, setCodebaseDescription] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("general");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const languages = ["general", "javascript", "typescript", "python", "rust", "go", "java", "csharp", "cpp", "ruby", "php"];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setCodeContent(content);
  };

  const handleRun = async () => {
    const content = (codeContent || fileContent || "").trim();
    if (!content && !codebaseDescription.trim()) return;
    const inputs = {
      codebaseDescription: codebaseDescription.trim(),
      codeContent: content,
      query: query.trim(),
      language,
      goal: "Provide code explanations and find relevant snippets",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setCodebaseDescription("");
    setCodeContent("");
    setQuery("");
    setLanguage("general");
    setFileContent(null);
    reset();
  };

  const hasContent = codebaseDescription.trim() || codeContent.trim() || fileContent;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Code2 className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Upload code or describe your codebase, ask questions, and get instant explanations, structure analysis, and relevant code snippets.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Codebase Description</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your codebase structure, purpose, tech stack, key modules, and what you're trying to understand or accomplish..."
              value={codebaseDescription}
              onChange={setCodebaseDescription}
              disabled={isRunning}
              maxLength={3000}
              rows={5}
              hint="Include tech stack, framework, key files/folders, and the overall architecture."
            />
          </div>

          <BasicFileUpload
            label="Upload code files (.txt, .js, .ts, .py, etc.)"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.js,.ts,.jsx,.tsx,.py,.rb,.go,.java,.cs,.cpp,.c,.php,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Code Content</Label>
            <PromptTextarea
              label=""
              placeholder="Paste code snippets, file contents, or specific sections you want analyzed..."
              value={codeContent}
              onChange={setCodeContent}
              disabled={isRunning}
              maxLength={6000}
              rows={10}
              hint="Paste specific code sections you need help understanding or finding patterns in."
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Programming Language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
            >
              {languages.map((lang) => <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Question / Query</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. How does the auth system work? Find all API endpoints. Explain this function..."
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!hasContent || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing codebase..." : "Analyze Codebase"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Codebase Analysis" />
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