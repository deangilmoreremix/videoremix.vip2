/**
 * AI News Content Writer
 * New VideoRemix Name: "AI News Content Writer"
 *
 * Creates timely, newsworthy articles from topic + angle + sources.
 * Outputs: headline, subhead, byline, leadParagraph, body (H2/H3), keyFacts, seoMeta, relatedStoryIdeas.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Clock, FileText, Lightbulb, Search, TrendingUp, BookOpen } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "./useRunAIApp";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";

const ARTICLE_LENGTHS = [
  { value: "short", label: "Short (500 words)", wordCount: 500 },
  { value: "medium", label: "Medium (700 words)", wordCount: 700 },
  { value: "long", label: "Long (900 words)", wordCount: 900 },
] as const;

const TONES = [
  { value: "breaking-news", label: "Breaking News" },
  { value: "investigative", label: "Investigative" },
  { value: "feature", label: "Feature" },
  { value: "opinion-analysis", label: "Opinion/Analysis" },
] as const;

interface SeoMeta {
  title?: string;
  desc?: string;
  keywords?: string;
}

interface NewsArticleOutput {
  headline?: string;
  subhead?: string;
  byline?: string;
  leadParagraph?: string;
  body?: string;
  keyFacts?: string[];
  seoMeta?: SeoMeta;
  relatedStoryIdeas?: string[];
}

export default function AINewsContentWriter({
  appId,
  appName,
  onResult,
  onError,
  onRunningChange,
  onReset,
}: AIAppProps) {
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [sources, setSources] = useState("");
  const [selectedLength, setSelectedLength] = useState<typeof ARTICLE_LENGTHS[number]["value"]>("medium");
  const [selectedTone, setSelectedTone] = useState<typeof TONES[number]["value"]>("feature");

  const { run, isRunning, output, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!topic.trim()) return;

    const inputs = {
      topic: topic.trim(),
      angle: angle.trim() || undefined,
      sources: sources.trim() || undefined,
      articleLength: selectedLength,
      tone: selectedTone,
    };

    await run(inputs);
  };

  const isFormValid = topic.trim().length > 0;

  const estimateReadingTime = (text: string): string => {
    if (!text) return "";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  const formatDate = (): string => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderBodyContent = (body: string) => {
    const sections: { level: number; heading: string; content: string }[] = [];
    const lines = body.split("\n");
    let currentSection: { level: number; heading: string; content: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentSection) {
          currentSection.content += "\n";
        }
        continue;
      }

      if (trimmed.startsWith("## ")) {
        if (currentSection) sections.push(currentSection);
        currentSection = { level: 2, heading: trimmed.slice(3), content: "" };
      } else if (trimmed.startsWith("### ")) {
        if (currentSection) sections.push(currentSection);
        currentSection = { level: 3, heading: trimmed.slice(4), content: "" };
      } else {
        if (currentSection) {
          currentSection.content += (currentSection.content ? "\n" : "") + trimmed;
        } else {
          currentSection = { level: 0, heading: "", content: trimmed };
        }
      }
    }
    if (currentSection) sections.push(currentSection);

    return sections.map((section, i) => {
      if (section.level === 0) {
        return (
          <p key={i} className="text-gray-300 leading-relaxed mb-4">
            {section.content}
          </p>
        );
      }
      if (section.level === 2) {
        return (
          <div key={i}>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4 flex items-center gap-2">
              <span className="text-primary-500 font-mono text-sm">##</span>
              {section.heading}
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">{section.content}</p>
          </div>
        );
      }
      if (section.level === 3) {
        return (
          <div key={i}>
            <h3 className="text-lg font-medium text-gray-200 mt-6 mb-3 flex items-center gap-2">
              <span className="text-primary-500 font-mono text-sm">###</span>
              {section.heading}
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">{section.content}</p>
          </div>
        );
      }
      return null;
    });
  };

  const renderArticleResult = (result: NewsArticleOutput) => {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          {result.headline && (
            <h1 className="text-3xl font-bold text-white leading-tight mb-3">
              {result.headline}
            </h1>
          )}
          {result.subhead && (
            <p className="text-xl text-gray-400 leading-relaxed mb-4">
              {result.subhead}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {result.byline && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                By {result.byline}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatDate()}
            </span>
            {result.body && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {estimateReadingTime(result.body)}
              </span>
            )}
          </div>
        </div>

        {/* Lead Paragraph / Standfirst */}
        {result.leadParagraph && (
          <div className="border-l-4 border-primary-500 pl-6 py-2">
            <p className="text-xl text-gray-200 leading-relaxed font-medium">
              {result.leadParagraph}
            </p>
          </div>
        )}

        {/* Body */}
        {result.body && (
          <div className="prose prose-invert prose-lg max-w-none">
            {renderBodyContent(result.body)}
          </div>
        )}

        {/* Key Facts */}
        {result.keyFacts && result.keyFacts.length > 0 && (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-amber-400">Key Facts</h3>
            </div>
            <ul className="space-y-3">
              {result.keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-900/50 text-amber-400 text-xs font-medium shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-amber-200/80 text-sm leading-relaxed">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* SEO Meta */}
        {result.seoMeta && (result.seoMeta.title || result.seoMeta.desc || result.seoMeta.keywords) && (
          <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-white">SEO Metadata</h3>
            </div>
            <div className="space-y-4">
              {result.seoMeta.title && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Title
                  </label>
                  <p className="text-gray-200 text-sm">{result.seoMeta.title}</p>
                </div>
              )}
              {result.seoMeta.desc && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Description
                  </label>
                  <p className="text-gray-300 text-sm">{result.seoMeta.desc}</p>
                </div>
              )}
              {result.seoMeta.keywords && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Keywords
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {result.seoMeta.keywords.split(",").map((keyword, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs"
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Story Ideas */}
        {result.relatedStoryIdeas && result.relatedStoryIdeas.length > 0 && (
          <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              Related Story Ideas
            </h3>
            <ul className="space-y-3">
              {result.relatedStoryIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-900 text-primary-400 text-xs font-medium shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-300 text-sm leading-relaxed">{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">{appName}</h2>
        <p className="mt-1 text-gray-400">
          Create timely, newsworthy articles with journalistic tone and SEO optimization.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-5">
        {/* News Topic */}
        <div>
          <label htmlFor="topic-input" className="mb-2 block text-sm font-medium text-gray-300">
            News Topic <span className="text-red-500">*</span>
          </label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Federal Reserve Interest Rate Decision"
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Angle / Focus */}
        <div>
          <label htmlFor="angle-input" className="mb-2 block text-sm font-medium text-gray-300">
            Angle / Focus
          </label>
          <input
            id="angle-input"
            type="text"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            placeholder="e.g., Impact on small businesses and consumers"
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Sources / References */}
        <div>
          <label htmlFor="sources-input" className="mb-2 block text-sm font-medium text-gray-300">
            Sources / References
          </label>
          <textarea
            id="sources-input"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder={"Enter sources, data points, or reference material (one per line)\ne.g., Federal Reserve Press Release, Q4 2024\nhttps://www.federalreserve.gov/..."}
            rows={4}
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Article Length & Tone Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Article Length */}
          <div>
            <label htmlFor="length-select" className="mb-2 block text-sm font-medium text-gray-300">
              Article Length
            </label>
            <select
              id="length-select"
              value={selectedLength}
              onChange={(e) => setSelectedLength(e.target.value as typeof ARTICLE_LENGTHS[number]["value"])}
              disabled={isRunning}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ARTICLE_LENGTHS.map((length) => (
                <option key={length.value} value={length.value}>
                  {length.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label htmlFor="tone-select" className="mb-2 block text-sm font-medium text-gray-300">
              Tone
            </label>
            <select
              id="tone-select"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value as typeof TONES[number]["value"])}
              disabled={isRunning}
              className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {TONES.map((tone) => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Run Button */}
        <Button
          onClick={handleRun}
          disabled={!isFormValid || isRunning}
          className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg mt-2"
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Play className="mr-2 h-5 w-5" />
          )}
          {isRunning ? "Writing Article..." : "Run AI News Content Writer"}
        </Button>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            {renderArticleResult(output as NewsArticleOutput)}
          </div>
          <ResultActions onNew={() => reset()} newLabel="New Article" />
        </div>
      )}
    </div>
  );
}