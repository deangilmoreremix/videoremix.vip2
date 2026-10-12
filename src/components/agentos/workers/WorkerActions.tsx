// src/components/agentos/workers/WorkerActions.tsx
//
// Worker lifecycle controls: clone, pause, resume, archive, delete.
//
// Destructive actions are always behind a confirm dialog, and deleting requires
// the operator to type the worker's name — the same bar the rest of the product
// uses, so nothing is removed by a stray click.

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Copy, Pause, Play, Trash2 } from "lucide-react";
import {
  cloneWorker,
  deleteWorker,
  setWorkerStatus,
} from "../../../services/agentos/workers";
import { Button } from "../../ui/button";
import { Modal } from "../../ui";

export interface WorkerActionsProps {
  workerId: string;
  workerName: string;
  status: string;
  onChanged: () => void;
}

export const WorkerActions: React.FC<WorkerActionsProps> = ({
  workerId,
  workerName,
  status,
  onChanged,
}) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const withBusy = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await action();
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [onChanged],
  );

  return (
    <>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            void withBusy(async () => {
              const result = await cloneWorker(workerId);
              if (result.error) throw new Error(result.error.message);
            })
          }
        >
          <Copy className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Clone
        </Button>

        {status === "paused" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void withBusy(() => setWorkerStatus(workerId, "active"))}
          >
            <Play className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Resume
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || status === "archived"}
            onClick={() => void withBusy(() => setWorkerStatus(workerId, "paused"))}
          >
            <Pause className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Pause
          </Button>
        )}

        {status !== "archived" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setConfirmArchive(true)}
          >
            <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Archive
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
      </div>

      <Modal
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${workerName}?`}
        description="Archived workers are hidden from the default list and are excluded from execution. You can restore them at any time."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmArchive(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500"
              disabled={busy}
              onClick={() =>
                void withBusy(async () => {
                  const result = await setWorkerStatus(workerId, "archived");
                  if (result.error) throw new Error(result.error.message);
                  setConfirmArchive(false);
                  navigate("/agentos/workforce");
                })
              }
            >
              Archive worker
            </Button>
          </div>
        }
      >
        <p className="text-sm text-white/50">
          Existing tasks and conversations are kept. Nothing is deleted.
        </p>
      </Modal>

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${workerName}?`}
        description="This cannot be undone. The worker, its tools, its memory, and its runs are removed permanently."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmDelete(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-500"
              disabled={busy || confirmText.trim() !== workerName}
              onClick={() =>
                void withBusy(async () => {
                  const result = await deleteWorker(workerId);
                  if (result.error) throw new Error(result.error.message);
                  setConfirmDelete(false);
                  navigate("/agentos/workforce");
                })
              }
            >
              Delete permanently
            </Button>
          </div>
        }
      >
        <label className="block text-sm text-white/60">
          Type <span className="font-medium text-white">{workerName}</span> to confirm.
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/25 focus:border-rose-400/40 focus:outline-none"
            placeholder={workerName}
          />
        </label>
      </Modal>
    </>
  );
};

export default WorkerActions;
