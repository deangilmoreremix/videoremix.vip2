import React from 'react';

interface OutputItem {
  outputType: string;
  title: string;
  content: string;
}

interface PersonalizerResultsProps {
  outputs: OutputItem[];
}

export default function PersonalizerResults({ outputs }: PersonalizerResultsProps) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-lg font-semibold mb-3">Generated Outputs</h3>
      <div className="space-y-4">
        {outputs.map((output, index) => (
          <div key={`${output.outputType}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm uppercase tracking-wide text-slate-500">{output.outputType}</div>
            <h4 className="text-md font-semibold mt-1 mb-2">{output.title}</h4>
            <div className="whitespace-pre-wrap text-sm text-slate-700">{output.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
