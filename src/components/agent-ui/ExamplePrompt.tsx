import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Copy, Check, Zap } from "lucide-react";

export interface ExamplePromptProps {
  examples: string[];
  onSelect: (example: string) => void;
  title?: string;
}

export function ExamplePrompt({
  examples,
  onSelect,
  title = "Try an example:",
}: ExamplePromptProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    onSelect(text);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-cyan-500" />
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map((example, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => handleCopy(example, index)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-gray-300 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {copiedIndex === index ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-gray-400" />
                <span className="truncate max-w-xs">
                  {example.length > 40 ? `${example.slice(0, 40)}...` : example}
                </span>
              </>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
