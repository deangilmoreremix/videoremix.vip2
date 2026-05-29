/**
 * Candidate Decision AI — Production UI
 * New VideoRemix Name: Candidate Decision AI
 */

import React, { useState, useEffect } from "react";
import { Users, Play, Loader2, ArrowRight, RefreshCw, Zap, CheckCircle2, AlertTriangle, Crown } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function CandidateDecisionAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [candidateProfiles, setCandidateProfiles] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [teamFit, setTeamFit] = useState("");
  const [priorityFactors, setPriorityFactors] = useState("");
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
    "Focus on technical skills",
    "Cultural fit emphasis",
    "Compare top 2 only",
    "Consider salary constraints",
    "Remote work preference",
    "Leadership potential",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      candidateProfiles: candidateProfiles.trim(),
      jobRequirements: jobRequirements.trim(),
    };
    if (teamFit.trim()) inputs.teamFit = teamFit.trim();
    if (priorityFactors.trim()) inputs.priorityFactors = priorityFactors.trim();
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!candidateProfiles.trim() || !jobRequirements.trim()) return;
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
    setCandidateProfiles("");
    setJobRequirements("");
    setTeamFit("");
    setPriorityFactors("");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const renderCandidateCard = (candidate: unknown, index: number, isTopPick: boolean) => {
    if (!candidate || typeof candidate !== "object") return null;
    const c = candidate as Record<string, unknown>;
    return (
      <div key={index} className={`rounded-xl border ${isTopPick ? "border-primary-600 bg-primary-950/20" : "border-gray-800 bg-black/50"} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isTopPick && <Crown className="h-5 w-5 text-yellow-400" />}
            <span className={`text-lg font-semibold ${isTopPick ? "text-primary-400" : "text-white"}`}>
              {c.name || c.candidateName || `Candidate ${index + 1}`}
            </span>
          </div>
          {c.rank && <span className="text-xs text-gray-500">#{c.rank}</span>}
        </div>
        {c.score && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-2xl font-bold text-green-400">{c.score}</span>
            <span className="text-xs text-gray-400">match score</span>
          </div>
        )}
        {c.pros && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Pros</span>
            </div>
            <div className="space-y-1">
              {(Array.isArray(c.pros) ? c.pros : []).map((pro: unknown, i: number) => (
                <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-green-400 mt-1 flex-shrink-0" />
                  {typeof pro === "string" ? pro : JSON.stringify(pro)}
                </div>
              ))}
            </div>
          </div>
        )}
        {c.cons && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-400 font-medium">Cons</span>
            </div>
            <div className="space-y-1">
              {(Array.isArray(c.cons) ? c.cons : []).map((con: unknown, i: number) => (
                <div key={i} className="text-sm text-gray-400 flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-red-400 mt-1 flex-shrink-0" />
                  {typeof con === "string" ? con : JSON.stringify(con)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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

  const canRun = candidateProfiles.trim().length > 0 && jobRequirements.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Compare candidates side-by-side, rank them, and get data-driven hiring recommendations.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Candidate Profiles *</Label>
            <PromptTextarea
              label=""
              placeholder={'Paste candidate information as JSON array. Example: [{"name": "Sarah Chen", "experience": "5 years", "skills": ["React", "Node"], "score": 85}, {"name": "Marcus Johnson", "experience": "7 years", "skills": ["Vue", "Python"], "score": 78}]'}
              value={candidateProfiles}
              onChange={setCandidateProfiles}
              disabled={isRunning}
              maxLength={4000}
              rows={10}
              hint="Enter as JSON array with name, skills, experience, scores for each candidate"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Job Requirements *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. React Developer needed. Must have 4+ years experience with TypeScript, experience with REST APIs, and ability to work in a collaborative team environment."
              value={jobRequirements}
              onChange={setJobRequirements}
              disabled={isRunning}
              maxLength={1000}
              rows={4}
              hint="Describe the role requirements and must-have skills"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Team Fit (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Fast-paced startup environment, preference for candidates who've worked in small teams, async communication culture"
              value={teamFit}
              onChange={setTeamFit}
              disabled={isRunning}
              maxLength={500}
              rows={2}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Priority Factors (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Skills > Experience > Culture fit; Salary must be under $120k; Remote work essential"
              value={priorityFactors}
              onChange={setPriorityFactors}
              disabled={isRunning}
              maxLength={400}
              rows={2}
            />
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing candidates..." : "Compare Candidates"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Decision Analysis</h3>
              </div>
              <span className="text-xs text-gray-500">File Search + multi-turn ready</span>
            </div>

            {output.recommendation && (
              <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <h4 className="font-semibold text-yellow-400 text-lg">Top Recommendation</h4>
                </div>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  {typeof output.recommendation === "string" ? output.recommendation : JSON.stringify(output.recommendation, null, 2)}
                </p>
              </div>
            )}

            {output.candidateRankings && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-4 text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" /> Candidate Rankings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Array.isArray(output.candidateRankings) ? output.candidateRankings : [output.candidateRankings]).map((c: unknown, i: number) =>
                    renderCandidateCard(c, i, i === 0)
                  )}
                </div>
              </div>
            )}

            {output.comparisonAnalysis && renderSection("Comparison Analysis", output.comparisonAnalysis, <Users className="h-5 w-5" />, "text-blue-400")}
            {output.risks && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <h4 className="font-semibold text-red-400 text-lg">Risks & Concerns</h4>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(output.risks) ? output.risks : [output.risks]).map((risk: unknown, i: number) => (
                    <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      {typeof risk === "string" ? risk : JSON.stringify(risk)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {output.followUpQuestions && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-white text-lg">Follow-Up Questions</h4>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(output.followUpQuestions) ? output.followUpQuestions : [output.followUpQuestions]).map((q: unknown, i: number) => (
                    <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-primary-400 font-mono text-xs">{i + 1}.</span>
                      {typeof q === "string" ? q : JSON.stringify(q)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {output.compensationAdvice && renderSection("Compensation Advice", output.compensationAdvice, <Crown className="h-5 w-5" />, "text-amber-400")}

            {output && !output.candidateRankings && !output.recommendation && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Re-analyze</span>
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
                placeholder="Custom refinement (e.g. 're-rank considering salary constraints')"
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

          <ResultActions onNew={handleReset} newLabel="New Comparison" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

CandidateDecisionAI.displayName = "CandidateDecisionAI";