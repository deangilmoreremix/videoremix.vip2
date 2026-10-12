import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getVectorStoreIds,
  setVectorStoreIds,
  withVectorStoreIds,
} from "../../../config/vectorStores";

// The repo test setup replaces localStorage with spy Storage.
const localStorageMock = localStorage as unknown as {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
};

describe("vector store id source (src/config/vectorStores)", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
  });

  it("returns no ids when nothing is configured", () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(getVectorStoreIds()).toEqual([]);
  });

  it("returns the stored selection when present", () => {
    localStorageMock.getItem.mockImplementation((key: string) =>
      key === "videoremix:vector-store-ids" ? JSON.stringify(["vs_test_123"]) : null,
    );
    expect(getVectorStoreIds()).toEqual(["vs_test_123"]);
  });

  it("persists and clears the selection", () => {
    setVectorStoreIds(["vs_a", "vs_b"]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "videoremix:vector-store-ids",
      JSON.stringify(["vs_a", "vs_b"]),
    );
    setVectorStoreIds([]);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("videoremix:vector-store-ids");
  });

  it("injects vector_store_ids only when configured", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const bare = withVectorStoreIds({ question: "hi" });
    expect(bare).toEqual({ question: "hi" });
    expect("vector_store_ids" in bare).toBe(false);

    localStorageMock.getItem.mockImplementation((key: string) =>
      key === "videoremix:vector-store-ids" ? JSON.stringify(["vs_x"]) : null,
    );
    expect(withVectorStoreIds({ question: "hi" })).toEqual({
      question: "hi",
      vector_store_ids: ["vs_x"],
    });
  });

  it("ignores corrupt stored selections", () => {
    localStorageMock.getItem.mockImplementation((key: string) =>
      key === "videoremix:vector-store-ids" ? "{not json" : null,
    );
    expect(getVectorStoreIds()).toEqual([]);
  });
});
