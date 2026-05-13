/**
 * Safe Number Parsing Utilities
 * Prevents NaN, Infinity, and other invalid number issues
 */

/**
 * Safely parse an integer with validation
 * @param value - The value to parse (string, number, or unknown)
 * @param defaultValue - Default value if parsing fails
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns A valid integer or defaultValue
 */
export function safeParseInt(
  value: unknown,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined) return defaultValue;
  
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  
  // Check for NaN or non-finite values
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  
  // Ensure integer
  const result = Math.floor(num);
  
  // Apply min/max bounds
  if (min !== undefined && result < min) return min;
  if (max !== undefined && result > max) return max;
  
  return result;
}

/**
 * Safely parse a float with validation
 * @param value - The value to parse (string, number, or unknown)
 * @param defaultValue - Default value if parsing fails
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns A valid float or defaultValue
 */
export function safeParseFloat(
  value: unknown,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined) return defaultValue;
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  // Check for NaN or non-finite values
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  
  // Apply min/max bounds
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
}

/**
 * Validate that a value is a positive integer
 */
export function isPositiveInteger(value: unknown): boolean {
  const num = safeParseInt(value, -1);
  return num > 0;
}

/**
 * Validate that a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): boolean {
  const num = safeParseFloat(value, -1);
  return num >= 0;
}
