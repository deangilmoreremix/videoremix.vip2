/**
 * Test to verify the Supabase client is configured correctly for Clerk integration.
 *
 * This test prevents regressions of the original bug where:
 * - The `accessToken` callback returned `""` (empty string) when no Clerk token
 *   was available, causing Supabase to send `Authorization: Bearer ` headers
 *   which resulted in 401 errors on public data
 * - Code was calling `supabase.auth.*` methods, which are disabled when a client
 *   is created with `accessToken`
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Supabase Client Configuration (static analysis)', () => {
  it('src/utils/supabase.ts accessToken callback should return null, not empty string', () => {
    const filePath = path.join(__dirname, '../src/utils/supabase.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // The accessToken callback should NOT return empty string
    // It should return null when no token is available
    expect(content).not.toMatch(/accessToken:\s*async\s*\(\)\s*=>\s*\(await\s+getClerkToken\(\)\)\s*\?\?\s*["']["']/);

    // It should return null
    expect(content).toMatch(/return\s+token\s*\?\?\s*null/);
  });

  it('src/hooks/useUserAccess.ts should not call supabase.auth.*', () => {
    const filePath = path.join(__dirname, '../src/hooks/useUserAccess.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check that the file does not call supabase.auth.* methods
    expect(content).not.toMatch(/supabase\.auth\.(getUser|getSession|onAuthStateChange)/);
  });

  it('src/hooks/useUserAccess.ts should use Clerk hooks', () => {
    const filePath = path.join(__dirname, '../src/hooks/useUserAccess.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should import useUser from Clerk provider
    expect(content).toMatch(/import\s*\{[^}]*useUser[^}]*\}\s*from\s*["'].*ClerkProvider["']/);
  });

  it('src/services/videoService.ts should not call supabase.auth.getUser()', () => {
    const filePath = path.join(__dirname, '../src/services/videoService.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check that the file does not call supabase.auth.getUser()
    expect(content).not.toMatch(/supabase\.auth\.getUser\(\)/);
  });

  it('VideoService.getUserVideos should accept userId as first parameter', () => {
    const filePath = path.join(__dirname, '../src/services/videoService.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check the signature
    expect(content).toMatch(/static\s+async\s+getUserVideos\s*\(\s*userId:\s*string/);
  });

  it('VideoService.getVideoById should accept userId as second parameter', () => {
    const filePath = path.join(__dirname, '../src/services/videoService.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check the signature
    expect(content).toMatch(/static\s+async\s+getVideoById\s*\(\s*id:\s*string\s*,\s*userId:\s*string/);
  });

  it('src/hooks/useVideos.ts should use Clerk useUser hook', () => {
    const filePath = path.join(__dirname, '../src/hooks/useVideos.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should import useUser from Clerk provider
    expect(content).toMatch(/import\s*\{[^}]*useUser[^}]*\}\s*from\s*["'].*ClerkProvider["']/);
  });

  it('useSupabaseToken hook should exist and export correctly', () => {
    const filePath = path.join(__dirname, '../src/hooks/useSupabaseToken.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should export useSupabaseToken
    expect(content).toMatch(/export\s+function\s+useSupabaseToken/);

    // Should import useSession from Clerk
    expect(content).toMatch(/import\s*\{[^}]*useSession[^}]*\}\s*from\s*["'].*ClerkProvider["']/);
  });
});

describe('No supabase.auth.* calls in active admin code paths', () => {
  const activeFiles = [
    '../src/components/admin/AdminFeaturesManagement.tsx',
    '../src/components/admin/AdminAppsManagement.tsx',
    '../src/components/admin/AdminUsersManagement.tsx',
    '../src/components/admin/AdminVideosManagement.tsx',
    '../src/components/admin/AdminPurchasesManagement.tsx',
    '../src/components/admin/AdminCSVImport.tsx',
    '../src/components/admin/AdminBulkImport.tsx',
    '../src/components/personalizer/PersonalizerDialog.tsx',
    '../src/components/ai/primitives/RealtimeVoiceSession.tsx',
  ];

  for (const relPath of activeFiles) {
    it(`${relPath} should not call supabase.auth.*`, () => {
      const filePath = path.join(__dirname, relPath);
      if (!fs.existsSync(filePath)) return; // skip if file doesn't exist
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/supabase\.auth\.(getUser|getSession|onAuthStateChange)/);
    });
  }
});
