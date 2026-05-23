import { render, screen } from "@testing-library/react";
import { DiffViewer } from "../DiffViewer";

describe("DiffViewer", () => {
  it("renders original content", () => {
    render(<DiffViewer original="old code" modified="new code" />);
    expect(screen.getByText("old code")).toBeInTheDocument();
  });

  it("renders modified content", () => {
    render(<DiffViewer original="old code" modified="new code" />);
    expect(screen.getByText("new code")).toBeInTheDocument();
  });

  it("shows title when provided", () => {
    render(<DiffViewer original="a" modified="b" title="Changes" />);
    expect(screen.getByText("Changes")).toBeInTheDocument();
  });

  it("shows added lines with + marker", () => {
    render(<DiffViewer original="line1" modified="line1\nline2" />);
    const added = document.querySelector(".bg-green-900\\/20");
    expect(added).toBeInTheDocument();
  });

  it("shows removed lines with - marker", () => {
    render(<DiffViewer original="line1\nline2" modified="line1" />);
    const removed = document.querySelector(".bg-red-900\\/20");
    expect(removed).toBeInTheDocument();
  });
});