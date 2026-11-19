// scripts/conversion/audit-upstream-ui.ts
//
// Compare every existing React page of an Awesome LLM app with the app's
// upstream screen (src/config/upstreamAppSpecs.ts), and decide per app:
//   keep     the page has upstream's inputs, title and description
//   rebuild  it does not: the app opens UpstreamAppPage instead
//   new      the app had no React page (it used the standard form)
//
// Run: npx tsx scripts/conversion/audit-upstream-ui.ts
// Writes src/config/upstreamAudit.generated.ts (the verdicts the dashboard
// routes by) and docs/agentos/UPSTREAM_UI_REPORT.md (the table, for people).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { APP_REGISTRY } from "../../src/config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../../src/config/agentRegistry";
import { UPSTREAM_APP_SPECS, cleanLabel } from "../../src/config/upstreamAppSpecs";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "../..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "your", "you", "with", "in", "on", "is", "what", "do", "want",
  "enter", "select", "choose", "please", "optional", "e", "g", "eg", "ai", "app", "agent", "this", "it", "be", "by",
]);
const words = (text: string) =>
  new Set(
    cleanLabel(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 1 && !STOP.has(word)),
  );
function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

/** The page file each existing React page lives in. */
function pageFiles(): Map<string, string> {
  const files = new Map<string, string>();
  const converted = read("src/config/convertedAppPages.ts");
  for (const [, slug, module] of converted.matchAll(/"([a-z0-9-]+)":\s*\(\)\s*=>\s*import\("([^"]+)"\)/g)) {
    files.set(slug, normalize(join("src/config", module)) + ".tsx");
  }
  const app = read("src/App.tsx");
  for (const slug of AGENT_PAGE_SLUGS) {
    const component = new RegExp(`['"]${slug}['"]\\s*:\\s*([A-Za-z0-9_]+)`).exec(app)?.[1];
    const module = component ? new RegExp(`const ${component} = lazy\\(\\(\\) => import\\("([^"]+)"\\)`).exec(app)?.[1] : null;
    if (module) files.set(slug, normalize(join("src", module)) + ".tsx");
  }
  return files;
}

function pageFacts(source: string) {
  const labels: string[] = [];
  const patterns = [
    /\blabel\s*[=:]\s*["'`]([^"'`]{2,120})["'`]/g,
    /<(?:Label|label|CardTitle|legend)\b[^>]*>\s*([^<{]{2,120})</g,
    /\bplaceholder\s*[=:]\s*["'`]([^"'`]{2,160})["'`]/g,
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) labels.push(match[1].trim());
  // Every literal <h1>: the page title is one of them (others are result headings).
  const headings = [...source.matchAll(/<h1[^>]*>\s*([^<{]+)</g)].map((match) => match[1].trim()).filter(Boolean);
  const description = /name="description"\s+content="([^"]*)"/.exec(source)?.[1] ?? "";
  const hasInputs = /<(input|Input|textarea|Textarea|SmartInput|SmartTextarea|select|SelectDropdown|FileUploadZone)\b/.test(source);
  const hasChat = /chat|message|conversation/i.test(source) && /<(textarea|Textarea|input|Input|SmartTextarea|SmartInput)\b/.test(source);
  return { labels, headings, description, hasInputs, hasChat };
}

interface Verdict {
  slug: string;
  name: string;
  verdict: "keep" | "rebuild" | "new";
  layout: string;
  upstreamFields: number;
  matched: number;
  missing: string[];
  reasons: string[];
  page?: string;
}

const files = pageFiles();
const verdicts: Verdict[] = [];

for (const app of APP_REGISTRY.filter((entry) => entry.family === "awesome-llm")) {
  const spec = UPSTREAM_APP_SPECS[app.slug];
  const inputs = spec.fields.filter((field) => field.kind !== "chat");
  const file = files.get(app.slug);
  const base = { slug: app.slug, name: app.name, layout: spec.layout, upstreamFields: inputs.length };
  if (!file || !existsSync(join(ROOT, file))) {
    verdicts.push({ ...base, verdict: "new", matched: 0, missing: inputs.map((field) => field.label), reasons: ["no React page"] });
    continue;
  }
  const facts = pageFacts(read(file));
  const pageWords = facts.labels.map(words);
  const missing: string[] = [];
  for (const field of inputs) {
    const target = words(field.label);
    const found = pageWords.some((label) => overlap(label, target) >= 0.5);
    if (!found) missing.push(field.label);
  }
  const matched = inputs.length - missing.length;
  const reasons: string[] = [];
  if (inputs.length > 0 && matched / inputs.length < 0.75) reasons.push(`has ${matched} of ${inputs.length} upstream inputs`);
  if (spec.layout === "chat" && !facts.hasChat) reasons.push("upstream is a chat; the page is not");
  if (inputs.length > 0 && !facts.hasInputs) reasons.push("the page has no inputs");
  const titleWords = words(`${spec.title} ${app.name}`);
  if (facts.headings.length > 0 && !facts.headings.some((heading) => overlap(words(heading), titleWords) >= 0.5)) {
    reasons.push(`title "${facts.headings[0]}" is not this app`);
  }
  // A page's meta description that names an old marketing slug is copy, not
  // UI: fix-converted-page-copy.ts rewrites it, so it does not decide the verdict.
  verdicts.push({
    ...base,
    verdict: reasons.length === 0 ? "keep" : "rebuild",
    matched,
    missing,
    reasons,
    page: file,
  });
}

const count = (verdict: Verdict["verdict"]) => verdicts.filter((entry) => entry.verdict === verdict).length;

writeFileSync(
  join(ROOT, "src/config/upstreamAudit.generated.ts"),
  `// GENERATED by scripts/conversion/audit-upstream-ui.ts. Do not edit by hand.\n` +
    `// "keep": the app's React page matches upstream. "rebuild" / "new": the app\n` +
    `// opens UpstreamAppPage, which draws upstream's screen.\n\n` +
    `export const UPSTREAM_AUDIT: Record<string, "keep" | "rebuild" | "new"> = ${JSON.stringify(
      Object.fromEntries(verdicts.map((entry) => [entry.slug, entry.verdict])),
      null,
      1,
    )};\n`,
);

const rows = verdicts
  .sort((a, b) => a.verdict.localeCompare(b.verdict) || a.name.localeCompare(b.name))
  .map(
    (entry) =>
      `| ${entry.name} | ${entry.verdict} | ${entry.layout} | ${entry.matched}/${entry.upstreamFields} | ${
        entry.reasons.join("; ") || "matches upstream"
      } |`,
  );
writeFileSync(
  join(ROOT, "docs/agentos/UPSTREAM_UI_REPORT.md"),
  `# Upstream UI report\n\n` +
    `Each Awesome LLM app compared with its upstream screen (github.com/Shubhamsaboo/awesome-llm-apps).\n` +
    `Generated by \`npx tsx scripts/conversion/audit-upstream-ui.ts\`.\n\n` +
    `- **keep** (${count("keep")}): the React page has upstream's inputs, title and description.\n` +
    `- **rebuild** (${count("rebuild")}): it did not; the app now opens the upstream screen (UpstreamAppPage).\n` +
    `- **new** (${count("new")}): the app had no React page; it now opens the upstream screen.\n\n` +
    `| App | Verdict | Upstream layout | Inputs on the old page | Why |\n|---|---|---|---|---|\n` +
    rows.join("\n") +
    "\n",
);

console.log(`keep ${count("keep")}, rebuild ${count("rebuild")}, new ${count("new")}`);
for (const entry of verdicts.filter((item) => item.verdict === "keep")) console.log("  keep", entry.slug);
