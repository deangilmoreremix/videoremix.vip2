import * as React from "react";
import { motion } from "framer-motion";

export interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onCheckedChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
          checked ? "bg-violet-600" : "bg-gray-700",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
