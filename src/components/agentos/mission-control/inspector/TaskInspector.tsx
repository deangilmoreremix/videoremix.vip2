// src/components/agentos/mission-control/inspector/TaskInspector.tsx
//
// Inspector for a mission node: the mission goal plus its tasks with real queue
// state, so a click on the canvas explains what is actually queued.

import { Button } from "../../../ui/button";
import { ExecutionStatusBadge } from "../../runtime/ExecutionStatusBadge";
import { Section } from "../../ui";
import type { Mission, Task } from "../../../../types/agentos";

export interface TaskInspectorProps {
  mission: Mission;
  tasks: Task[];
  onOpenMission?: (missionId: string) => void;
}

export const TaskInspector: React.FC<TaskInspectorProps> = ({
  mission,
  tasks,
  onOpenMission,
}) => (
  <div className="space-y-4 p-4">
    <Section title={mission.title} description={mission.goal || "No goal set."}>
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Status</dt>
          <dd className="text-white/75">{mission.status}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Priority</dt>
          <dd className="tabular-nums text-white/75">{mission.priority}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Created by</dt>
          <dd className="text-white/75">{mission.created_by}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Created</dt>
          <dd className="text-white/75">
            {new Date(mission.created_at).toLocaleDateString()}
          </dd>
        </div>
      </dl>
    </Section>

    <Section title="Tasks" description={`${tasks.length} in this mission`}>
      {tasks.length === 0 ? (
        <p className="text-xs text-white/45">No tasks yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border border-white/5 bg-black/30 px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-xs text-white/80">{task.title}</p>
                <ExecutionStatusBadge status={task.status} />
              </div>
              <p className="mt-1 text-[11px] text-white/35">
                attempt {task.attempt}/{task.max_attempts} · {task.trigger}
              </p>
              {task.error ? <p className="mt-1 text-[11px] text-rose-300">{task.error}</p> : null}
            </li>
          ))}
        </ul>
      )}
      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => onOpenMission?.(mission.id)}
      >
        Open mission
      </Button>
    </Section>
  </div>
);

export default TaskInspector;
