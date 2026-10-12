// src/components/agentos/ui/PageHeader.tsx
//
// The header used by every AgentOS page: title, optional description, optional
// breadcrumb trail, and the primary actions.

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface Breadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}) => (
  <div className={cn("mb-6", className)}>
    {breadcrumbs && breadcrumbs.length > 0 ? (
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-white/40">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="hover:text-white/70">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "text-white/60" : undefined}>{crumb.label}</span>
              )}
              {!isLast ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
            </span>
          );
        })}
      </nav>
    ) : null}

    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-white/50">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  </div>
);

export default PageHeader;
