/**
 * Input Validation Utilities
 * 
 * Provides validation functions for common user inputs.
 * These are client-side validations - server-side validation should also be implemented.
 */

import { z } from "zod";

/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password minimum requirements
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate email format
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate password strength
 */
export function isValidPassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  return true;
}

/**
 * Validate that a string is not empty
 */
export function isNotEmpty(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return value.trim().length > 0;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate numeric value is within range
 */
export function isInRange(value: unknown, min: number, max: number): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): { valid: boolean; error?: string; sanitized?: string } {
  const sanitized = sanitizeInput(email);
  
  if (!sanitized) {
    return { valid: false, error: "Email is required" };
  }
  
  if (!isValidEmail(sanitized)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  return { valid: true, sanitized: sanitized.toLowerCase() };
}

/**
 * Validate and sanitize password
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  
  if (!isValidPassword(password)) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  
  return { valid: true };
}

/**
 * Validate and sanitize text input
 */
export function validateTextInput(
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowHtml?: boolean;
  } = {}
): { valid: boolean; error?: string; sanitized?: string } {
  const { required = false, minLength = 0, maxLength = 10000, allowHtml = false } = options;
  
  const sanitized = allowHtml ? value : sanitizeInput(value);
  
  if (required && !sanitized) {
    return { valid: false, error: "This field is required" };
  }
  
  if (sanitized && sanitized.length < minLength) {
    return { valid: false, error: `Must be at least ${minLength} characters` };
  }
  
  if (sanitized && sanitized.length > maxLength) {
    return { valid: false, error: `Must be no more than ${maxLength} characters` };
  }
  
  return { valid: true, sanitized };
}

/**
 * Common Zod schemas for form validation
 */
export const validationSchemas = {
  /** Email schema with common validation */
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  
  /** Password schema with minimum length */
  password: z
    .string()
    .min(1, "Password is required")
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  
  /** Confirm password schema */
  confirmPassword: (password: string) =>
    z
      .string()
      .min(1, "Please confirm your password")
      .refine((val) => val === password, {
        message: "Passwords do not match",
      }),
  
  /** Name schema */
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  
  /** URL schema */
  url: z
    .string()
    .url("Invalid URL format")
    .or(z.literal("")),
  
  /** Optional URL schema */
  optionalUrl: z
    .string()
    .url("Invalid URL format")
    .optional()
    .or(z.literal("")),
};

/**
 * Form validation helper - returns first error or null if valid
 */
export function getFirstError(
  result: { success: boolean; error?: z.ZodError; data?: unknown }
): string | null {
  if (result.success || !result.error) return null;
  
  const firstError = result.error.issues[0];
  if (!firstError) return null;
  
  return firstError.message;
}

/**
 * Validate form data against a schema
 */
export function validateFormData<T extends Record<string, unknown>>(
  data: T,
  schema: z.ZodSchema<T>
): { valid: boolean; data?: T; errors?: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  
  return { valid: false, errors };
}
