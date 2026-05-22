import React from "react";
import { ArrowLeft, Save, Download, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface AIAppShellProps {
  appName: string;
  appSlug: string;
  children: React.ReactNode;
  usage?: {
    used: number;
    limit: number;
  };
  onSave?: () => void;
  onDownload?: () => void;
  isRunning?: boolean;
}

export const AIAppShell: React.FC<AIAppShellProps> = ({
  appName,
  appSlug,
  children,
  usage = { used: 12, limit: 100 },
  onSave,
  onDownload,
  isRunning = false,
}) => {
  const navigate = useNavigate();

  const usagePercent = Math.min((usage.used / usage.limit) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Apps
            </Button>

            <div className="h-6 w-px bg-gray-800" />

            <div>
              <h1 className="text-lg font-semibold">{appName}</h1>
              <p className="text-xs text-gray-500">/{appSlug}</p>
            </div>
          </div>

          {/* Usage Meter */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BarChart3 className="h-4 w-4" />
              <span>
                {usage.used} / {usage.limit} runs
              </span>
            </div>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={!onSave || isRunning}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Save to Project
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={!onDownload || isRunning}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 md:p-8">
          {children}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mx-auto max-w-7xl px-6 pb-8 text-center text-xs text-gray-600">
        Powered by OpenAI • Results are private to your account • Usage resets monthly
      </div>
    </div>
  );
};
