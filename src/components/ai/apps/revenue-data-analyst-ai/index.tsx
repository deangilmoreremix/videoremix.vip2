/**
 * Revenue Data Analyst AI — Production UI (Batch 8)
 * Revenue breakdown, growth analysis, churn, segmentation, forecast.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, TrendingUp, TrendingDown, FileText, BarChart3 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { StructuredResult } from "../../primitives/StructuredResult";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const TrendArrow: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = "%" }) => {
  if (value === 0) return <span className="text-gray-400">0{suffix}</span>;
  const positive = value > 0;
  return (
    <span className={positive ? "text-green-400" : "text-red-400"}>
      {positive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
};

const ForecastConfidence: React.FC<{ confidence: number }> = ({ confidence }) => {
  const color = confidence >= 80 ? "#22c55e" : confidence >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex-1 w-32">
        <div className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-medium" style={{ color }}>{confidence}%</span>
      <span className="text-xs text-gray-500">confidence</span>
    </div>
  );
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5">
    <h3 className="font-semibold text-primary-400 capitalize mb-3">{title.replace(/([A-Z])/g, " $1")}</h3>
    {children}
  </div>
);

export default function RevenueDataAnalystAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [timePeriod, setTimePeriod] = useState<"quarterly" | "annual">("quarterly");
  const [breakdown, setBreakdown] = useState<"customer" | "product" | "region">("customer");
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [lastInputs, setLastInputs] = useState<Record<string, any>>({});

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, {
    onResult, onError, onReset, enableMultiTurn: true
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleFileUpload = (file: File | null) => {
    if (!file) { setUploadedFile(null); setFileName(null); return; }
    setIsFileLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile(e.target?.result as string);
      setFileName(file.name);
      setIsFileLoading(false);
    };
    reader.onerror = () => { setIsFileLoading(false); setUploadedFile(null); };
    reader.readAsDataURL(file);
  };

  const handleRun = async () => {
    const inputs: Record<string, any> = { timePeriod, breakdown };
    if (uploadedFile) inputs.revenueData = uploadedFile;
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleReset = () => { setLastInputs({}); reset(); };

  const handleClearAll = () => {
    setTimePeriod("quarterly"); setBreakdown("customer");
    setUploadedFile(null); setFileName(null); setLastInputs({}); reset();
  };

  const out = output as any;

  const renderGrowthSection = (sectionKey: string) => {
    const data = out?.[sectionKey];
    if (!data) return null;
    if (typeof data === "object" && data.growthRate !== undefined) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Growth Rate:</span>
            <TrendArrow value={data.growthRate} />
          </div>
          {data.mrr !== undefined && <p className="text-gray-300 text-sm">MRR: <span className="text-white font-medium">{data.mrr}</span></p>}
          {data.arr !== undefined && <p className="text-gray-300 text-sm">ARR: <span className="text-white font-medium">{data.arr}</span></p>}
          {data.description && <p className="text-gray-400 text-xs mt-2">{data.description}</p>}
        </div>
      );
    }
    return <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(data)}</p>;
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary-500" />
          <h2 className="text-2xl font-semibold">{appName}</h2>
        </div>
        <p className="mt-2 text-gray-400">Upload revenue data (CSV/JSON) and get comprehensive growth analysis, customer segmentation, churn insights, and revenue forecasts.</p>
      </div>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <BasicFileUpload
            label="Revenue Data (CSV or JSON)"
            accept=".csv,.json"
            onFileSelect={handleFileUpload}
            disabled={isRunning}
            maxSizeMB={10}
          />
          {fileName && <p className="text-xs text-gray-500">File loaded: {fileName}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Time Period</Label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Breakdown By</Label>
              <select
                value={breakdown}
                onChange={(e) => setBreakdown(e.target.value as any)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white"
              >
                <option value="customer">Customer</option>
                <option value="product">Product</option>
                <option value="region">Region</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={isRunning || isFileLoading}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing revenue data..." : "Analyze Revenue Data"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {out.revenueOverview && (
            <SectionCard title="Revenue Overview">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{out.revenueOverview}</p>
            </SectionCard>
          )}

          {out.growthAnalysis && (
            <SectionCard title="Growth Analysis">
              {renderGrowthSection("growthAnalysis")}
            </SectionCard>
          )}

          {out.customerSegmentation && (
            <SectionCard title="Customer Segmentation">
              {Array.isArray(out.customerSegmentation) ? (
                <ul className="space-y-2">
                  {out.customerSegmentation.map((seg: any, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-primary-600 pl-3">
                      {typeof seg === "string" ? seg : `${seg.segment}: ${seg.revenue || seg.count || ""}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.customerSegmentation)}</p>
              )}
            </SectionCard>
          )}

          {out.churnAnalysis && (
            <SectionCard title="Churn Analysis">
              {typeof out.churnAnalysis === "object" ? (
                <div className="space-y-2">
                  {out.churnAnalysis.rate !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Churn Rate:</span>
                      <TrendArrow value={-out.churnAnalysis.rate} suffix="%" />
                    </div>
                  )}
                  {out.churnAnalysis.description && <p className="text-gray-400 text-xs">{out.churnAnalysis.description}</p>}
                </div>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.churnAnalysis)}</p>
              )}
            </SectionCard>
          )}

          {out.expansionRevenue && (
            <SectionCard title="Expansion Revenue">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.expansionRevenue)}</p>
            </SectionCard>
          )}

          {out.revenueForecast && (
            <SectionCard title="Revenue Forecast">
              <div className="space-y-3">
                {typeof out.revenueForecast === "object" && out.revenueForecast.confidence !== undefined ? (
                  <>
                    <ForecastConfidence confidence={out.revenueForecast.confidence} />
                    {out.revenueForecast.nextQuarter && <p className="text-gray-300 text-sm">Next Quarter: <span className="text-white font-medium">{out.revenueForecast.nextQuarter}</span></p>}
                    {out.revenueForecast.nextYear && <p className="text-gray-300 text-sm">Next Year: <span className="text-white font-medium">{out.revenueForecast.nextYear}</span></p>}
                    {out.revenueForecast.description && <p className="text-gray-400 text-xs mt-2">{out.revenueForecast.description}</p>}
                  </>
                ) : (
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.revenueForecast)}</p>
                )}
              </div>
            </SectionCard>
          )}

          {out.recommendations && (
            <SectionCard title="Recommendations">
              {Array.isArray(out.recommendations) ? (
                <ul className="space-y-2">
                  {out.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm border-l-2 border-green-600 pl-3">{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{String(out.recommendations)}</p>
              )}
            </SectionCard>
          )}

          {out.success === undefined && (
            <StructuredResult result={out} title="Full Analysis Results" />
          )}

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleReset} className="border-gray-700">New Analysis</Button>
            <Button onClick={handleClearAll} variant="ghost">Clear All</Button>
            {Object.keys(lastInputs).length > 0 && (
              <Button onClick={handleRun} disabled={isRunning} className="bg-primary-600 hover:bg-primary-500">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Re-run Analysis
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}