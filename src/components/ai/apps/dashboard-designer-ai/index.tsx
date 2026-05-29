/**
 * Dashboard Designer AI — Production UI
 * New VideoRemix Name: Dashboard Designer AI
 */

import React, { useState, useEffect } from "react";
import { BarChart3, Database, Play, Loader2, ArrowRight, RefreshCw, Zap, Eye, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function DashboardDesignerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [dataSources, setDataSources] = useState("");
  const [userRole, setUserRole] = useState<"executive" | "analyst" | "operator">("executive");
  const [keyMetrics, setKeyMetrics] = useState("");
  const [desiredInsights, setDesiredInsights] = useState("");
  const [iterationPrompt, setIterationPrompt] = useState("");
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);

  const { run, isRunning, output, reset, clearHistory } = useRunAIApp(appId, {
    enableMultiTurn: true,
    onResult,
    onError,
    onReset,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const roleLabels: Record<typeof userRole, string> = {
    executive: "Executive (high-level KPIs, strategic decisions)",
    analyst: "Analyst (detailed data, drill-down, segmentation)",
    operator: "Operator (operational metrics, daily monitoring)",
  };

  const quickIterateOptions = [
    "Add trend tracking widgets",
    "Focus on mobile layout",
    "Add export functionality",
    "Include forecast widgets",
    "Simplify for executives",
    "Add comparison features",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      dataSources: dataSources.trim(),
      userRole,
      keyMetrics: keyMetrics.trim(),
      desiredInsights: desiredInsights.trim(),
    };
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!dataSources.trim() || !keyMetrics.trim()) return;
    const inputs = buildInputs();
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleQuickIterate = async (instruction: string) => {
    const base = lastInputs || buildInputs();
    const iterInputs = { ...base, _iterationFocus: instruction };
    setLastInputs(iterInputs);
    await run(iterInputs);
  };

  const handleCustomIterate = async () => {
    if (!iterationPrompt.trim()) return;
    const base = lastInputs || buildInputs();
    const iterInputs = { ...base, _customFeedback: iterationPrompt.trim() };
    setLastInputs(iterInputs);
    setIterationPrompt("");
    await run(iterInputs);
  };

  const handleReset = () => {
    clearHistory();
    reset();
  };

  const handleClearAll = () => {
    setDataSources("");
    setUserRole("executive");
    setKeyMetrics("");
    setDesiredInsights("");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const renderSection = (title: string, content: unknown, icon: React.ReactNode) => {
    if (!content) return null;
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-primary-400">{icon}</span>
          <h4 className="font-semibold text-white text-lg">{title}</h4>
        </div>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
        </div>
      </div>
    );
  };

  const renderWidget = (title: string, items: unknown, colorClass: string) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return null;
    const itemArray = Array.isArray(items) ? items : [items];
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <h4 className={`font-semibold mb-4 flex items-center gap-2 ${colorClass}`}>
          <BarChart3 className="h-5 w-5" /> {title}
        </h4>
        <div className="space-y-3">
          {itemArray.map((item: unknown, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <ArrowRight className={`h-4 w-4 ${colorClass} mt-0.5 flex-shrink-0`} />
              <span className="text-sm text-gray-300">
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).name || (item as Record<string, unknown>).title || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canRun = dataSources.trim().length > 0 && keyMetrics.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Design data dashboards and visualizations. AI analyzes your data sources, user role, and key metrics to create actionable dashboard layouts.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Data Sources *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. CRM (Salesforce), Google Analytics, Stripe payments, Intercom support tickets, product usage data from Mixpanel"
              value={dataSources}
              onChange={setDataSources}
              disabled={isRunning}
              maxLength={1000}
              rows={3}
              hint="What data needs to appear on the dashboard?"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">User Role *</Label>
            <div className="flex flex-wrap gap-2">
              {(["executive", "analyst", "operator"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${userRole === r ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Key Metrics *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Monthly recurring revenue, customer churn rate, net promoter score, conversion rates by channel, support ticket resolution time"
              value={keyMetrics}
              onChange={setKeyMetrics}
              disabled={isRunning}
              maxLength={800}
              rows={3}
              hint="Which metrics are most important to track?"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Desired Insights (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Identify which channels drive highest-value customers, predict churn risk, track feature adoption rates"
              value={desiredInsights}
              onChange={setDesiredInsights}
              disabled={isRunning}
              maxLength={600}
              rows={2}
              hint="What decisions will this dashboard inform?"
            />
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Designing dashboard..." : "Design Dashboard"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Dashboard Design Output</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.dashboardConcept && renderSection("Dashboard Concept", output.dashboardConcept, <TrendingUp className="h-5 w-5" />)}

            {output.widgetLayout && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <h4 className="font-semibold text-primary-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Widget Layout
                </h4>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {typeof output.widgetLayout === "string" ? output.widgetLayout : JSON.stringify(output.widgetLayout, null, 2)}
                </div>
              </div>
            )}

            {output.recommendedCharts && renderWidget("Recommended Charts", output.recommendedCharts, "text-blue-400")}
            {output.interactionDesign && renderSection("Interaction Design", output.interactionDesign, <Zap className="h-5 w-5" />)}
            {output.colorScheme && renderSection("Color Scheme", output.colorScheme, <BarChart3 className="h-5 w-5" />)}
            {output.mobileConsiderations && renderSection("Mobile Considerations", output.mobileConsiderations, <Eye className="h-5 w-5" />)}
            {output.developmentNotes && renderSection("Development Notes", output.developmentNotes, <Database className="h-5 w-5" />)}

            {output && !output.dashboardConcept && !output.widgetLayout && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on this design</span>
              <span className="text-xs text-gray-500 ml-auto">Multi-turn context preserved</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickIterateOptions.map((inst, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => handleQuickIterate(inst)} disabled={isRunning} className="border-gray-700 hover:bg-primary-950 text-xs">
                  {inst}
                </Button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <PromptTextarea
                label=""
                placeholder="Custom refinement (e.g. 'add revenue forecasting widgets')"
                value={iterationPrompt}
                onChange={setIterationPrompt}
                disabled={isRunning}
                rows={2}
                maxLength={500}
                className="flex-1"
              />
              <Button onClick={handleCustomIterate} disabled={!iterationPrompt.trim() || isRunning} className="self-end bg-primary-600 hover:bg-primary-500 px-8">
                Apply
              </Button>
            </div>
          </div>

          <ResultActions onNew={handleReset} newLabel="New Design" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

DashboardDesignerAI.displayName = "DashboardDesignerAI";