// supabase/functions/_shared/identity.ts
//
// Server-side identity mapping helpers for the Clerk customer IdP.
//
// WHY THIS EXISTS
//   Purchases must resolve to a *verified* Clerk identity before any
//   entitlement is granted. public.app_users is NOT sufficient for that: its
//   RLS policy lets an authenticated user UPDATE their own row, including the
//   email, so its contents cannot prove who a purchase belongs to. The
//   dedicated public.clerk_identities table (migration
//   20261011160000_clerk_identity_table.sql) is written only by:
//     * the clerk-webhook function, from svix-verified Clerk events, and
//     * scripts/migration-verify-identities.mjs, after confirming the email
//       against the Clerk Backend API.
//   Rows seeded by the migration itself carry identity_verified = FALSE and
//   must grant nothing.
//
// FAIL-CLOSED CONTRACT
//   resolveVerifiedIdentity() returns a resolution of 'verified' ONLY for a
//   single row with identity_verified = TRUE. Every other outcome (missing
//   row, unverified row, duplicate/ambiguous match, database error) reports
//   'unverified' with a machine-readable reason. Callers MUST NOT grant
//   entitlements on an 'unverified' resolution.
//
// This module imports nothing and reads no secrets; the Supabase client
// (service_role) is injected by the caller.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** A verified Clerk identity: the only shape allowed to receive grants. */
export interface VerifiedIdentity {
  clerkUserId: string;
  email: string;
  appUserId: string | null;
}

export type IdentityUnverifiedReason =
  | 'no_identity_row'
  | 'identity_not_verified'
  | 'ambiguous_identity'
  | 'lookup_failed';

export type IdentityResolution =
  | { status: 'verified'; identity: VerifiedIdentity }
  | { status: 'unverified'; reason: IdentityUnverifiedReason };

/** Emails are stored lower-cased; normalize before compare/insert. */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * Resolve a verified Clerk identity for an email.
 *
 * Never throws: database failures are reported as an unverified resolution
 * (reason 'lookup_failed') so callers fail closed instead of granting on a
 * partial answer.
 */
export async function resolveVerifiedIdentity(
  supabase: SupabaseClient,
  email: string | null | undefined,
): Promise<IdentityResolution> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { status: 'unverified', reason: 'no_identity_row' };
  }

  let rows: Array<{
    clerk_user_id: string;
    email: string;
    app_user_id: string | null;
    identity_verified: boolean;
  }> | null = null;

  try {
    const { data, error } = await supabase
      .from('clerk_identities')
      .select('clerk_user_id, email, app_user_id, identity_verified')
      .eq('email', normalized)
      .eq('identity_verified', true)
      .limit(2);

    if (error) {
      console.error('identity: lookup failed:', error.message);
      return { status: 'unverified', reason: 'lookup_failed' };
    }
    rows = data ?? [];
  } catch (err) {
    console.error('identity: lookup threw:', err);
    return { status: 'unverified', reason: 'lookup_failed' };
  }

  if (!rows || rows.length === 0) {
    // Could be "no row at all" or "row exists but not verified" - both are
    // unverified from the caller's perspective; reconciliation distinguishes
    // them (scripts/migration-reconcile.mjs).
    return { status: 'unverified', reason: 'no_identity_row' };
  }

  if (rows.length > 1) {
    // Two verified Clerk accounts share this email (Clerk permits that).
    // Picking one would be a guess; a guess here is a purchase theft vector.
    console.error(
      `identity: ambiguous verified identities for email domain ${normalized.split('@')[1] ?? 'unknown'} (${rows.length} rows) - refusing to resolve`,
    );
    return { status: 'unverified', reason: 'ambiguous_identity' };
  }

  const row = rows[0];
  return {
    status: 'verified',
    identity: {
      clerkUserId: row.clerk_user_id,
      email: row.email,
      appUserId: row.app_user_id ?? null,
    },
  };
}

/** Minimal shape of a Clerk user payload as delivered by webhook events. */
export interface ClerkEventUser {
  id: string;
  email_addresses?: Array<{
    id?: string;
    email_address?: string;
    verification?: { status?: string } | null;
  }>;
  primary_email_address_id?: string | null;
}

function primaryEmailOf(user: ClerkEventUser): { email: string; verified: boolean } | null {
  const emails = user.email_addresses ?? [];
  if (emails.length === 0) return null;
  const primary =
    emails.find((e) => e.id && e.id === user.primary_email_address_id) ?? emails[0];
  const email = primary?.email_address;
  if (!email) return null;
  return { email, verified: primary?.verification?.status === 'verified' };
}

/**
 * Write/refresh the identity row for a Clerk user, from an event that the
 * clerk-webhook has already verified cryptographically (svix). Because the
 * event is verified, the row is trusted: identity_verified = TRUE.
 *
 * Must be called with the service_role client (RLS blocks authenticated
 * writes by design).
 */
export async function upsertIdentityFromClerkEvent(
  supabase: SupabaseClient,
  user: ClerkEventUser,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!user?.id) {
    return { ok: false, reason: 'missing_clerk_user_id' };
  }

  const primary = primaryEmailOf(user);
  if (!primary) {
    // A Clerk user with no email cannot be resolved by email; the identity
    // row is not useful for purchase resolution, and identity_verified would
    // be meaningless. Skip (and let the webhook log it) - do not fabricate.
    return { ok: false, reason: 'missing_email' };
  }

  const { error } = await supabase
    .from('clerk_identities')
    .upsert(
      {
        clerk_user_id: user.id,
        app_user_id: user.id, // app_users.id carries the Clerk sub (see clerk-webhook)
        email: normalizeEmail(primary.email),
        email_verified: primary.verified,
        identity_verified: true,
        verification_source: 'clerk_webhook',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' },
    );

  if (error) {
    console.error('identity: upsert failed:', error.message);
    return { ok: false, reason: 'write_failed' };
  }
  return { ok: true };
}

/**
 * Remove the identity row for a deleted Clerk user. The app_users row is
 * owned by the clerk-webhook itself; identity removal is best-effort here.
 */
export async function deleteIdentityForClerkUser(
  supabase: SupabaseClient,
  clerkUserId: string,
): Promise<void> {
  if (!clerkUserId) return;
  const { error } = await supabase
    .from('clerk_identities')
    .delete()
    .eq('clerk_user_id', clerkUserId);
  if (error) {
    // Do not throw: a stale identity row is caught by reconciliation, while a
    // throwing webhook would retry and spam.
    console.error('identity: delete failed:', error.message);
  }
}
