import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectDropdownProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export function SelectDropdown({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  helperText,
  error,
  required,
  className,
}: SelectDropdownProps) {
  const selectId = React.useId();

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-gray-200 flex items-center gap-1.5"
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={cn(
            "w-full appearance-none bg-gray-900/50 border border-gray-600 text-white rounded-lg px-4 py-2.5 pr-10",
            "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            "hover:border-gray-500"
          )}
          aria-describedby={cn(helperText && `${selectId}-help`, error && `${selectId}-error`)}
          aria-invalid={error ? "true" : "false"}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {helperText && !error && (
        <p id={`${selectId}-help`} className="text-xs text-gray-400">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-400 flex items-center gap-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
