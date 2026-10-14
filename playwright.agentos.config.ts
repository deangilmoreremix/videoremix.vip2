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
const DEFAULT_URL = "http://localhost:5173";

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
