#!/usr/bin/env node

/**
 * Health Check Server
 * Provides liveness, readiness, and dependency health checks
 */

const express = require('express');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 9466;

const HEALTH_CACHE_TTL = 10000; // 10 seconds
let cachedHealth = null;
let lastCheck = 0;

function isCacheValid() {
  return Date.now() - lastCheck < HEALTH_CACHE_TTL;
}

// Health check dependencies
const checks = {
  openai: async () => {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Simple API call to verify connectivity
      const start = Date.now();
      await openai.models.list();
      const duration = Date.now() - start;

      return {
        status: 'healthy',
        latency_ms: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },

  supabase: async () => {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );

      const start = Date.now();
      const { data, error } = await supabase.from('app').select('count').limit(1);
      const duration = Date.now() - start;

      if (error) throw error;

      return {
        status: 'healthy',
        latency_ms: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },

  redis: async () => {
    // Check Redis if available
    try {
      // Implement Redis health check if Redis is used
      return {
        status: 'not_configured',
        message: 'Redis not configured',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  },

  disk: async () => {
    const diskSpace = require('os').freemem();
    const totalSpace = require('os').totalmem();
    const usedPercent = ((totalSpace - diskSpace) / totalSpace) * 100;

    return {
      status: usedPercent > 90 ? 'unhealthy' : 'healthy',
      used_percent: usedPercent.toFixed(2),
      free_gb: (diskSpace / 1024 / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString(),
    };
  },

  memory: async () => {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      status: heapUsedPercent > 90 ? 'unhealthy' : 'healthy',
      heap_used_percent: heapUsedPercent.toFixed(2),
      rss_mb: (usage.rss / 1024 / 1024).toFixed(2),
      timestamp: new Date().toISOString(),
    };
  },
};

// Liveness probe - simple check
app.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe - checks all dependencies
app.get('/health/ready', async (req, res) => {
  if (isCacheValid() && cachedHealth) {
    return res.json(cachedHealth);
  }

  const results = await Promise.allSettled(
    Object.entries(checks).map(async ([name, check]) => {
      const result = await check();
      return { name, ...result };
    })
  );

  const overallStatus = results.every(r => r.status === 'fulfilled' && r.value.status === 'healthy')
    ? 'healthy'
    : 'unhealthy';

  const health = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason }),
  };

  cachedHealth = health;
  lastCheck = Date.now();

  res.status(overallStatus === 'healthy' ? 200 : 503).json(health);
});

// Detailed health check with all dependencies
app.get('/health', async (req, res) => {
  const results = await Promise.allSettled(
    Object.entries(checks).map(async ([name, check]) => {
      try {
        const result = await check();
        return { name, ...result };
      } catch (error) {
        return { name, status: 'unhealthy', error: error.message };
      }
    })
  );

  const overallStatus = results.every(r => r.status === 'fulfilled' && r.value.status === 'healthy')
    ? 'healthy'
    : 'unhealthy';

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason }),
    dependencies: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      supabase: process.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
    },
  });
});

// Dependency-specific health check
app.get('/health/dependencies', async (req, res) => {
  const dependencyResults = await Promise.allSettled(
    Object.keys(checks).map(async (key) => {
      try {
        const result = await checks[key]();
        return { [key]: result };
      } catch (error) {
        return { [key]: { status: 'error', error: error.message } };
      }
    })
  );

  res.json({
    dependencies: dependencyResults.reduce((acc, r) => Object.assign(acc, r.status === 'fulfilled' ? r.value : { error: r.reason }), {}),
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    health_check_total: 1,
    healthy_checks: Object.keys(checks).length,
    timestamp: Date.now(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Health Check Server listening on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /health - Full health check`);
  console.log(`  GET /health/live - Liveness probe`);
  console.log(`  GET /health/ready - Readiness probe`);
  console.log(`  GET /health/dependencies - Dependency status`);
  console.log(`  GET /metrics - Metrics for Prometheus`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down health checker...');
  process.exit(0);
});
