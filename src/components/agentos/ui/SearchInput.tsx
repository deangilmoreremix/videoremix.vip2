// src/components/agentos/ui/SearchInput.tsx
//
// The search box every AgentOS list uses.
//
// WHY A SHARED COMPONENT
//   Four surfaces had their own hand-rolled search input, and each of them
//   used the placeholder as the only accessible name. A placeholder is not a
//   label: it disappears as soon as the field has a value, and it is not
//   reliably announced by every screen reader. The label lives here, visually
//   hidden, so the input always has a stable accessible name.

import type { KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../lib/utils";

export interface SearchInputProps {
  /** Must be unique on the page — it ties the label to the input. */
  id: string;
  /** The accessible name. Rendered visually hidden. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called on Enter. */
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  id,
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  inputClassName,
  autoFocus,
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-violet-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50",
          inputClassName,
        )}
      />
    </div>
  );
};

export default SearchInput;
