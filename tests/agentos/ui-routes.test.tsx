// tests/agentos/ui-routes.test.tsx
//
// A browser-independent guard for the AgentOS port. For every AgentOS route it
// checks, against the SOURCE, that:
//   1. the page the route mounts actually exports a React component as default
//      (i.e. the <Route element={...}> is a real, lazy-loadable component), and
//   2. every internal `to=` / `navigate(` / breadcrumb target in the page (and
//      every AgentOS component) resolves to a route that `src/App.tsx` declares.
//
// This is deliberately deterministic and fast: it parses source and imports the
// page modules, never starting a server or a browser. Its job is to fail the
// build on a dead link or a route that points at a module with no component —
// the two defects a live smoke test can only hint at.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { describe, it, expect, vi } from "vitest";

// --- Modules that throw at import time without real env ---------------------
// src/utils/supabase.ts throws when VITE_SUPABASE_* are unset, and
// src/providers/ClerkProvider.tsx throws without VITE_CLERK_PUBLISHABLE_KEY.
// Pages pull both in transitively (services + useAuth), so stub them the same
// way the other AgentOS suites do — otherwise the page modules are not even
// importable, which would make the route guard unable to run.
vi.mock("../../src/utils/supabase", () => ({
  supabase: {
    from: () => {
      throw new Error("supabase is not used by the route/UI guard");
    },
    functions: { invoke: async () => ({ data: null, error: null }) },
  },
  setClerkTokenGetter: () => {},
}));

vi.mock("../../src/providers/ClerkProvider", () => ({
  useUser: () => ({ user: null }),
  useSession: () => ({ session: null }),
  useSignIn: () => ({}),
  useSignUp: () => ({}),
  useClerk: () => ({}),
  ClerkProvider: () => null,
  default: () => null,
}));

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const APP_TSX = join(ROOT, "src", "App.tsx");
const PAGES_DIR = join(ROOT, "src", "pages", "agentos");
const COMPONENTS_DIR = join(ROOT, "src", "components", "agentos");

const read = (path: string) => readFileSync(path, "utf8");

// ---------------------------------------------------------------------------
// The declared route set, parsed from src/App.tsx.
// ---------------------------------------------------------------------------
/**
 * Parse the route tree out of src/App.tsx.
 *
 * The AgentOS section is a LAYOUT route: `<Route path="/agentos">` with the
 * pages as children whose paths are relative ("workforce", "missions/:id").
 * A flat regex over every `path=` attribute would only see the relative
 * fragments, so the tree is walked instead: a route that has children is a
 * prefix for them.
 */
/**
 * The index of the ">" that ends a JSX opening tag.
 *
 * A naive text.indexOf(">") stops inside `element={<ProtectedRoute>…}`, so the
 * scan tracks braces, parens and quotes and only accepts a ">" at nesting
 * depth zero.
 */
function openingTagEnd(text: string, from: number): number {
  let index = from;
  let braces = 0;
  let parens = 0;
  let quote: string | null = null;

  while (index < text.length) {
    const ch = text[index];
    if (quote) {
      if (ch === "\\") {
        index += 2;
        continue;
      }
      if (ch === quote) quote = null;
      index += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      index += 1;
      continue;
    }
    if (ch === "{") {
      braces += 1;
      index += 1;
      continue;
    }
    if (ch === "}") {
      braces -= 1;
      index += 1;
      continue;
    }
    if (ch === "(") {
      parens += 1;
      index += 1;
      continue;
    }
    if (ch === ")") {
      parens -= 1;
      index += 1;
      continue;
    }
    if (ch === ">" && braces === 0 && parens === 0) return index;
    index += 1;
  }
  return -1;
}

function declaredRoutes(): string[] {
  const source = read(APP_TSX);
  const routes: string[] = [];

  /**
   * Parse the DIRECT children of a text block, resolving their paths against
   * `prefix`. A route that has children is a layout: its path becomes the
   * prefix for them.
   */
  const walk = (text: string, prefix: string): void => {
    const token = /<Route\b|<\/Route>/g;
    let match: RegExpExecArray | null;

    while ((match = token.exec(text)) !== null) {
      if (match[0] === "</Route>") continue;

      const openEnd = openingTagEnd(text, match.index);
      if (openEnd < 0) return;
      const openTag = text.slice(match.index, openEnd);
      const pathMatch = /\bpath=(?:"([^"]*)"|'([^']*)')/.exec(openTag);
      const raw = pathMatch ? (pathMatch[1] ?? pathMatch[2] ?? "") : "";
      const selfClosing = /\/\s*$/.test(openTag);

      const absolute = raw.startsWith("/") ? raw : `${prefix.replace(/\/$/, "")}/${raw}`;

      if (raw === "" || raw === "index") {
        routes.push(prefix === "" ? "/" : prefix);
      } else {
        routes.push(absolute);
      }

      if (selfClosing) {
        token.lastIndex = openEnd + 1;
        continue;
      }

      // The block of this route runs to its matching </Route>.
      let inner = 1;
      const innerToken = /<Route\b|<\/Route>/g;
      innerToken.lastIndex = openEnd + 1;
      let innerMatch: RegExpExecArray | null;
      let blockEnd = text.length;
      while ((innerMatch = innerToken.exec(text)) !== null) {
        if (innerMatch[0] === "</Route>") {
          inner -= 1;
          if (inner === 0) {
            blockEnd = innerMatch.index;
            break;
          }
        } else {
          inner += 1;
        }
      }

      const body = text.slice(openEnd + 1, blockEnd);
      if (body.includes("<Route")) walk(body, absolute);

      token.lastIndex = blockEnd;
    }
  };

  walk(source, "");
  return routes;
}

const ROUTES = declaredRoutes();

/**
 * Does a declared route match a concrete navigation target? Supports React
 * Router `:param` segments and a trailing `*` wildcard (which also matches the
 * base path, so `/dashboard` matches `/dashboard/*`).
 */
function routeMatches(declared: string, target: string): boolean {
  if (declared === target) return true;
  if (declared.endsWith("/*")) {
    const base = declared.slice(0, -2);
    return target === base || target.startsWith(`${base}/`);
  }
  const d = declared.split("/");
  const t = target.split("/");
  if (d.length !== t.length) return false;
  for (let i = 0; i < d.length; i += 1) {
    if (d[i].startsWith(":")) {
      if (t[i] === "") return false;
      continue;
    }
    if (d[i] === "*") return true;
    if (d[i] !== t[i]) return false;
  }
  return true;
}

function resolves(target: string): boolean {
  return ROUTES.some((declared) => routeMatches(declared, target));
}

/**
 * Extract every internal AgentOS link target from a source string. Targets are
 * the only link-bearing literals in this surface and always begin with
 * `/agentos` or `/dashboard`; template interpolations (`${…}`) become a
 * placeholder that any `:param` segment accepts.
 */
function extractLinkTargets(source: string): string[] {
  const targets: string[] = [];
  const re = /["'`](\/(?:agentos|dashboard)[^"'`]*)["'`]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const normalized = match[1].replace(/\$\{[^}]*\}/g, "__dynamic__");
    targets.push(normalized);
  }
  return targets;
}

function listFiles(dir: string, ext: RegExp): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listFiles(full, ext));
    } else if (ext.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const AGENTOS_ROUTE_NAMES = [
  "MissionControlPage",
  "WorkforcePage",
  "WorkerNewPage",
  "WorkerDetailPage",
  "WorkspacesPage",
  "WorkspaceDetailPage",
  "MissionsPage",
  "MissionNewPage",
  "MissionDetailPage",
  "SchedulesPage",
  "ApprovalsPage",
  "OperationsPage",
  "ModelsPage",
  "ConnectionsPage",
  "MemoryPage",
];

// Literal specifiers keep every page module statically resolvable by Vite.
const PAGE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  MissionControlPage: () => import("../../src/pages/agentos/MissionControlPage"),
  WorkforcePage: () => import("../../src/pages/agentos/WorkforcePage"),
  WorkerNewPage: () => import("../../src/pages/agentos/WorkerNewPage"),
  WorkerDetailPage: () => import("../../src/pages/agentos/WorkerDetailPage"),
  WorkspacesPage: () => import("../../src/pages/agentos/WorkspacesPage"),
  WorkspaceDetailPage: () => import("../../src/pages/agentos/WorkspaceDetailPage"),
  MissionsPage: () => import("../../src/pages/agentos/MissionsPage"),
  MissionNewPage: () => import("../../src/pages/agentos/MissionNewPage"),
  MissionDetailPage: () => import("../../src/pages/agentos/MissionDetailPage"),
  SchedulesPage: () => import("../../src/pages/agentos/SchedulesPage"),
  ApprovalsPage: () => import("../../src/pages/agentos/ApprovalsPage"),
  OperationsPage: () => import("../../src/pages/agentos/OperationsPage"),
  ModelsPage: () => import("../../src/pages/agentos/ModelsPage"),
  ConnectionsPage: () => import("../../src/pages/agentos/ConnectionsPage"),
  MemoryPage: () => import("../../src/pages/agentos/MemoryPage"),
};

const EXPECTED_AGENTOS_ROUTES = [
  "/agentos",
  "/agentos/mission-control",
  "/agentos/workforce",
  "/agentos/workforce/new",
  "/agentos/workforce/:workerId",
  "/agentos/workspaces",
  "/agentos/workspaces/:workspaceId",
  "/agentos/missions",
  "/agentos/missions/new",
  "/agentos/missions/:missionId",
  "/agentos/schedules",
  "/agentos/approvals",
  "/agentos/operations",
  "/agentos/models",
  "/agentos/connections",
  "/agentos/memory",
];

describe("AgentOS route registration (src/App.tsx)", () => {
  it("parses a non-empty route table", () => {
    expect(ROUTES.length).toBeGreaterThan(0);
  });

  it.each(EXPECTED_AGENTOS_ROUTES)("declares the /agentos route %s", (route) => {
    expect(ROUTES).toContain(route);
  });

  it("declares a dashboard route the sidebar/topbar link back to", () => {
    expect(ROUTES.some((r) => r === "/dashboard" || r === "/dashboard/*")).toBe(true);
  });
});

describe("AgentOS page modules", () => {
  it("has a page module file for every navigable page", () => {
    const files = readdirSync(PAGES_DIR).filter((f) => f.endsWith(".tsx"));
    for (const name of AGENTOS_ROUTE_NAMES) {
      expect(files).toContain(`${name}.tsx`);
    }
  });

  it.each(AGENTOS_ROUTE_NAMES)(
    "%s is lazy-loadable and exports a React component as default",
    async (name) => {
      const mod = await PAGE_LOADERS[name]();
      expect(typeof mod.default).toBe("function");
    },
  );
});

describe("every AgentOS link resolves to a declared route", () => {
  const scanned = [
    ...listFiles(PAGES_DIR, /\.tsx?$/).map((f) => ({
      label: relative(ROOT, f),
      source: read(f),
    })),
    ...listFiles(COMPONENTS_DIR, /\.tsx?$/).map((f) => ({
      label: relative(ROOT, f),
      source: read(f),
    })),
  ];

  // Collect every target once so the suite reports a stable count.
  const allTargets = scanned.flatMap((file) =>
    extractLinkTargets(file.source).map((target) => ({ file: file.label, target })),
  );

  it("finds a meaningful number of internal links to validate", () => {
    expect(allTargets.length).toBeGreaterThan(20);
  });

  const dead = allTargets.filter((link) => !resolves(link.target));

  it("has no dead links (every to=/navigate target is a declared route)", () => {
    expect(
      dead.map((d) => `${d.file}: "${d.target}"`),
    ).toEqual([]);
  });
});
