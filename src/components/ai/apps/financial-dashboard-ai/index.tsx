/**
 * Financial Dashboard AI — Production UI (Batch 8)
 * Dashboard design, KPI definitions, visualization types, alert thresholds, layout suggestions.
  * New VideoRemix Name: Financial Dashboard AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, LayoutDashboard, Bell, BarChart3, Share2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = "#3b82f6" }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120; const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

const KPICard: React.FC<{ label: string; value: string; trend?: number[]; alert?: boolean; alertMsg?: string }> = ({ label, value, trend, alert, alertMsg }) => (
  <div className={`bg-[#0a0a0a] border rounded-xl p-4 ${alert ? "border-red-500" : "border-gray-800"}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-xl font-bold text-white">{value}</p>
        {alertMsg && <p className="mt-0.5 text-xs text-red-400 flex items-center gap-1"><Bell className="h-3 w-3" />{alertMsg}</p>}
      </div>
      {trend && <Sparkline data={trend} color={alert ? "#ef4444" : "#3b82f6"} />}
    </div>
  </div>
);

const AlertBadge: React.FC<{ threshold: string }> = ({ threshold }) => (
  <span className="inline-flex items-center gap-1 text-xs bg-red-900/30 text-red-400 border border-red-800 rounded-full px-2 py-0.5">
    <Bell className="h-3 w-3" /> {threshold}
  </span>
);

export default function FinancialDashboardAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessType, setBusinessType] = useState("");
  const [keyMetricsFile, setKeyMetricsFile] = useState<string | null>(null);
  const [keyMetricsFileName, setKeyMetricsFileName] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [stakeholderRole, setStakeholderRole] = useState<"cfo" | "operations" | "investor">("cfo");
  const [refreshFrequency, setRefreshFrequency] = useState<"real-time" | "daily" | "weekly">("daily");
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null) => {
    if (!file) { setKeyMetricsFile(null); setKeyMetricsFileName(null); return; }
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setKeyMetricsFile(e.target?.result as string);
      setKeyMetricsFileName(file.name);
      setIsFileLoading(false);
    };
    reader.onerror = () => { setIsFileLoading(false); setKeyMetricsFile(null); };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    const inputs: Record<string, any> = { businessType: businessType.trim(), stakeholderRole, refreshFrequency };
    if (keyMetricsFile) inputs.keyMetrics = keyMetricsFile;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setBusinessType(""); setKeyMetricsFile(null); setKeyMetricsFileName(null);
    setStakeholderRole("cfo"); setRefreshFrequency("daily"); setLastInputs({}); reset();
  };

  const out = output as any;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Design a custom financial dashboard with KPI definitions, visualization recommendations, alert thresholds, and sharing strategy.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Type</Label>
            <Input
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. SaaS, E-commerce, Manufacturing"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <BasicFileUpload
            label="Key Metrics Data (JSON or CSV)"
            accept=".csv,.json"
            onFileSelect={handleFileUpload}
            disabled={isRunning}
            maxSizeMB={10}
          />
          {keyMetricsFileName && <p className="text-xs text-gray-500">File loaded: {keyMetricsFileName}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Stakeholder</Label>
              <select
                value={stakeholderRole}
                onChange={(e) => setStakeholderRole(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="cfo">CFO / Finance Lead</option>
                <option value="operations">Operations Lead</option>
                <option value="investor">Investor / Board</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Refresh Frequency</Label>
              <select
                value={refreshFrequency}
                onChange={(e) => setRefreshFrequency(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="real-time">Real-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!businessType.trim() || isRunning || isFileLoading}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Designing your dashboard..." : "Design Financial Dashboard"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out.kpiDefinitions && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">KPI Definitions</h3>
              {Array.isArray(out.kpiDefinitions) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {out.kpiDefinitions.map((kpi: any, i: number) => (
                    <div key={i} className="bg-black border border-gray-800 rounded-lg p-3">
                      <p className="text-white font-medium text-sm">{typeof kpi === "string" ? kpi : kpi.name}</p>
                      {typeof kpi === "object" && kpi.formula && <p className="text-gray-500 text-xs mt-1">Formula: {kpi.formula}</p>}
                      {typeof kpi === "object" && kpi.description && <p className="text-gray-400 text-xs mt-1">{kpi.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.kpiDefinitions)}</p>
              )}
            </div>
          )}

          {out.visualizationTypes && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Recommended Visualizations</h3>
              {Array.isArray(out.visualizationTypes) ? (
                <ul className="space-y-2">
                  {out.visualizationTypes.map((viz: any, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-blue-600 pl-3">
                      {typeof viz === "string" ? viz : `${viz.type}: ${viz.description || ""}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.visualizationTypes)}</p>
              )}
            </div>
          )}

          {out.alertThresholds && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4" /> Alert Thresholds
              </h3>
              {Array.isArray(out.alertThresholds) ? (
                <div className="space-y-2">
                  {out.alertThresholds.map((alert: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-black border border-gray-800 rounded-lg px-3 py-2">
                      <span className="text-gray-300 text-sm">{typeof alert === "string" ? alert : alert.metric}</span>
                      <AlertBadge threshold={typeof alert === "object" ? alert.threshold : "—"} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.alertThresholds)}</p>
              )}
            </div>
          )}

          {out.dashboardConcept && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3">Dashboard Concept</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.dashboardConcept}</p>
            </div>
          )}

          {out.layoutSuggestion && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Layout Suggestion
              </h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.layoutSuggestion}</p>
            </div>
          )}

          {out.dataSources && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Data Sources
              </h3>
              {Array.isArray(out.dataSources) ? (
                <ul className="space-y-2">
                  {out.dataSources.map((src: any, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-gray-700 pl-3">
                      {typeof src === "string" ? src : `${src.name}: ${src.description || src.type}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.dataSources)}</p>
              )}
            </div>
          )}

          {out.sharingStrategy && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-primary-400 mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Sharing Strategy
              </h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.sharingStrategy}</p>
            </div>
          )}

          {out.success === undefined && (
            <StructuredResult result={out} title="Dashboard Design Results" />
          )}

          <div className="flex gap-3 flex-wrap">
            <ResultActions onNew={handleReset} newLabel="New Dashboard" onClear={handleClearAll} clearLabel="Clear All" />
            {Object.keys(lastInputs).length > 0 && (
              <Button onClick={handleRun} disabled={isRunning} className="bg-primary-600 hover:bg-primary-500">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Re-generate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}