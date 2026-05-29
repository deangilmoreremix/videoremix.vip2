/**
 * AI Video Script Producer — Production UI
 * New VideoRemix Name: AI Video Script Producer
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
  const [topic, setTopic] = React.useState("");
  const [videoLength, setVideoLength] = React.useState("5");
  const [style, setStyle] = React.useState("talking-head");

  const { run, isRunning } = useRunAIApp("ai-video-script-producer", {
    onResult,
    onError,
    onRunningChange,
    onReset,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run({ topic, videoLengthMin: parseInt(videoLength), style });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          placeholder="Video topic"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Length (minutes)</label>
        <input
          type="number"
          value={videoLength}
          onChange={(e) => setVideoLength(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          min="1"
          max="30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Style</label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="talking-head">Talking Head</option>
          <option value="explainer">Explainer</option>
          <option value="interview">Interview</option>
          <option value="demo">Demo</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isRunning || !topic}
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50"
      >
        {isRunning ? "Generating..." : `Generate ${appName}`}
      </button>
    </form>
  );
};

export default AIAppComponent;