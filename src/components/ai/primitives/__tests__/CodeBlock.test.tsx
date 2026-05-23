import { render, screen } from "@testing-library/react";
import { CodeBlock } from "../CodeBlock";

describe("CodeBlock", () => {
  it("renders code content", () => {
    render(<CodeBlock code="const x = 1;" language="typescript" />);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("displays language label", () => {
    render(<CodeBlock code="print('hello')" language="python" />);
    expect(screen.getByText("python")).toBeInTheDocument();
  });

  it("has copy button", () => {
    render(<CodeBlock code="test" />);
    expect(screen.getByTitle("Copy code")).toBeInTheDocument();
  });

  it("has download button", () => {
    render(<CodeBlock code="test" />);
    expect(screen.getByTitle("Download as file")).toBeInTheDocument();
  });

  it("shows title when provided", () => {
    render(<CodeBlock code="test" title="My Script" />);
    expect(screen.getByText("My Script")).toBeInTheDocument();
  });

  it("shows line numbers when enabled", () => {
    render(<CodeBlock code="line1\nline2" showLineNumbers />);
    const cells = document.querySelectorAll("td");
    expect(cells.length).toBe(4);
  });
});