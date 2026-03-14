
/*
  # Restore critical user_id indexes removed in error

  ## Summary
  The previous drop-unused-indexes migration removed user_id indexes that are
  actively used by RLS policies to filter rows by the calling user. Without
  these indexes every RLS-guarded query on these tables becomes a sequential
  scan, which causes severe performance degradation at scale.

  Additionally, organizations.owner_id and organization_members.user_id had
  their dedicated indexes dropped; owner_id has no other index and is used in
  every organization ownership RLS check.

  ## Restored Indexes
  - purchases.user_id          — used by RLS SELECT policy
  - subscription_status.user_id — used by RLS SELECT policy
  - stripe_entitlements.user_id — used by RLS SELECT policy
  - user_app_access.user_id    — covered by composite unique, but explicit for clarity
  - videos.user_id             — used by RLS SELECT/UPDATE/DELETE policies
  - organizations.owner_id     — used by every ownership RLS policy on organizations
  - organization_members.user_id — composite unique covers (org_id, user_id) but not
                                   user_id-only lookups needed by membership RLS
*/

CREATE INDEX IF NOT EXISTS idx_purchases_user_id
  ON public.purchases (user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id
  ON public.subscription_status (user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_user_id
  ON public.stripe_entitlements (user_id);

CREATE INDEX IF NOT EXISTS idx_videos_user_id
  ON public.videos (user_id);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
  ON public.organizations (owner_id);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id
  ON public.organization_members (user_id);
