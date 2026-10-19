// src/components/agentos/ui/Modal.tsx
//
// Thin dark-themed wrapper over the shared Radix dialog, so every AgentOS
// dialog has one visual treatment.
//
// WHY TWO THINGS ARE ADDED ON TOP OF RADIX
//   1. aria-modal. Radix hides everything outside the dialog with aria-hidden
//      instead of marking the dialog aria-modal, which is a well supported
//      equivalent — but the AgentOS dialogs are also opened by plain buttons
//      that are not Radix triggers, and the audit for this port asks for the
//      explicit attribute. Both together are harmless.
//   2. Focus restoration. Radix returns focus to its DialogTrigger on close.
//      Most AgentOS dialogs are opened by an ordinary button, so there is no
//      trigger, and Radix would then drop focus on the body — the user would
//      be stranded at the top of the page. The element that had focus when the
//      dialog opened is remembered here and focused again on close.

import { useEffect, useRef, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { cn } from "../../../lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}) => {
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Remember what had focus before the dialog took it.
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-modal="true"
        className={cn(
          "max-w-lg border-white/10 bg-[#0d0d0f] text-white",
          className,
        )}
        onCloseAutoFocus={(event) => {
          const opener = openerRef.current;
          if (!opener || !document.contains(opener)) return;
          event.preventDefault();
          opener.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-white/50">{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="mt-2">{children}</div>
        {footer ? <DialogFooter className="mt-4">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
