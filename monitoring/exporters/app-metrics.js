#!/usr/bin/env node

/**
 * Application Metrics Exporter for Prometheus
 * Collects metrics from VideoRemix application
 */

const express = require('express');
const { promClient } = require('prom-client');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 9465;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Prometheus registry
const register = new promClient.Registry();

// Collect default Node.js metrics
const collectDefaultMetrics = new promClient.collect();
register.registerMetrics(collectDefaultMetrics);

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const userActivityTotal = new promClient.Counter({
  name: 'user_activity_total',
  help: 'Total user activities',
  labelNames: ['action', 'page'],
  registers: [register],
});

const appUsageTotal = new promClient.Counter({
  name: 'app_usage_total',
  help: 'Total application launches/usages',
  labelNames: ['app_id', 'app_name', 'category'],
  registers: [register],
});

const purchaseProcessingTotal = new promClient.Counter({
  name: 'purchase_processing_total',
  help: 'Total purchase processing attempts',
  labelNames: ['status', 'platform', 'product_id'],
  registers: [register],
});

const webhookDeliveryTotal = new promClient.Counter({
  name: 'webhook_delivery_total',
  help: 'Total webhook deliveries',
  labelNames: ['platform', 'event_type', 'status'],
  registers: [register],
});

const videoProcessingDuration = new promClient.Histogram({
  name: 'video_processing_duration_seconds',
  help: 'Video processing duration',
  labelNames: ['operation', 'status'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

const thumbnailGenerationTotal = new promClient.Counter({
  name: 'thumbnail_generation_total',
  help: 'Total thumbnails generated',
  labelNames: ['style', 'status'],
  registers: [register],
});

const activeUsersGauge = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  labelNames: [],
  registers: [register],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const cacheHitTotal = new promClient.Counter({
  name: 'cache_hit_total',
  help: 'Cache hit/miss counts',
  labelNames: ['cache_type', 'result'],
  registers: [register],
});

// Periodic collection tasks
setInterval(collectDatabaseMetrics, 30); // Every 30s
setInterval(collectUserMetrics, 60); // Every minute
setInterval(collectBusinessMetrics, 300); // Every 5 minutes

async function collectDatabaseMetrics() {
  const start = Date.now();

  try {
    // Active users (last 30 min)
    const { data: activeUsers, error: userError } = await supabase.rpc('get_active_users_count', {
      minutes: 30,
    });

    if (!userError && activeUsers) {
      activeUsersGauge.set(activeUsers.count || activeUsers);
    }

    // Database query performance (from pg_stat_statements if available)
    const queryStart = Date.now();
    const { data: queryStats, error: queryError } = await supabase
      .from('api_usage_logs')
      .select('model, tokens, cost_cents', { count: 'exact' })
      .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

    const queryDuration = (Date.now() - queryStart) / 1000;
    databaseQueryDuration.observe({ query_type: 'select', table: 'api_usage_logs' }, queryDuration);

    if (queryError) {
      console.warn('Error collecting DB metrics:', queryError.message);
    }

    // Cache performance (if Redis is used)
    // Implementation depends on actual cache layer

  } catch (error) {
    console.error('Database metrics collection failed:', error);
  }
}

async function collectUserMetrics() {
  try {
    // Active sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('user_id', { count: 'exact' })
      .gte('last_seen', new Date(Date.now() - 1800000).toISOString());

    if (!sessionError && sessions) {
      userActivityTotal.inc({ action: 'active_session', page: 'global' }, sessions.length);
    }

    // App usage stats
    const { data: appUsage, error: appError } = await supabase
      .from('app_launches')
      .select(`
        app_id,
        apps (name, category)
      `, { count: 'exact' })
      .gte('launched_at', new Date(Date.now() - 3600000).toISOString());

    if (!appError && appUsage) {
      // Group by app and increment
      const usageByApp = {};
      appUsage.forEach(record => {
        const key = record.app_id;
        usageByApp[key] = (usageByApp[key] || 0) + 1;
      });

      Object.entries(usageByApp).forEach(([appId, count]) => {
        const appInfo = appUsage.find(u => u.app_id === appId)?.apps;
        if (appInfo) {
          appUsageTotal.inc(
            { app_id: appId, app_name: appInfo.name, category: appInfo.category },
            count
          );
        }
      });
    }

  } catch (error) {
    console.error('User metrics collection failed:', error);
  }
}

async function collectBusinessMetrics() {
  try {
    // Purchase processing
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('status, platform, product_id')
      .gte('created_at', new Date(Date.now() - 300000).toISOString());

    if (!purchaseError && purchases) {
      purchases.forEach(purchase => {
        purchaseProcessingTotal.inc({
          status: purchase.status || 'unknown',
          platform: purchase.platform || 'unknown',
          product_id: purchase.product_id || 'unknown',
        });
      });
    }

    // Video processing metrics
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('processing_status, processing_time')
      .gte('updated_at', new Date(Date.now() - 300000).toISOString());

    if (!videoError && videos) {
      videos.forEach(video => {
        if (video.processing_time) {
          videoProcessingDuration.observe(
            { operation: 'video_processing', status: video.processing_status },
            video.processing_time / 1000
          );
        }
      });
    }

  } catch (error) {
    console.error('Business metrics collection failed:', error);
  }
}

// Instrumentation middleware for Express apps
app.use('/metrics', async (req, res) => {
  const start = Date.now();

  try {
    // Collect all metrics
    await Promise.all([
      collectDatabaseMetrics(),
      collectUserMetrics(),
      collectBusinessMetrics(),
    ]);

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Application Metrics Exporter listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down app exporter...');
  process.exit(0);
});
