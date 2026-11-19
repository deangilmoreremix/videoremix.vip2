// scripts/conversion/fix-converted-page-copy.ts
//
// The converted pages were generated with the page title and description of
// an old marketing slug ("Use ai-knowledgebase-debugger to play chess"). For
// every page the dashboard still opens (audit verdict "keep"), set the
// browser title and the description to the app's catalog name and
// description. Run after audit-upstream-ui.ts:
//   npx tsx scripts/conversion/fix-converted-page-copy.ts

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { APP_REGISTRY } from "../../src/config/appRegistry";
import { AGENT_PAGE_SLUGS } from "../../src/config/agentRegistry";
import { UPSTREAM_AUDIT } from "../../src/config/upstreamAudit.generated";

const ROOT = join(dirname(new URL(import.meta.url).pathname), "../..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const attr = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/[{}]/g, "");

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

// A file that serves two apps keeps its copy: it cannot name both.
const uses = new Map<string, number>();
for (const file of files.values()) uses.set(file, (uses.get(file) ?? 0) + 1);

let changed = 0;
for (const entry of APP_REGISTRY.filter((item) => item.family === "awesome-llm")) {
  const file = files.get(entry.slug);
  if (!file || UPSTREAM_AUDIT[entry.slug] !== "keep" || (uses.get(file) ?? 0) > 1) continue;
  const source = read(file);
  const next = source
    .replace(/<title>[^<]*<\/title>/g, `<title>${attr(entry.name)} — SapienX AgentOS</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/g, `$1${attr(entry.description)}$2`);
  if (next !== source) {
    writeFileSync(join(ROOT, file), next);
    changed += 1;
  }
}
console.log(`updated the title and description of ${changed} pages`);
