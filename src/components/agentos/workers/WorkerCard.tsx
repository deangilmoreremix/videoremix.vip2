// src/components/agentos/workers/WorkerCard.tsx
//
// Worker summary tile. Reads the same status vocabulary as the rest of the
// AgentOS surfaces so colours can never drift between screens.

import { useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import type { Worker } from "../../../types/agentos";
import { Pill, StatusDot, WORKER_STATUS_STYLE } from "../ui";

export interface WorkerCardProps {
  worker: Worker;
  onSelect?: (workerId: string) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onSelect }) => {
  const navigate = useNavigate();
  const style = WORKER_STATUS_STYLE[worker.status];

  const handleClick = () => {
    if (onSelect) {
      onSelect(worker.id);
      return;
    }
    navigate(`/agentos/workforce/${worker.id}`);
  };

  const activeTools = (worker.tools ?? []).filter((tool) => tool.enabled).length;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group rounded-2xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-violet-400/30 hover:bg-black/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-violet-200">{worker.name}</p>
            <p className="text-xs text-white/45">{worker.role || "unassigned role"}</p>
          </div>
        </div>
        <StatusDot tone={style.tone} title={style.label} />
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs text-white/50">
        {worker.instructions || worker.goals || "No instructions yet."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone="violet">{worker.model_id}</Pill>
        <Pill tone={style.pill}>{style.label}</Pill>
        {activeTools > 0 ? (
          <Pill tone="slate">
            {activeTools} {activeTools === 1 ? "tool" : "tools"}
          </Pill>
        ) : null}
      </div>
    </button>
  );
};

export default WorkerCard;
