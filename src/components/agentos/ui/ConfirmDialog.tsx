// src/components/agentos/ui/ConfirmDialog.tsx
//
// The confirmation prompt for a destructive action.
//
// WHY A SHARED COMPONENT
//   Deleting a memory, a schedule or a workspace cannot be undone, and three
//   surfaces grew their own confirmation markup. They disagreed on the copy,
// on the button wording, and on whether a failure was visible. This component
//   makes the confirmation one thing: a modal with a clear question, a
//   destructive-styled confirm button, and — the part that was missing — the
//   failure message shown inside the dialog when the delete itself fails.
//
// FOCUS BEHAVIOUR
//   The shared Modal is a Radix dialog, so it already traps focus, moves focus
//   into the panel on open, closes on Escape or a backdrop click, and returns
//   focus to the element that opened it. Nothing here re-implements that.

import { Button } from "../../ui/button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The question the user must answer with the confirm button. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (rose). */
  destructive?: boolean;
  /** Disables the confirm button while the action is in flight. */
  busy?: boolean;
  /** The failure message from the last attempt, if it failed. */
  error?: string | null;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  busy = false,
  error = null,
  onConfirm,
}) => (
  <Modal
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description}
    footer={
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          disabled={busy}
          onClick={onConfirm}
          className={
            destructive
              ? "border border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
              : undefined
          }
        >
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    }
  >
    {error ? (
      <p role="alert" className="text-sm text-rose-300">
        {error}
      </p>
    ) : null}
  </Modal>
);

export default ConfirmDialog;
