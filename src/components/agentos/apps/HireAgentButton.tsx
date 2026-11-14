// src/components/agentos/apps/HireAgentButton.tsx
//
// "Hire as agent": turns an app into an AgentOS agent whose job is that app,
// then opens the agent so the owner can give it work.

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import { getAppMeta } from "../../../config/appRegistry";
import { hireAppAgent } from "../../../services/agentos/workers";
import { cn } from "../../../lib/utils";

export const HireAgentButton: React.FC<{ slug: string; className?: string; compact?: boolean }> = ({
  slug,
  className,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const app = getAppMeta(slug);
  if (!app || app.family !== "awesome-llm") return null;

  const hire = async () => {
    setBusy(true);
    setError(null);
    const result = await hireAppAgent(app);
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Could not create the agent.");
      return;
    }
    navigate(`/dashboard/workforce/${result.data.id}`);
  };

  return (
    <span className={cn("inline-flex flex-col items-end", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          void hire();
        }}
        title={`Create an agent that runs ${app.name} for you`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-agentos-brand/40 bg-agentos-brand/10 font-medium text-white hover:bg-agentos-brand/20 disabled:opacity-50",
          compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        )}
      >
        <Bot className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
        {busy ? "Hiring…" : "Hire as agent"}
      </button>
      {error ? (
        <span role="alert" className="mt-1 text-[11px] text-red-400">
          {error}
        </span>
      ) : null}
    </span>
  );
};

/** The bar above an app: back to the library, and hire it as an agent. */
export const AppTopBar: React.FC<{ slug?: string }> = ({ slug }) => {
  const params = useParams<{ slug?: string; id?: string }>();
  const appSlug = slug ?? params.slug ?? params.id ?? "";
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-4 sm:px-6">
      <Link
        to="/dashboard/apps"
        className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> App Library
      </Link>
      <HireAgentButton slug={appSlug} />
    </div>
  );
};
