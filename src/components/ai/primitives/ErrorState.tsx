import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-3" />
      <p className="text-red-300 font-medium">Something went wrong</p>
      <p className="mt-1 text-sm text-red-400/80">{error}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 border-red-800 text-red-300 hover:bg-red-950"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
};
