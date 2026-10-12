// src/components/agentos/ui/Section.tsx
//
// Titled card wrapper used to group controls on every AgentOS surface.

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

export interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}) => (
  <section
    className={cn(
      "rounded-2xl border border-white/10 bg-black/40 backdrop-blur",
      className,
    )}
  >
    {title || actions ? (
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
        <div>
          {title ? <h2 className="text-sm font-semibold text-white">{title}</h2> : null}
          {description ? (
            <p className="mt-0.5 text-xs text-white/45">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
    ) : null}
    <div className={cn("p-5", contentClassName)}>{children}</div>
  </section>
);

export default Section;
