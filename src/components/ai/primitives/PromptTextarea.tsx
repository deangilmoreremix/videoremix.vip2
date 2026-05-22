import React, { useState } from "react";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";

interface PromptTextareaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  hint?: string;
}

export const PromptTextarea: React.FC<PromptTextareaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  maxLength = 2000,
  rows = 6,
  hint,
}) => {
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, maxLength);
    onChange(newValue);
    setCharCount(newValue.length);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium text-gray-300">{label}</Label>
        <span className="text-xs text-gray-500">{charCount}/{maxLength}</span>
      </div>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-primary-500"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};
