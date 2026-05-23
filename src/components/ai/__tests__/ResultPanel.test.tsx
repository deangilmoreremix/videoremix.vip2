import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ResultPanel } from "../ResultPanel";

describe("ResultPanel", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      configurable: true,
    });
  });

  const mockResult = {
    summary: "Test summary",
    opportunities: ["opp1", "opp2"],
    nextSteps: ["step1", "step2"],
  };

  it("renders result content", () => {
    render(<ResultPanel result={mockResult} onCopy={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText("summary:")).toBeInTheDocument();
  });

  it("calls onCopy when copy button clicked", () => {
    const onCopy = vi.fn();
    render(<ResultPanel result={mockResult} onCopy={onCopy} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy Full JSON" }));
    expect(onCopy).toHaveBeenCalled();
  });

  it("shows expand/collapse for nested objects", () => {
    render(<ResultPanel result={mockResult} onCopy={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText("opportunities (2 items)")).toBeInTheDocument();
  });
});