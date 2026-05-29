/**
 * Landing Page Critic AI — Production UI
 * New VideoRemix Name: Landing Page Critic AI
 */

import React, { useState, useEffect } from "react";
import { Target, Users, Play, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, ArrowRight, RefreshCw, Zap, LayoutGrid, Image as LucideImage } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function LandingPageCriticAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [targetGoal, setTargetGoal] = useState<"conversion" | "signup" | "purchase">("conversion");
  const [targetAudience, setTargetAudience] = useState("");
  const [iterationPrompt, setIterationPrompt] = useState("");
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [stickyScreenshot, setStickyScreenshot] = useState<string | null>(null);

  const { run, isRunning, output, reset, clearHistory } = useRunAIApp(appId, {
    enableMultiTurn: true,
    onResult,
    onError,
    onReset,
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const goalOptions = ["conversion", "signup", "purchase"] as const;
  const goalLabels: Record<typeof goalOptions[number], string> = {
    conversion: "Conversion (Sign up, Subscribe)",
    signup: "Sign Up (Account Creation)",
    purchase: "Purchase (E-commerce)",
  };

  const quickIterateOptions = [
    "Focus more on mobile UX",
    "Suggest bolder CTA improvements",
    "Deeper accessibility analysis",
    "Analyze above-the-fold section",
    "Focus on trust signals",
    "Critique the pricing layout",
  ];

  const handleScreenshot = (file: File | null) => {
    if (file) {
      setScreenshotName(file.name);
      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setScreenshot(dataUrl);
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        setIsImageLoading(false);
        setScreenshotName(null);
        setScreenshot(null);
      };
      reader.readAsDataURL(file);
    } else {
      setScreenshotName(null);
      setScreenshot(null);
      setIsImageLoading(false);
    }
  };

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      targetGoal,
      targetAudience: targetAudience.trim(),
    };
    if (landingPageUrl.trim()) {
      inputs.landingPageUrl = landingPageUrl.trim();
    }
    if (screenshot) {
      inputs.screenshot = screenshot;
    }
    if (extra) {
      Object.assign(inputs, extra);
    }
    return inputs;
  };

  const handleRun = async () => {
    const hasUrl = landingPageUrl.trim().length > 0;
    const hasScreenshot = !!screenshot;
    if (!hasUrl && !hasScreenshot) return;

    const inputs = buildInputs();
    setLastInputs(inputs);
    setStickyScreenshot(screenshot || stickyScreenshot);
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
    setStickyScreenshot(null);
  };

  const handleClearAll = () => {
    setLandingPageUrl("");
    setScreenshot(null);
    setScreenshotName(null);
    setTargetGoal("conversion");
    setTargetAudience("");
    setIterationPrompt("");
    setLastInputs(null);
    setStickyScreenshot(null);
    setIsImageLoading(false);
    clearHistory();
    reset();
  };

  const getScoreColor = (score: number) => {
    if (score < 5) return "text-red-400";
    if (score < 7) return "text-yellow-400";
    return "text-green-400";
  };

  const getScoreTrackColor = (score: number) => {
    if (score < 5) return "bg-red-500";
    if (score < 7) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score < 5) return "from-red-950/30 to-red-900/10";
    if (score < 7) return "from-yellow-950/30 to-yellow-900/10";
    return "from-green-950/30 to-green-900/10";
  };

  const renderScoreGauge = (score: number) => {
    const clampedScore = Math.max(1, Math.min(10, score));
    const percentage = (clampedScore / 10) * 100;

    return (
      <div className={`rounded-2xl bg-gradient-to-br ${getScoreBgColor(score)} border border-gray-800 p-8 text-center`}>
        <div className={`text-8xl font-bold ${getScoreColor(score)} mb-3`}>{score}</div>
        <div className="text-sm text-gray-400 mb-6">out of 10</div>
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${getScoreTrackColor(score)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Poor</span>
          <span>Average</span>
          <span>Excellent</span>
        </div>
      </div>
    );
  };

  const renderListItem = (text: string, icon: React.ReactNode, colorClass: string) => (
    <li className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 ${colorClass}`}>{icon}</span>
      <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
    </li>
  );

  const renderAnalysisSection = (title: string, content: string | undefined, icon: React.ReactNode) => {
    if (!content) return null;
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-primary-400">{icon}</span>
          <h4 className="font-semibold text-white text-lg">{title}</h4>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    );
  };

  const hasInput = landingPageUrl.trim().length > 0 || !!screenshot;
  const canRun = hasInput && !isRunning && !isImageLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Target className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Analyze any landing page for UX, messaging, and conversion improvements. Supports URL analysis or screenshot upload with AI vision.</p>

      {!output ? (
        <div className="space-y-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Landing Page URL</Label>
              <Input
                value={landingPageUrl}
                onChange={(e) => setLandingPageUrl(e.target.value)}
                placeholder="https://example.com/landing"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1.5">AI will crawl and analyze the page</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Screenshot (alternative)</Label>
              <BasicFileUpload
                label=""
                onFileSelect={handleScreenshot}
                disabled={isRunning}
                accept=".png,.jpg,.jpeg,.webp"
                maxSizeMB={10}
              />
              {screenshotName && isImageLoading && (
                <div className="flex items-center gap-2 text-sm text-amber-400 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing image...
                </div>
              )}
              {screenshotName && screenshot && !isImageLoading && (
                <div className="flex items-center gap-2 text-sm text-green-400 mt-2">
                  <LucideImage className="h-4 w-4" /> {screenshotName}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Goal</Label>
              <div className="flex flex-wrap gap-2">
                {goalOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => setTargetGoal(g)}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${targetGoal === g ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                  >
                    {goalLabels[g]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. SaaS founders, e-commerce shoppers, B2B buyers"
                disabled={isRunning}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!canRun}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Analyzing landing page..." : "Analyze Landing Page"}
          </Button>
          {!hasInput && (
            <p className="text-xs text-gray-500">Provide a URL or upload a screenshot to begin analysis</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {stickyScreenshot && (
            <div className="sticky top-4 z-10 mb-6">
              <div className="inline-flex items-center gap-3 rounded-xl border border-gray-700 bg-black/90 backdrop-blur px-4 py-2">
                <img src={stickyScreenshot} alt="Screenshot" className="h-12 w-auto rounded-lg object-contain border border-gray-700" />
                <span className="text-xs text-gray-400">Screenshot preserved for iterations</span>
                <button onClick={() => setStickyScreenshot(null)} className="text-gray-500 hover:text-white ml-2">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Critique Results</h3>
              </div>
              <span className="text-xs text-gray-500">Vision + Web Search ready</span>
            </div>

            {output.overallScore !== undefined && renderScoreGauge(output.overallScore)}

            {(output.strengths?.length || output.weaknesses?.length) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {output.strengths?.length > 0 && (
                  <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-6">
                    <h4 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> What Works
                    </h4>
                    <ul className="space-y-2">
                      {output.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <ArrowRight className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {output.weaknesses?.length > 0 && (
                  <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
                    <h4 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Needs Improvement
                    </h4>
                    <ul className="space-y-2">
                      {output.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <ArrowRight className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {(output.uxAnalysis || output.conversionAnalysis) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderAnalysisSection("UX Analysis", output.uxAnalysis, <LayoutGrid className="h-5 w-5" />)}
                {renderAnalysisSection("Conversion Analysis", output.conversionAnalysis, <TrendingUp className="h-5 w-5" />)}
              </div>
            )}

            {output.specificRecommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-4 text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" /> Actionable Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {output.specificRecommendations.map((rec: string, i: number) => (
                    <div key={i} className="rounded-xl border border-gray-800 bg-black p-5 hover:border-primary-600 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 text-sm font-semibold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-300 leading-relaxed">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {output.abTestIdeas?.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-4 text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" /> A/B Test Ideas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {output.abTestIdeas.map((idea: string, i: number) => (
                    <div key={i} className="rounded-xl border border-gray-700 bg-black/50 p-4 hover:border-amber-600 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Test {i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{idea}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Quick Iterate</span>
              <span className="text-xs text-gray-500 ml-auto">Multi-turn context preserved</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickIterateOptions.map((inst, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickIterate(inst)}
                  disabled={isRunning}
                  className="border-gray-700 hover:bg-primary-950 text-xs"
                >
                  {inst}
                </Button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Input
                value={iterationPrompt}
                onChange={(e) => setIterationPrompt(e.target.value)}
                placeholder="Custom feedback instruction (e.g. 'focus on trust signals and social proof')"
                disabled={isRunning}
                className="flex-1 bg-black border-gray-700 text-white"
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

LandingPageCriticAI.displayName = "LandingPageCriticAI";