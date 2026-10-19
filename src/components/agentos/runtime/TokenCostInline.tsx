// src/components/agentos/runtime/TokenCostInline.tsx
//
// Inline token/credit readout for a worker, rendered from the usage table so
// every number shown is a real recorded cost.

import { useEffect, useState } from "react";
import { agentosDb } from "../../../services/agentos/client";

export interface TokenCostInlineProps {
  workerId: string;
}

interface UsageTotals {
  prompt_tokens: number;
  completion_tokens: number;
  credits: number;
  runs: number;
}

export const TokenCostInline: React.FC<TokenCostInlineProps> = ({ workerId }) => {
  const [totals, setTotals] = useState<UsageTotals | null>(null);

  useEffect(() => {
    if (!workerId) return;
    let cancelled = false;

    void (async () => {
      const { data } = await agentosDb
        .from("usage_records")
        .select("prompt_tokens, completion_tokens, credits")
        .eq("worker_id", workerId);

      if (cancelled) return;
      const rows = (data ?? []) as Array<{
        prompt_tokens: number;
        completion_tokens: number;
        credits: number;
      }>;
      setTotals({
        prompt_tokens: rows.reduce((sum, row) => sum + Number(row.prompt_tokens ?? 0), 0),
        completion_tokens: rows.reduce((sum, row) => sum + Number(row.completion_tokens ?? 0), 0),
        credits: rows.reduce((sum, row) => sum + Number(row.credits ?? 0), 0),
        runs: rows.length,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [workerId]);

  if (!totals || totals.runs === 0) {
    return <span className="text-xs text-white/35">no usage recorded</span>;
  }

  return (
    <span className="text-xs tabular-nums text-white/55">
      {totals.prompt_tokens.toLocaleString()} in · {totals.completion_tokens.toLocaleString()} out ·{" "}
      <span className="text-violet-300">{Math.round(totals.credits).toLocaleString()} credits</span>
    </span>
  );
};

export default TokenCostInline;
