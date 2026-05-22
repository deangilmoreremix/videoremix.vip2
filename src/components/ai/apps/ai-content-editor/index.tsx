/**
 * AI Content Editor — Production UI
 * New VideoRemix Name: AI Content Editor
 * World-class copy editing and conversion optimization powered by AI.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Edit3, TrendingUp, Lightbulb, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

type EditGoal = "shorten" | "expand" | "persuasive" | "clarify" | "grammar" | "tone";
type ToneOption = "Professional" | "Casual" | "Friendly" | "Witty" | "Direct";

interface ChangeLogItem {
  before: string;
  after: string;
  rationale: string;
}

interface OutputShape {
  editedContent: string;
  changeLog: ChangeLogItem[];
  readabilityScore: number;
  conversionTips: string[];
  wordCountBeforeAfter: { before: number; after: number };
}

const EDIT_GOALS: { id: EditGoal; label: string; icon: React.ReactNode }[] = [
  { id: "shorten", label: "Shorten", icon: null },
  { id: "expand", label: "Expand", icon: null },
  { id: "persuasive", label: "Make More Persuasive", icon: null },
  { id: "clarify", label: "Improve Clarity", icon: null },
  { id: "grammar", label: "Fix Grammar", icon: null },
  { id: "tone", label: "Change Tone →", icon: null },
];

const TONE_OPTIONS: ToneOption[] = ["Professional", "Casual", "Friendly", "Witty", "Direct"];

export default function AIContentEditor({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [originalContent, setOriginalContent] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<Set<EditGoal>>(new Set(["clarify"]));
  const [toneOption, setToneOption] = useState<ToneOption>("Professional");
  const showToneSelect = selectedGoals.has("tone");
  const [targetAudience, setTargetAudience] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const toggleGoal = (goal: EditGoal) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goal)) next.delete(goal);
      else next.add(goal);
      return next;
    });
  };

  const compileInstructions = (): string => {
    const parts: string[] = [];

    if (selectedGoals.has("shorten")) parts.push("Shorten the content");
    if (selectedGoals.has("expand")) parts.push("Expand and elaborate on the content");
    if (selectedGoals.has("persuasive")) parts.push("Make the content more persuasive");
    if (selectedGoals.has("clarify")) parts.push("Improve clarity and readability");
    if (selectedGoals.has("grammar")) parts.push("Fix grammar and spelling errors");
    if (selectedGoals.has("tone")) parts.push(`Change tone to ${toneOption}`);

    const base = parts.join("; ") || "Improve the content";
    if (additionalInstructions.trim()) {
      return `${base}. Additional instructions: ${additionalInstructions.trim()}`;
    }
    return base;
  };

  const handleRun = async () => {
    if (!originalContent.trim()) return;
    const inputs = {
      originalContent: originalContent.trim(),
      editInstructions: compileInstructions(),
      targetAudience: targetAudience.trim() || undefined,
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setOriginalContent("");
    setSelectedGoals(new Set(["clarify"]));
    setToneOption("Professional");
    setTargetAudience("");
    setAdditionalInstructions("");
    reset();
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const scoreBg = (score: number) => {
    if (score >= 8) return "bg-green-500/20 border-green-500/40";
    if (score >= 5) return "bg-yellow-500/20 border-yellow-500/40";
    return "bg-red-500/20 border-red-500/40";
  };

  const wordDelta = output?.wordCountBeforeAfter
    ? output.wordCountBeforeAfter.after - output.wordCountBeforeAfter.before
    : 0;
  const wordDeltaPercent = output?.wordCountBeforeAfter?.before
    ? Math.round((wordDelta / output.wordCountBeforeAfter.before) * 100)
    : 0;

  const isFormValid = originalContent.trim().length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Edit3 className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">
        Paste your content, choose your edit goals, and let AI Content Editor polish it to perfection — with a full change log so you learn as you go.
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          {/* Original Content */}
          <PromptTextarea
            label="Original Content"
            placeholder="Paste or type your content here..."
            value={originalContent}
            onChange={setOriginalContent}
            disabled={isRunning}
            maxLength={10000}
            rows={10}
            hint="The more complete your original content, the better the AI can understand context and make meaningful improvements."
          />

          {/* Edit Goals */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">
              What would you like to do?
            </Label>
            <div className="flex flex-wrap gap-2">
              {EDIT_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  disabled={isRunning}
                  aria-pressed={selectedGoals.has(goal.id)}
                  className={`
                    inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all
                    ${selectedGoals.has(goal.id)
                      ? "border-primary-500 bg-primary-500/20 text-primary-300"
                      : "border-gray-700 bg-black text-gray-300 hover:border-gray-500 hover:text-white"
                    }
                    ${isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {goal.icon}
                  {goal.label}
                </button>
              ))}
            </div>

            {/* Tone select — shown when "Change Tone" is selected */}
            {showToneSelect && (
              <div className="mt-3">
                <Label className="text-sm font-medium text-gray-300 mb-2 block" htmlFor="tone-select">
                  Select Tone
                </Label>
                <select
                  id="tone-select"
                  value={toneOption}
                  onChange={(e) => setToneOption(e.target.value as ToneOption)}
                  disabled={isRunning}
                  className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Audience (optional)</Label>
            <Input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. startup founders, busy executives, creative professionals"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          {/* Additional Instructions */}
          <PromptTextarea
            label="Additional Instructions (optional)"
            placeholder="e.g. Keep it under 150 words, emphasize the benefits, avoid jargon..."
            value={additionalInstructions}
            onChange={setAdditionalInstructions}
            disabled={isRunning}
            maxLength={600}
            rows={3}
          />

          <Button
            onClick={handleRun}
            disabled={!isFormValid || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Running AI Content Editor..." : "Run AI Content Editor"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom rich result rendering */}
          <div className="space-y-6">
            {/* Header with scores */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Readability Score Badge */}
              {output.readabilityScore !== undefined && (
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${scoreBg(output.readabilityScore)}`}>
                  <TrendingUp className={`h-5 w-5 ${scoreColor(output.readabilityScore)}`} />
                  <div>
                    <div className={`text-2xl font-bold ${scoreColor(output.readabilityScore)}`}>
                      {output.readabilityScore}/10
                    </div>
                    <div className="text-xs text-gray-400">Readability Score</div>
                  </div>
                </div>
              )}

              {/* Word Count Change */}
              {output.wordCountBeforeAfter && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0a0a0a] px-4 py-3">
                  <Edit3 className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-300">
                      <span className="text-gray-500">{output.wordCountBeforeAfter.before} words</span>
                      {" "}
                      <ArrowRight className="inline h-3 w-3 text-gray-500" />
                      {" "}
                      <span className="font-semibold text-white">{output.wordCountBeforeAfter.after} words</span>
                    </div>
                    <div className={`text-xs font-medium ${wordDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {wordDelta >= 0 ? "+" : ""}{wordDelta} ({wordDeltaPercent >= 0 ? "+" : ""}{wordDeltaPercent}%)
                    </div>
                  </div>
                </div>
              )}

              {/* Change Count */}
              {output.changeLog && output.changeLog.length > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0a0a0a] px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="text-lg font-semibold text-white">{output.changeLog.length}</div>
                    <div className="text-xs text-gray-400">Edits made</div>
                  </div>
                </div>
              )}
            </div>

            {/* Edited Content */}
            {output.editedContent && (
              <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Edited Content</h3>
                </div>
                <div className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed font-mono bg-black/50 rounded-lg p-4 border border-gray-800">
                  {output.editedContent}
                </div>
              </div>
            )}

            {/* Change Log */}
            {output.changeLog && output.changeLog.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="h-5 w-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-white">Change Log</h3>
                </div>
                <div className="space-y-4">
                  {output.changeLog.map((item: ChangeLogItem, i: number) => (
                    <div key={i} className="rounded-lg border border-gray-800 p-4 bg-black/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-red-400 uppercase tracking-wide mb-1">Before</div>
                          <div className="text-sm text-gray-300 italic">{item.before}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-green-400 uppercase tracking-wide mb-1">After</div>
                          <div className="text-sm text-gray-200">{item.after}</div>
                        </div>
                      </div>
                      {item.rationale && (
                        <div className="mt-3 flex items-start gap-2 rounded bg-primary-500/10 px-3 py-2 border border-primary-500/20">
                          <Lightbulb className="h-3 w-3 text-primary-400 mt-0.5 shrink-0" />
                          <div className="text-xs text-gray-300">{item.rationale}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion Tips */}
            {output.conversionTips && output.conversionTips.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Conversion Tips</h3>
                </div>
                <ul className="space-y-3">
                  {output.conversionTips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-300">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <ResultActions
            onNew={handleReset}
            newLabel="New Run"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}