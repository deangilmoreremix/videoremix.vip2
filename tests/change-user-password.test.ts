import { describe, it, expect } from 'vitest';

describe('change-user-password edge function', () => {
  const functionUrl = 'https://bzxohkrxcwodllketcpz.supabase.co/functions/v1/change-user-password';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A'
  };

  const testEmails = [
    'lloydvheath@gmail.com',
    'heidiburke@gmail.com',
    'finaltest@example.com',
    'harveydenv@gmail.com',
    'thomaspublications@gmail.com',
    'bruce.chinn@icloud.com',
    'trigger-test@example.com',
    'rogersdarlene0@gmail.com',
    'darkstyle@msn.com',
    'eduardogonzalez@gmail.com',
    'karrynusa@yahoo.com',
    'sarabarnett@gmail.com',
    'hartmut-weidner@mail.de',
    'thomaspublications@gmail.com', // duplicate to test
    'rogersdarlene0@gmail.com' // duplicate
  ];

  it('should allow password changes for 15 different existing users without email confirmation', async () => {
    for (const email of testEmails) {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          grant_type: 'password',
          email,
          newPassword: 'VideoRemix2026'
        })
      });

      const text = await response.text();
      console.log(`Login response for ${email}:`, response.status, text);
      const result = JSON.parse(text);

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toContain(`Password updated successfully for ${email}`);
    }
  }, 60000); // 60 second timeout for multiple requests

  it('should return success for non-existent email to prevent enumeration', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        newPassword: 'VideoRemix2026'
      })
    });

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Password updated successfully for nonexistent@example.com');
  });

  it('should reject passwords shorter than 8 characters', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: 'test@example.com',
        newPassword: 'short'
      })
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('Password must be at least 8 characters');
  });

  it('should reject requests missing email', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        newPassword: 'VideoRemix2026'
      })
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('Email and newPassword are required');
  });

  it('should reject requests missing newPassword', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error).toContain('Email and newPassword are required');
  });

  it('should allow users to log in with email and VideoRemix2026 after password change', async () => {
    const authUrl = 'https://bzxohkrxcwodllketcpz.supabase.co/auth/v1/token';
    const authHeaders = {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A'
    };

    // Test login for a subset of users
    const loginEmails = testEmails.slice(0, 5); // Test first 5 to avoid too many requests

    for (const email of loginEmails) {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          grant_type: 'password',
          email,
          password: 'VideoRemix2026',

        })
      });

      const text = await response.text();
      console.log(`Login response for ${email}:`, response.status, text);
      const result = JSON.parse(text);
      console.log(`Login response for ${email}:`, response.status, result);

      expect(response.status).toBe(200);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user.email).toBe(email);
    }
  }, 30000);
});
