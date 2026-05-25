#!/usr/bin/env node

/**
 * 🎯 REVOLUTIONARY LAUNCH: Analytics Script
 * Tracks and reports launch performance metrics
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function celebration(message) {
  log(`🎉 ${message}`, 'magenta');
}

// Mock metrics - in real implementation, these would come from analytics service
const mockMetrics = {
  modalOpens: Math.floor(Math.random() * 500) + 100,
  pageViews: Math.floor(Math.random() * 2000) + 500,
  purchaseAttempts: Math.floor(Math.random() * 50) + 10,
  averageSessionTime: Math.floor(Math.random() * 300) + 180,
  errorRate: (Math.random() * 2).toFixed(2),
  conversionRate: (Math.random() * 10 + 5).toFixed(2)
};

function calculateKPIs(metrics) {
  return {
    engagementRate: ((metrics.modalOpens / metrics.pageViews) * 100).toFixed(2),
    conversionRate: metrics.conversionRate,
    errorRate: metrics.errorRate,
    sessionQuality: metrics.averageSessionTime > 240 ? 'excellent' : metrics.averageSessionTime > 180 ? 'good' : 'needs_improvement'
  };
}

function generateReport(metrics, kpis) {
  const launchDate = new Date().toISOString().split('T')[0];
  const reportPath = path.join('reports', `launch-report-${launchDate}.json`);

  const report = {
    launch_date: launchDate,
    timestamp: new Date().toISOString(),
    metrics: metrics,
    kpis: kpis,
    status: kpis.engagementRate > 15 ? 'success' : kpis.engagementRate > 10 ? 'moderate_success' : 'needs_attention',
    recommendations: []
  };

  // Generate recommendations based on metrics
  if (kpis.engagementRate < 10) {
    report.recommendations.push('Consider improving modal discoverability');
  }
  if (kpis.conversionRate < 7) {
    report.recommendations.push('Review pricing and CTA messaging');
  }
  if (kpis.errorRate > 1) {
    report.recommendations.push('Investigate and fix technical issues');
  }

  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

function displayDashboard(metrics, kpis) {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 REVOLUTIONARY LAUNCH: Performance Dashboard');
  console.log('='.repeat(60));

  console.log('\n📊 KEY METRICS:');
  console.log(`   Modal Opens: ${colors.green}${metrics.modalOpens}${colors.reset}`);
  console.log(`   Page Views: ${colors.green}${metrics.pageViews}${colors.reset}`);
  console.log(`   Purchase Attempts: ${colors.green}${metrics.purchaseAttempts}${colors.reset}`);
  console.log(`   Avg Session Time: ${colors.green}${metrics.averageSessionTime}s${colors.reset}`);
  console.log(`   Error Rate: ${metrics.errorRate < 1 ? colors.green : colors.red}${metrics.errorRate}%${colors.reset}`);

  console.log('\n🎯 KEY PERFORMANCE INDICATORS:');
  console.log(`   Engagement Rate: ${kpis.engagementRate > 15 ? colors.green : kpis.engagementRate > 10 ? colors.yellow : colors.red}${kpis.engagementRate}%${colors.reset}`);
  console.log(`   Conversion Rate: ${kpis.conversionRate > 8 ? colors.green : colors.yellow}${kpis.conversionRate}%${colors.reset}`);
  console.log(`   Session Quality: ${kpis.sessionQuality === 'excellent' ? colors.green : kpis.sessionQuality === 'good' ? colors.yellow : colors.red}${kpis.sessionQuality.replace('_', ' ')}${colors.reset}`);

  console.log('\n🏆 SUCCESS CRITERIA:');
  const criteria = [
    { name: 'Modal Open Rate', target: '> 15%', actual: `${kpis.engagementRate}%`, met: kpis.engagementRate > 15 },
    { name: 'Conversion Rate', target: '> 8%', actual: `${kpis.conversionRate}%`, met: kpis.conversionRate > 8 },
    { name: 'Error Rate', target: '< 1%', actual: `${kpis.errorRate}%`, met: kpis.errorRate < 1 },
    { name: 'Session Quality', target: 'Excellent', actual: kpis.sessionQuality.replace('_', ' '), met: kpis.sessionQuality === 'excellent' }
  ];

  criteria.forEach(criterion => {
    const status = criterion.met ? '✅' : '❌';
    const color = criterion.met ? colors.green : colors.red;
    console.log(`   ${status} ${criterion.name}: ${color}${criterion.actual}${colors.reset} (Target: ${criterion.target})`);
  });

  const successCount = criteria.filter(c => c.met).length;
  const overallSuccess = successCount >= 3;

  console.log('\n' + '='.repeat(60));
  if (overallSuccess) {
    celebration('🚀 LAUNCH SUCCESS! Revolutionary experience is performing excellently!');
  } else {
    log(`⚠️  Launch needs attention. ${successCount}/4 success criteria met.`, 'yellow');
  }
  console.log('='.repeat(60));
}

async function main() {
  log('🎯 Gathering revolutionary launch analytics...');

  // In real implementation, fetch from analytics service
  const metrics = mockMetrics;
  const kpis = calculateKPIs(metrics);

  displayDashboard(metrics, kpis);

  const reportPath = generateReport(metrics, kpis);
  success(`Analytics report saved to: ${reportPath}`);

  // Save metrics for trending
  const metricsPath = path.join('reports', 'metrics-history.json');
  let history = [];
  try {
    history = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
  } catch {
    // File doesn't exist, start new history
  }

  history.push({
    date: new Date().toISOString(),
    metrics,
    kpis
  });

  // Keep only last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  history = history.filter(entry => new Date(entry.date) > thirtyDaysAgo);

  fs.writeFileSync(metricsPath, JSON.stringify(history, null, 2));
  success('Metrics history updated');
}

main().catch(console.error);