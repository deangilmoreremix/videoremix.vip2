import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { LANDING_APPS, LANDING_APP_COUNT, ACTIVE_GROUPS, countInGroup, resolveAppImage } from "../src/components/landing/landingData";
import { defaultPlans } from "../src/data/pricingPlans";

const publicDir = join(__dirname, "..", "public");

describe("landing catalog", () => {
  it("lists every app once and every group chip has apps", () => {
    expect(LANDING_APP_COUNT).toBe(117);
    expect(new Set(LANDING_APPS.map((a) => a.slug)).size).toBe(LANDING_APP_COUNT);
    for (const g of ACTIVE_GROUPS) expect(countInGroup(g.key)).toBeGreaterThan(0);
    expect(ACTIVE_GROUPS.reduce((n, g) => n + countInGroup(g.key), 0)).toBe(LANDING_APP_COUNT);
  });

  it("has an image file on disk for every app", () => {
    const missing = LANDING_APPS.filter((a) => {
      const path = resolveAppImage(a);
      return !path || !existsSync(join(publicDir, path));
    }).map((a) => a.slug);
    expect(missing).toEqual([]);
  });

  it("ships the social-share image", () => {
    expect(existsSync(join(publicDir, "og-image.jpg"))).toBe(true);
  });
});

describe("landing pricing", () => {
  it("keeps the prices in step with the Stripe sync script", () => {
    const byName = Object.fromEntries(defaultPlans.map((p) => [p.name, p]));
    expect([byName.Free.price_monthly, byName.Free.price_lifetime]).toEqual([0, 0]);
    expect([byName.Pro.price_monthly, byName.Pro.price_yearly, byName.Pro.price_lifetime]).toEqual([29, 290, 699]);
    expect([byName.Business.price_monthly, byName.Business.price_yearly, byName.Business.price_lifetime]).toEqual([79, 790, 1999]);
  });
});

describe("landing copy", () => {
  it("does not mention open source or the upstream project", () => {
    const dir = join(__dirname, "..", "src", "components", "landing");
    const offenders = readdirSync(dir)
      .filter((f) => /\.tsx$/.test(f))
      .filter((f) => /open[- ]?source|awesome[- ]llm|apache/i.test(readFileSync(join(dir, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
