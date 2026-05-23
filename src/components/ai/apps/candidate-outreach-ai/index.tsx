import React, { useState, useEffect } from "react";
import { Mail, Play, Loader2, ArrowRight, RefreshCw, Zap, Send, Linkedin, Clock } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function CandidateOutreachAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [candidateName, setCandidateName] = useState("");
  const [candidateBackground, setCandidateBackground] = useState("");
  const [role, setRole] = useState("");
  const [companyCulture, setCompanyCulture] = useState("");
  const [outreachType, setOutreachType] = useState<"cold" | "follow-up" | "offer">("cold");
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

  const typeLabels: Record<typeof outreachType, string> = {
    cold: "Cold Outreach (Initial contact)",
    "follow-up": "Follow-Up (Second attempt)",
    offer: "Offer Stage (Offer letter/negotiation)",
  };

  const quickIterateOptions = [
    "More casual tone",
    "Formal executive style",
    "Focus on values",
    "Urgent紧迫感",
    "Include salary hint",
    "Tech startup voice",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      candidateName: candidateName.trim(),
      candidateBackground: candidateBackground.trim(),
      role: role.trim(),
      outreachType,
    };
    if (companyCulture.trim()) inputs.companyCulture = companyCulture.trim();
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!candidateName.trim() || !candidateBackground.trim() || !role.trim()) return;
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
    setCandidateName("");
    setCandidateBackground("");
    setRole("");
    setCompanyCulture("");
    setOutreachType("cold");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const canRun = candidateName.trim().length > 0 && candidateBackground.trim().length > 0 && role.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Mail className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Craft personalized recruitment messages that get responses. AI researches candidates and writes compelling outreach.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Candidate Name *</Label>
              <PromptTextarea
                label=""
                placeholder="e.g. Dr. Emily Watson"
                value={candidateName}
                onChange={setCandidateName}
                disabled={isRunning}
                maxLength={200}
                rows={2}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Role *</Label>
              <PromptTextarea
                label=""
                placeholder="e.g. VP of Engineering"
                value={role}
                onChange={setRole}
                disabled={isRunning}
                maxLength={200}
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Candidate Background *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Former engineering manager at Stripe, led a team of 12, recently left to start her own company, strong distributed systems background, 8 years in fintech"
              value={candidateBackground}
              onChange={setCandidateBackground}
              disabled={isRunning}
              maxLength={1500}
              rows={5}
              hint="Include relevant experience, achievements, and why they're a good fit"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Company Culture (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Fast-paced series B startup, fully remote, dog-friendly, values transparency and rapid execution. Mission: democratize finance."
              value={companyCulture}
              onChange={setCompanyCulture}
              disabled={isRunning}
              maxLength={600}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Outreach Type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map((t) => (
                <button
                  key={t}
                  onClick={() => setOutreachType(t)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${outreachType === t ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Writing outreach..." : "Generate Outreach Messages"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Outreach Messages</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.subjectLine && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary-400" />
                    <h4 className="font-semibold text-white text-lg">Email Subject Line</h4>
                  </div>
                  <button onClick={() => copyToClipboard(typeof output.subjectLine === "string" ? output.subjectLine : JSON.stringify(output.subjectLine))} className="text-xs text-primary-400 hover:text-white">
                    Copy
                  </button>
                </div>
                <p className="text-lg text-gray-200">{typeof output.subjectLine === "string" ? output.subjectLine : JSON.stringify(output.subjectLine)}</p>
              </div>
            )}

            {output.outreachMessage && (
              <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-blue-400 text-lg">Email Message</h4>
                  </div>
                  <button onClick={() => copyToClipboard(typeof output.outreachMessage === "string" ? output.outreachMessage : JSON.stringify(output.outreachMessage))} className="text-xs text-primary-400 hover:text-white">
                    Copy
                  </button>
                </div>
                <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {typeof output.outreachMessage === "string" ? output.outreachMessage : JSON.stringify(output.outreachMessage, null, 2)}
                </div>
              </div>
            )}

            {output.linkedinMessage && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-500" />
                    <h4 className="font-semibold text-white text-lg">LinkedIn Message</h4>
                  </div>
                  <button onClick={() => copyToClipboard(typeof output.linkedinMessage === "string" ? output.linkedinMessage : JSON.stringify(output.linkedinMessage))} className="text-xs text-primary-400 hover:text-white">
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {typeof output.linkedinMessage === "string" ? output.linkedinMessage : JSON.stringify(output.linkedinMessage, null, 2)}
                </p>
              </div>
            )}

            {output.followUpSequence && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <h4 className="font-semibold text-white text-lg">Follow-Up Sequence</h4>
                </div>
                <div className="space-y-4">
                  {(Array.isArray(output.followUpSequence) ? output.followUpSequence : [output.followUpSequence]).map((step: unknown, i: number) => (
                    <div key={i} className="flex items-start gap-3 border-l-2 border-gray-700 pl-4">
                      <span className="text-xs font-semibold text-primary-400">Step {i + 1}</span>
                      <div className="text-sm text-gray-300">
                        {typeof step === "string" ? step : typeof step === "object" ? (step as Record<string, unknown>).timing ? `${(step as Record<string, unknown>).timing}: ${(step as Record<string, unknown>).message}` : JSON.stringify(step) : String(step)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {output.timingAdvice && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-green-400">Timing Advice</h4>
                </div>
                <p className="text-sm text-gray-300">{typeof output.timingAdvice === "string" ? output.timingAdvice : JSON.stringify(output.timingAdvice)}</p>
              </div>
            )}

            {output.sourceSuggestion && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <h4 className="font-semibold text-primary-400 mb-3">Where to Find More Candidates Like This</h4>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{typeof output.sourceSuggestion === "string" ? output.sourceSuggestion : JSON.stringify(output.sourceSuggestion)}</p>
              </div>
            )}

            {output && !output.outreachMessage && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on this message</span>
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
                placeholder="Custom refinement (e.g. 'make it more urgent, add compensation hint')"
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

          <ResultActions onNew={handleReset} newLabel="New Outreach" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

CandidateOutreachAI.displayName = "CandidateOutreachAI";