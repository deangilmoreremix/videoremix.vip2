/**
 * AI Intake Voice Agent — Production UI
 * New VideoRemix Name: AI Intake Voice Agent
 * Helps businesses collect client information through structured intake conversations and voice-style workflows.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Mic } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function AIIntakeVoiceAgent({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [intakeRequirements, setIntakeRequirements] = useState("");
  const [clientType, setClientType] = useState("new_client");
  const [industry, setIndustry] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const clientTypes = [
    { value: "new_client", label: "New Client Onboarding" },
    { value: "returning_client", label: "Returning Client" },
    { value: "consultation", label: "Consultation Request" },
    { value: "support", label: "Support / Service Request" },
    { value: "sales_lead", label: "Sales Lead Qualification" },
  ];

  const industries = [
    "Professional Services (Legal, Accounting, Consulting)",
    "Healthcare & Wellness",
    "Real Estate",
    "Financial Services",
    "Marketing & Advertising",
    "E-commerce & Retail",
    "Technology & Software",
    "Education & Training",
    "Hospitality & Travel",
    "Other",
  ];

  const handleRun = async () => {
    const requirements = intakeRequirements.trim();
    if (!requirements) return;
    const inputs = {
      intakeRequirements: requirements,
      clientType,
      industry: industry || "General Business",
      additionalNotes: additionalNotes.trim(),
      goal: "Generate complete intake conversation scripts, forms, and workflow documentation",
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setIntakeRequirements("");
    setClientType("new_client");
    setIndustry("");
    setAdditionalNotes("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Mic className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Generate structured intake conversations, forms, and workflow scripts for collecting client information efficiently.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Intake Requirements & Goals</Label>
            <PromptTextarea
              label=""
              placeholder="Describe what client information you need to collect, what questions to ask, and the overall goal of the intake process..."
              value={intakeRequirements}
              onChange={setIntakeRequirements}
              disabled={isRunning}
              maxLength={3000}
              rows={6}
              hint="Include: information to gather, key questions, desired outcomes, any compliance requirements"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Client Type</Label>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {clientTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry</Label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                <option value="">Select industry (optional)</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Additional Notes (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="Any specific requirements, tone preferences, compliance notes, or special instructions..."
              value={additionalNotes}
              onChange={setAdditionalNotes}
              disabled={isRunning}
              maxLength={1000}
              rows={3}
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!intakeRequirements.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating intake workflows..." : "Run AI Intake Voice Agent"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Intake Conversation Package" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Intake Package"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}