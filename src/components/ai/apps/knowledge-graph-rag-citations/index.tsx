/**
 * Knowledge Graph RAG with Citations — Production UI
 *
 * Multi-hop question answering with verifiable source attribution. The user
 * supplies source documents (pasted text or uploaded text files); the runner
 * grounds every claim in a quoted passage ([n] citations), shows the entity
 * graph used for multi-hop reasoning, and flags ungrounded claims in `gaps`.
 *
 * When a vector store id is configured (see src/config/vectorStores.ts) the
 * server additionally enables file_search over that store.
 */

import { useState, useEffect } from "react";
import { Play, Loader2, BookOpen, FileText } from "lucide-react";
import type { AIAppProps } from "../types";
import { useRunAIApp } from "../useRunAIApp";
import { PromptTextarea } from "../../primitives/PromptTextarea";
import { BasicFileUpload } from "../../primitives/BasicFileUpload";
import { ResultActions } from "../../primitives/ResultActions";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";

interface Citation {
  ref?: string;
  sourceId?: string;
  quote?: string;
}

interface GraphTriple {
  entity?: string;
  relation?: string;
  target?: string;
}

export default function KnowledgeGraphRagCitations({ appId, appName, onResult, onError, onRunningChange, onReset }: AIAppProps) {
  const [sources, setSources] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [question, setQuestion] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const { run, isRunning, output, reset } = useRunAIApp(appId, { onResult, onError, onReset });

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const handleFile = (_file: File | null, content?: string) => {
    if (content) {
      setSources(content);
      setFileName(_file?.name ?? null);
    } else {
      setFileName(_file?.name ?? null);
    }
  };

  const handleRun = async () => {
    const trimmedSources = sources.trim();
    if (!trimmedSources || !question.trim()) return;
    await run({
      sources: trimmedSources,
      documentName: documentName.trim() || fileName || "provided document",
      question: question.trim(),
    });
  };

  const handleReset = () => {
    setSources("");
    setDocumentName("");
    setQuestion("");
    setFileName(null);
    reset();
  };

  const citations: Citation[] = Array.isArray(output?.citations) ? output.citations : [];
  const graph: GraphTriple[] = Array.isArray(output?.knowledgeGraph) ? output.knowledgeGraph : [];
  const reasoningPath: string[] = Array.isArray(output?.reasoningPath) ? output.reasoningPath : [];
  const gaps: string[] = Array.isArray(output?.gaps) ? output.gaps : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-primary-500" />
        <h2 className="text-2xl font-semibold">{appName}</h2>
      </div>
      <p className="text-gray-400 -mt-4">
        Multi-hop answers with verifiable source attribution. Paste your sources, ask a question, and every
        claim is grounded in a quoted passage.
      </p>

      {!output ? (
        <div className="space-y-6 max-w-3xl">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Sources</Label>
            <BasicFileUpload
              label="Upload a text document (optional)"
              accept=".txt,.md,.csv"
              onFileSelect={handleFile}
              disabled={isRunning}
            />
            <p className="mt-2 mb-1 text-xs text-gray-500">
              Or paste your document text below. Uploaded files are read as text (max 5 MB, first 10,000 characters).
            </p>
            <PromptTextarea
              label="Source documents"
              value={sources}
              onChange={(v) => setSources(v)}
              placeholder="Paste the document text you want answers grounded in…"
              rows={8}
              disabled={isRunning}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Document name (optional)</Label>
            <Input
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Q3 strategy memo"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2 block">Your question</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a multi-hop question about the sources…"
              disabled={isRunning}
              className="bg-black border-gray-700 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRun();
              }}
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={!sources.trim() || !question.trim() || isRunning}
            className="gap-2"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? "Researching…" : "Answer with citations"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
            <h3 className="mb-2 font-semibold text-gray-200">Answer</h3>
            <p className="whitespace-pre-wrap text-gray-200">{output.answer}</p>
            {output.confidence && (
              <p className="mt-3 text-xs text-gray-500">Confidence: {String(output.confidence)}</p>
            )}
          </div>

          {citations.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="mb-3 font-semibold text-gray-200">Citations</h3>
              <ol className="space-y-3">
                {citations.map((c, i) => (
                  <li key={i} className="rounded-lg border border-gray-800 bg-black p-3 text-sm">
                    <span className="font-mono text-primary-400">{c.ref || `[${i + 1}]`}</span>
                    {c.sourceId && <span className="ml-2 text-gray-500">({c.sourceId})</span>}
                    {c.quote && <p className="mt-1 text-gray-300">“{c.quote}”</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {graph.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="mb-3 font-semibold text-gray-200">Knowledge graph used</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                {graph.map((t, i) => (
                  <li key={i} className="font-mono text-xs">
                    {t.entity} — {t.relation} → {t.target}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reasoningPath.length > 0 && (
            <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-6">
              <h3 className="mb-3 font-semibold text-gray-200">Reasoning path</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-300">
                {reasoningPath.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {gaps.length > 0 && (
            <div className="rounded-xl border border-amber-800/50 bg-amber-900/10 p-6">
              <h3 className="mb-2 font-semibold text-amber-200">Not grounded in sources</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-100/80">
                {gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => reset()} className="gap-2">
              <FileText className="h-4 w-4" />
              New question
            </Button>
            <ResultActions onNew={handleReset} newLabel="Clear all" />
          </div>
        </div>
      )}
    </div>
  );
}
