// src/services/agentos/cron.ts
//
// A pure-TS 5-field cron parser for the schedules preview.
//
// WHY THIS EXISTS
//   The database has the authoritative next_cron_run() function (used by the
//   sweep), but the schedule dialog needs to preview the next three occurrences
//   without a round trip and without duplicating that logic in SQL. This is a
//   deliberately small, dependency-free implementation of the same grammar so
//   both sides agree. Pure functions only — no clock, no I/O — so it is trivial
//   to test.
//
// GRAMMAR (per field): * | n | n-m | n-m/s | n/s | */s | comma-separated list
// FIELDS: minute hour day-of-month month day-of-week (0 and 7 = Sunday)

const RANGES: Array<[number, number]> = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day of month
  [1, 12], // month
  [0, 7],  // day of week (0 and 7 = Sunday)
];

export interface CronField {
  /** Whether the field is `*` (any value). */
  unrestricted: boolean;
  /** Test whether a value matches. */
  matches: (value: number) => boolean;
}

function parsePart(part: string, fieldIndex: number): (value: number) => boolean {
  const [min, max] = RANGES[fieldIndex];
  let token = part.trim();
  if (token === "") throw new Error(`Empty cron field at position ${fieldIndex + 1}`);

  let step = 1;
  const slash = token.indexOf("/");
  if (slash >= 0) {
    const stepText = token.slice(slash + 1).trim();
    step = Number(stepText);
    if (!Number.isInteger(step) || step < 1) {
      throw new Error(`Invalid step "${stepText}" in cron field ${fieldIndex + 1}`);
    }
    token = token.slice(0, slash).trim();
    if (token === "") token = "*";
  }

  let lo: number;
  let hi: number;

  if (token === "*") {
    lo = min;
    hi = max;
  } else {
    const dash = token.indexOf("-", 1);
    if (dash >= 0) {
      lo = Number(token.slice(0, dash));
      hi = Number(token.slice(dash + 1));
      if (!Number.isInteger(lo) || !Number.isInteger(hi)) {
        throw new Error(`Invalid range "${token}" in cron field ${fieldIndex + 1}`);
      }
    } else {
      lo = Number(token);
      if (!Number.isInteger(lo)) {
        throw new Error(`Invalid value "${token}" in cron field ${fieldIndex + 1}`);
      }
      // A bare number with a step means "from n to the end of the field".
      hi = slash >= 0 ? max : lo;
    }
  }

  if (lo < min || hi > max) {
    throw new Error(`Value out of range in cron field ${fieldIndex + 1}`);
  }
  if (lo > hi) {
    throw new Error(`Reversed range in cron field ${fieldIndex + 1}`);
  }

  return (value: number) => value >= lo && value <= hi && (value - lo) % step === 0;
}

function parseField(field: string, fieldIndex: number): CronField {
  const parts = field.split(",");
  const testers = parts.map((part) => parsePart(part, fieldIndex));
  const unrestricted = parts.length === 1 && parts[0].trim() === "*";
  return {
    unrestricted,
    matches: (value: number) => testers.some((tester) => tester(value)),
  };
}

export interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

export function parseCron(expression: string): ParsedCron | null {
  const trimmed = expression.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) return null;

  try {
    return {
      minute: parseField(parts[0], 0),
      hour: parseField(parts[1], 1),
      dayOfMonth: parseField(parts[2], 2),
      month: parseField(parts[3], 3),
      dayOfWeek: parseField(parts[4], 4),
    };
  } catch {
    return null;
  }
}

/**
 * Cron's classic day-of-week and day-of-month OR semantics.
 *
 * `date` holds the target zone's wall clock as a UTC epoch, so every field is
 * read with the UTC accessors. Mixing in local reads (getDate/getDay) would
 * silently evaluate the host's own timezone instead of the requested one.
 */
function dayMatches(parsed: ParsedCron, date: Date): boolean {
  const dom = date.getUTCDate();
  const dow = date.getUTCDay();

  const domOk = parsed.dayOfMonth.matches(dom);
  // Benchmark cron accepts both 0 and 7 for Sunday, but Date#getUTCDay() only
  // returns 0-6. Testing dow+7 means a Sunday written as 7 still fires, and a
  // span such as 6-7 keeps Sunday instead of silently dropping it.
  const dowOk = parsed.dayOfWeek.matches(dow) || parsed.dayOfWeek.matches(dow + 7);

  if (!parsed.dayOfMonth.unrestricted && !parsed.dayOfWeek.unrestricted) {
    return domOk || dowOk;
  }
  if (!parsed.dayOfMonth.unrestricted) return domOk;
  if (!parsed.dayOfWeek.unrestricted) return dowOk;
  return true;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Search budgets, counted separately so a single day-level skip cannot consume
 * the minute budget. A never-matching expression must return null promptly
 * rather than walking decades of calendar one step at a time.
 */
const MAX_MINUTE_STEPS = 5 * 366 * 24 * 60;
const MAX_DAY_STEPS = 5 * 366 * 3;

/**
 * The next time this expression fires strictly after `base`.
 *
 * Returns null when the expression is unparseable or never matches (for example
 * the 31st of February), so callers can distinguish "no future run" from
 * "invalid input" only by pre-parsing.
 */
export function nextCronRun(
  expression: string,
  timezone: string,
  base: Date = new Date(),
): Date | null {
  const parsed = parseCron(expression);
  if (!parsed) return null;

  // Work in the requested timezone's wall clock. To avoid pulling in a timezone
  // database we compute the offset from the target zone once and apply it
  // iteratively, which is correct for DST-aware zones within an hour of drift
  // and exact for fixed-offset zones (including UTC).
  const offsetMs = getZoneOffsetMs(timezone);
  const baseTimezone = base.getTime() + offsetMs;
  const localCursor = new Date(baseTimezone);

  // Step minute by minute in the zone's wall clock, skipping whole days when the
  // day cannot match. localCursor is the wall clock, so the acceptance test must
  // also run in wall-clock terms (baseTimezone) — comparing it to base.getTime()
  // would shift the window by the whole offset and, west of UTC, skip the first
  // candidate day outright.
  localCursor.setUTCSeconds(0, 0);

  let minuteSteps = 0;
  let daySteps = 0;

  while (minuteSteps < MAX_MINUTE_STEPS && daySteps < MAX_DAY_STEPS) {
    minuteSteps += 1;

    if (!parsed.month.matches(localCursor.getUTCMonth() + 1)) {
      daySteps += 1;
      localCursor.setUTCDate(localCursor.getUTCDate() + 1);
      localCursor.setUTCHours(0, 0, 0, 0);
      continue;
    }

    if (!dayMatches(parsed, localCursor)) {
      daySteps += 1;
      localCursor.setUTCDate(localCursor.getUTCDate() + 1);
      localCursor.setUTCHours(0, 0, 0, 0);
      continue;
    }

    if (!parsed.hour.matches(localCursor.getUTCHours())) {
      const nextHour = localCursor.getUTCHours() + 1;
      if (nextHour >= 24) {
        daySteps += 1;
        localCursor.setUTCDate(localCursor.getUTCDate() + 1);
        localCursor.setUTCHours(0, 0, 0, 0);
      } else {
        localCursor.setUTCHours(nextHour, 0, 0, 0);
      }
      continue;
    }

    if (!parsed.minute.matches(localCursor.getUTCMinutes())) {
      localCursor.setUTCMinutes(localCursor.getUTCMinutes() + 1, 0, 0);
      continue;
    }

    if (localCursor.getTime() <= baseTimezone) {
      localCursor.setUTCMinutes(localCursor.getUTCMinutes() + 1, 0, 0);
      continue;
    }

    return new Date(localCursor.getTime() - offsetMs);
  }

  return null;
}

/** Offset of `timezone` from UTC in ms at the current instant. */
function getZoneOffsetMs(timezone: string): number {
  const zone = timezone?.trim() || "UTC";
  const now = new Date();
  try {
    // Intl gives the zone's local time for a given instant; the difference is
    // the offset. Fixed-offset zones (UTC, Etc/GMT+5) are exact; DST zones are
    // exact at the sampled instant and drift by at most the DST delta.
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const get = (type: string): number =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    const asUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
      get("second"),
    );
    return asUtc - Math.floor(now.getTime() / 1000) * 1000;
  } catch {
    return 0;
  }
}

/** True when the expression parses. Use this for input validation. */
export function isValidCron(expression: string): boolean {
  return parseCron(expression) !== null;
}

export const CRON_INTERVAL_MS = MINUTE_MS;
export const CRON_DAY_MS = DAY_MS;
