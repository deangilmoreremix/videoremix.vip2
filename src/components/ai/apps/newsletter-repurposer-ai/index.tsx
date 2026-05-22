/**
 * Newsletter Repurposer AI — Production UI
 * New VideoRemix Name: Newsletter Repurposer AI
 * Repurposes long-form newsletter/Substack content into bite-size social assets.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Mail, Hash, Linkedin, FileText, Share2, Megaphone } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

const GOALS = [
  { id: "tweet", label: "Tweet", icon: Hash },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "blog", label: "Blog Excerpt", icon: FileText },
  { id: "email", label: "Email Promotion", icon: Mail },
  { id: "ad", label: "Ad Copy", icon: Megaphone },
  { id: "thread", label: "Thread Version", icon: Share2 },
];

export default function NewsletterRepurposerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [newsletterText, setNewsletterText] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["tweet", "linkedin", "thread"]);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const handleRun = async () => {
    if (!newsletterText.trim()) return;
    const inputs = {
      newsletterText: newsletterText.trim(),
      primaryGoals: selectedGoals.join(","),
    };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Mail className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">
        Turn your newsletter or Substack post into bite-size content for every platform.
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea
            label="Newsletter or Substack Text"
            placeholder="Paste your full newsletter or Substack article here..."
            value={newsletterText}
            onChange={setNewsletterText}
            disabled={isRunning}
            maxLength={10000}
            rows={12}
            hint="Paste the complete newsletter content for best results."
          />

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">Primary Goals</Label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(({ id, label, icon: Icon }) => {
                const isSelected = selectedGoals.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleGoal(id)}
                    disabled={isRunning}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-[#0f0f0f] border border-gray-700 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!newsletterText.trim() || selectedGoals.length === 0 || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Repurposing your content..." : "Run Newsletter Repurposer AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <NewsletterResult output={output} />
          <ResultActions onNew={() => reset()} newLabel="New Run" />
        </div>
      )}
    </div>
  );
}

function NewsletterResult({ output }: { output: Record<string, any> }) {
  const { keyInsights, repurposed, threadVersion, linkedInCarousel, blogPostTitle, blogPostOutline, promotionEmail } = output;

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      {keyInsights && keyInsights.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
          <ol className="space-y-3">
            {keyInsights.map((insight: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-gray-200">{insight}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Repurposed Assets */}
      {repurposed && repurposed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Repurposed Assets</h3>
          {repurposed.map((asset: { type: string; content: string; engagementHook?: string }, i: number) => {
            const Icon = GOALS.find((g) => g.id === asset.type)?.icon || FileText;
            return (
              <div key={i} className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5 text-primary-400" />
                  <span className="font-semibold capitalize text-primary-400">
                    {asset.type}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed mb-3">
                  {asset.content}
                </p>
                {asset.engagementHook && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Engagement Hook:</span>
                    <span className="text-sm text-primary-300">{asset.engagementHook}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Thread Version */}
      {threadVersion && (
        <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Thread Version</h3>
          </div>
          <div className="space-y-4">
            {threadVersion.split("\n").filter(Boolean).map((tweet: string, i: number) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-gray-300">
                  {i + 1}
                </span>
                <p className="text-gray-200 text-sm leading-relaxed">{tweet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn Carousel */}
      {linkedInCarousel && linkedInCarousel.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">LinkedIn Carousel</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedInCarousel.map((slide: { title?: string; content: string }, i: number) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {slide.title && (
                    <span className="font-semibold text-primary-400">{slide.title}</span>
                  )}
                </div>
                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {slide.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blog Post */}
      {(blogPostTitle || blogPostOutline) && (
        <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Blog Post</h3>
          </div>
          {blogPostTitle && (
            <h4 className="text-xl font-semibold text-primary-300 mb-4">{blogPostTitle}</h4>
          )}
          {blogPostOutline && (
            <div className="space-y-2">
              {blogPostOutline.split("\n").filter(Boolean).map((line: string, i: number) => (
                <p key={i} className="text-gray-300 text-sm pl-4 border-l-2 border-primary-600">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promotion Email */}
      {promotionEmail && (
        <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Promotion Email</h3>
          </div>
          {promotionEmail.subject && (
            <div className="mb-4">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Subject:</span>
              <p className="text-lg font-semibold text-primary-300 mt-1">{promotionEmail.subject}</p>
            </div>
          )}
          {promotionEmail.body && (
            <div className="bg-black rounded-lg p-4">
              <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                {promotionEmail.body}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}