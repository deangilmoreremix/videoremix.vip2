import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({
  ownedSet: new Set<string>(),
  userValue: null as { id: string; email: string } | null,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockHasAccessToApp = vi.fn(() => false);
vi.mock("../hooks/useUserAccess", () => ({
  useUserAccess: () => ({
    hasAccessToApp: (...args: any[]) => mockHasAccessToApp(...args),
    loading: false,
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: h.userValue }),
}));

vi.mock("../components/PurchaseModal", () => ({
  default: ({ isOpen, app }: any) =>
    isOpen ? <div data-testid="purchase-modal">{app?.name}</div> : null,
}));

import ApplicationsPage from "./ApplicationsPage";

beforeEach(() => {
  mockNavigate.mockClear();
  mockHasAccessToApp.mockClear();
  h.ownedSet = new Set<string>();
  h.userValue = null;
  mockHasAccessToApp.mockReturnValue(false);
});

describe("ApplicationsPage — dashboard visibility & ownership gating", () => {
  it("shows catalog apps and sign-in prompt for logged-out users", () => {
    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/One SapienX application catalog/i)).toBeTruthy();
    expect(screen.getByText(/Sign in to access your apps/i)).toBeTruthy();
  });

  it("opens purchase prompt when a locked app is clicked while logged out", () => {
    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    );
    const cards = screen.getAllByText("AI Personalization Studio");
    fireEvent.click(cards[0]);
    expect(screen.getByTestId("purchase-modal").textContent).toBe("AI Personalization Studio");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates owned internal apps through launch utility", () => {
    h.userValue = { id: "u1", email: "owner@test.com" };
    mockHasAccessToApp.mockReturnValue(true);

    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    );

    const cards = screen.getAllByText("Project Graveyard");
    fireEvent.click(cards[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/ai-runner/project-graveyard");
    expect(screen.queryByTestId("purchase-modal")).toBeNull();
  });

  it("still prompts purchase for unowned apps when signed in", () => {
    h.userValue = { id: "u1", email: "owner@test.com" };
    mockHasAccessToApp.mockReturnValue(false);

    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    );

    const cards = screen.getAllByText("Project Graveyard");
    fireEvent.click(cards[0]);
    expect(screen.getByTestId("purchase-modal").textContent).toBe("Project Graveyard");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
