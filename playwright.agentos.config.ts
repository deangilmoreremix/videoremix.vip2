// playwright.agentos.config.ts
//
// A dedicated Playwright config for the AgentOS browser E2E spec. It is
// intentionally separate from any app config so it can be run in isolation:
//   npx playwright test --config=playwright.agentos.config.ts
//
// BEHAVIOR
//   * testDir points at tests/agentos, but testMatch narrows the run to the
//     single e2e spec — the *.test.ts service suites in that directory are
//     vitest files and must never be loaded by Playwright.
//   * A dev server is started ONLY when AGENTOS_BASE_URL is not overridden, so
//     an externally-hosted / CI-provided instance is used exactly as given and
//     never fights a second `npm run dev`.

import { defineConfig, devices } from "@playwright/test";

const override = (process.env.AGENTOS_BASE_URL || "").trim();
// The app's own vite config pins the dev port to 8080 (vite.config.ts:60), so
// that is what `npm run dev` actually binds. Pointing this at vite's default of
// 5173 made the webServer wait forever for a server that never appears.
const DEFAULT_URL = "http://localhost:8080";
/** The port the dev server binds, kept in sync with vite.config.ts. */
const DEV_PORT = 8080;

export default defineConfig({
  testDir: "./tests/agentos",
  testMatch: /e2e-agentos\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: override || DEFAULT_URL,
    trace: "off",
    screenshot: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: override
    ? undefined
    : {
        command: "npm run dev",
        url: DEFAULT_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
