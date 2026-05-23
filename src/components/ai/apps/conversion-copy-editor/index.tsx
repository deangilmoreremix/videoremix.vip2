import React, { useState, useEffect } from "react";
import { Edit3, Play, Loader2, ArrowRight, RefreshCw, Zap, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function ConversionCopyEditor({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [currentCopy, setCurrentCopy] = useState("");
  const [goal, setGoal] = useState<"more_clicks" | "more_signups" | "more_purchases">("more_signups");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<"web" | "email" | "social">("web");
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

  const goalLabels: Record<typeof goal, string> = {
    more_clicks: "More Clicks (Traffic to offer)",
    more_signups: "More Signups (Free conversions)",
    more_purchases: "More Purchases (Revenue)",
  };

  const platformLabels: Record<typeof platform, string> = {
    web: "Web Page / Landing Page",
    email: "Email Campaign",
    social: "Social Media Post / Ad",
  };

  const quickIterateOptions = [
    "Make it more urgent",
    "Add social proof",
    "Simplify the language",
    "Stronger CTA",
    "More emotional appeal",
    "Focus on benefits not features",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      currentCopy: currentCopy.trim(),
      goal,
      audience: audience.trim(),
      platform,
    };
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!currentCopy.trim() || !audience.trim()) return;
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
    setCurrentCopy("");
    setGoal("more_signups");
    setAudience("");
    setPlatform("web");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const renderSection = (title: string, content: unknown, icon: React.ReactNode, colorClass: string) => {
    if (!content) return null;
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={colorClass}>{icon}</span>
          <h4 className="font-semibold text-white text-lg">{title}</h4>
        </div>
        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
        </div>
      </div>
    );
  };

  const renderScore = (score: unknown, label: string) => {
    if (score === undefined || score === null) return null;
    const numScore = typeof score === "number" ? score : parseFloat(String(score));
    if (isNaN(numScore)) return null;
    const color = numScore >= 7 ? "text-green-400" : numScore >= 4 ? "text-yellow-400" : "text-red-400";
    return (
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-3xl font-bold ${color}`}>{numScore.toFixed(1)}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
    );
  };

  const renderList = (title: string, items: unknown, icon: React.ReactNode, colorClass: string) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return null;
    const itemArray = Array.isArray(items) ? items : [items];
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={colorClass}>{icon}</span>
          <h4 className="font-semibold text-white text-lg">{title}</h4>
        </div>
        <div className="space-y-3">
          {itemArray.map((item: unknown, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <ArrowRight className={`h-4 w-4 ${colorClass} mt-0.5 flex-shrink-0`} />
              <span className="text-sm text-gray-300">
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).tip || (item as Record<string, unknown>).text || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canRun = currentCopy.trim().length > 0 && audience.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Edit3 className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Edit any copy to maximize conversion rates. AI analyzes your current copy, goal, and audience to suggest improvements for more clicks, signups, or purchases.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Current Copy *</Label>
            <PromptTextarea
              label=""
              placeholder="Paste your current copy here (headline, body text, CTA buttons, anything you want to improve)"
              value={currentCopy}
              onChange={setCurrentCopy}
              disabled={isRunning}
              maxLength={3000}
              rows={8}
              hint="The more context you provide, the better the suggestions"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Goal *</Label>
              <div className="flex flex-col gap-2">
                {(Object.keys(goalLabels) as Array<keyof typeof goalLabels>).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    disabled={isRunning}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border text-left ${goal === g ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                  >
                    {goalLabels[g]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Platform</Label>
              <div className="flex flex-col gap-2">
                {(Object.keys(platformLabels) as Array<keyof typeof platformLabels>).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    disabled={isRunning}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border text-left ${platform === p ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                  >
                    {platformLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. SaaS founders looking to reduce churn, first-time buyers on a budget, busy professionals who value time"
              value={audience}
              onChange={setAudience}
              disabled={isRunning}
              maxLength={500}
              rows={2}
              hint="Who will read this copy?"
            />
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Editing copy..." : "Edit Copy"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Edited Copy</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.readabilityScore && renderScore(output.readabilityScore, "Readability Score")}

            {output.editedCopy && (
              <div className="rounded-xl border border-primary-900/50 bg-primary-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-primary-400" />
                  <h4 className="font-semibold text-primary-400 text-lg">Improved Version</h4>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {typeof output.editedCopy === "string" ? output.editedCopy : JSON.stringify(output.editedCopy, null, 2)}
                </div>
              </div>
            )}

            {output.changes && renderSection("Key Changes", output.changes, <ArrowRight className="h-5 w-5" />, "text-blue-400")}
            {output.conversionTips && renderList("Conversion Tips", output.conversionTips, <Zap className="h-5 w-5" />, "text-green-400")}
            {output.abVariants && renderList("A/B Test Variants", output.abVariants, <AlertTriangle className="h-5 w-5" />, "text-amber-400")}
            {output.emotionalTriggers && renderList("Emotional Triggers Used", output.emotionalTriggers, <Eye className="h-5 w-5" />, "text-purple-400")}

            {output && !output.editedCopy && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on this copy</span>
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
                placeholder="Custom refinement (e.g. 'make the CTA more action-oriented and add urgency')"
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

          <ResultActions onNew={handleReset} newLabel="New Edit" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

ConversionCopyEditor.displayName = "ConversionCopyEditor";