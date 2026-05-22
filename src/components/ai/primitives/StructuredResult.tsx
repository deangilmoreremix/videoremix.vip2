import React from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "../../ui/button";

interface StructuredResultProps {
  result: Record<string, any>;
  title?: string;
  onCopy?: (section: string, content: any) => void;
  onDownload?: () => void;
}

export const StructuredResult: React.FC<StructuredResultProps> = ({
  result,
  title = "Results",
  onCopy,
  onDownload,
}) => {
  const copyToClipboard = (key: string, content: any) => {
    const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(text);
    onCopy?.(key, content);
  };

  const sections = Object.entries(result).filter(([k]) => k !== "success" && k !== "metadata");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {onDownload && (
          <Button variant="outline" size="sm" onClick={onDownload} className="border-gray-700">
            <Download className="mr-2 h-4 w-4" /> Download JSON
          </Button>
        )}
      </div>

      {sections.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-gray-800 bg-[#0a0a0a] p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold capitalize text-primary-400">{key.replace(/([A-Z])/g, " $1")}</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(key, value)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {typeof value === "string" ? (
            <div className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{value}</div>
          ) : Array.isArray(value) ? (
            <ul className="space-y-2 text-sm text-gray-300">
              {value.map((item, i) => (
                <li key={i} className="border-l-2 border-primary-600 pl-3">
                  {typeof item === "string" ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          ) : (
            <pre className="text-xs text-gray-400 overflow-auto bg-black p-3 rounded">
              {JSON.stringify(value, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
};
