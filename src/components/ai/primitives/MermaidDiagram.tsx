import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  diagram: string;
  title?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  diagram,
  title,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#3b82f6",
        primaryTextColor: "#e5e7eb",
        primaryBorderColor: "#4b5563",
        lineColor: "#9ca3af",
        secondaryColor: "#1f2937",
        tertiaryColor: "#111827",
      },
    });

    const renderDiagram = async () => {
      try {
        setError(false);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagram);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        setError(true);
      }
    };

    renderDiagram();
  }, [diagram]);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
      {title && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm text-gray-300 font-medium">
          {title}
        </div>
      )}
      <div className="p-4 flex items-center justify-center">
        {error ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>Diagram could not be rendered</p>
            <p className="text-xs mt-1 text-gray-600">Check diagram syntax</p>
          </div>
        ) : (
          <div ref={containerRef} className="mermaid-container" />
        )}
      </div>
    </div>
  );
};