import React, { useState, useEffect } from "react";
import { Compass, Users, Play, Loader2, Lightbulb, ArrowRight, RefreshCw, LayoutGrid, Zap, Target, Eye } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function AIUXDesigner({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [productConcept, setProductConcept] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [primaryUseCase, setPrimaryUseCase] = useState("");
  const [constraints, setConstraints] = useState("");
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
    "Focus on mobile-first flows",
    "Add accessibility features",
    "Simplify the user journey",
    "Add offline support considerations",
    "Focus on power users",
    "Simplify onboarding flow",
  ];

  const buildInputs = (extra?: Record<string, unknown>) => {
    const inputs: Record<string, unknown> = {
      productConcept: productConcept.trim(),
      targetUsers: targetUsers.trim(),
      primaryUseCase: primaryUseCase.trim(),
    };
    if (constraints.trim()) {
      inputs.constraints = constraints.trim();
    }
    if (extra) {
      Object.assign(inputs, extra);
    }
    return inputs;
  };

  const handleRun = async () => {
    if (!productConcept.trim() || !targetUsers.trim()) return;
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
    setProductConcept("");
    setTargetUsers("");
    setPrimaryUseCase("");
    setConstraints("");
    setIterationPrompt("");
    setLastInputs(null);
    clearHistory();
    reset();
  };

  const renderSection = (title: string, content: unknown, icon: React.ReactNode) => {
    if (!content) return null;
    return (
      <div className="rounded-xl border border-gray-800 bg-black/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-primary-400">{icon}</span>
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
                {typeof item === "string" ? item : typeof item === "object" ? (item as Record<string, unknown>).name || (item as Record<string, unknown>).title || JSON.stringify(item) : String(item)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canRun = productConcept.trim().length > 0 && targetUsers.trim().length > 0 && !isRunning;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Compass className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Design user experiences, wireframes, and flows. AI analyzes your product concept and target users to create actionable UX recommendations.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Product Concept *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. A project management tool for remote design teams to coordinate tasks, share files, and track progress across time zones"
              value={productConcept}
              onChange={setProductConcept}
              disabled={isRunning}
              maxLength={1500}
              rows={4}
              hint="Describe what the product does and who it's for"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Users *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Remote design teams of 5-15 people, including project managers, designers, and creative directors"
              value={targetUsers}
              onChange={setTargetUsers}
              disabled={isRunning}
              maxLength={800}
              rows={3}
              hint="Who will use this product?"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Primary Use Case *</Label>
            <Input
              value={primaryUseCase}
              onChange={(e) => setPrimaryUseCase(e.target.value)}
              placeholder="e.g. Daily task management, async design reviews, client feedback collection"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Constraints (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Must work on mobile, needs to integrate with Figma, requires offline mode, HIPAA compliant..."
              value={constraints}
              onChange={setConstraints}
              disabled={isRunning}
              maxLength={600}
              rows={2}
              hint="Any platform, technology, or regulatory requirements?"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!canRun}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating UX design..." : "Design UX"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Compass className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">UX Design Output</h3>
              </div>
              <span className="text-xs text-gray-500">Web Search + multi-turn ready</span>
            </div>

            {output.userFlow && renderSection("User Flow", output.userFlow, <Target className="h-5 w-5" />)}
            {output.wireframeDescription && renderSection("Wireframe Description", output.wireframeDescription, <LayoutGrid className="h-5 w-5" />)}
            {output.interactionPatterns && renderSection("Interaction Patterns", output.interactionPatterns, <Zap className="h-5 w-5" />)}
            {output.informationArchitecture && renderSection("Information Architecture", output.informationArchitecture, <LayoutGrid className="h-5 w-5" />)}
            {output.userJourneyMap && renderSection("User Journey Map", output.userJourneyMap, <Users className="h-5 w-5" />)}
            {output.painPoints && renderList("Pain Points Solved", output.painPoints, <Lightbulb className="h-5 w-5" />, "text-amber-400")}
            {output.uxRecommendations && renderList("UX Recommendations", output.uxRecommendations, <ArrowRight className="h-5 w-5" />, "text-primary-400")}
            {output.accessibilityRequirements && renderSection("Accessibility", output.accessibilityRequirements, <Eye className="h-5 w-5" />)}

            {output && !output.userFlow && !output.wireframeDescription && (
              <div className="text-sm text-gray-400 bg-black/50 p-8 rounded-xl border border-gray-800">
                <pre className="whitespace-pre-wrap text-xs text-gray-500">{JSON.stringify(output, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Zap className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on this design</span>
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
                placeholder="Custom refinement (e.g. 'focus on reducing friction in the onboarding flow')"
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

          <ResultActions onNew={handleReset} newLabel="New Design" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}

AIUXDesigner.displayName = "AIUXDesigner";