import React, { useState, useEffect } from "react";
import { Target, Play, Loader2, ArrowRight, RefreshCw, Zap, Users, Calendar, DollarSign } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function HiringPlanBuilder({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [openRoles, setOpenRoles] = useState("");
  const [hiringTimeline, setHiringTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [teamGrowthGoals, setTeamGrowthGoals] = useState("");
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

  const quickIterateOptions = [
    "Accelerate timeline",
    "Reduce budget constraints",
    "Focus on senior hires",
    "Remote-first strategy",
    "Internal promotion plan",
    " contingencia hiring",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      openRoles: openRoles.trim(),
      hiringTimeline: hiringTimeline.trim(),
    };
    if (budget.trim()) inputs.budget = budget.trim();
    if (teamGrowthGoals.trim()) inputs.teamGrowthGoals = teamGrowthGoals.trim();
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!openRoles.trim() || !hiringTimeline.trim()) return;
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
    setOpenRoles("");
    setHiringTimeline("");
    setBudget("");
    setTeamGrowthGoals("");
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
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).role || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTimeline = (timeline: unknown) => {
    if (!timeline) return null;
    const timelineArray = Array.isArray(timeline) ? timeline : [timeline];
    return (
      <div className="space-y-3">
        {timelineArray.map((item: unknown, i: number) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-sm text-gray-300">
              {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).milestone || (item as Record<string, unknown>).phase || JSON.stringify(item) : String(item)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const canRun = openRoles.trim().length > 0 && hiringTimeline.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Target className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Build strategic hiring plans with role prioritization, sourcing strategies, and budget allocation.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Open Roles *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g.\n- 2 Senior React Developers (remote)\n- 1 Product Manager (NYC hybrid)\n- 1 DevOps Engineer (SF or remote)\n- 1 UX Designer (contract to hire)"
              value={openRoles}
              onChange={setOpenRoles}
              disabled={isRunning}
              maxLength={1500}
              rows={6}
              hint="List all open positions with any relevant details"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Hiring Timeline *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Need all roles filled within 3 months. Senior roles priority by end of month, others can wait 6-8 weeks."
              value={hiringTimeline}
              onChange={setHiringTimeline}
              disabled={isRunning}
              maxLength={600}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Budget (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. $400k total hiring budget, $120k max per senior role, willing to pay premium for exceptional candidates"
              value={budget}
              onChange={setBudget}
              disabled={isRunning}
              maxLength={500}
              rows={2}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Team Growth Goals (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Scale from 8 to 15 people by Q4. Want to build a culture of senior ICs. Need to support 3x revenue growth."
              value={teamGrowthGoals}
              onChange={setTeamGrowthGoals}
              disabled={isRunning}
              maxLength={500}
              rows={2}
            />
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Building hiring plan..." : "Build Hiring Plan"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Hiring Plan</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.hiringStrategy && renderSection("Hiring Strategy", output.hiringStrategy, <Target className="h-5 w-5" />, "text-primary-400")}
            {output.rolePrioritization && renderList("Role Prioritization", output.rolePrioritization, <Users className="h-5 w-5" />, "text-blue-400")}
            {output.sourcingPlan && renderList("Sourcing Plan", output.sourcingPlan, <Target className="h-5 w-5" />, "text-green-400")}
            {output.interviewProcess && renderSection("Interview Process", output.interviewProcess, <Users className="h-5 w-5" />, "text-purple-400")}
            {output.budgetAllocation && (
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-amber-400" />
                  <h4 className="font-semibold text-amber-400 text-lg">Budget Allocation</h4>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {typeof output.budgetAllocation === "string" ? output.budgetAllocation : JSON.stringify(output.budgetAllocation, null, 2)}
                </div>
              </div>
            )}
            {output.keyMilestones && renderSection("Key Milestones", output.keyMilestones, <Calendar className="h-5 w-5" />, "text-green-400")}
            {output.riskFactors && renderList("Risk Factors", output.riskFactors, <Target className="h-5 w-5" />, "text-red-400")}
            {output.employerBrandingTips && renderSection("Employer Branding Tips", output.employerBrandingTips, <Users className="h-5 w-5" />, "text-amber-400")}

            {output && !output.hiringStrategy && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on this plan</span>
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
                placeholder="Custom refinement (e.g. 'focus on contingency hiring options')"
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

          <ResultActions onNew={handleReset} newLabel="New Plan" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

HiringPlanBuilder.displayName = "HiringPlanBuilder";