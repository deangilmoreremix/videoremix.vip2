import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { APP_REGISTRY } from "../src/config/appRegistry";
import { UPSTREAM_APP_SPECS, cleanLabel } from "../src/config/upstreamAppSpecs";
import { UPSTREAM_AUDIT } from "../src/config/upstreamAudit.generated";
import { appScreen, dashboardAppPath } from "../src/config/appScreens";
import { CONVERTED_APP_PAGES } from "../src/config/convertedAppPages";
import { Markdown } from "../src/components/apps/Markdown";

const awesome = APP_REGISTRY.filter((app) => app.family === "awesome-llm");

describe("upstream app screens", () => {
  it("every Awesome LLM app has an upstream spec with a title and a way to run it", () => {
    for (const app of awesome) {
      const spec = UPSTREAM_APP_SPECS[app.slug];
      expect(spec, app.slug).toBeDefined();
      expect(spec.title.length, app.slug).toBeGreaterThan(2);
      expect(spec.upstreamPath, app.slug).toBeTruthy();
      if (spec.layout !== "chat") expect(spec.runLabel, app.slug).toBeTruthy();
    }
    expect(Object.keys(UPSTREAM_APP_SPECS)).toHaveLength(117);
  });

  it("asks for no API keys: every app runs on the key the user saved once", () => {
    for (const spec of Object.values(UPSTREAM_APP_SPECS)) {
      for (const field of spec.fields) {
        expect(/api[\s_-]*key|secret|password/i.test(field.label), `${spec.slug}: ${field.label}`).toBe(false);
      }
    }
  });

  it("field names are unique within an app", () => {
    for (const spec of Object.values(UPSTREAM_APP_SPECS)) {
      const names = spec.fields.map((field) => field.name);
      expect(new Set(names).size, spec.slug).toBe(names.length);
    }
  });

  it("keeps upstream's own labels and defaults (spot checks)", () => {
    const travel = UPSTREAM_APP_SPECS["ai-travel-planner-mcp-agent"];
    expect(travel.runLabel).toBe("Generate Itinerary");
    expect(travel.fields.map((field) => field.label)).toEqual(
      expect.arrayContaining(["Destination", "Number of Days", "Budget (USD)", "Start Date"]),
    );
    const tour = UPSTREAM_APP_SPECS["ai-audio-tour-agent"];
    expect(tour.fields.find((field) => field.label === "Tour Duration (minutes)")?.value).toBe(10);
    expect(UPSTREAM_APP_SPECS["chat-with-pdf-gpt-llama3"].layout).toBe("chat");
    expect(UPSTREAM_APP_SPECS["scope-creep-detector"].fields.map((field) => field.name)).toEqual(["intent", "diff"]);
    expect(cleanLabel("🎙️ Generate Podcast:")).toBe("Generate Podcast");
  });

  it("opens a React page only when it matched upstream, and the upstream screen otherwise", () => {
    for (const app of awesome) {
      const screen = appScreen(app.slug);
      if (UPSTREAM_AUDIT[app.slug] !== "keep") expect(screen, app.slug).toBe("upstream");
      if (screen === "converted") expect(CONVERTED_APP_PAGES[app.slug], app.slug).toBeDefined();
      expect(dashboardAppPath(app.slug)).toMatch(/^\/dashboard\/(apps|agents)\//);
    }
    const counts = Object.values(UPSTREAM_AUDIT).reduce<Record<string, number>>((acc, verdict) => {
      acc[verdict] = (acc[verdict] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.new).toBe(26);
  });
});

describe("result markdown", () => {
  it("renders markdown and never injects HTML or script links", () => {
    const html = renderToStaticMarkup(
      createElement(Markdown, {
        source: "# Title\n\n**bold** and `code`\n\n- one\n- two\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1)) [ok](https://example.com)",
      }),
    );
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<li>one</li>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('href="javascript');
    expect(html).toContain('href="https://example.com"');
  });
});
