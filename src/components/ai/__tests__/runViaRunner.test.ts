import { describe, it, expect, beforeEach, vi } from "vitest";
import { runViaRunner } from "../../../pages/agents/runViaRunner";

// The canonical runner client (utils/supabase) is stubbed so the test asserts
// the bridge's own contract: Clerk bearer header, appSlug payload, userId
// stripping, and legacy response adaptation.
const getTokenMock = vi.fn(async () => "clerk-test-token");
vi.mock("../../../utils/supabase", () => ({
  getClerkTokenGetter: () => getTokenMock,
}));

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("runViaRunner (legacy agent pages → canonical runner bridge)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    getTokenMock.mockClear();
  });

  it("posts to run-ai-app with the Clerk bearer token and appSlug", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, appSlug: "deep-research-pro", output: { summary: "s" }, metadata: {} }),
    );

    const res = await runViaRunner("deep-research-pro", { topic: "AI" });

    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/functions/v1/run-ai-app");
    expect(init.headers.Authorization).toBe("Bearer clerk-test-token");
    const body = JSON.parse(init.body);
    expect(body.appSlug).toBe("deep-research-pro");
    expect(body.inputs).toEqual({ topic: "AI" });
    expect(body.stream).toBe(false);
  });

  it("drops the legacy client-supplied userId (identity comes from the JWT)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, output: { summary: "s" } }));

    await runViaRunner("fact-check-ai", { claim: "x", userId: "attacker-supplied" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.inputs).not.toHaveProperty("userId");
  });

  it("adapts the runner output to the legacy page contract", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        appSlug: "deep-research-pro",
        output: { summary: "found it", sources: [{ title: "t" }] },
        metadata: { model: "gpt-5.5" },
      }),
    );

    const res = await runViaRunner("deep-research-pro", { topic: "AI" });
    const data = await res.json();

    expect(data.result).toEqual({ summary: "found it", sources: [{ title: "t" }] });
    // Structured output keys are spread for pages that read data.<key>.
    expect(data.summary).toBe("found it");
    expect(data.sources).toEqual([{ title: "t" }]);
    expect(data.demo).toBe(false);
  });

  it("surfaces demo mode when the app has no specialized config", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        appSlug: "decision-helper",
        output: { summary: "Demo mode for decision-helper. Connect OPENAI_API_KEY and add config for full AI." },
        metadata: { demo: true },
      }),
    );

    const res = await runViaRunner("decision-helper", {});
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.demo).toBe(true);
  });

  it("returns ok=false with an error message on HTTP failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Insufficient credits" }, false, 402));

    const res = await runViaRunner("fact-check-ai", {});
    const data = await res.json();

    expect(res.ok).toBe(false);
    expect(res.status).toBe(402);
    expect(data.error).toBe("Insufficient credits");
  });

  it("converts FormData bodies (legacy upload pages) to a plain object", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, output: { summary: "s" } }));

    const fd = new FormData();
    fd.append("ask_a_question_about_the_pdf", "What is the revenue?");
    await runViaRunner("pdf-business-assistant", fd);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.inputs).toEqual({ ask_a_question_about_the_pdf: "What is the revenue?" });
  });

  it("still sends the request when the Clerk token getter is unavailable", async () => {
    getTokenMock.mockRejectedValueOnce(new Error("no session"));
    fetchMock.mockResolvedValue(jsonResponse({ success: true, output: { summary: "s" } }));

    const res = await runViaRunner("fact-check-ai", {});
    expect(res.ok).toBe(true);
    // Server rejects unauthenticated runs with 401 — that surfaces honestly.
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer ");
  });
});
