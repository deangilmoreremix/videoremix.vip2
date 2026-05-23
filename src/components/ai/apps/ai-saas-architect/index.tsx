/**
 * AI SaaS Architect — Production UI
 * New VideoRemix Name: AI SaaS Architect
 * Custom form for SaaS architecture, scalability, and go-to-market strategy
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Building2, Shield, DollarSign, Rocket, Globe, Lock, Users } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { ExecutionTrace } from "../../primitives/ExecutionTrace";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AISaaSArchitect({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [saasIdea, setSaasIdea] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [pricingModel, setPricingModel] = useState("subscription");
  const [coreFunctionality, setCoreFunctionality] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!saasIdea.trim()) return;
    await run({
      saasIdea: saasIdea.trim(),
      targetMarket: targetMarket.trim() || undefined,
      pricingModel,
      coreFunctionality: coreFunctionality.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
  };

  const handleClearAll = () => {
    setSaasIdea("");
    setTargetMarket("");
    setPricingModel("subscription");
    setCoreFunctionality("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Design scalable SaaS architectures with security, multi-tenancy, and go-to-market strategy.</p>
      </div>

      {!output ? (
        <div className="space-y-6">
          <PromptTextarea
            label="SaaS Product Idea"
            placeholder="Describe your SaaS product: what it does, core value proposition, target users..."
            value={saasIdea}
            onChange={setSaasIdea}
            disabled={isRunning}
            maxLength={1800}
            rows={5}
            hint="Define the core problem you're solving."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Market</Label>
              <Input
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                placeholder="e.g. SMBs, Enterprise, Developers, E-commerce"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Pricing Model</Label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white focus:border-primary-500"
              >
                <option value="subscription">Subscription (Monthly/Annual)</option>
                <option value="usage-based">Usage-Based (Pay-per-use)</option>
                <option value="freemium">Freemium</option>
                <option value="one-time">One-Time Purchase</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <PromptTextarea
            label="Core Functionality"
            placeholder="List the main features and functionality of your SaaS product..."
            value={coreFunctionality}
            onChange={setCoreFunctionality}
            disabled={isRunning}
            maxLength={1500}
            rows={4}
          />

          <Button
            onClick={handleRun}
            disabled={!saasIdea.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Designing architecture..." : "Generate SaaS Architecture"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {output.verificationTrace && (
            <ExecutionTrace trace={output.verificationTrace} />
          )}
          <StructuredResult
            result={output}
            title="SaaS Architecture & Strategy"
            onDownload={() => {
              const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `saas-architecture-${Date.now()}.json`; a.click();
            }}
          />
          <ResultActions
            onNew={handleReset}
            newLabel="New Architecture"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}