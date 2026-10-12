// src/components/agentos/ui/Modal.tsx
//
// Thin dark-themed wrapper over the shared Radix dialog, so every AgentOS
// dialog has one visual treatment.

import type { ReactNode } from "react";
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
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        "max-w-lg border-white/10 bg-[#0d0d0f] text-white",
        className,
      )}
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

export default Modal;
