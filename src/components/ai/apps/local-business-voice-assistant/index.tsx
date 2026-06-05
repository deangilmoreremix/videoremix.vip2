/**
 * Local Business Voice Assistant — Production UI (Batch 10)
 * New VideoRemix Name: Local Business Voice Assistant
 * Note: This is a TEXT app, not voice realtime — just a form UI.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Users } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function LocalBusinessVoiceAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [customerBase, setCustomerBase] = useState("");
  const [challenge, setChallenge] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!businessType.trim() && !challenge.trim()) return;
    await run({
      businessType: businessType.trim(),
      location: location.trim(),
      customerBase: customerBase.trim(),
      challenge: challenge.trim(),
    });
  };

  const handleReset = () => reset();
  const handleClearAll = () => {
    setBusinessType("");
    setLocation("");
    setCustomerBase("");
    setChallenge("");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Get voice strategy, greeting scripts, common question responses, upselling tips, review responses, and customer journey optimization for your local business.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Type</Label>
              <Input value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Coffee shop, Salon, Retail store..." disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Downtown Austin, TX" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
          </div>

          <PromptTextarea label="Customer Base" placeholder="Describe your typical customers: age range, demographics, what they come in for, peak hours..." value={customerBase} onChange={setCustomerBase} disabled={isRunning} rows={3} />

          <PromptTextarea label="Current Challenge" placeholder="What challenge are you facing? e.g. customer retention, upselling, handling rush hour, response to reviews..." value={challenge} onChange={setChallenge} disabled={isRunning} rows={3} />

          <Button onClick={handleRun} disabled={isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating voice strategy..." : "Run Local Business Voice Assistant"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Voice Strategy & Scripts" />
          <ResultActions onNew={handleReset} newLabel="New Strategy" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}