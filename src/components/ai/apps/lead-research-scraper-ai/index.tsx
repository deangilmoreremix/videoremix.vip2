/**
 * Lead Research Scraper AI — Production UI
 * New VideoRemix Name: Lead Research Scraper AI
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

export default function LeadResearchScraperAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [keywords, setKeywords] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [location, setLocation] = useState("");
  const [numLeads, setNumLeads] = useState(6);

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const industries = ["SaaS", "E-commerce", "Healthcare", "Fintech", "Marketing Agencies", "All"];

  const handleRun = async () => {
    if (!keywords.trim()) return;
    const inputs = {
      keywords: keywords.trim(),
      industry,
      location: location.trim() || "Global / US",
      targetCount: numLeads,
      sources: "LinkedIn, company sites, recent news, job boards",
    };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Search className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Instantly scrape, qualify, and enrich high-intent leads from public signals and web data.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Target Keywords / ICP Description</Label>
            <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. VP Marketing at Series B fintech companies hiring SDRs" disabled={isRunning} className="bg-black border-gray-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Industry Focus</Label>
              <select value={industry} onChange={e => setIndustry(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Geography (optional)</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="US, UK, Remote, NYC" disabled={isRunning} className="bg-black border-gray-700" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block"># of Leads</Label>
              <Input type="number" value={numLeads} onChange={e => setNumLeads(Math.max(3, Math.min(12, parseInt(e.target.value)||6)))} min={3} max={12} disabled={isRunning} className="bg-black border-gray-700" />
            </div>
          </div>

          <Button onClick={handleRun} disabled={!keywords.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Scraping & qualifying leads..." : "Run Lead Research Scraper AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Qualified Lead List & Strategy" />
          <ResultActions onNew={() => reset()} newLabel="New Search" />
        </div>
      )}
    </div>
  );
}
