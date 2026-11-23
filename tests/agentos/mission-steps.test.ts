import { describe, expect, it } from "vitest";
import {
  UPSTREAM_RESULT_CAP,
  appResultText,
  buildAppStepRequest,
  formatUpstreamResults,
  readAppStep,
  taskResultText,
} from "../../supabase/functions/_shared/mission-steps";

describe("mission steps", () => {
  it("reads an app step from a task's input", () => {
    expect(readAppStep({ app_step: { app_slug: "ai-journalist-agent", request: "Write it" } })).toEqual({
      app_slug: "ai-journalist-agent",
      request: "Write it",
    });
    expect(readAppStep({})).toBeNull();
    expect(readAppStep({ app_step: { request: "x" } })).toBeNull();
    expect(readAppStep(null)).toBeNull();
  });

  it("passes earlier results on, capped, and skips empty ones", () => {
    const long = "x".repeat(UPSTREAM_RESULT_CAP + 50);
    const block = formatUpstreamResults([
      { title: "1. Research", result: "Findings" },
      { title: "2. Empty", result: "  " },
      { title: "3. Long", result: long },
    ]);
    expect(block).toContain("## Results from earlier steps");
    expect(block).toContain("### 1. Research\nFindings");
    expect(block).not.toContain("2. Empty");
    expect(block).toContain(`cut to ${UPSTREAM_RESULT_CAP} characters`);
    expect(formatUpstreamResults([])).toBe("");
  });

  it("builds an app step's request from its job and the earlier results", () => {
    expect(buildAppStepRequest("Summarise", [])).toBe("Summarise");
    const request = buildAppStepRequest("", [{ title: "1. Research", result: "Findings" }]);
    expect(request).toMatch(/^Continue the work/);
    expect(request).toContain("Findings");
  });

  it("reduces an app's answer to text", () => {
    expect(appResultText({ success: true, output: { content: "Hello" } })).toBe("Hello");
    expect(appResultText({ output: "Plain" })).toBe("Plain");
    expect(appResultText({ output: { title: "T", points: [1] } })).toContain('"points"');
    expect(appResultText("raw")).toBe("raw");
  });

  it("reads a finished task's result", () => {
    expect(taskResultText({ result: "Done" })).toBe("Done");
    expect(taskResultText({ result: { a: 1 } })).toContain('"a": 1');
    expect(taskResultText(null)).toBe("");
    expect(taskResultText({})).toBe("");
  });
});
