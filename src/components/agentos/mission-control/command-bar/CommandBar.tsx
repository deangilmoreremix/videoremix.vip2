// src/components/agentos/mission-control/command-bar/CommandBar.tsx
//
// Cmd/Ctrl+K palette over the rows already loaded in the shell. Selecting a
// result focuses that node on the canvas; there is no result the user cannot
// open, because the index is the user's own data.

import { useMemo, useState } from "react";
import { Dialog } from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import type { Mission, Worker } from "../../../../types/agentos";

export interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  missions: Mission[];
  onSelectWorker: (workerId: string) => void;
  onSelectMission: (missionId: string) => void;
}

interface Result {
  id: string;
  kind: "worker" | "mission";
  title: string;
  subtitle: string;
  onSelect: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  open,
  onOpenChange,
  workers,
  missions,
  onSelectWorker,
  onSelectMission,
}) => {
  const [query, setQuery] = useState("");

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();
    const list: Result[] = [
      ...workers.map((worker) => ({
        id: `worker:${worker.id}`,
        kind: "worker" as const,
        title: worker.name,
        subtitle: `${worker.role || "no role"} · ${worker.model_id}`,
        onSelect: () => onSelectWorker(worker.id),
      })),
      ...missions.map((mission) => ({
        id: `mission:${mission.id}`,
        kind: "mission" as const,
        title: mission.title,
        subtitle: `mission · ${mission.status}`,
        onSelect: () => onSelectMission(mission.id),
      })),
    ];
    if (!needle) return list.slice(0, 20);
    return list
      .filter((entry) =>
        [entry.title, entry.subtitle].join(" ").toLowerCase().includes(needle),
      )
      .slice(0, 20);
  }, [query, workers, missions, onSelectWorker, onSelectMission]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <div className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/70 pt-[12vh]">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f] shadow-2xl">
          <div className="border-b border-white/5 p-3">
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workers and missions…"
              className="border-transparent bg-transparent focus-visible:ring-0"
            />
          </div>

          <ul className="max-h-80 overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-white/35">
                No matches for “{query}”.
              </li>
            ) : (
              results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      result.onSelect();
                      onOpenChange(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5"
                  >
                    <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/40">
                      {result.kind}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{result.title}</span>
                      <span className="block truncate text-[11px] text-white/35">
                        {result.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Dialog>
  );
};

export default CommandBar;
