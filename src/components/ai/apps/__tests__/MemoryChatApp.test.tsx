import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryChatApp } from "../MemoryChatApp";

// The repo-wide test setup (tests/setup.ts) replaces localStorage with a
// spy Storage, so persistence is asserted via the setItem/removeItem spies.
const localStorageMock = localStorage as unknown as {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
};

const runMock = vi.fn(async () => {});
let mockOutput: any = null;
let mockIsRunning = false;
let mockStreamingContent = "";

vi.mock("../useRunAIApp", () => ({
  useRunAIApp: () => ({
    run: runMock,
    isRunning: mockIsRunning,
    output: mockOutput,
    error: null,
    reset: vi.fn(),
    isStreaming: mockIsRunning,
    streamingContent: mockStreamingContent,
    conversationHistory: [],
    clearHistory: vi.fn(),
    errorSuggestion: undefined,
  }),
}));

const props = {
  appId: "llm-app-personalized-memory",
  appName: "LLM App with Personalized Memory",
};

const FACTS_KEY = "videoremix:ai-chat-memory:llm-app-personalized-memory:facts";
const TURNS_KEY = "videoremix:ai-chat-memory:llm-app-personalized-memory";

describe("MemoryChatApp", () => {
  beforeEach(() => {
    runMock.mockClear();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    mockOutput = null;
    mockIsRunning = false;
    mockStreamingContent = "";
  });

  it("renders the chat shell with empty state", () => {
    render(<MemoryChatApp {...props} />);
    expect(screen.getByText("LLM App with Personalized Memory")).toBeInTheDocument();
    expect(screen.getByText(/Start the conversation/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
  });

  it("sends the message with the memory block and recent history", async () => {
    render(<MemoryChatApp {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/Type a message/), {
      target: { value: "My name is Ada and I love distributed systems" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(runMock).toHaveBeenCalledTimes(1));
    const inputs = runMock.mock.calls[0][0];
    expect(inputs.message).toBe("My name is Ada and I love distributed systems");
    expect(inputs.memory).toBe("");
    expect(inputs.history).toEqual([]);
  });

  it("persists (deduplicated) memory updates extracted from a run output", async () => {
    mockOutput = {
      reply: "Nice to meet you, Ada!",
      recalledFacts: [],
      memoryUpdates: [
        { fact: "User's name is Ada", type: "identity" },
        { fact: "User's name is Ada", type: "identity" },
      ],
    };
    render(<MemoryChatApp {...props} />);

    await waitFor(() => {
      expect(screen.getByText(/1 fact remembered in this browser/)).toBeInTheDocument();
    });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(FACTS_KEY, JSON.stringify(["User's name is Ada"]));
    // The conversation itself is persisted too.
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      TURNS_KEY,
      JSON.stringify([{ role: "assistant", content: "Nice to meet you, Ada!" }]),
    );
  });

  it("loads stored memory and forget-everything clears it", async () => {
    localStorageMock.getItem.mockImplementation((key: string) =>
      key === FACTS_KEY ? JSON.stringify(["Likes tea"]) : null,
    );
    mockOutput = null;

    render(<MemoryChatApp {...props} />);
    expect(screen.getByRole("button", { name: /Memory \(1\)/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Memory \(1\)/ }));
    expect(screen.getByText(/Likes tea/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Forget everything/ }));
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(FACTS_KEY);

    await waitFor(() => {
      expect(screen.getByText(/No memories stored yet/)).toBeInTheDocument();
    });
  });
});
