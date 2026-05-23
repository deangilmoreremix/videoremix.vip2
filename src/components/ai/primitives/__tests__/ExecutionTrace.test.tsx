import { render, screen, fireEvent } from "@testing-library/react";
import { ExecutionTrace } from "../ExecutionTrace";

describe("ExecutionTrace", () => {
  it("renders nothing when trace is null", () => {
    const { container } = render(<ExecutionTrace trace={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when trace is undefined", () => {
    const { container } = render(<ExecutionTrace trace={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows passed state correctly", () => {
    render(<ExecutionTrace trace={{ executedCode: "console.log(1)", stdout: "1", passed: true }} />);
    expect(screen.getByText("Passed")).toBeInTheDocument();
  });

  it("shows failed state correctly", () => {
    render(<ExecutionTrace trace={{ executedCode: "throw 1", stderr: "Error", passed: false }} />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows executed code when present", () => {
    render(<ExecutionTrace trace={{ executedCode: "const x = 1;", passed: true }} />);
    fireEvent.click(screen.getByText("Execution Trace"));
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("shows stdout in green", () => {
    render(<ExecutionTrace trace={{ stdout: "hello world", passed: true }} />);
    fireEvent.click(screen.getByText("Execution Trace"));
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("shows stderr in red", () => {
    render(<ExecutionTrace trace={{ stderr: "something went wrong", passed: false }} />);
    fireEvent.click(screen.getByText("Execution Trace"));
    expect(screen.getByText("something went wrong")).toBeInTheDocument();
  });
});