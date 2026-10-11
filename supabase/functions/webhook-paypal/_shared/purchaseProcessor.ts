// supabase/functions/webhook-paypal/_shared/purchaseProcessor.ts
//
// DEPRECATED SHIM - kept only so this path stays importable.
//
// webhook-paypal/index.ts imports the shared, Clerk-identity purchase
// processor from '../_shared/purchaseProcessor.ts' (the parent _shared
// directory), which resolves to
// supabase/functions/_shared/purchaseProcessor.ts. That module resolves a
// VERIFIED Clerk identity (public.clerk_identities) and fails closed when the
// buyer cannot be verified.
//
// The copy that used to live here provisioned temporary Supabase-auth users
// (supabase.auth.admin.createUser) for unknown purchaser emails and logged a
// generated password. Those UUID identities can never match a Clerk user, so
// grants keyed by them land on accounts the purchaser cannot reach - the exact
// anti-pattern this re-export removes. Do not reintroduce local copies of this
// module; import the shared one.

export * from '../../_shared/purchaseProcessor.ts';
