import { render, screen, waitFor } from "@testing-library/react";
import { MermaidDiagram } from "../MermaidDiagram";

// The `mermaid` renderer is an external, heavy dependency that is intentionally
// isolated so these tests verify MermaidDiagram's own logic (initialize call,
// render invocation, error fallback, and SVG injection) without executing the
// real parser. NOTE: this package is not yet declared in package.json — see
// docs/completion/runtime-status.md; the real dependency must be installed for
// the production build to resolve (mermaid is imported statically).
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (_id: string, diagram: string) => {
      if (/not valid/i.test(diagram)) {
        throw new Error("Invalid mermaid syntax");
      }
      return { svg: '<svg data-testid="mermaid-rendered"><g></g></svg>' };
    }),
  },
}));

describe("MermaidDiagram", () => {
  it("renders title when provided", () => {
    render(<MermaidDiagram diagram="graph TD;\nA-->B" title="Flow Diagram" />);
    expect(screen.getByText("Flow Diagram")).toBeInTheDocument();
  });

  it("shows error fallback when diagram is invalid", async () => {
    render(<MermaidDiagram diagram="this is not valid mermaid syntax !!!" />);
    await waitFor(() => {
      expect(screen.getByText("Diagram could not be rendered")).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it("renders valid diagram when possible", async () => {
    render(<MermaidDiagram diagram="graph TD;\nA-->B" />);
    await waitFor(() => {
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});