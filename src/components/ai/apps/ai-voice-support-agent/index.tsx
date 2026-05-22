/**
 * AI Voice Support Agent — Production UI
 * New VideoRemix Name: AI Voice Support Agent
 * Creates voice-based support scripts, customer service flows, and automated response systems.
 */

import React, { useState, useEffect } from "react";
import { Headphones, Play, Loader2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIVoiceSupportAgent({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [supportScenarios, setSupportScenarios] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [industry, setIndustry] = useState("General");
  const [responseTone, setResponseTone] = useState("Professional & Empathetic");
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const industries = [
    "General",
    "E-commerce / Retail",
    "SaaS / Technology",
    "Healthcare",
    "Finance / Banking",
    "Hospitality",
    "Education",
    "Real Estate",
  ];

  const tones = [
    "Professional & Empathetic",
    "Friendly & Conversational",
    "Formal & Authoritative",
    "Casual & Relaxed",
    "Warm & Caring",
  ];

  const handleFile = (_file: File | null, content?: string) => {
    setFileContent(content || null);
    if (content) setSupportScenarios(content);
  };

  const handleRun = async () => {
    const scenarios = (supportScenarios || fileContent || "").trim();
    if (!scenarios) return;
    const inputs = {
      supportScenarios: scenarios,
      businessContext: businessContext.trim() || "General customer service scenarios",
      industry,
      responseTone,
      goal: "Complete voice support script package with flows and response systems",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setSupportScenarios("");
    setBusinessContext("");
    setIndustry("General");
    setResponseTone("Professional & Empathetic");
    setFileContent(null);
    reset();
  };

  const finalContent = supportScenarios || fileContent || "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Headphones className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Generate professional voice support scripts, customer service flows, and automated response systems for your business.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Support Scenarios</Label>
            <PromptTextarea
              label=""
              placeholder="Describe the customer support scenarios you need scripts for (e.g., 'Customer has a billing issue', 'User can't access their account', 'Product return request')..."
              value={supportScenarios}
              onChange={setSupportScenarios}
              disabled={isRunning}
              maxLength={5000}
              rows={6}
              hint="List the main support scenarios or use cases. Include any specific challenges or common issues."
            />
          </div>

          <BasicFileUpload
            label="Or upload .txt / .md file with support scenarios"
            onFileSelect={handleFile}
            disabled={isRunning}
            accept=".txt,.md"
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Context</Label>
            <PromptTextarea
              label=""
              placeholder="Describe your business, products, services, and any specific policies or procedures agents should follow..."
              value={businessContext}
              onChange={setBusinessContext}
              disabled={isRunning}
              maxLength={2000}
              rows={4}
              hint="Context helps tailor scripts to your specific business needs and terminology."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry</Label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Response Tone</Label>
              <select
                value={responseTone}
                onChange={(e) => setResponseTone(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {tones.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!finalContent.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating support scripts..." : "Run AI Voice Support Agent"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Voice Support Script Package" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Support Scripts"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}