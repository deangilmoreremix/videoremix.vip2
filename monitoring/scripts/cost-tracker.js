#!/usr/bin/env node

/**
 * Cost Tracker Service
 * Monitors OpenAI API costs and triggers alerts when thresholds are exceeded
 */

const { OpenAI } = require('openai');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const DAILY_THRESHOLD = parseFloat(process.env.DAILY_THRESHOLD || '50');
const MONTHLY_THRESHOLD = parseFloat(process.env.MONTHLY_THRESHOLD || '1000');
const ALERT_PERCENTAGE = parseFloat(process.env.ALERT_PERCENTAGE || '80');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// Store cost data
const costStore = {
  daily: {},
  monthly: {},
};

// Load persisted data
function loadCostData() {
  try {
    const dataPath = path.join(__dirname, '../../data/cost-tracking.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      Object.assign(costStore, data);
      console.log(`[CostTracker] Loaded cost data:`, costStore);
    }
  } catch (error) {
    console.warn('Could not load cost data:', error.message);
  }
}

// Save cost data
function saveCostData() {
  try {
    const dataPath = path.join(__dirname, '../../data/cost-tracking.json');
    const dir = path.dirname(dataPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dataPath, JSON.stringify(costStore, null, 2));
  } catch (error) {
    console.error('Could not save cost data:', error);
  }
}

// Get today's date key
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

// Get current month key
function getMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

// Fetch OpenAI usage from API
async function fetchOpenAIUsage() {
  try {
    // OpenAI billing endpoint (requires organization ID)
    const response = await fetch(`https://api.openai.com/v1/organization/${process.env.OPENAI_ORG_ID}/usage?start_date=${getMonthKey()}-01&end_date=${getTodayKey()}`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch OpenAI usage:', error.message);
    return null;
  }
}

// Calculate costs from usage object
function calculateCostFromUsage(usage) {
  let totalCost = 0;

  if (!usage) return 0;

  // Parse line items from OpenAI usage response
  if (usage.line_items) {
    usage.line_items.forEach(item => {
      totalCost += (parseFloat(item.cost) || 0);
    });
  }

  return totalCost;
}

// Main tracking function
async function trackCosts() {
  const today = getTodayKey();
  const month = getMonthKey();

  // Initialize if not exists
  if (!costStore.daily[today]) {
    costStore.daily[today] = 0;
  }
  if (!costStore.monthly[month]) {
    costStore.monthly[month] = 0;
  }

  // Fetch latest from OpenAI
  const usageData = await fetchOpenAIUsage();
  const actualCost = calculateCostFromUsage(usageData);

  if (actualCost > 0) {
    costStore.daily[today] = actualCost;
    costStore.monthly[month] = actualCost;
  }

  // Check thresholds
  await checkThresholds(today, month);

  // Log summary
  console.log(`[CostTracker] Daily: $${costStore.daily[today].toFixed(2)}, Monthly: $${costStore.monthly[month].toFixed(2)}`);

  saveCostData();
  return { daily: costStore.daily[today], monthly: costStore.monthly[month] };
}

// Check thresholds and send alerts
async function checkThresholds(today, month) {
  const dailyCost = costStore.daily[today];
  const monthlyCost = costStore.monthly[month];

  // Daily checks
  if (dailyCost >= DAILY_THRESHOLD) {
    await sendAlert({
      severity: 'critical',
      category: 'daily',
      current: dailyCost,
      threshold: DAILY_THRESHOLD,
      message: `Daily OpenAI cost threshold EXCEEDED: $${dailyCost.toFixed(2)} > $${DAILY_THRESHOLD}`,
      date: today,
    });
  } else if (dailyCost >= DAILY_THRESHOLD * (ALERT_PERCENTAGE / 100)) {
    await sendAlert({
      severity: 'warning',
      category: 'daily',
      current: dailyCost,
      threshold: DAILY_THRESHOLD,
      message: `Daily OpenAI cost warning: $${dailyCost.toFixed(2)} (${ALERT_PERCENTAGE}% of $${DAILY_THRESHOLD})`,
      date: today,
    });
  }

  // Monthly checks
  if (monthlyCost >= MONTHLY_THRESHOLD) {
    await sendAlert({
      severity: 'critical',
      category: 'monthly',
      current: monthlyCost,
      threshold: MONTHLY_THRESHOLD,
      message: `Monthly OpenAI cost threshold EXCEEDED: $${monthlyCost.toFixed(2)} > $${MONTHLY_THRESHOLD}`,
      month,
    });
  } else if (monthlyCost >= MONTHLY_THRESHOLD * (ALERT_PERCENTAGE / 100)) {
    await sendAlert({
      severity: 'warning',
      category: 'monthly',
      current: monthlyCost,
      threshold: MONTHLY_THRESHOLD,
      message: `Monthly OpenAI cost warning: $${monthlyCost.toFixed(2)} (${ALERT_PERCENTAGE}% of $${MONTHLY_THRESHOLD})`,
      month,
    });
  }
}

// Send Slack alert
async function sendAlert({ severity, category, current, threshold, message, date, month }) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping alert');
    return;
  }

  const exceededBy = current - threshold;
  const color = severity === 'critical' ? 'danger' : 'warning';
  const emoji = severity === 'critical' ? '🚨' : '⚠️';

  const period = category === 'daily' ? date : month;
  const title = `${emoji} OpenAI ${category} cost ${severity}`;

  const payload = {
    text: title,
    attachments: [
      {
        color,
        fields: [
          { title: 'Category', value: category, short: true },
          { title: 'Current Spend', value: `$${current.toFixed(2)}`, short: true },
          { title: 'Threshold', value: `$${threshold.toFixed(2)}`, short: true },
          { title: 'Exceeded By', value: `$${exceededBy.toFixed(2)}`, short: true },
          { title: 'Period', value: period, short: true },
        ],
        actions: [
          {
            type: 'button',
            text: 'View Dashboard',
            url: 'http://localhost:3000/dashboards',
          },
        ],
        footer: 'VideoRemix Production Monitoring',
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
      console.log(`[CostTracker] Alert sent: ${title}`);
    } else {
      console.error(`[CostTracker] Slack webhook error: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

// Export endpoint for metrics
function createMetricsServer() {
  const express = require('express');
  const { promClient } = require('prom-client');

  const costDailyMetric = new promClient.Gauge({
    name: 'openai_daily_cost_usd',
    help: 'Daily OpenAI cost in USD',
  });

  const costMonthlyMetric = new promClient.Gauge({
    name: 'openai_monthly_cost_usd',
    help: 'Monthly OpenAI cost in USD',
  });

  const app = express();

  app.get('/metrics', async (req, res) => {
    const today = getTodayKey();
    const month = getMonthKey();

    costDailyMetric.set({}, costStore.daily[today] || 0);
    costMonthlyMetric.set({}, costStore.monthly[month] || 0);

    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  return app;
}

// Scheduled tasks
function scheduleTasks() {
  // Check costs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CostTracker] Running scheduled check...');
    await trackCosts();
  });

  // Daily reset at midnight UTC
  cron.schedule('0 0 * * *', () => {
    console.log('[CostTracker] Resetting daily costs...');
    const today = getTodayKey();
    costStore.daily[today] = 0;
    saveCostData();
  });

  // Monthly cleanup on 1st
  cron.schedule('0 0 1 * *', () => {
    console.log('[CostTracker] Running monthly cleanup...');
    // Keep last 90 days of daily data
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffKey = cutoff.toISOString().split('T')[0];

    Object.keys(costStore.daily).forEach(key => {
      if (key < cutoffKey) {
        delete costStore.daily[key];
      }
    });

    saveCostData();
  });
}

// Start metrics server
const metricsApp = createMetricsServer();
const METRICS_PORT = process.env.PORT || 9467;

metricsApp.listen(METRICS_PORT, () => {
  console.log(`Cost Tracker metrics server listening on port ${METRICS_PORT}`);
});

// Initialize
async function main() {
  console.log('[CostTracker] Initializing...');
  loadCostData();
  scheduleTasks();

  // Initial check
  await trackCosts();

  console.log('[CostTracker] Service started');
}

main().catch(error => {
  console.error('[CostTracker] Fatal error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[CostTracker] Shutting down...');
  saveCostData();
  process.exit(0);
});

module.exports = { trackCosts, sendAlert, costStore };
