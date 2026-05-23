import { render, screen, waitFor } from "@testing-library/react";
import { MermaidDiagram } from "../MermaidDiagram";

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