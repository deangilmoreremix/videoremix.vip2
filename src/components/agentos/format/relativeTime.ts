// src/components/agentos/format/relativeTime.ts
//
// "3m ago" — the timestamp format every AgentOS surface uses.
//
// WHY A SHARED HELPER
//   Three surfaces now render timestamps (artifacts, notifications, activity).
//   Each one rolling its own formatting rule is how "2 minutes ago" ends up
//   next to "2m ago" on the same screen, so the rule lives here once.
//
// WHY THE THRESHOLDS ARE WHAT THEY ARE
//   Below a minute the exact clock time is noise ("just now"). Above a day a
//   relative phrase stops being useful ("31d ago" tells you nothing), so the
//   date is shown instead.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * A relative description of a timestamp, e.g. "just now", "12m ago",
 * "3h ago", "4d ago", or a plain date once the moment is older than a week.
 *
 * Returns an empty string for a missing or unparseable value, so a caller can
 * render it without a null check.
 */
export function relativeTime(value: string | number | Date | null | undefined): string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return "";

  const delta = Date.now() - timestamp;
  if (delta < 0) return "just now";
  if (delta < MINUTE) return "just now";
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`;
  if (delta < WEEK) return `${Math.floor(delta / DAY)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * The absolute timestamp, for tooltips and `<time dateTime>` titles.
 */
export function absoluteTime(value: string | number | Date | null | undefined): string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return "";
  return new Date(timestamp).toLocaleString();
}

/**
 * The machine-readable timestamp for a `<time dateTime>` attribute.
 */
export function machineTime(value: string | number | Date | null | undefined): string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return "";
  return new Date(timestamp).toISOString();
}

function toTimestamp(value: string | number | Date | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;

  const timestamp =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
        ? value
        : new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}
