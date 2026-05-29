/**
 * Travel Concierge AI — Production UI (Overflow / Batch 10 extension)
 * New VideoRemix Name: Travel Concierge AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, MapPin, Plane } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { PromptTextarea } from "../../primitives/PromptTextarea";

export default function TravelConciergeAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [travelers, setTravelers] = useState("2");
  const [budget, setBudget] = useState("moderate");
  const [style, setStyle] = useState("balanced");
  const [interests, setInterests] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const { run, isRunning, output, error, reset, lastInputs } = useRunAIApp(appId, {
    onResult,
    onError,
    onReset,
    enableMultiTurn: true,
  });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!destination.trim()) return;
    await run({
      destination: destination.trim(),
      dates: dates.trim(),
      travelers: travelers.trim(),
      budget,
      style,
      interests: interests.trim(),
      specialRequests: specialRequests.trim(),
    });
  };

  const handleReset = () => reset();

  const handleClearAll = () => {
    setDestination("");
    setDates("");
    setTravelers("2");
    setBudget("moderate");
    setStyle("balanced");
    setInterests("");
    setSpecialRequests("");
    reset();
  };

  const quickRefinements = [
    "Add 3 hotel options with price ranges",
    "Suggest flight alternatives and best booking windows",
    "Create a day-by-day food itinerary",
    "What about accessibility and family-friendly activities?",
    "Adjust for a tighter budget",
  ];

  const handleQuickRefine = async (refinement: string) => {
    await run({ ...(lastInputs || {}), refinement });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary-500/10 p-2">
          <Plane className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{appName}</h2>
          <p className="text-sm text-gray-400 -mt-0.5">Your always-on personal travel concierge</p>
        </div>
      </div>

      <p className="text-gray-400 max-w-3xl">
        Get personalized travel ideas, full itineraries, real-time booking advice, reminders, packing lists, and live trip adjustments. 
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Destination</Label>
              <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Kyoto, Japan or Greek islands" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Travel Dates or Window</Label>
              <Input value={dates} onChange={e => setDates(e.target.value)} placeholder="Oct 10-18 2026 or flexible fall" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Travelers</Label>
              <Input type="number" min="1" value={travelers} onChange={e => setTravelers(e.target.value)} disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Budget</Label>
              <select value={budget} onChange={e => setBudget(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white text-sm">
                <option value="shoestring">Shoestring</option>
                <option value="moderate">Moderate</option>
                <option value="comfort">Comfort</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Trip Vibe</Label>
              <select value={style} onChange={e => setStyle(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white text-sm">
                <option value="balanced">Balanced</option>
                <option value="adventure">Adventure</option>
                <option value="culture">Culture</option>
                <option value="relax">Relaxation</option>
                <option value="food">Food & Wine</option>
                <option value="romantic">Romantic</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Interests (optional)</Label>
            <textarea value={interests} onChange={e => setInterests(e.target.value)} placeholder="Street photography, hiking, night markets..." disabled={isRunning} className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white text-sm" rows={2} />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-1.5 block">Special Requests</Label>
            <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Vegetarian, infant, mobility..." disabled={isRunning} className="w-full rounded-lg border border-gray-700 bg-black p-3 text-white text-sm" rows={2} />
          </div>

          <Button onClick={handleRun} disabled={!destination.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
            {isRunning ? "Consulting..." : "Ask Travel Concierge AI"}
          </Button>
          <p className="text-xs text-gray-500">Multi-turn supported — refine after the first plan using the chips below the result.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Personalized Travel Plan" />
          <div className="flex flex-wrap gap-2">
            {["Add hotel options", "Flight alternatives", "Food day-by-day", "Accessibility tips", "Lower budget version"].map((chip, i) => (
              <button key={i} onClick={() => handleQuickRefine(chip)} disabled={isRunning} className="text-xs px-3 py-1 rounded-full border border-gray-700 hover:bg-gray-800 disabled:opacity-50">{chip}</button>
            ))}
          </div>
          <ResultActions onNew={handleReset} newLabel="New Trip" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}
