// src/components/agentos/format/numbers.ts
//
// Numbers that arrive from Postgres.
//
// WHY A SHARED HELPER
//   A `numeric` column comes back over PostgREST as a STRING, not a number:
//   the model's `credit_rate_in` is `numeric(18,9)`, so the browser receives
//   "2.500000000" rather than 2.5. Rendering that raw shows the storage
//   precision to the operator and looks like a bug; parsing it ad hoc in each
//   surface is how one card shows "2.5" and the next shows "2.500000000".
//
// WHAT THIS DOES NOT DO
//   It never rounds a value the operator needs in full. `formatDecimal` caps
//   the decimals it prints, but the value it prints is still the value the
//   runtime charges — the credit rate is not a display approximation.

/**
 * Parse a Postgres numeric/bigint value into a number.
 *
 * Returns null for a missing or unparseable value, so a caller can decide
 * between "unknown" and "zero" instead of rendering NaN.
 */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Format a decimal value for display: "2.500000000" becomes "2.5",
 * 15 becomes "15", and a missing value becomes "unknown".
 */
export function formatDecimal(
  value: number | string | null | undefined,
  maxDecimals = 4,
): string {
  const parsed = toNumber(value);
  if (parsed === null) return "unknown";
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Format an integer value with thousands separators: "12345" becomes
 * "12,345". Counts arrive from Postgres as bigint strings.
 */
export function formatInteger(value: number | string | null | undefined): string {
  const parsed = toNumber(value);
  if (parsed === null) return "unknown";
  return Math.round(parsed).toLocaleString();
}

/**
 * Format a credit amount. Credits are fractional (the runtime charges per
 * thousand tokens), so two decimals are kept and trailing zeros are dropped.
 */
export function formatCredits(value: number | string | null | undefined): string {
  const parsed = toNumber(value);
  if (parsed === null) return "unknown";
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
