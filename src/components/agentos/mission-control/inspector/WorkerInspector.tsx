// src/components/agentos/mission-control/inspector/WorkerInspector.tsx
//
// Inspector for a selected worker node: identity, model routing, memory, and
// the missions its tasks belong to.

import { useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import { Button } from "../../../ui/button";
import { Pill, Section } from "../../ui";
import { TokenCostInline } from "../../runtime/TokenCostInline";
import type { Mission, Worker } from "../../../../types/agentos";

export interface WorkerInspectorProps {
  worker: Worker;
  missions?: Mission[];
  onSelectWorker?: (workerId: string) => void;
  onSelectMission?: (missionId: string) => void;
}

export const WorkerInspector: React.FC<WorkerInspectorProps> = ({
  worker,
  missions = [],
  onSelectWorker,
  onSelectMission,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 p-4">
      <Section>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">{worker.name}</p>
            <p className="text-xs text-white/45">{worker.role || "no role set"}</p>
          </div>
        </div>

        {worker.instructions ? (
          <p className="mt-3 whitespace-pre-wrap text-xs text-white/60">{worker.instructions}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill tone="violet">{worker.model_id}</Pill>
          {worker.fallback_model_id ? (
            <Pill tone="sky">→ {worker.fallback_model_id}</Pill>
          ) : null}
          <Pill tone={worker.status === "active" ? "emerald" : "slate"}>{worker.status}</Pill>
          <Pill tone={worker.memory_enabled ? "sky" : "slate"}>
            memory {worker.memory_enabled ? "on" : "off"}
          </Pill>
        </div>

        <div className="mt-3">
          <TokenCostInline workerId={worker.id} />
        </div>
      </Section>

      <Section title="Model routing">
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-white/40">Provider</dt>
            <dd className="text-white/75">{worker.model_provider}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/40">Temperature</dt>
            <dd className="tabular-nums text-white/75">{worker.temperature}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/40">Max output</dt>
            <dd className="tabular-nums text-white/75">{worker.max_output_tokens}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/40">Tools</dt>
            <dd className="text-white/75">
              {(worker.tools ?? []).filter((tool) => tool.enabled).length} enabled
            </dd>
          </div>
        </dl>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => {
            onSelectWorker?.(worker.id);
            navigate(`/agentos/workforce/${worker.id}`);
          }}
        >
          Open worker
        </Button>
      </Section>

      <Section
        title="Missions"
        description={missions.length === 0 ? "No missions for this worker." : undefined}
      >
        {missions.length === 0 ? null : (
          <ul className="space-y-1.5">
            {missions.map((mission) => (
              <li key={mission.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMission?.(mission.id);
                    navigate(`/agentos/missions/${mission.id}`);
                  }}
                  className="w-full rounded-lg border border-white/5 bg-black/30 px-2.5 py-2 text-left text-xs text-white/75 hover:border-violet-400/30"
                >
                  {mission.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};

export default WorkerInspector;
