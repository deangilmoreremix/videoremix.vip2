// src/components/agentos/shared/AsyncBoundary.tsx
//
// One place to render loading / error / empty states for every AgentOS page.
//
// WHY THIS EXISTS
//   Nine pages in this port load the same kind of thing (a list of rows from
//   Supabase, sometimes filtered). Rendering a different skeleton per page is
//   how states drift apart; this component makes the failure path explicit and
// forces every page to handle an error rather than showing an empty screen that
// looks identical to "you have no data".

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { Spinner } from "../ui/Spinner";

export interface AsyncBoundaryProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  /** Shown when nothing failed but there is genuinely nothing to show. */
  isEmpty?: boolean;
  empty?: ReactNode;
  /** Skeleton rows while loading. */
  loadingRows?: number;
  children: ReactNode;
}

export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  loading,
  error,
  onRetry,
  isEmpty = false,
  empty = null,
  loadingRows = 3,
  children,
}) => {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 text-rose-100"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Could not load this view</h3>
            <p className="mt-1 text-sm text-rose-100/80">{error}</p>
            {onRetry ? (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-rose-300/30 bg-transparent text-rose-100 hover:bg-rose-500/10"
                onClick={onRetry}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: loadingRows }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
          />
        ))}
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (isEmpty) return <>{empty}</>;

  return <>{children}</>;
};

export default AsyncBoundary;
