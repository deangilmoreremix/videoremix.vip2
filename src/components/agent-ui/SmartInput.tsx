import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface SmartInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const SmartInput = React.forwardRef<HTMLInputElement, SmartInputProps>(
  ({ label, name, value, onChange, helperText, error, required, icon, className, id, ...props }, ref) => {
    const inputId = id || `input-${name}`;
    const helpId = `${inputId}-help`;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-200 flex items-center gap-1.5"
        >
          {label}
          {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </Label>

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "bg-gray-900/50 border-gray-600 text-white transition-all duration-200",
              "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "hover:border-gray-500",
              icon && "pl-10",
              className
            )}
            aria-describedby={cn(helperText && helpId, error && errorId)}
            aria-invalid={error ? "true" : "false"}
            aria-required={required}
            {...props}
          />
        </div>

        {/* Helper text */}
        {helperText && !error && (
          <p id={helpId} className="text-xs text-gray-400 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-cyan-500" />
            <span>{helperText}</span>
          </p>
        )}

        {/* Error message */}
        {error && (
          <motion.p
            id={errorId}
            className="text-sm text-red-400 flex items-start gap-1.5"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.p>
        )}
      </div>
    );
  }
);
SmartInput.displayName = "SmartInput";

// Icons
const Info = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const AlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export { SmartInput };
