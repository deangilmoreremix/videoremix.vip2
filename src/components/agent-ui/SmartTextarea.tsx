import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface SmartTextareaProps extends React.ComponentProps<"textarea"> {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxChars?: number;
  example?: string;
}

const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  ({ label, name, value, onChange, helperText, error, required, showCharCount, maxChars, example, className, id, ...props }, ref) => {
    const inputId = id || `textarea-${name}`;
    const helpId = `${inputId}-help`;
    const errorId = `${inputId}-error`;

    const currentLength = value?.length || 0;
    const isOverLimit = maxChars ? currentLength > maxChars : false;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-200 flex items-center gap-1.5"
          >
            {label}
            {required && <span className="text-red-500" aria-hidden="true">*</span>}
          </Label>
          {showCharCount && (
            <span
              className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}
              aria-live="polite"
            >
              {currentLength}{maxChars ? ` / ${maxChars}` : ''}
            </span>
          )}
        </div>

        <Textarea
          ref={ref}
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-gray-900/50 border-gray-600 text-white transition-all duration-200 min-h-[120px]",
            "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "hover:border-gray-500",
            className
          )}
          aria-describedby={cn(helperText && helpId, error && errorId, example ? `${inputId}-example` : '')}
          aria-invalid={error ? "true" : "false"}
          aria-required={required}
          maxLength={maxChars}
          {...props}
        />

        {/* Helper text */}
        {helperText && !error && (
          <p id={helpId} className="text-xs text-gray-400 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-cyan-500" />
            <span>{helperText}</span>
          </p>
        )}

        {/* Example */}
        {example && !error && (
          <div id={`${inputId}-example`} className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Example:</p>
            <pre className="text-xs bg-gray-800/50 border border-gray-700/50 p-2 rounded overflow-x-auto">
              <code>{example}</code>
            </pre>
          </div>
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
SmartTextarea.displayName = "SmartTextarea";

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

export { SmartTextarea };
