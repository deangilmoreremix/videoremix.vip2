import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Terminal } from "lucide-react";

interface VerificationTrace {
  executedCode?: string;
  stdout?: string;
  stderr?: string;
  passed?: boolean;
}

interface ExecutionTraceProps {
  trace: VerificationTrace | null | undefined;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ trace }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!trace) {
    return null;
  }

  const { executedCode, stdout, stderr, passed } = trace;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <Terminal className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-200">Execution Trace</span>
        {passed !== undefined && (
          <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${passed ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
            {passed ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Passed
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" /> Failed
              </>
            )}
          </span>
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700 space-y-3">
          {executedCode && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Executed Code</div>
              <pre className="bg-gray-800 rounded p-3 text-sm text-gray-100 overflow-x-auto whitespace-pre-wrap">{executedCode}</pre>
            </div>
          )}
          {stdout && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">stdout</div>
              <pre className="bg-gray-800/50 rounded p-3 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{stdout}</pre>
            </div>
          )}
          {stderr && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">stderr</div>
              <pre className="bg-gray-800/50 rounded p-3 text-sm text-red-400 overflow-x-auto whitespace-pre-wrap">{stderr}</pre>
            </div>
          )}
          {passed !== undefined && (
            <div className="pt-2 border-t border-gray-800">
              <span className={`inline-flex items-center gap-2 text-sm font-medium ${passed ? "text-green-400" : "text-red-400"}`}>
                {passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {passed ? "Verification passed" : "Verification failed"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};