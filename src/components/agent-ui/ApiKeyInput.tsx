import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export interface ApiKeyInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export function ApiKeyInput({
  label,
  value,
  onChange,
  helperText,
  error,
  required,
  className,
  id,
  ...props
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = React.useState(false);
  const inputId = id || `apikey-${label.toLowerCase().replace(/\s+/g, '-')}`;

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
        <Input
          id={inputId}
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-gray-900/50 border-gray-600 text-white pr-20",
            "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          aria-describedby={cn(helperText && `${inputId}-help`, error && `${inputId}-error`)}
          aria-invalid={error ? "true" : "false"}
          {...props}
        />

        {/* Reveal/hide toggle */}
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label={showKey ? "Hide API key" : "Show API key"}
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${inputId}-help`} className="text-xs text-gray-400 flex items-start gap-1.5">
          <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-cyan-500" />
          <span>{helperText}</span>
        </p>
      )}

      {/* Error */}
      {error && (
        <motion.p
          id={`${inputId}-error`}
          className="text-sm text-red-400 flex items-start gap-1.5"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.p>
      )}
    </div>
  );
}

// Import Input from shadcn
import { Input } from "@/components/ui/input";

// Icons
const Shield = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const AlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
