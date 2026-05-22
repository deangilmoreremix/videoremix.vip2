/**
 * YouTube Repurposer AI — Production UI
 * New VideoRemix Name: YouTube Repurposer AI
 * Turn video transcript or description into 5+ repurposed assets for social, email, blog, and shorts.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Youtube } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

interface Asset {
  format: string;
  title: string;
  content: string;
  cta?: string;
  charCount?: number;
}

interface ShortsIdea {
  timestamp: string;
  hook: string;
}

interface OutputShape {
  summary?: string;
  assets?: Asset[];
  shortsIdeas?: ShortsIdea[];
  blogOutline?: string;
  emailSubjectLines?: string[];
  crossPostTips?: string[];
}

const FORMAT_OPTIONS = [
  "Twitter/X Thread",
  "LinkedIn Post",
  "Blog Article",
  "Email Newsletter",
  "Shorts Script",
  "Instagram Caption",
];

const TONE_OPTIONS = ["Professional", "Casual", "Inspirational", "Humorous", "Educational"];

function formatBadgeColor(format: string): string {
  if (format.includes("Twitter")) return "bg-blue-600";
  if (format.includes("LinkedIn")) return "bg-sky-700";
  if (format.includes("Blog")) return "bg-emerald-700";
  if (format.includes("Email")) return "bg-violet-700";
  if (format.includes("Shorts")) return "bg-rose-700";
  if (format.includes("Instagram")) return "bg-pink-700";
  return "bg-gray-700";
}

export default function YouTubeRepurposerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [transcript, setTranscript] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["Twitter/X Thread", "LinkedIn Post"]);
  const [selectedTone, setSelectedTone] = useState("Professional");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const handleRun = async () => {
    if (!transcript.trim() || selectedFormats.length === 0) return;
    const inputs = {
      transcript: transcript.trim(),
      targetFormats: selectedFormats.join(","),
      tone: selectedTone,
    };
    await run(inputs);
  };

  const typedOutput = output as OutputShape | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Youtube className="h-7 w-7 text-red-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Transform any YouTube video into 5+ optimized assets — threads, posts, emails, blogs, and shorts.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          {/* Transcript textarea */}
          <PromptTextarea
            label="Video Transcript or Description"
            placeholder="Paste your YouTube video transcript or description here..."
            value={transcript}
            onChange={setTranscript}
            disabled={isRunning}
            maxLength={10000}
            rows={10}
            hint="Include the full transcript or a detailed video description for best results."
          />

          {/* Target formats */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-3 block">Target Formats</Label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(format => {
                const isSelected = selectedFormats.includes(format);
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    disabled={isRunning}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all border
                      ${isSelected
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-black text-gray-400 border-gray-700 hover:border-gray-500"
                      }
                      disabled:opacity-50
                    `}
                  >
                    {format}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {selectedFormats.length === 0 ? "Select at least one format" : `${selectedFormats.length} format${selectedFormats.length > 1 ? "s" : ""} selected`}
            </p>
          </div>

          {/* Tone */}
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Tone</Label>
            <select
              value={selectedTone}
              onChange={e => setSelectedTone(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2.5 text-white md:w-64"
            >
              {TONE_OPTIONS.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleRun}
            disabled={!transcript.trim() || selectedFormats.length === 0 || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Repurposing your video content..." : "Run YouTube Repurposer AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary card */}
          {typedOutput?.summary && (
            <div className="rounded-xl border border-yellow-600/30 bg-yellow-900/10 p-6">
              <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">Key Insights Summary</h3>
              <p className="text-gray-200 leading-relaxed">{typedOutput.summary}</p>
            </div>
          )}

          {/* Assets */}
          {typedOutput?.assets && typedOutput.assets.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Repurposed Assets</h3>
              <div className="space-y-4">
                {typedOutput.assets.map((asset, i) => (
                  <div key={i} className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${formatBadgeColor(asset.format)}`}>
                        {asset.format}
                      </span>
                      {asset.charCount && (
                        <span className="text-xs text-gray-500">{asset.charCount} chars</span>
                      )}
                    </div>
                    {asset.title && (
                      <h4 className="text-base font-semibold text-primary-400 mb-2">{asset.title}</h4>
                    )}
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{asset.content}</p>
                    {asset.cta && (
                      <div className="mt-3 inline-block rounded bg-primary-900/40 px-3 py-1 text-xs text-primary-300 border border-primary-700/50">
                        CTA: {asset.cta}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shorts Ideas */}
          {typedOutput?.shortsIdeas && typedOutput.shortsIdeas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Shorts Ideas</h3>
              <div className="space-y-3">
                {typedOutput.shortsIdeas.map((idea, i) => (
                  <div key={i} className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-4 flex gap-4">
                    <span className="text-2xl font-bold text-primary-500">{i + 1}</span>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-900/40 text-rose-400 text-xs font-mono mb-2">
                        Hook {idea.timestamp}
                      </span>
                      <p className="text-gray-200 text-sm leading-relaxed">{idea.hook}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blog Outline */}
          {typedOutput?.blogOutline && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Blog Article Outline</h3>
              <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-5">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{typedOutput.blogOutline}</pre>
              </div>
            </div>
          )}

          {/* Email Subject Lines */}
          {typedOutput?.emailSubjectLines && typedOutput.emailSubjectLines.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Email Subject Lines</h3>
              <ol className="space-y-2">
                {typedOutput.emailSubjectLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-[#0a0a0a] p-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-900/60 text-violet-300 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-200 text-sm">{line}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Cross-Post Tips */}
          {typedOutput?.crossPostTips && typedOutput.crossPostTips.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Cross-Post Tips</h3>
              <ul className="space-y-2">
                {typedOutput.crossPostTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-[#0a0a0a] p-4">
                    <span className="flex-shrink-0 text-primary-500 mt-0.5">•</span>
                    <span className="text-gray-300 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ResultActions onNew={() => reset()} newLabel="New Run" />
        </div>
      )}
    </div>
  );
}