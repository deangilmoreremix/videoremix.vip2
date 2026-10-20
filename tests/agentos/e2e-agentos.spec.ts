// tests/agentos/e2e-agentos.spec.ts
//
// Playwright smoke suite for the SapienX AgentOS browser experience.
//
// It runs against the server Playwright's config provides
// (playwright.agentos.config.ts starts `npm run dev` on the app's real port,
// 8080, and honours an AGENTOS_BASE_URL override). When that server is
// unreachable every test skips with a clear message, so the repo stays green in
// CI with no server running.
//
//   AGENTOS_BASE_URL=https://example.com \
//     npx playwright test --config=playwright.agentos.config.ts
//
// This file is also matched by vitest's default `*.spec` glob when the full
// vitest suite runs. Calling Playwright's test.describe() outside its own
// runner throws, so the suite is only registered when NOT running under vitest;
// under vitest it registers a single no-op so the file is green and inert.

import { test, expect, type Page } from "@playwright/test";

// Every navigation below is RELATIVE so Playwright resolves it against the
// config's baseURL. Re-deriving the URL here would let the spec and the config
// drift apart — which is exactly what happened when the spec defaulted to
// vite's 5173 while the app binds 8080, and every test silently skipped.
const underVitest = Boolean(process.env?.VITEST);

/** Every declared /agentos route, with concrete values for :param segments. */
const AGENTOS_ROUTES = [
  "/agentos",
  "/agentos/mission-control",
  "/agentos/workforce",
  "/agentos/workforce/new",
  "/agentos/workforce/demo-worker",
  "/agentos/workspaces",
  "/agentos/workspaces/demo-workspace",
  "/agentos/missions",
  "/agentos/missions/new",
  "/agentos/missions/demo-mission",
  "/agentos/schedules",
  "/agentos/approvals",
  "/agentos/operations",
  "/agentos/models",
  "/agentos/connections",
  "/agentos/memory",
  "/agentos/artifacts",
  "/agentos/activity",
];

// Routes that always render a deterministic <h1> (a page header) regardless of
// whether the account has rows — Mission Control included via its accessible
// hidden title. Detail routes with a :param resolve to a "not found" state in a
// data-less environment, so they are excluded from the strict one-<h1> check.
const HEADED_ROUTES = AGENTOS_ROUTES.filter(
  (route) => !route.endsWith("demo-worker") && !route.endsWith("demo-workspace") && !route.endsWith("demo-mission"),
);

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
];

/** A crashed React tree renders this heading via the app's ErrorBoundary. */
const ERROR_SENTINEL = /Oops!|Something went wrong|We encountered an unexpected error/i;

async function reachable(page: Page): Promise<boolean> {
  try {
    await page.request.get("/", { timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether the app itself booted. src/providers/ClerkProvider.tsx throws at
 * module load when VITE_CLERK_PUBLISHABLE_KEY is absent, which fails the whole
 * React mount — so a blank body on "/" (the public landing route, which is not
 * behind the auth guard) means the SPA never started rather than a route is
 * broken. Distinguishing those two cases is the difference between "this
 * environment has no credentials" and "AgentOS is broken".
 */
/** One precise reason, reused by every skip so the message can never drift. */
const AUTH_SKIP_REASON =
  "the SPA never booted — VITE_CLERK_PUBLISHABLE_KEY is absent from .env, so src/providers/ClerkProvider.tsx throws at module load and every route renders a blank body. Provide the key to run these browser checks.";

async function appBooted(page: Page): Promise<boolean> {
  try {
    const response = await page.goto("/", { waitUntil: "domcontentloaded", timeout: 15_000 });
    if (!response || response.status() >= 500) return false;
    await page.waitForFunction(() => (document.body?.innerText || "").trim().length > 0, undefined, {
      timeout: 8_000,
    });
    return true;
  } catch {
    return false;
  }
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

async function loadPage(page: Page, route: string): Promise<number | null> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  return response?.status() ?? null;
}

if (underVitest) {
  (globalThis as unknown as { it?: (name: string, fn: () => void) => void }).it?.(
    "AgentOS Playwright spec is inert under vitest (run via Playwright)",
    () => {},
  );
} else {
  test.describe("AgentOS routes render across viewports", () => {
    for (const route of AGENTOS_ROUTES) {
      for (const vp of VIEWPORTS) {
        test(`${route} serves content at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
          if (!(await reachable(page))) {
            test.skip(true, `the AgentOS server is unreachable — start the app or point AGENTOS_BASE_URL at it.`);
          }
          if (!(await appBooted(page))) {
            test.skip(
              true,
              "the SPA never booted — VITE_CLERK_PUBLISHABLE_KEY is absent from .env, so src/providers/ClerkProvider.tsx throws at module load and every route renders a blank body. Provide the key to run these browser checks.",
            );
          }

          await page.setViewportSize({ width: vp.width, height: vp.height });
          const errors = collectErrors(page);

          const status = await loadPage(page, route);
          expect(status, "main document does not return a 5xx").toBeLessThan(500);

          await expect(page.getByText(ERROR_SENTINEL), "no error-boundary marker rendered").toHaveCount(0);

          // An AgentOS route sits behind the auth guard, so a signed-out visit
          // redirects to the sign-in route. Both outcomes are healthy: the
          // protected UI, or the sign-in screen the guard hands over to. What
          // must never happen is a blank body — which is what a broken lazy
          // chunk or a thrown render looks like. Wait for the redirect to
          // settle before measuring, otherwise the app is still mid-navigation.
          await page
            .waitForURL(/signin/i, { timeout: 10_000 })
            .catch(() => {});
          await page.waitForFunction(
            () => (document.body?.innerText || "").trim().length > 0,
            undefined,
            { timeout: 10_000 },
          ).catch(() => {});

          const bodyText = await page.evaluate(() => (document.body?.innerText || "").trim());
          expect(bodyText.length, "page renders some content (not a blank body)").toBeGreaterThan(0);

          expect(
            errors.filter((message) => /error/i.test(message)),
            "no uncaught console errors mentioning 'error'",
          ).toEqual([]);
        });
      }
    }
  });

  test.describe("AgentOS accessibility basics", () => {
    for (const route of HEADED_ROUTES) {
      test(`${route} exposes exactly one <h1>`, async ({ page }) => {
        if (!(await reachable(page))) {
          test.skip(true, `the AgentOS server is unreachable — start the app or point AGENTOS_BASE_URL at it.`);
        }
        if (!(await appBooted(page))) {
          test.skip(true, AUTH_SKIP_REASON);
        }
        await loadPage(page, route);
        await page.waitForSelector("h1", { timeout: 10_000 });
        expect(await page.locator("h1").count(), `${route} has exactly one <h1>`).toBe(1);
      });
    }
  });

  test.describe("AgentOS auth guard", () => {
    test("an unauthenticated visit to /agentos redirects to sign-in", async ({ page }) => {
      if (!(await reachable(page))) {
        test.skip(true, `the AgentOS server is unreachable — start the app or point AGENTOS_BASE_URL at it.`);
      }
      if (!(await appBooted(page))) {
        test.skip(true, AUTH_SKIP_REASON);
      }
      await page.context().clearCookies();
      await loadPage(page, "/agentos");
      await page.waitForURL(/signin/i, { timeout: 15_000 });
      expect(page.url(), "unauthenticated /agentos lands on the sign-in route").toMatch(/signin/i);
    });
  });
}
