/**
 * Talk To Your Business AI — Production UI
 * New VideoRemix Name: Talk To Your Business AI
 * Creates conversational AI assistant that answers questions about their business, documents, or knowledgebase.
 */

import React, { useState, useEffect } from "react";
import { MessageSquare, Play, Loader2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function TalkToYourBusinessAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessInfo, setBusinessInfo] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [sampleQuestions, setSampleQuestions] = useState("");
  const [assistantPersona, setAssistantPersona] = useState("Helpful & Informative");
  const [useCase, setUseCase] = useState("Customer Support");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const personas = [
    "Helpful & Informative",
    "Friendly & Casual",
    "Professional & Formal",
    "Warm & Empathetic",
    "Expert & Authoritative",
  ];

  const useCases = [
    "Customer Support",
    "Internal Knowledge Base",
    "Product/Service FAQ",
    "Employee Training",
    "Sales Qualification",
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setBusinessInfo(content);
  };

  const handleRun = async () => {
    const info = (businessInfo || fileContent || "").trim();
    if (!info) return;
    const inputs = {
      businessInfo: info,
      knowledgeBase: knowledgeBase.trim(),
      sampleQuestions: sampleQuestions.trim(),
      assistantPersona,
      useCase,
      goal: "Complete conversational AI setup with Q&A pairs and response structure",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setBusinessInfo("");
    setKnowledgeBase("");
    setSampleQuestions("");
    setAssistantPersona("Helpful & Informative");
    setUseCase("Customer Support");
    setFileContent(null);
    reset();
  };

  const finalContent = businessInfo || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Build a conversational AI assistant that answers questions about your business, documents, or knowledgebase.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Information</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your business, what you offer, key processes, policies, and anything the AI assistant needs to know..."
              value={businessInfo}
              onChange={setBusinessInfo}
              disabled={isRunning}
              maxLength={5000}
              rows={6}
              hint="Include business description, products/services, policies, and key terminology."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file with business information"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Knowledge Base / Documents (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Paste content from your documents, manuals, FAQs, or knowledge base articles..."
              value={knowledgeBase}
              onChange={setKnowledgeBase}
              disabled={isRunning}
              maxLength={4000}
              rows={5}
              hint="The more context you provide, the better the AI can answer questions accurately."
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Sample Questions (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="List example questions your users might ask (e.g., 'What are your pricing plans?', 'How do I reset my password?', 'What is your refund policy?')..."
              value={sampleQuestions}
              onChange={setSampleQuestions}
              disabled={isRunning}
              maxLength={2000}
              rows={4}
              hint="These help train the AI to handle the most important use cases."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Assistant Persona</Label>
              <select
                value={assistantPersona}
                onChange={(e) => setAssistantPersona(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {personas.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Use Case</Label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {useCases.map((uc) => <option key={uc} value={uc}>{uc}</option>)}
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating conversational AI setup..." : "Run Talk To Your Business AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Conversational AI Setup" />
          <ResultActions
            onNew={handleReset}
            newLabel="New AI Setup"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}