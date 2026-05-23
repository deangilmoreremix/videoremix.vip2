/**
 * Travel Planner AI — Production UI (Batch 10)
 * New VideoRemix Name: Travel Planner AI
 */

import React, { useState, useEffect } from "react";
import { Play, Loader2, Plane } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { StructuredResult } from "../../primitives/StructuredResult";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

export default function TravelPlannerAI({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [destination, setDestination] = useState("");
  const [travelDates, setTravelDates] = useState("");
  const [budget, setBudget] = useState("moderate");
  const [travelers, setTravelers] = useState("1");
  const [travelStyle, setTravelStyle] = useState("relaxation");

  const { run, isRunning, output, error, reset } = useRunAIApp(appId, { onResult, onError, onReset, enableMultiTurn: true });

  useEffect(() => { onRunningChange?.(isRunning); }, [isRunning, onRunningChange]);

  const handleRun = async () => {
    if (!destination.trim()) return;
    await run({
      destination: destination.trim(),
      travelDates: travelDates.trim(),
      budget,
      travelers: travelers.trim(),
      travelStyle,
    });
  };

  const handleReset = () => reset();
  const handleClearAll = () => {
    setDestination("");
    setTravelDates("");
    setBudget("moderate");
    setTravelers("1");
    setTravelStyle("relaxation");
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Plane className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">Get a complete travel itinerary, accommodation options, activity recommendations, budget breakdown, packing list, and local insights for any destination.</p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Destination</Label>
              <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Paris, France" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Travel Dates</Label>
              <Input value={travelDates} onChange={e => setTravelDates(e.target.value)} placeholder="June 15-22, 2026" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Budget</Label>
              <select value={budget} onChange={e => setBudget(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Number of Travelers</Label>
              <Input type="number" min="1" value={travelers} onChange={e => setTravelers(e.target.value)} placeholder="2" disabled={isRunning} className="bg-black border-gray-700 text-white" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Travel Style</Label>
              <select value={travelStyle} onChange={e => setTravelStyle(e.target.value)} disabled={isRunning} className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white">
                <option value="adventure">Adventure</option>
                <option value="cultural">Cultural</option>
                <option value="relaxation">Relaxation</option>
                <option value="family">Family</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <Button onClick={handleRun} disabled={!destination.trim() || isRunning} className="w-full md:w-auto bg-primary-600 hover:bg-primary-500 py-6 text-lg">
            {isRunning ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            {isRunning ? "Planning your trip..." : "Run Travel Planner AI"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <StructuredResult result={output} title="Complete Travel Plan" />
          <ResultActions onNew={handleReset} newLabel="Plan Another Trip" onClear={handleClearAll} clearLabel="Clear All" />
        </div>
      )}
    </div>
  );
}