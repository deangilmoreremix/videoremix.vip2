import React from "react";

interface DiffViewerProps {
  original: string;
  modified: string;
  title?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  title,
}) => {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");

  const computeDiff = () => {
    const result: Array<{ type: "same" | "added" | "removed"; content: string }> = [];
    const maxLen = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLen; i++) {
      const o = originalLines[i];
      const m = modifiedLines[i];

      if (o === m) {
        result.push({ type: "same", content: o ?? "" });
      } else {
        if (o !== undefined) {
          result.push({ type: "removed", content: o });
        }
        if (m !== undefined) {
          result.push({ type: "added", content: m });
        }
      }
    }
    return result;
  };

  const diff = computeDiff();

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      {title && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300 font-medium">
          {title}
        </div>
      )}
      <div className="flex text-sm font-mono">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full">
            <tbody>
              {diff.map((line, i) => (
                <tr key={i} className={line.type === "added" ? "bg-green-900/20" : line.type === "removed" ? "bg-red-900/20" : ""}>
                  <td className="px-3 py-1 whitespace-pre text-gray-100 border-b border-gray-800">
                    {line.type === "added" && (
                      <span className="text-green-400 mr-2">+</span>
                    )}
                    {line.type === "removed" && (
                      <span className="text-red-400 mr-2">-</span>
                    )}
                    {line.type === "same" && (
                      <span className="text-gray-600 mr-2"> </span>
                    )}
                    {line.content || " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};