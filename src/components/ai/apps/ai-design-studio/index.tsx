/**
 * AI Design Studio — Production UI
 * New VideoRemix Name: AI Design Studio
 */

import React, { useState, useEffect } from "react";
import { Palette, Image as LucideImage, Play, Loader2, Wand2 } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";

export default function AIDesignStudio({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [designGoal, setDesignGoal] = useState("");
  const [style, setStyle] = useState<"modern" | "minimalist" | "bold" | "playful">("modern");
  const [targetPlatform, setTargetPlatform] = useState<"web" | "mobile" | "both">("web");
  const [colorPreference, setColorPreference] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [refImageName, setRefImageName] = useState<string | null>(null);
  const [iterationPrompt, setIterationPrompt] = useState("");
  const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);
  // isImageLoading guards against race condition: FileReader.readAsDataURL is async;
  // prevents Run button from being enabled (and clicked) before base64 referenceImage is populated in buildInputs.
  const [isImageLoading, setIsImageLoading] = useState(false);

  const { run, isRunning, output, reset, clearHistory } = useRunAIApp(appId, { 
    enableMultiTurn: true, 
    onResult, 
    onError, 
    onReset 
  });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const styleOptions = ["modern", "minimalist", "bold", "playful"] as const;
  const platformOptions = ["web", "mobile", "both"] as const;
  const colorSuggestions = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "monochrome", "pastel", "earth tones", "vibrant"];

  const handleReferenceImage = (file: File | null, _content?: string) => {
    if (file) {
      setRefImageName(file.name);
      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setReferenceImage(dataUrl);
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        setIsImageLoading(false);
        setRefImageName(null);
        setReferenceImage(null);
      };
      reader.readAsDataURL(file);
    } else {
      setRefImageName(null);
      setReferenceImage(null);
      setIsImageLoading(false);
    }
  };

  const buildInputs = (goal: string, extra?: Record<string, unknown>) => ({
    designGoal: goal.trim(),
    style,
    targetPlatform,
    colorPreference: colorPreference.trim() || "balanced modern palette with good contrast",
    ...(referenceImage ? { referenceImage } : {}),
    ...extra,
  });

  const handleRun = async () => {
    if (!designGoal.trim()) return;
    // Race closed: button is disabled while isImageLoading, so referenceImage (if any) is guaranteed to be set before buildInputs runs.
    const inputs = buildInputs(designGoal);
    setLastInputs(inputs);
    await run(inputs);
  };

  const handleQuickIterate = async (instruction: string) => {
    const base = lastInputs || buildInputs(designGoal || "Refine the previous design concept");
    const iterInputs = { ...base, designGoal: instruction, refinementRequest: instruction };
    setLastInputs(iterInputs as Record<string, unknown>);
    await run(iterInputs);
  };

  const handleCustomIterate = async () => {
    if (!iterationPrompt.trim()) return;
    const base = lastInputs || buildInputs(designGoal || "Apply refinement");
    const iterInputs = { ...base, designGoal: iterationPrompt.trim(), refinementRequest: iterationPrompt.trim() };
    setLastInputs(iterInputs as Record<string, unknown>);
    setIterationPrompt("");
    await run(iterInputs);
  };

  const handleReset = () => {
    clearHistory();
    reset();
  };

  const handleClearAll = () => {
    setDesignGoal("");
    setStyle("modern");
    setTargetPlatform("web");
    setColorPreference("");
    setReferenceImage(null);
    setRefImageName(null);
    setIterationPrompt("");
    setLastInputs(null);
    setIsImageLoading(false);
    clearHistory();
    reset();
  };

  const renderColorPalette = (palette: unknown) => {
    if (!palette) return null;
    let colors: Array<{ hex: string; usage?: string }> = [];
    if (Array.isArray(palette)) {
      colors = palette.map((c: unknown) => (typeof c === "string" ? { hex: c } : (c as { hex?: string; usage?: string })));
    } else if (typeof palette === "object") {
      colors = Object.entries(palette).map(([name, hex]) => ({ hex: String(hex), usage: name }));
    } else if (typeof palette === "string") {
      const matches = palette.match(/#[0-9a-fA-F]{6}/g) || [];
      colors = matches.map((h) => ({ hex: h }));
    }
    if (colors.length === 0) return <div className="text-gray-400 text-sm">{JSON.stringify(palette)}</div>;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {colors.slice(0, 6).map((c, i) => (
          <div key={i} className="group">
            <div
              className="w-full h-14 rounded-xl border border-gray-700 shadow-inner cursor-pointer transition-transform group-hover:scale-105"
              style={{ backgroundColor: c.hex }}
              onClick={() => navigator.clipboard.writeText(c.hex)}
              title={`Copy ${c.hex}`}
            />
            <div className="mt-1.5 text-[10px] font-mono text-gray-400 truncate">{c.hex}</div>
            {c.usage && <div className="text-[10px] text-gray-500 truncate">{c.usage}</div>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Palette className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Create stunning UI/UX designs, color systems, and component libraries. Upload reference images for moodboards or existing UIs. Supports multi-turn iteration ("more minimalist", "variations").</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Design Goal *</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. Design a clean investment dashboard for fintech SaaS users to track portfolios and receive AI insights"
              value={designGoal}
              onChange={setDesignGoal}
              disabled={isRunning}
              maxLength={2000}
              rows={5}
              hint="Describe the product, users, key screens and flows"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Visual Style</Label>
              <div className="flex flex-wrap gap-2">
                {styleOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${style === s ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Platform</Label>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTargetPlatform(p)}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${targetPlatform === p ? "bg-primary-600 text-white border-primary-500" : "bg-black border-gray-700 text-gray-300 hover:border-gray-500"}`}
                  >
                    {p === "web" ? "Web" : p === "mobile" ? "Mobile" : "Web + Mobile"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Color Preference</Label>
            <Input
              value={colorPreference}
              onChange={(e) => setColorPreference(e.target.value)}
              placeholder="deep blues with energetic orange accents or 'soft pastels, high contrast'"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {colorSuggestions.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setColorPreference(c)}
                  disabled={isRunning}
                  className="text-xs px-3 py-1 rounded-full border border-gray-700 hover:border-primary-500 text-gray-400 hover:text-white"
                  style={c.startsWith("#") ? { backgroundColor: c + "20", borderColor: c } : {}}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <BasicFileUpload
            label="Optional Reference Image (screenshot, moodboard, wireframe, existing UI)"
            onFileSelect={handleReferenceImage}
            disabled={isRunning}
            accept=".png,.jpg,.jpeg,.webp,.gif"
            maxSizeMB={5}
          />
          {refImageName && isImageLoading && (
            <div className="flex items-center gap-3 text-sm text-amber-400 -mt-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing image for vision...
            </div>
          )}
          {refImageName && referenceImage && !isImageLoading && (
            <div className="flex items-center gap-3 text-sm text-green-400 -mt-2">
              <LucideImage className="h-4 w-4" /> {refImageName} — will be analyzed via vision
            </div>
          )}

          <Button
            onClick={handleRun}
            disabled={!designGoal.trim() || isRunning || isImageLoading}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Generating design concepts with vision..." : "Run AI Design Studio"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 text-primary-500" />
                <h3 className="text-2xl font-semibold text-white">Design Output</h3>
              </div>
              <div className="text-xs text-gray-500">Vision + multi-turn ready</div>
            </div>

            <div>
              <h4 className="font-semibold text-primary-400 mb-2 text-lg">Design Concept</h4>
              <p className="text-lg leading-relaxed text-gray-200">{output.designConcept || output.concept || JSON.stringify(output)}</p>
            </div>

            {(output.colorPalette || output.colors || output.color) && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-4 text-lg flex items-center gap-2">Color Palette</h4>
                {renderColorPalette(output.colorPalette || output.colors || output.color)}
              </div>
            )}

            {output.typography && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-3 text-lg">Typography</h4>
                <div className="text-sm text-gray-200 bg-black/50 p-5 rounded-xl border border-gray-800 whitespace-pre-wrap">
                  {typeof output.typography === "string" ? output.typography : JSON.stringify(output.typography, null, 2)}
                </div>
              </div>
            )}

            {output.componentIdeas && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-4 text-lg">Component Ideas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Array.isArray(output.componentIdeas) ? output.componentIdeas : [output.componentIdeas]).map((idea: unknown, idx: number) => (
                    <div key={idx} className="rounded-xl border border-gray-700 bg-black p-5 hover:border-primary-600 transition-colors">
                      <div className="font-medium text-white mb-2 text-sm">{typeof idea === "string" ? idea.substring(0, 60) : idea.name || `Idea ${idx + 1}`}</div>
                      <div className="text-xs text-gray-300">{typeof idea === "string" ? idea : idea.description || JSON.stringify(idea)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {output.layoutSuggestions && (
              <div>
                <h4 className="font-semibold text-primary-400 mb-3 text-lg">Layout Suggestions</h4>
                <div className="text-sm text-gray-200 bg-black/50 p-5 rounded-xl border border-gray-800">
                  {typeof output.layoutSuggestions === "string" ? output.layoutSuggestions : JSON.stringify(output.layoutSuggestions, null, 2)}
                </div>
              </div>
            )}

            {(output.accessibilityNotes || output.implementationTips) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                {output.accessibilityNotes && (
                  <div>
                    <h4 className="font-semibold text-primary-400 mb-2">Accessibility</h4>
                    <p className="text-sm text-gray-300">{output.accessibilityNotes}</p>
                  </div>
                )}
                {output.implementationTips && (
                  <div>
                    <h4 className="font-semibold text-primary-400 mb-2">Implementation Tips</h4>
                    <p className="text-sm text-gray-300">{output.implementationTips}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary-400">
              <Wand2 className="h-5 w-5" />
              <span className="font-semibold text-white">Iterate on this design</span>
              <span className="text-xs text-gray-500 ml-auto">Multi-turn context preserved (incl. reference image)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Make it more minimalist", "Switch to bold style", "Generate 3 variations", "Refine colors & typography", "Mobile-first adjustments", "Increase whitespace & elegance"].map((inst, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => handleQuickIterate(inst)} disabled={isRunning} className="border-gray-700 hover:bg-primary-950 text-xs">
                  {inst}
                </Button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <PromptTextarea
                label=""
                placeholder="Custom refinement instruction (e.g. 'make the hero section more impactful and use deeper navy tones')"
                value={iterationPrompt}
                onChange={setIterationPrompt}
                disabled={isRunning}
                rows={2}
                maxLength={600}
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

AIDesignStudio.displayName = "AIDesignStudio";
