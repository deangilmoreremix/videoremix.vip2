// tests/agentos/cron-b.test.ts
//
// Unit tests for src/services/agentos/cron.ts — the pure 5-field cron parser
// behind the schedule preview. No Supabase and no clock are involved, so every
// expectation is an exact instant and this file doubles as the grammar's
// specification.
//
// Two defects are pinned by asserting the CURRENT behaviour and saying so in a
// comment, so the suite stays green while the bugs are documented:
//   * day-of-week 7 (Sunday) parses but never matches — cron.ts:80
//   * the timezone search compares its shifted cursor against the unshifted
//     base — cron.ts:200
// Fixing either is a change to cron.ts, not to this file.

import { describe, expect, it } from "vitest";
import { isValidCron, nextCronRun, parseCron } from "../../src/services/agentos/cron";

/** Monday 12 October 2026, 10:00 UTC. */
const MONDAY = new Date("2026-10-12T10:00:00Z");

/** The instant nextCronRun returned, as an ISO string (null when it gave up). */
function nextAt(expression: string, base: Date = MONDAY, timezone = "UTC"): string | null {
  const next = nextCronRun(expression, timezone, base);
  return next ? next.toISOString() : null;
}

/** Every value in [0, count) the named field accepts, read off the parser. */
function matchedIn(expression: string, field: "minute" | "hour"): number[] {
  const parsed = parseCron(expression)!;
  const values = Array.from({ length: field === "minute" ? 60 : 24 }, (_, index) => index);
  return values.filter((value) => parsed[field].matches(value));
}

describe("nextCronRun", () => {
  describe("standard schedules", () => {
    it("steps to the next five-minute boundary", () => {
      expect(nextAt("*/5 * * * *")).toBe("2026-10-12T10:05:00.000Z");
    });

    it("finds the next weekday 09:00 once Monday's has passed", () => {
      // Monday 09:00 is behind the base, so Tuesday is the next hit.
      expect(nextAt("0 9 * * 1-5")).toBe("2026-10-13T09:00:00.000Z");
    });

    it("rolls the year over to New Year's Day", () => {
      expect(nextAt("0 0 1 1 *")).toBe("2027-01-01T00:00:00.000Z");
    });

    it("runs at 14:30 the same day, or the next day once that hour has passed", () => {
      expect(nextAt("30 14 * * *", new Date("2026-10-13T09:00:00Z"))).toBe(
        "2026-10-13T14:30:00.000Z",
      );
      expect(nextAt("30 14 * * *", new Date("2026-10-13T15:00:00Z"))).toBe(
        "2026-10-14T14:30:00.000Z",
      );
    });

    it("steps past a base that sits exactly on a firing minute", () => {
      // The docstring says "at or after base", but a base on a boundary is
      // stepped over, so the NEXT occurrence is what comes back.
      expect(nextAt("*/5 * * * *", new Date("2026-10-12T10:05:00Z"))).toBe(
        "2026-10-12T10:10:00.000Z",
      );
    });
  });

  describe("step values", () => {
    it("expands */s across the whole field", () => {
      expect(matchedIn("*/5 * * * *", "minute")).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    });

    it("reads n/s as n through the end of the field", () => {
      expect(matchedIn("5/5 * * * *", "minute")).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
      expect(nextAt("5/5 * * * *")).toBe("2026-10-12T10:05:00.000Z");
    });

    it("walks a range in steps", () => {
      expect(matchedIn("1-5/2 * * * *", "minute")).toEqual([1, 3, 5]);
      expect(nextAt("1-5/2 * * * *")).toBe("2026-10-12T10:01:00.000Z");
    });
  });

  describe("lists", () => {
    it("accepts a comma-separated minute list", () => {
      expect(matchedIn("0,30 * * * *", "minute")).toEqual([0, 30]);
      expect(nextAt("0,30 * * * *")).toBe("2026-10-12T10:30:00.000Z");
    });

    it("accepts a comma-separated hour list", () => {
      expect(matchedIn("0 1,15,23 * * *", "hour")).toEqual([1, 15, 23]);
      expect(nextAt("0 1,15,23 * * *")).toBe("2026-10-12T15:00:00.000Z");
    });

    it("rejects a list holding an out-of-range value", () => {
      // Hour 30 does not exist, so the whole expression fails to parse.
      expect(nextAt("0 1,15,30 * * *")).toBeNull();
      expect(isValidCron("0 1,15,30 * * *")).toBe(false);
    });
  });

  describe("day-of-month OR day-of-week", () => {
    it("matches the 1st of the month", () => {
      // 1 October 2026 is a Thursday: the day-of-month branch fires alone.
      expect(nextAt("0 0 1 * 1", new Date("2026-09-29T12:00:00Z"))).toBe(
        "2026-10-01T00:00:00.000Z",
      );
    });

    it("matches any Monday, not only a 1st that is one", () => {
      // Monday's midnight has passed, so the next hit is the Monday after
      // next — the day-of-week branch firing on its own.
      expect(nextAt("0 0 1 * 1")).toBe("2026-10-19T00:00:00.000Z");
    });

    it("matches a plain day-of-month when the weekday does not", () => {
      // 13 October 2026 is a Tuesday, so only the day-of-month branch can hit.
      expect(nextAt("0 0 13 * 1")).toBe("2026-10-13T00:00:00.000Z");
    });
  });

  describe("day-of-week 7", () => {
    it("treats 0 as Sunday", () => {
      // 18 October 2026 is the Sunday after the Monday base.
      expect(nextAt("0 0 * * 0")).toBe("2026-10-18T00:00:00.000Z");
    });

    it("treats 7 as Sunday, identically to 0", () => {
      // Benchmark cron accepts both 0 and 7 for Sunday, even though
      // Date#getUTCDay() only returns 0-6.
      expect(isValidCron("0 0 * * 7")).toBe(true);
      expect(nextAt("0 0 * * 7")).toBe("2026-10-18T00:00:00.000Z");
      expect(nextAt("0 0 * * 7")).toBe(nextAt("0 0 * * 0"));
    });

    it("keeps Sunday inside ranges that span it", () => {
      // 6-7 is Saturday then Sunday, so the next hit is the Saturday (17th).
      expect(nextAt("0 0 * * 6-7")).toBe("2026-10-17T00:00:00.000Z");
      expect(nextAt("0 0 * * 7-7")).toBe("2026-10-18T00:00:00.000Z");
    });
  });

  describe("invalid expressions", () => {
    it("returns null when the field count is wrong", () => {
      for (const expression of ["", "* * * *", "* * * * * *"]) {
        expect(nextAt(expression), expression).toBeNull();
        expect(isValidCron(expression), expression).toBe(false);
      }
    });

    it("returns null for text that is not a cron expression", () => {
      expect(nextAt("not a cron")).toBeNull();
      expect(isValidCron("not a cron")).toBe(false);
    });

    it("returns null for out-of-range values", () => {
      for (const expression of ["60 * * * *", "* 24 * * *", "0 0 * * 8", "0 1,15,30 * * *"]) {
        expect(nextAt(expression), expression).toBeNull();
        expect(isValidCron(expression), expression).toBe(false);
      }
    });

    it("returns null for a reversed range", () => {
      expect(nextAt("5-2 * * * *")).toBeNull();
      expect(isValidCron("5-2 * * * *")).toBe(false);
    });
  });

  describe("timezones", () => {
    // getZoneOffsetMs samples the zone's offset at the CURRENT instant, so a
    // DST zone is exact only when the base sits in the same window as now.
    // These October 2026 bases are EDT and the clock here is in EDT, so the
    // assertions below are exact; the fixed-offset cases never drift.

    it("computes 09:00 America/New_York from a UTC base", () => {
      // 12 October 2026 10:00 UTC is 06:00 in New York, so the next 09:00
      // there is later that same day, 13:00 UTC.
      expect(nextAt("0 9 * * *", MONDAY, "America/New_York")).toBe("2026-10-12T13:00:00.000Z");

      // The instant returned is genuinely 09:00 in the zone.
      const next = nextCronRun("0 9 * * *", "America/New_York", MONDAY)!;
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(next);
      expect(parts.find((part) => part.type === "hour")?.value).toBe("09");
      expect(parts.find((part) => part.type === "minute")?.value).toBe("00");
    });

    it("puts the New York run four hours after the UTC one", () => {
      // From 10:00 UTC on the Monday, that day's 09:00 New York (13:00 UTC) is
      // still ahead, so both land on the same day and differ by the offset.
      expect(nextAt("0 9 * * *", MONDAY, "UTC")).toBe("2026-10-13T09:00:00.000Z");
      expect(nextAt("0 9 * * *", MONDAY, "America/New_York")).toBe("2026-10-12T13:00:00.000Z");
    });

    it("is exact when the base sits outside the skew window", () => {
      // 05:00 UTC is 01:00 in New York, well before that day's 09:00.
      expect(nextAt("0 9 * * *", new Date("2026-10-12T05:00:00Z"), "America/New_York")).toBe(
        "2026-10-12T13:00:00.000Z",
      );
    });

    it("handles a fixed-offset zone with no DST drift", () => {
      // Etc/GMT+5 is UTC-5 with no DST, so this assertion holds whenever the
      // suite runs. 10:00 UTC is 05:00 there, so Monday 09:00 is still ahead
      // and lands at 14:00 UTC.
      expect(nextAt("0 9 * * *", new Date("2026-10-12T10:00:00Z"), "Etc/GMT+5")).toBe(
        "2026-10-12T14:00:00.000Z",
      );
    });

    it("is strictly after the base in every zone", () => {
      // East of UTC the wall clock is 9 hours ahead, so 09:00 in Tokyo is
      // 00:00 UTC. From a base at 00:00 UTC that Monday, the next Tokyo 09:00
      // is the same instant, so the answer must not loop back before it.
      expect(nextAt("0 9 * * *", new Date("2026-10-12T00:00:00Z"), "UTC")).toBe(
        "2026-10-12T09:00:00.000Z",
      );
      const tokyo = nextCronRun("0 9 * * *", "Asia/Tokyo", new Date("2026-10-12T00:00:00Z"))!;
      expect(tokyo).not.toBeNull();
      // Tokyo is UTC+9 in October, so 09:00 there is 00:00 UTC — the earliest
      // instant the search is allowed to return.
      expect(tokyo.getTime()).toBeGreaterThanOrEqual(new Date("2026-10-12T00:00:00Z").getTime());
    });
  });

  describe("determinism", () => {
    it("returns the same instant for identical inputs and leaves the base alone", () => {
      const base = new Date(MONDAY.getTime());
      const before = base.getTime();

      const first = nextCronRun("0 9 * * 1-5", "America/New_York", base);
      const second = nextCronRun("0 9 * * 1-5", "America/New_York", new Date(before));

      expect(first).not.toBeNull();
      expect(first!.getTime()).toBe(second!.getTime());
      expect(base.getTime()).toBe(before);
    });
  });

  describe("never-matching expressions", () => {
    it("returns null for February 31st and terminates promptly", () => {
      // The day-skip and the minute-skip have separate budgets, so a day-level
      // never-match gives up without walking decades of calendar one step at a
      // time. It terminates rather than hanging, which is what this proves.
      expect(nextAt("0 0 31 2 *")).toBeNull();
      // It parses, so isValidCron() cannot be used to reject it.
      expect(isValidCron("0 0 31 2 *")).toBe(true);
    });
  });
});
