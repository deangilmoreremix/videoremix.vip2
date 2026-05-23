import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders title and collapsed by default", () => {
    render(<CollapsibleSection title="Test Section">Content here</CollapsibleSection>);
    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.queryByText("Content here")).toBeNull();
  });

  it("expands when clicked", () => {
    render(<CollapsibleSection title="Test Section">Content here</CollapsibleSection>);
    fireEvent.click(screen.getByText("Test Section"));
    expect(screen.getByText("Content here")).toBeVisible();
  });

  it("toggles expand/collapse", () => {
    render(<CollapsibleSection title="Test Section">Content here</CollapsibleSection>);
    const header = screen.getByText("Test Section").closest("button")!;
    fireEvent.click(header);
    expect(screen.getByText("Content here")).toBeVisible();
    fireEvent.click(header);
    expect(screen.queryByText("Content here")).toBeNull();
  });
});
