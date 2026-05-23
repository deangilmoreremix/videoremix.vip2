/**
 * Business Finance AI Team — Production UI (Batch 8)
 * Financial health analysis, cost optimization, profitability timeline, cash flow projection.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp, DollarSign, PieChart, BarChart3, AlertTriangle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const color = score < 40 ? "#ef4444" : score < 70 ? "#eab308" : "#22c55e";
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle
          cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 80 80)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="80" y="80" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="32" fontWeight="bold">
          {score}
        </text>
        <text x="80" y="108" textAnchor="middle" fill="#9ca3af" fontSize="12">/100</text>
      </svg>
      <span className="text-sm font-medium" style={{ color }}>Financial Health Score</span>
    </div>
  );
};

const MetricBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
};

const KPICard: React.FC<{ label: string; value: string; icon: React.ReactNode; sub?: string }> = ({ label, value, icon, sub }) => (
  <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-xl font-bold text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
      <div className="text-primary-500 mt-0.5">{icon}</div>
    </div>
  </div>
);

export default function BusinessFinanceAITeam({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [businessType, setBusinessType] = useState<"saas" | "ecommerce" | "service" | "manufacturing" | "consulting">("saas");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [growthGoals, setGrowthGoals] = useState("");
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!revenue.trim() || !expenses.trim()) return;
    const inputs = { businessType, revenue: revenue.trim(), expenses: expenses.trim(), growthGoals: growthGoals.trim() };
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setBusinessType("saas"); setRevenue(""); setExpenses(""); setGrowthGoals("");
    setLastInputs({}); reset();
  };

  const out = output as any;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <DollarSign className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Complete financial health analysis with scores, cost optimization, profitability roadmap, and cash flow projections.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Business Type</Label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="saas">SaaS</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="service">Service Business</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="consulting">Consulting</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Monthly Revenue ($)</Label>
              <Input
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="e.g. 75000"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Monthly Expenses ($)</Label>
            <Input
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              placeholder="e.g. 45000"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <PromptTextarea
            label="Growth Goals (optional)"
            placeholder="Describe your growth objectives, target markets, expansion plans..."
            value={growthGoals}
            onChange={setGrowthGoals}
            disabled={isRunning}
            maxLength={1200}
            rows={3}
          />

          <Button
            onClick={handleRun}
            disabled={!revenue.trim() || !expenses.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing financial health..." : "Analyze Financial Health"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out?.financialHealthScore !== undefined && (
            <div className="flex flex-col md:flex-row items-center gap-8 bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8">
              <ScoreGauge score={out.financialHealthScore} />
              <div className="flex-1 space-y-4 w-full">
                <h3 className="text-lg font-semibold text-white">Financial Overview</h3>
                <MetricBar label="Revenue" value={out.revenueAnalysis?.revenue || 0} max={out.revenueAnalysis?.revenue || 1} color="#22c55e" />
                <MetricBar label="Expenses" value={out.revenueAnalysis?.expenses || 0} max={out.revenueAnalysis?.revenue || 1} color="#ef4444" />
                <MetricBar label="Net Profit" value={out.revenueAnalysis?.netProfit || 0} max={out.revenueAnalysis?.revenue || 1} color="#3b82f6" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard label="Net Profit Margin" value={out.keyMetrics?.netProfitMargin || "—"} icon={<TrendingUp className="h-5 w-5" />} sub={out.keyMetrics?.profitMarginTrend} />
            <KPICard label="Runway" value={out.keyMetrics?.runway || "—"} icon={<BarChart3 className="h-5 w-5" />} sub="months of cash" />
            <KPICard label="Cash Flow" value={out.cashFlowProjection?.monthlyCashFlow || "—"} icon={<PieChart className="h-5 w-5" />} />
          </div>

          {out.costOptimization?.length > 0 && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> Cost Optimization Opportunities
              </h3>
              <ul className="space-y-2">
                {out.costOptimization.map((item: string, i: number) => (
                  <li key={i} className="text-gray-300 text-sm border-l-2 border-yellow-600 pl-3">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {out.profitabilityTimeline && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Profitability Timeline</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.profitabilityTimeline}</p>
            </div>
          )}

          {out.improvementRecommendations?.length > 0 && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Improvement Recommendations</h3>
              <ul className="space-y-2">
                {out.improvementRecommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-gray-300 text-sm border-l-2 border-primary-600 pl-3">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {out.financialRoadmap && (
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Financial Roadmap</h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.financialRoadmap}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="border-gray-700">New Analysis</Button>
            <Button onClick={handleClearAll} variant="ghost">Clear All</Button>
            {Object.keys(lastInputs).length > 0 && (
              <Button
                onClick={handleRun}
                disabled={isRunning}
                className="bg-primary-600 hover:bg-primary-500"
              >
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Iterate with Same Inputs
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}