// src/components/agentos/runtime/TokenCostInline.tsx
//
// Inline token/credit readout for a worker, rendered from the usage table so
// every number shown is a real recorded cost.
//
// WHY THE NUMBERS GO THROUGH THE SHARED HELPER
//   The usage table stores its counters in Postgres `numeric` columns, and
//   the PostgREST client returns those as strings ("1200", "12.50"). Adding
//   them as strings would concatenate them ("12001200"), and printing them
//   raw would show the storage precision. format/numbers.ts owns that rule
//   for every AgentOS surface, so this component uses it too.

import { useEffect, useState } from "react";
import { agentosDb } from "../../../services/agentos/client";
import { formatCredits, formatInteger, toNumber } from "../format";

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
        prompt_tokens: number | string | null;
        completion_tokens: number | string | null;
        credits: number | string | null;
      }>;
      setTotals({
        prompt_tokens: rows.reduce((sum, row) => sum + (toNumber(row.prompt_tokens) ?? 0), 0),
        completion_tokens: rows.reduce((sum, row) => sum + (toNumber(row.completion_tokens) ?? 0), 0),
        credits: rows.reduce((sum, row) => sum + (toNumber(row.credits) ?? 0), 0),
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
      {formatInteger(totals.prompt_tokens)} in · {formatInteger(totals.completion_tokens)} out ·{" "}
      <span className="text-violet-300">{formatCredits(totals.credits)} credits</span>
    </span>
  );
};

export default TokenCostInline;
