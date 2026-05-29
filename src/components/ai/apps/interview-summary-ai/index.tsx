/**
 * Interview Summary AI — Production UI
 * New VideoRemix Name: Interview Summary AI
 */

import React, { useState, useEffect } from "react";
import { ClipboardCheck, Play, Loader2, ArrowRight, RefreshCw, Zap, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function InterviewSummaryAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [interviewNotes, setInterviewNotes] = useState("");
  const [candidateResponses, setCandidateResponses] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [interviewType, setInterviewType] = useState<"screening" | "technical" | "behavioral" | "final">("technical");
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

  const typeLabels: Record<typeof interviewType, string> = {
    screening: "Screening (Initial call)",
    technical: "Technical (Skills assessment)",
    behavioral: "Behavioral (Culture fit)",
    final: "Final (Leadership/Executive)",
  };

  const quickIterateOptions = [
    "Focus on strengths",
    "Highlight red flags",
    "Compare to requirements",
    "Cultural fit score",
    "Technical depth",
    "Follow-up questions",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      interviewNotes: interviewNotes.trim(),
      candidateResponses: candidateResponses.trim(),
      jobRequirements: jobRequirements.trim(),
      interviewType,
    };
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!interviewNotes.trim() || !candidateResponses.trim() || !jobRequirements.trim()) return;
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
    setInterviewNotes("");
    setCandidateResponses("");
    setJobRequirements("");
    setInterviewType("technical");
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
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).strength || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendation = (recommendation: unknown) => {
    if (!recommendation) return null;
    const rec = String(recommendation).toLowerCase();
    const isHire = rec.includes("hire") && !rec.includes("no hire");
    const isHold = rec.includes("hold");
    const bgClass = isHire ? "border-green-900/50 bg-green-950/20" : isHold ? "border-yellow-900/50 bg-yellow-950/20" : "border-red-900/50 bg-red-950/20";
    const textClass = isHire ? "text-green-400" : isHold ? "text-yellow-400" : "text-red-400";
    const icon = isHire ? <CheckCircle2 className="h-5 w-5" /> : isHold ? <Users className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />;
    return (
      <div className={`rounded-xl border ${bgClass} p-6`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={textClass}>{icon}</span>
          <h4 className={`font-semibold text-lg ${textClass}`}>Overall Recommendation</h4>
        </div>
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{typeof recommendation === "string" ? recommendation : JSON.stringify(recommendation, null, 2)}</p>
      </div>
    );
  };

  const renderScoreCard = (scoreCard: unknown) => {
    if (!scoreCard || typeof scoreCard !== "object") return null;
    const scores = scoreCard as Record<string, unknown>;
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <h4 className="font-semibold text-primary-400 mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" /> Score Card
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(scores).map(([key, value]) => {
            const numVal = typeof value === "number" ? value : parseFloat(String(value));
            const isNum = !isNaN(numVal);
            const colorClass = isNum ? (numVal >= 7 ? "text-green-400" : numVal >= 4 ? "text-yellow-400" : "text-red-400") : "text-gray-300";
            return (
              <div key={key} className="text-center p-3 rounded-lg bg-black/50 border border-gray-800">
                <div className={`text-2xl font-bold ${colorClass}`}>{isNum ? numVal.toFixed(1) : String(value)}</div>
                <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canRun = interviewNotes.trim().length > 0 && candidateResponses.trim().length > 0 && jobRequirements.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Generate structured interview feedback with performance summaries, recommendations, and scorecards.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Interview Notes *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Candidate seemed nervous initially but warmed up. Struggled with system design but showed strong coding skills. Good communication throughout."
              value={interviewNotes}
              onChange={setInterviewNotes}
              disabled={isRunning}
              maxLength={2000}
              rows={5}
              hint="General observations about the candidate"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Candidate Responses *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g.\nQ: Tell me about a time you led a team through a difficult project.\nA: Discussed leading a re-platforming effort at previous company. Showed ownership but couldn't quantify the impact.\n\nQ: Design a URL shortener.\nA: Good understanding of hashing, discussed collisions, but struggled with scale considerations."
              value={candidateResponses}
              onChange={setCandidateResponses}
              disabled={isRunning}
              maxLength={2500}
              rows={8}
              hint="Key questions and how the candidate responded"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Job Requirements *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Senior React Developer needed. Must have: 5+ years experience, TypeScript proficiency, system design skills, experience leading a team of 3+, strong communication."
              value={jobRequirements}
              onChange={setJobRequirements}
              disabled={isRunning}
              maxLength={1000}
              rows={4}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Interview Type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
                <button
                  key={t}
                  onClick={() => setInterviewType(t)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${interviewType === t ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating feedback..." : "Generate Interview Feedback"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Interview Feedback</h3>
              </div>
              <span className="text-xs text-gray-500">File Search + multi-turn ready</span>
            </div>

            {output.overallRecommendation && renderRecommendation(output.overallRecommendation)}

            {output.performanceSummary && renderSection("Performance Summary", output.performanceSummary, <ClipboardCheck className="h-5 w-5" />, "text-primary-400")}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {output.strengthsDemonstrated && renderList("Strengths", output.strengthsDemonstrated, <CheckCircle2 className="h-5 w-5" />, "text-green-400")}
              {output.gapsOrConcerns && renderList("Gaps & Concerns", output.gapsOrConcerns, <AlertTriangle className="h-5 w-5" />, "text-red-400")}
            </div>

            {output.skillsAssessment && renderSection("Skills Assessment vs Requirements", output.skillsAssessment, <ClipboardCheck className="h-5 w-5" />, "text-blue-400")}
            {output.culturalFit && renderSection("Cultural Fit", output.culturalFit, <Users className="h-5 w-5" />, "text-purple-400")}
            {output.followUpQuestions && renderList("Follow-Up Questions", output.followUpQuestions, <ArrowRight className="h-5 w-5" />, "text-amber-400")}
            {output.scoreCard && renderScoreCard(output.scoreCard)}

            {output && !output.performanceSummary && (
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
                placeholder="Custom refinement (e.g. 'focus more on technical depth')"
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

          <ResultActions onNew={handleReset} newLabel="New Feedback" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

InterviewSummaryAI.displayName = "InterviewSummaryAI";