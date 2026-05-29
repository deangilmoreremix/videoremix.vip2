/**
 * Resume Analyzer AI — Production UI
 * New VideoRemix Name: Resume Analyzer AI
 */

import React, { useState, useEffect } from "react";
import { FileText, Play, Loader2, ArrowRight, RefreshCw, Zap, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function ResumeAnalyzerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobTarget, setJobTarget] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"entry" | "mid" | "senior" | "executive">("mid");
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

  const levelLabels: Record<typeof experienceLevel, string> = {
    entry: "Entry Level (0-2 years)",
    mid: "Mid Level (3-5 years)",
    senior: "Senior Level (5-10 years)",
    executive: "Executive (10+ years)",
  };

  const quickIterateOptions = [
    "Focus on technical skills",
    "ATS optimization tips",
    "Quantify achievements",
    "Leadership experience",
    "Education section",
    "Summary improvement",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      resumeText: resumeText.trim(),
      jobTarget: jobTarget.trim(),
      experienceLevel,
    };
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!resumeText.trim() || !jobTarget.trim()) return;
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
    setResumeText("");
    setJobTarget("");
    setExperienceLevel("mid");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const renderScoreGauge = (score: unknown, label: string, colorClass: string) => {
    if (score === undefined || score === null) return null;
    const numScore = typeof score === "number" ? score : parseFloat(String(score));
    if (isNaN(numScore)) return null;
    const bgClass = numScore >= 7 ? "text-green-400" : numScore >= 4 ? "text-yellow-400" : "text-red-400";
    const gaugeColor = numScore >= 7 ? "bg-green-500" : numScore >= 4 ? "bg-yellow-500" : "bg-red-500";
    const percentage = Math.min(100, (numScore / 10) * 100);
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6 text-center">
        <div className={`text-5xl font-bold ${bgClass} mb-1`}>{numScore.toFixed(1)}</div>
        <div className="text-xs text-gray-400 mb-3">{label}</div>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${gaugeColor}`} style={{ width: `${percentage}%` }} />
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
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).suggestion || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canRun = resumeText.trim().length > 0 && jobTarget.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Analyze resumes and get actionable feedback on fit, ATS compatibility, and improvement suggestions.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Resume Text *</Label>
            <PromptTextarea
              label=""
              placeholder="Paste your full resume here (or paste a job description below and enter your resume in the next field)..."
              value={resumeText}
              onChange={setResumeText}
              disabled={isRunning}
              maxLength={5000}
              rows={10}
              hint="Copy-paste your resume text. Include work history, skills, education."
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Position *</Label>
            <Input
              value={jobTarget}
              onChange={(e) => setJobTarget(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer, Product Manager, Data Scientist"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Experience Level</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(levelLabels) as Array<keyof typeof levelLabels>).map((l) => (
                <button
                  key={l}
                  onClick={() => setExperienceLevel(l)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${experienceLevel === l ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {levelLabels[l]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing resume..." : "Analyze Resume"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Analysis Results</h3>
              </div>
              <span className="text-xs text-gray-500">File Search + multi-turn ready</span>
            </div>

            {output.overallScore !== undefined && renderScoreGauge(output.overallScore, "Overall Resume Score", "text-primary-400")}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {output.strengths && renderList("Strengths", output.strengths, <CheckCircle2 className="h-5 w-5" />, "text-green-400")}
              {output.weaknesses && renderList("Areas to Improve", output.weaknesses, <AlertTriangle className="h-5 w-5" />, "text-red-400")}
            </div>

            {output.skillsMatch && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h4 className="font-semibold text-white text-lg">Skills Match</h4>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {typeof output.skillsMatch === "string" ? output.skillsMatch : JSON.stringify(output.skillsMatch, null, 2)}
                </div>
              </div>
            )}

            {output.atsCompatibility !== undefined && (
              <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-6 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-1">{typeof output.atsCompatibility === "number" ? output.atsCompatibility.toFixed(0) : output.atsCompatibility}</div>
                <div className="text-xs text-gray-400">ATS Compatibility Score</div>
              </div>
            )}

            {output.specificImprovements && renderList("Actionable Improvements", output.specificImprovements, <ArrowRight className="h-5 w-5" />, "text-primary-400")}
            {output.coverLetterTips && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-amber-400" />
                  <h4 className="font-semibold text-amber-400 text-lg">Cover Letter Tips</h4>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {typeof output.coverLetterTips === "string" ? output.coverLetterTips : JSON.stringify(output.coverLetterTips, null, 2)}
                </p>
              </div>
            )}

            {output && output.overallScore === undefined && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on feedback</span>
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
                placeholder="Custom feedback request (e.g. 'focus on quantifying achievements')"
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

          <ResultActions onNew={handleReset} newLabel="New Analysis" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

ResumeAnalyzerAI.displayName = "ResumeAnalyzerAI";