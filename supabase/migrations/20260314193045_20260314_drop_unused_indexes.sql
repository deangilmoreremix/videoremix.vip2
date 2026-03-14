
/*
  # Drop unused indexes

  ## Summary
  Removes indexes that have zero recorded usage. Unused indexes consume disk
  space and add write overhead on every INSERT/UPDATE/DELETE with no query
  benefit. The foreign key indexes required for performance have already been
  added in the previous migration.

  ## Dropped Indexes
  - organizations: idx_organizations_owner_id, idx_organizations_slug
  - organization_members: idx_org_members_user_id, idx_org_members_org_id
  - user_profiles: idx_user_profiles_user_id, idx_user_profiles_default_org
  - products_catalog: idx_products_catalog_slug, idx_products_catalog_sku, idx_products_catalog_type
  - platform_product_mappings: idx_platform_mappings_platform, idx_platform_product_mappings_product_id
  - subscription_status: idx_subscription_status_user_id
  - purchases: idx_purchases_user_id
  - stripe_entitlements: idx_stripe_entitlements_user_id
  - access_revocation_log: idx_access_revocation_user_id, idx_access_revocation_revoked_at, idx_access_revocation_reason
  - videos: idx_videos_user_id
  - import_products: idx_import_products_first_seen_in_import_id
  - product_app_mappings: idx_product_app_mappings_verified_by
  - import_user_records: idx_import_user_records_import_product_id
  - apps: idx_apps_item_type, idx_apps_parent_app_id, idx_apps_is_suite
  - app_feature_links: idx_app_feature_links_app, idx_app_feature_links_feature, idx_app_feature_links_sort
*/

DROP INDEX IF EXISTS public.idx_organizations_owner_id;
DROP INDEX IF EXISTS public.idx_organizations_slug;
DROP INDEX IF EXISTS public.idx_org_members_user_id;
DROP INDEX IF EXISTS public.idx_org_members_org_id;
DROP INDEX IF EXISTS public.idx_user_profiles_user_id;
DROP INDEX IF EXISTS public.idx_user_profiles_default_org;
DROP INDEX IF EXISTS public.idx_products_catalog_slug;
DROP INDEX IF EXISTS public.idx_products_catalog_sku;
DROP INDEX IF EXISTS public.idx_products_catalog_type;
DROP INDEX IF EXISTS public.idx_platform_mappings_platform;
DROP INDEX IF EXISTS public.idx_platform_product_mappings_product_id;
DROP INDEX IF EXISTS public.idx_subscription_status_user_id;
DROP INDEX IF EXISTS public.idx_purchases_user_id;
DROP INDEX IF EXISTS public.idx_stripe_entitlements_user_id;
DROP INDEX IF EXISTS public.idx_access_revocation_user_id;
DROP INDEX IF EXISTS public.idx_access_revocation_revoked_at;
DROP INDEX IF EXISTS public.idx_access_revocation_reason;
DROP INDEX IF EXISTS public.idx_videos_user_id;
DROP INDEX IF EXISTS public.idx_import_products_first_seen_in_import_id;
DROP INDEX IF EXISTS public.idx_product_app_mappings_verified_by;
DROP INDEX IF EXISTS public.idx_import_user_records_import_product_id;
DROP INDEX IF EXISTS public.idx_apps_item_type;
DROP INDEX IF EXISTS public.idx_apps_parent_app_id;
DROP INDEX IF EXISTS public.idx_apps_is_suite;
DROP INDEX IF EXISTS public.idx_app_feature_links_app;
DROP INDEX IF EXISTS public.idx_app_feature_links_feature;
DROP INDEX IF EXISTS public.idx_app_feature_links_sort;
