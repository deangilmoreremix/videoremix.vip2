// tests/free-apps.test.ts
//
// Every Awesome LLM app is free for a signed-in user (they run on the user's
// own key); purchases still gate everything else, and a signed-out visitor
// has no access.

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const clerk = vi.hoisted(() => ({ user: null as null | { id: string } }));
vi.mock("../src/providers/ClerkProvider", () => ({
  useUser: () => ({ user: clerk.user, isLoaded: true }),
  useSession: () => ({ session: null }),
}));
vi.mock("../src/utils/supabase", () => ({ supabase: {}, supabaseAuth: {} }));
vi.mock("../src/services/purchaseService", () => ({
  purchaseService: {
    getUserPurchasedApps: vi.fn(async () => []),
    getUserAppAccessDetails: vi.fn(async () => []),
    getAllUserPurchases: vi.fn(async () => []),
    checkUserHasAccess: vi.fn(async () => false),
  },
}));

describe("free apps", () => {
  it("opens every Awesome LLM app for a signed-in user", async () => {
    clerk.user = { id: "user_123" };
    const { useUserAccess } = await import("../src/hooks/useUserAccess");
    const { APP_REGISTRY } = await import("../src/config/appRegistry");
    const { result } = renderHook(() => useUserAccess());
    const awesome = APP_REGISTRY.filter((app) => app.family === "awesome-llm");
    expect(awesome.length).toBe(117);
    expect(awesome.filter((app) => !result.current.hasAccessToApp(app.slug)).map((app) => app.slug)).toEqual([]);
    // A paid VideoRemix app still needs a purchase.
    const paid = APP_REGISTRY.find((app) => app.family !== "awesome-llm");
    if (paid) expect(result.current.hasAccessToApp(paid.slug)).toBe(false);
  });

  it("gives a signed-out visitor nothing", async () => {
    clerk.user = null;
    const { useUserAccess } = await import("../src/hooks/useUserAccess");
    const { result } = renderHook(() => useUserAccess());
    expect(result.current.hasAccessToApp("ai-chess-agent")).toBe(false);
  });
});
