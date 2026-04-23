-- =============================================================================
-- RESTORE CRITICAL INDEXES FOR PERFORMANCE AND INTEGRITY
-- 
-- 43 indexes were mistakenly removed in migration 20251120163426
-- These are critical for foreign keys, query performance, and concurrency
-- =============================================================================

-- Foreign key indexes (PostgreSQL does NOT auto-create these!)
CREATE INDEX IF NOT EXISTS idx_app_features_app_id ON app_features(app_id);
CREATE INDEX IF NOT EXISTS idx_feature_benefits_feature_id ON feature_benefits(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_steps_feature_id ON feature_steps(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_use_cases_feature_id ON feature_use_cases(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_faqs_feature_id ON feature_faqs(feature_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_user_id ON user_feature_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_interactions_feature_id ON user_feature_interactions(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_ratings_feature_id ON feature_ratings(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_relationships_feature_id ON feature_relationships(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_relationships_related_feature_id ON feature_relationships(related_feature_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_imported_by ON csv_imports(imported_by);
CREATE INDEX IF NOT EXISTS idx_import_user_records_csv_import_id ON import_user_records(csv_import_id);
CREATE INDEX IF NOT EXISTS idx_import_user_records_user_id ON import_user_records(user_id);
CREATE INDEX IF NOT EXISTS idx_import_user_records_import_product_id ON import_user_records(import_product_id);
CREATE INDEX IF NOT EXISTS idx_product_app_mappings_access_tier_id ON product_app_mappings(access_tier_id);
CREATE INDEX IF NOT EXISTS idx_product_app_mappings_app_id ON product_app_mappings(app_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status_purchase_id ON subscription_status(purchase_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status_user_id ON subscription_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_purchase_id ON user_app_access(purchase_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_user_id ON user_app_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_access_app_slug ON user_app_access(app_slug);
CREATE INDEX IF NOT EXISTS idx_admin_analytics_events_user_id ON admin_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_analytics_events_created_at ON admin_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_import_products_first_seen_in_import_id ON import_products(first_seen_in_import_id);
CREATE INDEX IF NOT EXISTS idx_platform_product_mappings_product_id ON platform_product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_stripe_entitlements_user_id ON stripe_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Performance critical indexes
CREATE INDEX IF NOT EXISTS idx_app_usage_app_slug ON app_usage_analytics(app_slug);
CREATE INDEX IF NOT EXISTS idx_app_usage_date ON app_usage_analytics(date);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_analytics(date);
CREATE INDEX IF NOT EXISTS idx_revenue_platform ON revenue_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_revenue_product ON revenue_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_app_features_category ON app_features(category);
CREATE INDEX IF NOT EXISTS idx_app_features_sort_order ON app_features(sort_order);
CREATE INDEX IF NOT EXISTS idx_daily_snapshots_date ON daily_analytics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Uniqueness and concurrency indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_platform_transaction_id ON purchases(platform, platform_transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_status_platform_subscription_id ON subscription_status(platform, platform_subscription_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_app_access_user_app ON user_app_access(user_id, app_slug);

SELECT 'Restored 38 critical indexes for performance and data integrity' as status;
