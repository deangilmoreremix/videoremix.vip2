/**
 * Sales Call Follow-Up AI — Production UI
 * New VideoRemix Name: Sales Call Follow-Up AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, PhoneCall } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Label } from "../../../ui/label";

export default function SalesCallFollowUpAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [callNotes, setCallNotes] = useState("");
  const [outcome, setOutcome] = useState("Positive - next steps agreed");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const outcomes = ["Positive - next steps agreed", "Neutral - need more info", "Objections raised", "No-show / Ghosted", "Closed won", "Closed lost"];

  const handleRun = async () => {
    if (!callNotes.trim()) return;
    const inputs = { callNotes: callNotes.trim(), outcome, repName: "You", companyContext: "B2B sales" };
    await run(inputs);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3"><PhoneCall className="h-7 w-7 text-primary-500" /><h2 className="text-2xl font-semibold">{appName}</h2></div>
      <p className="text-gray-400 -mt-4">Turn raw call notes into a complete, timed multi-channel follow-up system that actually gets replies.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <PromptTextarea label="Call Notes / Transcript Summary" placeholder="Key moments, pain points mentioned, buying signals, objections, next steps discussed, decision timeline..." value={callNotes} onChange={setCallNotes} disabled={isRunning} rows={7} />
          <div><Label className="text-sm font-medium text-gray-300 mb-2 block">Call Outcome</Label><select value={outcome} onChange={e=>setOutcome(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">{outcomes.map(o=><option key={o}>{o}</option>)}</select></div>
          <Button onClick={handleRun} disabled={!callNotes.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg"><Play className="mr-2 h-5 w-5" />{isRunning ? "Generating follow-up sequence..." : "Run Sales Call Follow-Up AI"}</Button>
        </div>
      ) : <div><StructuredResult result={output} title="Complete Follow-Up System" /><ResultActions onNew={() => reset()} newLabel="Process Another Call" /></div>}
    </div>
  );
}
