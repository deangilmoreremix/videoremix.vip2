import React, { useState, useEffect } from "react";
import { Play, Loader2, Copy, Download, Share2, Check } from "lucide-react";
import type { AIAppProps } from "./types";
import { useRunAIApp } from "./useRunAIApp";
import { ResultActions } from "../primitives/ResultActions";

/**
 * Enhanced GenericAIApp with copy/save/share functionality
 * for all 95 AI apps powered by OpenAI Responses API
 */
export const GenericAIApp: React.FC<AIAppProps> = ({ appId, appName, onResult, onError, onRunningChange, onReset }) => {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"json" | "text">("json");

  const { run, isRunning, output, error, reset, isStreaming, streamingContent } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!input.trim()) return;
    await run({ prompt: input.trim() });
  };

  const handleCopy = async () => {
    if (!output && !streamingContent) return;

    let textToCopy: string;
    if (typeof output === "string") {
      textToCopy = output;
    } else if (output) {
      textToCopy = outputFormat === "json" ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    } else {
      textToCopy = streamingContent;
    }

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output && !streamingContent) return;

    let content: string;
    if (typeof output === "string") {
      content = output;
    } else if (output) {
      content = outputFormat === "json" ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    } else {
      content = streamingContent;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appId.replace(/-/g, "_")}_${Date.now()}.${outputFormat === "json" ? "json" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!output && !streamingContent) return;

    const shareData = {
      title: `${appName} Result`,
      text: typeof output === "string" ? output : JSON.stringify(output, null, 2),
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const getDisplayContent = () => {
    if (streamingContent) return streamingContent;
    if (output) {
      if (typeof output === "string") return output;
      // If it's an object with content, try to extract meaningful text
      if (output.content && typeof output.content === "string") return output.content;
      if (output.response && typeof output.response === "string") return output.response;
      // Fall back to JSON string
      return outputFormat === "json" ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    }
    return "";
  };

  const displayContent = getDisplayContent();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{appName}</h2>
        <p className="mt-1 text-gray-400">
          Powered by OpenAI Responses API. Enter your request below for professional-grade output.
        </p>
      </div>

      {/* Input Area */}
      <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Your Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Describe what you need... (e.g. 'Create a sales outreach campaign for my SaaS product targeting fintech companies')`}
          className="min-h-[140px] w-full resize-y rounded-lg border border-gray-700 bg-black p-4 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          disabled={isRunning}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleRun();
            }
          }}
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">⌘ + Enter to run</span>
          <button
            onClick={handleRun}
            disabled={!input.trim() || isRunning}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-8 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run {appName}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streaming Indicator */}
      {isStreaming && (
        <div className="rounded-xl border border-blue-800 bg-blue-900/20 p-4">
          <div className="flex items-center gap-2 text-blue-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            <span className="text-sm">AI is processing your request...</span>
          </div>
        </div>
      )}

      {/* Output Area */}
      {(output || streamingContent) && (
        <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-200">Result</h3>
            <div className="flex items-center gap-2">
              {/* Format Toggle */}
              <div className="flex items-center rounded-lg border border-gray-700">
                <button
                  onClick={() => setOutputFormat("json")}
                  className={`px-3 py-1 text-xs ${outputFormat === "json" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"}`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setOutputFormat("text")}
                  className={`px-3 py-1 text-xs ${outputFormat === "text" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"}`}
                >
                  Text
                </button>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-600"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-600"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-gray-600"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </div>

          {/* Content Display */}
          <div className="relative">
            {isStreaming && !displayContent && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating response...</span>
              </div>
            )}
            {displayContent && (
              <pre className="max-h-[600px] overflow-auto rounded-lg bg-black p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono">
                {displayContent}
              </pre>
            )}
          </div>

          {/* Result Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-4">
            <div className="text-xs text-gray-500">
              {output?.metadata?.tokensUsed && `Tokens: ${output.metadata.tokensUsed}`}
              {output?.metadata?.latencyMs && ` • Latency: ${output.metadata.latencyMs}ms`}
            </div>
            <ResultActions onNew={() => {
              reset();
              setInput("");
            }} newLabel="New Request" />
          </div>
        </div>
      )}

      {/* Features Badge */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Responses API
        </span>
        <span className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1">
          Streaming
        </span>
        <span className="flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1">
          Copy & Download
        </span>
      </div>
    </div>
  );
};