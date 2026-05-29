/**
 * AI Hiring Assistant — Production UI
 * New VideoRemix Name: AI Hiring Assistant
 */

import React, { useState, useEffect } from "react";
import { Users, Briefcase, Play, Loader2, ArrowRight, RefreshCw, Zap, CheckCircle2, Target, Clock } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function AIHiringAssistant({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [hiringStage, setHiringStage] = useState<"sourcing" | "screening" | "interview" | "offer">("sourcing");
  const [candidatePool, setCandidatePool] = useState("");
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

  const stageLabels: Record<typeof hiringStage, string> = {
    sourcing: "Sourcing (Finding candidates)",
    screening: "Screening (Filtering resumes)",
    interview: "Interview (Conducting interviews)",
    offer: "Offer (Negotiating & closing)",
  };

  const quickIterateOptions = [
    "Add salary benchmarks",
    "Focus on technical skills",
    "Cultural fit questions",
    "Entry-level adjustments",
    "Senior role criteria",
    "Remote-friendly additions",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      jobDescription: jobDescription.trim(),
      hiringStage,
    };
    if (candidatePool.trim()) {
      inputs.candidatePool = candidatePool.trim();
    }
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!jobDescription.trim()) return;
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
    setJobDescription("");
    setHiringStage("sourcing");
    setCandidatePool("");
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
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).question || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canRun = jobDescription.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Streamline your hiring process with AI-powered job posting optimization, sourcing strategies, and interview question generation.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Job Description *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. We are looking for a Senior React Developer with 5+ years of experience to join our growing engineering team. Must have experience with TypeScript, React, and modern CI/CD pipelines."
              value={jobDescription}
              onChange={setJobDescription}
              disabled={isRunning}
              maxLength={2500}
              rows={6}
              hint="Copy-paste your current job description or write a brief summary"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Hiring Stage</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(stageLabels) as Array<keyof typeof stageLabels>).map((s) => (
                <button
                  key={s}
                  onClick={() => setHiringStage(s)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${hiringStage === s ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {stageLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Candidate Pool (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. 15 applicants so far, mostly mid-level, 3 strong front-end candidates from referrals"
              value={candidatePool}
              onChange={setCandidatePool}
              disabled={isRunning}
              maxLength={800}
              rows={3}
              hint="Describe your current candidate pool if you have one"
            />
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating hiring strategy..." : "Generate Hiring Strategy"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Hiring Output</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.jobPostingOptimization && renderSection("Optimized Job Posting", output.jobPostingOptimization, <Briefcase className="h-5 w-5" />, "text-primary-400")}
            {output.sourcingStrategy && renderList("Sourcing Strategy", output.sourcingStrategy, <Target className="h-5 w-5" />, "text-blue-400")}
            {output.screeningCriteria && renderList("Screening Criteria", output.screeningCriteria, <CheckCircle2 className="h-5 w-5" />, "text-green-400")}
            {output.interviewQuestions && renderList("Interview Questions (5-7)", output.interviewQuestions, <Users className="h-5 w-5" />, "text-purple-400")}
            {output.evaluationRubric && renderSection("Evaluation Rubric", output.evaluationRubric, <Target className="h-5 w-5" />, "text-amber-400")}

            {(output.timelineToHire || output.costEstimate) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {output.timelineToHire && (
                  <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-5 w-5 text-primary-400" />
                      <h4 className="font-semibold text-white">Timeline to Hire</h4>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{typeof output.timelineToHire === "string" ? output.timelineToHire : JSON.stringify(output.timelineToHire)}</p>
                  </div>
                )}
                {output.costEstimate && (
                  <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-green-400" />
                      <h4 className="font-semibold text-white">Cost Estimate</h4>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{typeof output.costEstimate === "string" ? output.costEstimate : JSON.stringify(output.costEstimate)}</p>
                  </div>
                )}
              </div>
            )}

            {output && !output.jobPostingOptimization && (
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
                placeholder="Custom refinement (e.g. 'add assessment for cultural fit')"
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

AIHiringAssistant.displayName = "AIHiringAssistant";