// tests/clerkKey.test.ts
import { describe, expect, it } from "vitest";
import { hostFromPublishableKey, resolvePublishableKey } from "../src/providers/clerkKey";

const GOOD = "pk_live_Y2xlcmsuYXV0aC52aWRlb3JlbWl4LnZpcCQ"; // clerk.auth.videoremix.vip$
const SHIPPED_BROKEN = "pk_live_LmNsZXJrLmFjY291bnRzLmRldiQ"; // .clerk.accounts.dev$

describe("Clerk publishable key", () => {
  it("reads the host from a well-formed key", () => {
    expect(hostFromPublishableKey(GOOD)).toBe("clerk.auth.videoremix.vip");
  });

  it("keeps a well-formed key", () => {
    expect(resolvePublishableKey(GOOD, "clerk.auth.videoremix.vip")).toEqual({ key: GOOD, rebuilt: false });
  });

  it("rebuilds the key production shipped, whose host has no instance name", () => {
    expect(hostFromPublishableKey(SHIPPED_BROKEN)).toBeNull();
    expect(resolvePublishableKey(SHIPPED_BROKEN, "clerk.auth.videoremix.vip")).toEqual({ key: GOOD, rebuilt: true });
  });

  it("rebuilds a key that is not base64 of a host at all", () => {
    expect(resolvePublishableKey("pk_live_", "https://clerk.auth.videoremix.vip/").key).toBe(GOOD);
  });

  it("still refuses to start without any key", () => {
    expect(() => resolvePublishableKey("  ", "clerk.auth.videoremix.vip")).toThrow(/Missing VITE_CLERK_PUBLISHABLE_KEY/);
  });
});
