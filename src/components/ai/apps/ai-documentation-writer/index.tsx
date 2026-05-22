/**
 * AI Documentation Writer
 * New VideoRemix Name: "AI Documentation Writer"
 *
 * Creates professional documentation from product/feature info, audience, and key points.
 * Outputs: title, introduction, sections, prerequisites, faq, nextSteps, estimatedReadTime.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Clock, BookOpen, CheckCircle2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "./useRunAIApp";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";

const DOC_TYPES = [
  "Tutorial",
  "SOP (Standard Operating Procedure)",
  "User Guide",
  "Onboarding Doc",
  "Technical Reference",
  "Knowledge Base Article",
] as const;

interface Section {
  heading: string;
  content: string;
  tips?: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface DocOutput {
  title: string;
  introduction: string;
  sections: Section[];
  prerequisites?: string[];
  faq: FAQ[];
  nextSteps: string[];
  estimatedReadTime: string;
}

export default function AIDocumentationWriter({
  appId,
  appName,
  onResult,
  onError,
  onRunningChange,
  onReset,
}: AIAppProps) {
  const [selectedDocType, setSelectedDocType] = useState<string>(DOC_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const { run, isRunning, output, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!topic.trim()) return;

    const inputs = {
      docType: selectedDocType,
      topic: topic.trim(),
      audience: audience.trim() || undefined,
      keyPoints: keyPoints.trim() || undefined,
      additionalContext: additionalContext.trim() || undefined,
    };

    await run(inputs);
  };

  const isFormValid = topic.trim().length > 0;

  const renderDocResult = (result: DocOutput) => {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-white leading-tight">{result.title}</h1>
            {result.estimatedReadTime && (
              <span className="flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-full bg-primary-900/40 text-primary-400 text-sm border border-primary-800">
                <Clock className="h-4 w-4" />
                {result.estimatedReadTime}
              </span>
            )}
          </div>
        </div>

        {/* Introduction */}
        {result.introduction && (
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-gray-300 leading-relaxed text-lg">{result.introduction}</p>
          </div>
        )}

        {/* Prerequisites */}
        {result.prerequisites && result.prerequisites.length > 0 && (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-amber-400">Prerequisites</h3>
            </div>
            <ul className="space-y-2">
              {result.prerequisites.map((prereq, i) => (
                <li key={i} className="flex items-start gap-2 text-amber-200/80 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        {result.sections && result.sections.length > 0 && (
          <div className="space-y-8">
            {result.sections.map((section, i) => (
              <div key={i} className="border border-gray-800 rounded-xl bg-[#0f0f0f] p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-primary-500 font-mono text-sm">#{i + 1}</span>
                  {section.heading}
                </h2>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {section.content}
                </div>
                {section.tips && section.tips.length > 0 && (
                  <div className="mt-4 rounded-lg bg-primary-950/30 border border-primary-900/50 p-4">
                    <h4 className="text-sm font-medium text-primary-400 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Tips
                    </h4>
                    <ul className="space-y-1.5">
                      {section.tips.map((tip, ti) => (
                        <li key={ti} className="text-sm text-primary-200/70 flex items-start gap-2">
                          <span className="text-primary-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {result.faq && result.faq.length > 0 && (
          <div className="border border-gray-800 rounded-xl bg-[#0f0f0f] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary-500" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {result.faq.map((item, i) => (
                <div key={i} className="border border-gray-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-900/50 transition-colors"
                  >
                    <span className="font-medium text-gray-200">{item.question}</span>
                    {expandedFaqIndex === i ? (
                      <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                    )}
                  </button>
                  {expandedFaqIndex === i && (
                    <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-3">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {result.nextSteps && result.nextSteps.length > 0 && (
          <div className="border border-gray-800 rounded-xl bg-[#0f0f0f] p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-500" />
              Next Steps
            </h3>
            <ul className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-900 text-primary-400 text-xs font-medium shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-300 text-sm leading-relaxed">{step}</span>
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
          Create professional documentation in seconds. Just describe what you need and let AI do the rest.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6 space-y-5">
        {/* Document Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Topic / Title */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Topic / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., How to Set Up Two-Factor Authentication"
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Audience */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Target Audience
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., developers, new customers, internal team members"
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Key Points / Content Outline */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Key Points / Content Outline
          </label>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            placeholder="What should this document cover? List the main topics, steps, or sections..."
            rows={4}
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Additional Context */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Additional Context
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any extra information, brand voice notes, examples, or specific requirements..."
            rows={3}
            disabled={isRunning}
            className="w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:border-primary-600 focus:ring-1 focus:ring-primary-600 outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
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
          {isRunning ? "Generating Documentation..." : "Run AI Documentation Writer"}
        </Button>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-6">
            {renderDocResult(output as DocOutput)}
          </div>
          <ResultActions onNew={() => reset()} newLabel="New Documentation" />
        </div>
      )}
    </div>
  );
}