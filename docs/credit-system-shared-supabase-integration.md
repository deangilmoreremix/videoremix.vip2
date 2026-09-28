# Shared Supabase Credit System — Integration Guide

This guide explains how multiple apps can safely share one Supabase project for credits without colliding.

## Core Principle

All credit data lives in the dedicated `credits` schema and is scoped by `app_id`. Every table, RLS policy, helper function, and webhook metadata path enforces that boundary. One app must never read or write another app's credit records.

## 1. App Registration

Treat `credits.credit_products.app_id` as the app namespace. Each consuming app should have its own product namespace and default app id.

Recommended setup:
- Use a single source of truth for `app_id` in each app.
- Do not let the frontend choose `app_id`.
- Keep credit product ids unique within the app namespace.

## 2. Frontend Integration

### Route through credit-aware endpoints only

When the user enables platform credits, route AI traffic through the credit proxy instead of direct OpenAI calls.

Old flow:
- Browser → `https://api.openai.com/v1/...`

New flow:
- Browser → `/functions/v1/proxy-openai/v1/...`

### Purchase flow

Call the credit checkout function with the app-scoped product:

```ts
const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
  body: { product_id: 'pro' },
});

if (data?.url) {
  window.location.href = data.url;
}
```

Do not pass `app_id` from the frontend. The backend should default the credit namespace to the assigned app.

### Reading balance and transactions

Always scope queries by both `user_id` and `app_id`:

```ts
const { data } = await supabase
  .from('credit_balances', { schema: 'credits' })
  .select('*')
  .eq('user_id', userId)
  .eq('app_id', APP_ID)
  .maybeSingle();
```

## 3. Backend / Edge Function Boundary

### Use schema-scoped clients

Inside Edge Functions, create a credits-scoped client:

```ts
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  schema: 'credits',
});
```

### Always pass `app_id`

Helper functions require `app_id`:

```ts
const { data } = await supabase.rpc('add_credits', {
  p_user_id: user.id,
  p_app_id: 'videoremixvip',
  p_amount: 500000,
  p_type: 'purchase',
  p_source: 'stripe',
  p_source_id: session.id,
  p_metadata: { product_id: 'starter' },
});
```

### Never infer app from user input

Do not accept `app_id` from browser requests unless the caller is a trusted internal service. For normal user traffic, default `app_id` from a server-side config or env value.

## 4. Stripe Webhook Isolation

The credit checkout function should set credit-specific metadata:

```ts
metadata: {
  product_id: product.id,
  product_type: 'credits',
  app_id: APP_ID,
  credits_amount: String(product.credits_amount),
  ...(user_id ? { userId: user_id } : {}),
}
```

The webhook handler must:
- Use a credits-scoped Supabase client
- Read `app_id` from session metadata
- Use `credits.add_credits` instead of generic balance updates
- Leave existing app purchase/subscription logic untouched

## 5. Security Rules

- **Never expose `OPENAI_API_KEY` to the browser.**
- **Never let the browser set `app_id` for credit operations.**
- **Never return another app's credit balance or transactions.**
- **Keep credit write paths in Edge Functions or service-role contexts only.**
- **Keep RLS as the user-facing guardrail, not the only guardrail.**

## 6. Multi-App Example

If App A and App B share the same Supabase project:

| Scope | Value |
|------|-------|
| App A `app_id` | `app-a` |
| App B `app_id` | `app-b` |
| Shared schema | `credits` |
| Credit tables | `credits.credit_products`, `credits.credit_balances`, `credits.credit_transactions` |
| RLS user read | `auth.uid() = user_id` |
| RLS write | `service_role` only |

App A frontend should never see App B products because:
- `create-credit-checkout` filters by `app_id`
- `credit_balances` queries filter by `app_id`
- RLS only allows users to see their own rows

## 7. Checklist for Adding a New App

- [ ] Choose a unique `app_id`
- [ ] Seed credit products with that `app_id`
- [ ] Update credit Edge Functions default app id if needed
- [ ] Verify frontend always queries with `schema: 'credits'` and `app_id`
- [ ] Verify webhook metadata includes `app_id`
- [ ] Run smoke tests in isolation before sharing with other apps

## 8. Troubleshooting

- **Cross-app data leak:** check missing `app_id` filters in queries or RLS policies
- **Double credits:** verify webhook idempotency and `stripe_event_id` handling
- **Missing balance rows:** ensure `add_credits` creates the row if absent
- **Wrong app charged:** inspect `app_id` in checkout session metadata and webhook handler

If you want, I can also turn this into a short onboarding checklist for each new app that joins this shared Supabase project.
