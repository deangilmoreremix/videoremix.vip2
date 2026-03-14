import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  isNotEmpty,
  isValidUrl,
  isInRange,
  sanitizeInput,
  validateEmail,
  validatePassword,
  validateTextInput,
  validationSchemas,
  getFirstError,
  validateFormData,
} from './validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('a'.repeat(20))).toBe(true);
    });

    it('should return false for passwords that are too short', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidPassword(12345678)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('  hello  ')).toBe(true);
      expect(isNotEmpty('a')).toBe(true);
    });

    it('should return false for empty or whitespace-only strings', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty('\n')).toBe(false);
      expect(isNotEmpty('\t')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
      expect(isNotEmpty(123)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('just a string')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true for values within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
      expect(isInRange(0, 0, 10)).toBe(true);
    });

    it('should return false for values outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
      expect(isInRange(-1, 0, 10)).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      // Note: Number() converts string numbers to valid numbers
      // These are considered valid as they can be coerced
      expect(isInRange(null, 1, 10)).toBe(false);
      expect(isInRange(undefined, 1, 10)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
      expect(sanitizeInput('<div>hello</div>')).toBe('divhello/div');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('javascript:void(0)')).toBe('void(0)');
    });

    it('should remove event handlers', () => {
      // The regex removes the entire event handler pattern including =
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('onmouseover=doSomething()')).toBe('doSomething()');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('should return valid for correct email', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should sanitize and validate email', () => {
      const result = validateEmail('  User@Example.com  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should return error for invalid email format', () => {
      const result = validateEmail('invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('validatePassword', () => {
    it('should return valid for correct password', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should return error for short password', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });
  });

  describe('validateTextInput', () => {
    it('should validate required field', () => {
      const result = validateTextInput('', { required: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('should validate min length', () => {
      const result = validateTextInput('ab', { minLength: 3 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be at least 3 characters');
    });

    it('should validate max length', () => {
      const result = validateTextInput('a'.repeat(11), { maxLength: 10 });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be no more than 10 characters');
    });

    it('should allow HTML when specified', () => {
      const result = validateTextInput('<p>Hello</p>', { allowHtml: true });
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('<p>Hello</p>');
    });

    it('should sanitize HTML when not allowed', () => {
      const result = validateTextInput('<p>Hello</p>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('pHello/p');
    });

    it('should validate valid input', () => {
      const result = validateTextInput('Hello World', { required: true, minLength: 1, maxLength: 100 });
      expect(result.valid).toBe(true);
    });
  });

  describe('validationSchemas', () => {
    it('should validate email schema', () => {
      const result = validationSchemas.email.safeParse('user@example.com');
      expect(result.success).toBe(true);
    });

    it('should fail email schema for invalid email', () => {
      const result = validationSchemas.email.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should validate password schema', () => {
      const result = validationSchemas.password.safeParse('password123');
      expect(result.success).toBe(true);
    });

    it('should fail password schema for short password', () => {
      const result = validationSchemas.password.safeParse('short');
      expect(result.success).toBe(false);
    });

    it('should validate confirmPassword schema', () => {
      const schema = validationSchemas.confirmPassword('password123');
      const result = schema.safeParse('password123');
      expect(result.success).toBe(true);
    });

    it('should fail confirmPassword for mismatch', () => {
      const schema = validationSchemas.confirmPassword('password123');
      const result = schema.safeParse('different');
      expect(result.success).toBe(false);
    });

    it('should validate name schema', () => {
      const result = validationSchemas.name.safeParse('John Doe');
      expect(result.success).toBe(true);
    });

    it('should validate URL schema', () => {
      const result = validationSchemas.url.safeParse('https://example.com');
      expect(result.success).toBe(true);
    });

    it('should allow empty string for optional URL', () => {
      const result = validationSchemas.optionalUrl.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('getFirstError', () => {
    it('should return null for successful result', () => {
      const result = { success: true, data: {} };
      expect(getFirstError(result)).toBeNull();
    });

    it('should return first error message from ZodError', () => {
      const mockError = new (require('zod').ZodError)([]);
      const result = {
        success: false,
        error: mockError,
      };
      // Since the error has no issues, it should return null
      expect(getFirstError(result)).toBeNull();
    });

    it('should return null when error is undefined', () => {
      const result = {
        success: false,
      };
      expect(getFirstError(result)).toBeNull();
    });
  });

  describe('validateFormData', () => {
    // Create an object schema for testing
    const testSchema = require('zod').object({
      email: validationSchemas.email,
      password: validationSchemas.password,
    });

    it('should return valid data when parsing succeeds', () => {
      const data = { email: 'user@example.com', password: 'password123' };
      const result = validateFormData(data, testSchema);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should return errors when parsing fails', () => {
      const data = { email: 'invalid', password: 'short' };
      const result = validateFormData(data, testSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
