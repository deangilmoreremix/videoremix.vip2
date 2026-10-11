import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import KnowledgeGraphRagCitations from "../knowledge-graph-rag-citations";

const runMock = vi.fn(async () => {});
let mockOutput: any = null;
let mockIsRunning = false;

vi.mock("../useRunAIApp", () => ({
  useRunAIApp: () => ({
    run: runMock,
    isRunning: mockIsRunning,
    output: mockOutput,
    error: null,
    reset: vi.fn(),
    isStreaming: mockIsRunning,
    streamingContent: "",
    conversationHistory: [],
    clearHistory: vi.fn(),
    errorSuggestion: undefined,
  }),
}));

const props = {
  appId: "knowledge-graph-rag-citations",
  appName: "Knowledge Graph RAG with Citations",
};

describe("KnowledgeGraphRagCitations", () => {
  beforeEach(() => {
    runMock.mockClear();
    mockOutput = null;
    mockIsRunning = false;
  });

  it("requires sources and a question before running", () => {
    render(<KnowledgeGraphRagCitations {...props} />);
    expect(screen.getByRole("button", { name: /Answer with citations/ })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Paste the document text/), { target: { value: "Acme acquired Beta in 2024." } });
    fireEvent.change(screen.getByPlaceholderText(/multi-hop question/), { target: { value: "Who did Acme acquire?" } });
    expect(screen.getByRole("button", { name: /Answer with citations/ })).toBeEnabled();
  });

  it("runs with sources, document name, and question", async () => {
    render(<KnowledgeGraphRagCitations {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/Paste the document text/), {
      target: { value: "Acme acquired Beta in 2024." },
    });
    fireEvent.change(screen.getByPlaceholderText(/multi-hop question/), {
      target: { value: "Who did Acme acquire?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Answer with citations/ }));

    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1));
    const inputs = runMock.mock.calls[0][0];
    expect(inputs.sources).toBe("Acme acquired Beta in 2024.");
    expect(inputs.question).toBe("Who did Acme acquire?");
  });

  it("renders the cited answer, citations, and ungrounded-claim warnings", () => {
    mockOutput = {
      answer: "Acme acquired Beta in 2024 [1].",
      citations: [{ ref: "[1]", sourceId: "memo", quote: "Acme acquired Beta in 2024." }],
      knowledgeGraph: [{ entity: "Acme", relation: "acquired", target: "Beta" }],
      reasoningPath: ["Find the acquirer", "Find the target"],
      confidence: "high",
      gaps: ["Purchase price was not in the sources."],
    };
    render(<KnowledgeGraphRagCitations {...props} />);

    expect(screen.getByText("Acme acquired Beta in 2024 [1].")).toBeInTheDocument();
    expect(screen.getAllByText(/Citations/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Acme acquired Beta in 2024\./)).toBeInTheDocument();
    expect(screen.getByText(/Acme — acquired → Beta/)).toBeInTheDocument();
    expect(screen.getByText(/Find the acquirer/)).toBeInTheDocument();
    expect(screen.getByText(/Not grounded in sources/)).toBeInTheDocument();
    expect(screen.getByText(/Purchase price was not in the sources/)).toBeInTheDocument();
  });
});
