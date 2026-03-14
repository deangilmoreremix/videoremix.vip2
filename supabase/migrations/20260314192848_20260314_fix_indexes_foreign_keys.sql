
/*
  # Add missing foreign key indexes

  ## Summary
  Adds covering indexes for all unindexed foreign key columns to improve
  query performance on JOIN and lookup operations.

  ## New Indexes
  - access_revocation_log: purchase_id, subscription_id
  - csv_imports: imported_by
  - import_user_records: csv_import_id, user_id
  - organization_members: invited_by
  - product_app_mappings: access_tier_id, app_id
  - purchases: product_id
  - subscription_status: purchase_id
  - sync_jobs: started_by
  - user_app_access: purchase_id
*/

CREATE INDEX IF NOT EXISTS idx_access_revocation_log_purchase_id
  ON public.access_revocation_log (purchase_id)
  WHERE purchase_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_access_revocation_log_subscription_id
  ON public.access_revocation_log (subscription_id)
  WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_csv_imports_imported_by
  ON public.csv_imports (imported_by)
  WHERE imported_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_user_records_csv_import_id
  ON public.import_user_records (csv_import_id);

CREATE INDEX IF NOT EXISTS idx_import_user_records_user_id
  ON public.import_user_records (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_members_invited_by
  ON public.organization_members (invited_by)
  WHERE invited_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_app_mappings_access_tier_id
  ON public.product_app_mappings (access_tier_id)
  WHERE access_tier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_app_mappings_app_id
  ON public.product_app_mappings (app_id);

CREATE INDEX IF NOT EXISTS idx_purchases_product_id
  ON public.purchases (product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_status_purchase_id
  ON public.subscription_status (purchase_id)
  WHERE purchase_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_by
  ON public.sync_jobs (started_by)
  WHERE started_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_app_access_purchase_id
  ON public.user_app_access (purchase_id)
  WHERE purchase_id IS NOT NULL;
