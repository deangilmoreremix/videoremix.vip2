/**
 * AI Music Idea Generator — Production UI
 * New VideoRemix Name: AI Music Idea Generator
 */

import React from "react";
import { useRunAIApp } from "../useRunAIApp";

interface Props {
  appId: string;
  appName: string;
  onResult?: (result: any) => void;
  onError?: (error: string) => void;
  onRunningChange?: (isRunning: boolean) => void;
  onReset?: () => void;
}

export const AIAppComponent: React.FC<Props> = ({ appName, onResult, onError, onRunningChange, onReset }) => {
  const [genre, setGenre] = React.useState("");
  const [mood, setMood] = React.useState("");
  const [theme, setTheme] = React.useState("");

  const { run, isRunning } = useRunAIApp("ai-music-idea-generator", {
    onResult,
    onError,
    onRunningChange,
    onReset,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run({ genre, mood, theme });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
        <input
          type="text"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          placeholder="e.g., Pop, Rock, Jazz"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Mood</label>
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          placeholder="e.g., Energetic, Calm, Fun"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          placeholder="e.g., Love, Adventure"
        />
      </div>
      <button
        type="submit"
        disabled={isRunning || !genre}
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50"
      >
        {isRunning ? "Generating..." : `Generate ${appName}`}
      </button>
    </form>
  );
};

export default AIAppComponent;