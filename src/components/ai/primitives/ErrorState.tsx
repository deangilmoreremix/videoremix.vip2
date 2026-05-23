import React from "react";
import { AlertTriangle, RefreshCw, Lightbulb, X } from "lucide-react";
import { Button } from "../../ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  suggestion?: string;
  onDismiss?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  suggestion,
  onDismiss,
}) => {
  return (
    <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-400">Something went wrong</h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-300">{error}</p>

          {suggestion && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-950/30 p-3 border border-amber-900/30">
              <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-400">Suggestion</p>
                <p className="mt-0.5 text-xs text-gray-300">{suggestion}</p>
              </div>
            </div>
          )}

          {onRetry && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};