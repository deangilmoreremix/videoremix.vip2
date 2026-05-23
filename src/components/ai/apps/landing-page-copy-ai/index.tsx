import React, { useState, useEffect } from "react";
import { FileText, Users, Play, Loader2, ArrowRight, RefreshCw, Zap, Star, MessageSquare, Search } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function LandingPageCopyAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [productService, setProductService] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [uniqueValueProp, setUniqueValueProp] = useState("");
  const [conversionGoal, setConversionGoal] = useState<"signup" | "purchase" | "contact">("signup");
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

  const goalLabels: Record<typeof conversionGoal, string> = {
    signup: "Sign Up (Account Creation)",
    purchase: "Purchase (E-commerce)",
    contact: "Contact / Demo Request",
  };

  const quickIterateOptions = [
    "Make it more persuasive",
    "Add urgency elements",
    "Focus on social proof",
    "Stronger headline",
    "Alternative CTA copy",
    "Add FAQ section",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      productService: productService.trim(),
      targetAudience: targetAudience.trim(),
      uniqueValueProp: uniqueValueProp.trim(),
      conversionGoal,
    };
    if (extra) Object.assign(inputs, extra);
    return inputs;
  };

  const handleRun = async () => {
    if (!productService.trim() || !targetAudience.trim() || !uniqueValueProp.trim()) return;
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
    setProductService("");
    setTargetAudience("");
    setUniqueValueProp("");
    setConversionGoal("signup");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const renderText = (title: string, content: unknown, icon: React.ReactNode, colorClass: string) => {
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
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).text || (item as Record<string, unknown>).statement || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canRun = productService.trim().length > 0 && targetAudience.trim().length > 0 && uniqueValueProp.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FileText className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Write high-converting landing page copy. AI analyzes your product, audience, and value proposition to generate compelling headlines, CTAs, and social proof.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Product or Service *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. An AI-powered project management tool that helps remote teams coordinate tasks and reduce meetings by 50%"
              value={productService}
              onChange={setProductService}
              disabled={isRunning}
              maxLength={1000}
              rows={4}
              hint="Describe what you're selling and what makes it unique"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Project managers and team leads at tech startups (10-100 employees) who feel overwhelmed by status meetings and async communication"
              value={targetAudience}
              onChange={setTargetAudience}
              disabled={isRunning}
              maxLength={600}
              rows={3}
              hint="Who is most likely to convert?"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Unique Value Proposition *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. The first PM tool that actually reduces meeting time through AI-powered async standups and smart task prioritization"
              value={uniqueValueProp}
              onChange={setUniqueValueProp}
              disabled={isRunning}
              maxLength={600}
              rows={3}
              hint="What makes you different from alternatives?"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Conversion Goal</Label>
            <div className="flex flex-wrap gap-2">
              {(["signup", "purchase", "contact"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setConversionGoal(g)}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${conversionGoal === g ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                >
                  {goalLabels[g]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleRun} disabled={!canRun} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Writing copy..." : "Write Landing Page Copy"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Copy Output</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.headline && renderText("Main Headline", output.headline, <Star className="h-5 w-5" />, "text-yellow-400")}
            {output.subheadline && renderText("Subheadline", output.subheadline, <FileText className="h-5 w-5" />, "text-gray-400")}
            {output.heroCopy && renderText("Hero Copy", output.heroCopy, <MessageSquare className="h-5 w-5" />, "text-primary-400")}
            {output.benefitStatements && renderList("Benefit Statements", output.benefitStatements, <ArrowRight className="h-5 w-5" />, "text-green-400")}
            {output.socialProof && renderList("Social Proof Templates", output.socialProof, <Users className="h-5 w-5" />, "text-blue-400")}

            {output.ctaCopy && (
              <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-yellow-400" />
                  <h4 className="font-semibold text-yellow-400 text-lg">CTA Variations</h4>
                </div>
                <div className="space-y-3">
                  {Array.isArray(output.ctaCopy) ? output.ctaCopy.map((cta: unknown, i: number) => (
                    <div key={i} className="bg-black/50 rounded-lg p-4 border border-gray-800">
                      <span className="text-xs text-gray-500 block mb-1">Variant {i + 1}</span>
                      <span className="text-sm text-gray-200">{typeof cta === "string" ? cta : typeof cta === "object" ? (cta as Record<string, unknown>).text || (cta as Record<string, unknown>).copy || JSON.stringify(cta) : String(cta)}</span>
                    </div>
                  )) : (
                    <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
                      <span className="text-sm text-gray-200">{typeof output.ctaCopy === "string" ? output.ctaCopy : JSON.stringify(output.ctaCopy)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {output.trustSignals && renderList("Trust Signals", output.trustSignals, <Star className="h-5 w-5" />, "text-amber-400")}
            {output.seoMeta && (
              <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-5 w-5 text-primary-400" />
                  <h4 className="font-semibold text-white text-lg">SEO Meta</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Title:</span> <span className="text-gray-300">{typeof output.seoMeta === "object" ? (output.seoMeta as Record<string, unknown>).title : ""}</span></div>
                  <div><span className="text-gray-500">Description:</span> <span className="text-gray-300">{typeof output.seoMeta === "object" ? (output.seoMeta as Record<string, unknown>).description : ""}</span></div>
                </div>
              </div>
            )}

            {output && !output.headline && (
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
                placeholder="Custom refinement (e.g. 'make the CTA more urgent, add a limited time offer')"
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

          <ResultActions onNew={handleReset} newLabel="New Copy" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

LandingPageCopyAI.displayName = "LandingPageCopyAI";