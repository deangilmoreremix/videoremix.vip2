import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Running AI analysis...",
  subMessage = "This usually takes 10-30 seconds",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
      <p className="text-lg font-medium text-white">{message}</p>
      <p className="text-sm text-gray-400 mt-1">{subMessage}</p>
    </div>
  );
};
