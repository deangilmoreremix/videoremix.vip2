// src/components/agentos/format/bytes.ts
//
// Human-readable byte sizes.
//
// WHY A SHARED HELPER
//   The artifact surface shows a size per card and a total per page. Both
//   must agree, and neither should print "1048576 bytes", so the conversion
//   lives here once.
//
// WHY 1024 AND NOT 1000
//   Storage is reported in binary units by every tool the port touches
//   (`ls -h`, `du`, the browser download panel), so a "1 KB" file here means
//   1024 bytes, the same as everywhere else in the stack.

const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

/**
 * Format a byte count as a short human-readable size, e.g. "0 B", "1.5 KB",
 * "12 MB".
 *
 * Returns "unknown" for a missing size, because an artifact whose size the
 * database does not know is a real state — not zero bytes.
 */
export function formatBytes(bytes: number | string | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === "") return "unknown";

  const value = typeof bytes === "number" ? bytes : Number(bytes);
  if (!Number.isFinite(value) || value < 0) return "unknown";
  if (value === 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), UNITS.length - 1);
  const scaled = value / 1024 ** exponent;

  // One decimal below 10 keeps "9.4 MB" but drops it for "12 MB".
  const rounded = exponent === 0 ? Math.round(scaled) : Math.round(scaled * 10) / 10;

  return `${rounded} ${UNITS[exponent]}`;
}

/**
 * Format a byte total for a stat tile: the same unit as formatBytes(), with
 * thousands separators so a large number stays readable.
 */
export function formatBytesTotal(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return "unknown";
  }
  if (bytes === 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const scaled = bytes / 1024 ** exponent;
  const rounded = exponent === 0 ? Math.round(scaled) : Math.round(scaled * 10) / 10;

  return `${rounded.toLocaleString()} ${UNITS[exponent]}`;
}
