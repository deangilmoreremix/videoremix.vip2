import React, { useState } from "react";
import { Copy, Download } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "text",
  title,
  showLineNumbers = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === "javascript" ? "js" : language === "typescript" ? "ts" : language === "python" ? "py" : "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = code.split("\n");

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      {title && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300 font-medium">
          {title}
        </div>
      )}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{language}</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {copied ? (
              <span className="text-xs text-green-400">Copied!</span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            title="Download as file"
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>
          {showLineNumbers ? (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td className="pr-4 text-gray-600 text-right select-none w-8">{i + 1}</td>
                    <td className="text-gray-100 whitespace-pre">{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="text-gray-100 whitespace-pre">{code}</span>
          )}
        </code>
      </pre>
    </div>
  );
};