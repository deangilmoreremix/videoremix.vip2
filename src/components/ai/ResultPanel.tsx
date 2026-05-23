import React, { useState } from "react";
import { Copy, Check, Save, Maximize2, Minimize2 } from "lucide-react";
import { CollapsibleSection } from "./primitives/CollapsibleSection";

interface ResultPanelProps {
  result: any;
  onCopy?: (content: string) => void;
  onSave?: () => void;
  appSlug?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onCopy,
  onSave,
  appSlug,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = (content: string, key?: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key || "full");
    setTimeout(() => setCopiedKey(null), 2000);
    onCopy?.(content);
  };

  const handleCopyKey = (key: string, value: any) => {
    const content = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    handleCopy(content, key);
  };

  const renderValue = (key: string, value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) return null;

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <CollapsibleSection title={key} defaultExpanded={depth === 0}>
          <div className="space-y-2 pl-4 border-l-2 border-gray-700">
            {Object.entries(value).map(([subKey, subValue]) => (
              <div key={subKey} className="flex items-start gap-2">
                <span className="text-xs text-gray-400 min-w-[100px]">{subKey}:</span>
                <div className="flex-1">
                  {typeof subValue === "object" ? (
                    renderValue(subKey, subValue, depth + 1)
                  ) : (
                    <span className="text-sm text-gray-300">{String(subValue)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleCopyKey(subKey, subValue)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title={`Copy ${subKey}`}
                >
                  {copiedKey === subKey ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      );
    }

    if (Array.isArray(value)) {
      return (
        <CollapsibleSection title={`${key} (${value.length} items)`}>
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded">
                <span className="text-gray-500 text-xs">{idx + 1}.</span>
                <div className="flex-1">
                  {typeof item === "object" ? (
                    <div className="space-y-1">
                      {Object.entries(item).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-xs text-gray-400">{k}:</span>
                          <span className="text-sm text-gray-300">
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300">{String(item)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleCopyKey(`${key}[${idx}]`, item)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  {copiedKey === `${key}[${idx}]` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      );
    }

    return (
      <div className="flex items-start gap-2">
        <span className="text-sm text-gray-300 break-all">{String(value)}</span>
      </div>
    );
  };

  const panelContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(JSON.stringify(result, null, 2))}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            {copiedKey === "full" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            Copy Full JSON
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Save to Workspace
            </button>
          )}
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="flex items-start gap-3">
            <span className="text-sm font-medium text-gray-400 min-w-[120px] capitalize">{key}:</span>
            <div className="flex-1 min-w-0">{renderValue(key, value)}</div>
            <button
              onClick={() => handleCopyKey(key, value)}
              className="p-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
              title={`Copy ${key}`}
            >
              {copiedKey === key ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Results: {appSlug}</h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Minimize2 className="h-6 w-6" />
            </button>
          </div>
          {panelContent}
        </div>
      </div>
    );
  }

  return <div className="bg-[#111] rounded-xl border border-gray-800 p-6">{panelContent}</div>;
};