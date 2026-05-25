#!/usr/bin/env node

/**
 * OpenAI Metrics Exporter for Prometheus
 * Tracks API usage, costs, and rate limits
 */

const express = require('express');
const { promClient } = require('prom-client');
const OpenAI = require('openai');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 9464;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Prometheus metrics registry
const register = new promClient.Registry();

// Custom metrics
const openaiRequestsTotal = new promClient.Counter({
  name: 'openai_requests_total',
  help: 'Total number of OpenAI API requests',
  labelNames: ['model', 'endpoint', 'status'],
  registers: [register],
});

const openaiTokensTotal = new promClient.Counter({
  name: 'openai_tokens_total',
  help: 'Total tokens consumed',
  labelNames: ['model', 'type'],
  registers: [register],
});

const openaiCostTotal = new promClient.Counter({
  name: 'openai_cost_total_cents',
  help: 'Total cost in cents (USD * 100)',
  labelNames: ['model', 'service'],
  registers: [register],
});

const openApiLatency = new promClient.Histogram({
  name: 'openai_request_duration_seconds',
  help: 'OpenAI API request duration',
  labelNames: ['model', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30],
  registers: [register],
});

const openaiDailyCost = new promClient.Gauge({
  name: 'openai_daily_cost_usd',
  help: 'Daily OpenAI spend in USD',
  labelNames: ['date'],
  registers: [register],
});

const openaiMonthlyCost = new promClient.Gauge({
  name: 'openai_monthly_cost_usd',
  help: 'Monthly OpenAI spend in USD',
  labelNames: ['month'],
  registers: [register],
});

const openaiRateLimitRemaining = new promClient.Gauge({
  name: 'openai_rate_limit_remaining',
  help: 'Remaining requests in rate limit window',
  labelNames: ['type'],
  registers: [register],
});

const openaiErrorTotal = new promClient.Counter({
  name: 'openai_error_total',
  help: 'Total OpenAI API errors',
  labelNames: ['error_type', 'model'],
  registers: [register],
});

// Cost tracking state
let dailyCost = 0;
let monthlyCost = 0;
costsUpdatedAt = new Date();

// Pricing per 1K tokens (in cents)
const PRICING = {
  'gpt-4o': { input: 250, output: 1000 }, // $2.50/1M in, $10/1M out
  'gpt-4': { input: 300, output: 600 },
  'gpt-3.5-turbo': { input: 50, output: 100 },
  'text-embedding-ada-002': { input: 10, output: 0 },
  'whisper-1': { per_minute: 600 }, // $6/hour
};

// Track request metrics via intercepted fetch
if (typeof window !== 'undefined') {
  // Browser environment - track via performance API
} else {
  // Node.js - intercept OpenAI calls
  const originalCreate = openai.chat.completions.create.bind(openai.chat.completions);
  openai.chat.completions.create = async function (...args) {
    const start = Date.now();
    const model = args[0].model || 'unknown';

    try {
      const result = await originalCreate(...args);
      const duration = (Date.now() - start) / 1000;

      // Record metrics
      openaiRequestsTotal.inc({ model, endpoint: 'chat/completions', status: 'success' });
      openApiLatency.observe({ model, endpoint: 'chat/completions' }, duration);

      const usage = result.usage;
      if (usage) {
        const inputTokens = usage.prompt_tokens;
        const outputTokens = usage.completion_tokens;

        openaiTokensTotal.inc({ model, type: 'input' }, inputTokens);
        openaiTokensTotal.inc({ model, type: 'output' }, outputTokens);

        // Calculate cost (approximate)
        const pricing = PRICING[model] || PRICING['gpt-4o'];
        const inputCost = (inputTokens / 1000) * (pricing.input / 100); // cents to dollars
        const outputCost = (outputTokens / 1000) * (pricing.output / 100);
        const totalCost = inputCost + outputCost;

        openaiCostTotal.inc({ model, service: 'chat' }, totalCost * 100); // to cents

        dailyCost += totalCost;
        monthlyCost += totalCost;
      }

      return result;
    } catch (error) {
      openaiRequestsTotal.inc({ model, endpoint: 'chat/completions', status: 'error' });
      openaiErrorTotal.inc({ error_type: error.code || 'unknown', model });
      throw error;
    }
  };
}

// Periodic cost update task
cron.schedule('*/5 * * * *', async () => {
  await updateCostMetrics();
});

async function updateCostMetrics() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const month = now.toISOString().slice(0, 7);

    // Update gauges
    openaiDailyCost.set({ date: today }, dailyCost);
    openaiMonthlyCost.set({ month }, monthlyCost);

    // Reset daily cost at midnight UTC
    const lastMidnight = new Date(now);
    lastMidnight.setUTCHours(0, 0, 0, 0);
    if (costsUpdatedAt < lastMidnight) {
      dailyCost = 0;
      costsUpdatedAt = now;
    }

    console.log(`[OpenAI Exporter] Costs updated - Daily: $${dailyCost.toFixed(2)}, Monthly: $${monthlyCost.toFixed(2)}`);

    // Check thresholds
    await checkCostThresholds(dailyCost, monthlyCost, today, month);
  } catch (error) {
    console.error('Error updating cost metrics:', error);
  }
}

async function checkCostThresholds(daily, monthly, date, month) {
  const DAILY_THRESHOLD = parseFloat(process.env.DAILY_THRESHOLD || '50');
  const MONTHLY_THRESHOLD = parseFloat(process.env.MONTHLY_THRESHOLD || '1000');

  // Fetch usage from OpenAI API for more accurate tracking
  try {
    const usage = await openai.daily.usage.list({
      // Last 7 days
    });

    // Calculate actual spend from API
    // Implementation depends on OpenAI API response format
  } catch (error) {
    console.warn('Could not fetch OpenAI usage API:', error.message);
  }

  // Send alerts if thresholds exceeded
  if (daily > DAILY_THRESHOLD) {
    console.error(`🚨 DAILY COST THRESHOLD EXCEEDED: $${daily} > $${DAILY_THRESHOLD}`);
    await sendSlackAlert('daily', daily, DAILY_THRESHOLD, date);
  } else if (daily > DAILY_THRESHOLD * 0.8) {
    console.warn(`⚠️ Daily cost warning: $${daily} (${((daily/DAILY_THRESHOLD)*100).toFixed(0)}% of threshold)`);
  }

  if (monthly > MONTHLY_THRESHOLD) {
    console.error(`🚨 MONTHLY COST THRESHOLD EXCEEDED: $${monthly} > $${MONTHLY_THRESHOLD}`);
    await sendSlackAlert('monthly', monthly, MONTHLY_THRESHOLD, month);
  } else if (monthly > MONTHLY_THRESHOLD * 0.8) {
    console.warn(`⚠️ Monthly cost warning: $${monthly} (${((monthly/MONTHLY_THRESHOLD)*100).toFixed(0)}% of threshold)`);
  }
}

async function sendSlackAlert(period, current, threshold, date) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping alert');
    return;
  }

  const exceededBy = current - threshold;
  const exceededByFormatted = `$${exceededBy.toFixed(2)}`;
  const thresholdFormatted = `$${threshold.toFixed(2)}`;
  const currentFormatted = `$${current.toFixed(2)}`;
  const severity = current > threshold ? 'critical' : 'warning';
  const emoji = severity === 'critical' ? '🚨' : '⚠️';

  const payload = {
    text: `${emoji} OpenAI ${period} cost ${severity === 'critical' ? 'threshold EXCEEDED' : 'warning'}`,
    attachments: [
      {
        color: severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Period', value: period, short: true },
          { title: 'Current Spend', value: currentFormatted, short: true },
          { title: 'Threshold', value: thresholdFormatted, short: true },
          { title: 'Exceeded By', value: exceededByFormatted, short: true },
          { title: 'Date/Period', value: String(date), short: true },
        ],
        footer: 'VideoRemix Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`✅ Slack alert sent for ${period} cost threshold`);
    } else {
      console.error(`❌ Slack webhook error: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    metrics_count: register.metrics.length,
  });
});

// Metrics endpoint (Prometheus scrape)
app.get('/metrics', async (req, res) => {
  try {
    // Update costs before scraping
    await updateCostMetrics();

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    dailyCost,
    monthlyCost,
    metrics: register.metrics.map(m => ({ name: m.name, help: m.help, type: m.type })),
  });
});

app.listen(PORT, () => {
  console.log(`OpenAI Metrics Exporter listening on port ${PORT}`);
  console.log(`Metrics endpoint: http://localhost:${PORT}/metrics`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Initial cost update on startup
  updateCostMetrics();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down OpenAI exporter...');
  process.exit(0);
});
