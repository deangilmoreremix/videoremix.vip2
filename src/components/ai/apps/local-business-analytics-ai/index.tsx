/**
 * Local Business Analytics AI — Production UI (Batch 10)
 * New VideoRemix Name: Local Business Analytics AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function LocalBusinessAnalyticsAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessType, setBusinessType] = useState("restaurant");
  const [keyMetrics, setKeyMetrics] = useState("");
  const [timePeriod, setTimePeriod] = useState("month");
  const [analysisGoal, setAnalysisGoal] = useState("performance");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => { setUploadedFile(e.target?.result as string); setIsFileLoading(false); };
    reader.onerror = () => { setIsFileLoading(false); setUploadedFile(null); };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    if (!keyMetrics.trim() && !uploadedFile) return;
    await run({
      businessType,
      keyMetrics: keyMetrics.trim(),
      timePeriod,
      analysisGoal,
      fileData: uploadedFile,
    });
  };

  const handleReset = () => { reset(); setUploadedFile(null); };
  const handleClearAll = () => {
    setBusinessType("restaurant");
    setKeyMetrics("");
    setTimePeriod("month");
    setAnalysisGoal("performance");
    setUploadedFile(null);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Get performance scores, trend analysis, peak times identification, customer insights, recommendations, and actionable next steps for your business.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Type</Label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="restaurant">Restaurant</option>
                <option value="retail">Retail</option>
                <option value="service">Service</option>
                <option value="healthcare">Healthcare</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Time Period</Label>
              <select value={timePeriod} onChange={e => setTimePeriod(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Analysis Goal</Label>
              <select value={analysisGoal} onChange={e => setAnalysisGoal(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="performance">Performance Review</option>
                <option value="optimization">Optimization</option>
                <option value="forecasting">Forecasting</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Upload Metrics Data (CSV/JSON)</Label>
            <BasicFileUpload onFileSelect={handleFileUpload} accept=".csv,.json" disabled={isRunning} />
            {uploadedFile && <p className="mt-2 text-sm text-green-400">File uploaded successfully</p>}
          </div>

          <PromptTextarea label="Key Metrics (or paste directly)" placeholder="Daily sales: $1200, $1450, $980... | Foot traffic: 45, 62, 38... | Average order: $32, $28, $41..." value={keyMetrics} onChange={setKeyMetrics} disabled={isRunning} rows={5} />

          <Button onClick={handleRun} disabled={(!keyMetrics.trim() && !uploadedFile) || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing data..." : "Run Local Business Analytics AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Business Analytics Report" />
          <ResultActions onNew={handleReset} newLabel="New Analysis" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}