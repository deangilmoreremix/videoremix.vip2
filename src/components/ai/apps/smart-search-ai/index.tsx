/**
 * Smart Search AI — Production UI
 * New VideoRemix Name: Smart Search AI
 * Intelligent search across multiple sources with ranked results and summaries.
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Search } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function SmartSearchAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourcePreferences, setSourcePreferences] = useState("");
  const [searchType, setSearchType] = useState("comprehensive");
  const [maxResults, setMaxResults] = useState("10");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const searchTypes = ["comprehensive", "academic", "news", "business", "technical", "general"];

  const handleRun = async () => {
    if (!searchQuery.trim()) return;
    const inputs = {
      searchQuery: searchQuery.trim(),
      sourcePreferences: sourcePreferences.trim(),
      searchType,
      maxResults: parseInt(maxResults, 10),
    };
    await run(inputs);
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setSearchQuery("");
    setSourcePreferences("");
    setSearchType("comprehensive");
    setMaxResults("10");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Search className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Intelligent search across multiple sources with ranked results, summaries, and source attribution.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Search Query</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What would you like to search for?"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white text-lg py-6"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Source Preferences (optional)</Label>
            <PromptTextarea
              label=""
              placeholder="e.g. 'Prioritize academic sources', 'Focus on recent news', 'Include tech blogs and documentation', 'Prefer B2B SaaS resources'"
              value={sourcePreferences}
              onChange={setSourcePreferences}
              disabled={isRunning}
              maxLength={500}
              rows={3}
              hint="Guide the search to focus on specific types of sources"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Search Type</Label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                {searchTypes.map((type) => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Max Results</Label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                disabled={isRunning}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white focus:border-primary-500"
              >
                <option value="5">5 results</option>
                <option value="10">10 results</option>
                <option value="15">15 results</option>
                <option value="20">20 results</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleRun}
            disabled={!searchQuery.trim() || isRunning}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 text-lg py-6"
          >
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Searching..." : "Run Smart Search AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Search Results" />
          <ResultActions
            onNew={handleReset}
            newLabel="New Search"
            onClear={handleClearAll}
            clearLabel="Clear All"
          />
        </div>
      )}
    </div>
  );
}