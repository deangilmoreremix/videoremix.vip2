// src/components/agentos/ui/FilterGroup.tsx
//
// A row of mutually exclusive filter buttons.
//
// WHY A SHARED COMPONENT
//   Every AgentOS list that filters did it with an unlabelled row of plain
//   buttons. Two things were missing: the row had no group name, so a screen
//   reader announced four anonymous buttons, and the active one had no state,
//   so there was no way to know which filter was on. aria-pressed carries
//   that state.
//
// WHY flex-wrap
//   The row is a horizontal flex box. On a narrow viewport a non-wrapping row
//   overflows the page instead of stacking, so the row wraps.

import { cn } from "../../../lib/utils";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export interface FilterGroupProps<T extends string> {
  /** Accessible name of the group, e.g. "Filter workers by status". */
  label: string;
  options: ReadonlyArray<FilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
}

export function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  buttonClassName,
}: FilterGroupProps<T>): React.ReactElement {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
              active ? "bg-violet-500/20 text-violet-200" : "text-white/50 hover:text-white",
              buttonClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default FilterGroup;
