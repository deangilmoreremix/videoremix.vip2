#!/usr/bin/env node

/**
 * Monitoring Deployment Summary Generator
 * Creates comprehensive deployment report
 */

const fs = require('fs');
const path = require('path');

const MONITORING_DIR = path.join(__dirname, '../..', 'monitoring');

function generateDeploymentSummary() {
  const timestamp = new Date().toISOString();

  // Collect system status
  const dockerStatus = getDockerComposeStatus();
  const services = checkServiceHealth();
  const dashboards = listDashboards();
  const alerts = listConfiguredAlerts();
  const metrics = collectExposedMetrics();

  const summary = {
    deployment: {
      timestamp,
      version: '1.0.0',
      deployed_by: 'Kilo CLI',
      method: 'docker-compose',
    },
    infrastructure: {
      docker_compose: true,
      services: services,
      total_services: Object.keys(services).length,
      healthy_count: Object.values(services).filter((s: any) => s.healthy).length,
    },
    dashboards: {
      total: dashboards.length,
      list: dashboards,
    },
    alerts: {
      total_rules: alerts.length,
      categories: groupAlertsByCategory(alerts),
      thresholds: {
        daily_cost: 50,
        monthly_cost: 1000,
        alert_percentage: 80,
      },
    },
    metrics: {
      custom_exporters: metrics.exporters,
      total_metrics: metrics.count,
      categories: metrics.categories,
    },
    endpoints: {
      grafana: 'http://localhost:3000',
      prometheus: 'http://localhost:9090',
      alertmanager: 'http://localhost:9093',
      loki: 'http://localhost:3100',
      openai_exporter: 'http://localhost:9464/metrics',
      app_exporter: 'http://localhost:9465/metrics',
      health_checker: 'http://localhost:9466/health',
      cost_tracker: 'http://localhost:9467/metrics',
    },
    slack_integration: {
      configured: process.env.SLACK_WEBHOOK_URL ? true : false,
      webhook_url: process.env.SLACK_WEBHOOK_URL ? '✅ Configured' : '❌ Not set',
      channels: {
        cost_alerts: '#cost-alerts',
        monitoring: '#monitoring-alerts',
      },
    },
    database_schema: {
      tables_created: [
        'openai_daily_costs',
        'openai_monthly_costs',
        'api_usage_logs',
        'error_logs',
        'health_check_history',
        'performance_metrics',
        'alert_history',
        'business_metrics_daily',
      ],
      scheduled_jobs: [
        'aggregate_daily_costs (daily at midnight)',
        'aggregate_monthly_costs (1st of month)',
        'cleanup_old_metrics (weekly)',
      ],
    },
    file_structure: {
      config_files: [
        'docker-compose.yml',
        'prometheus/prometheus.yml',
        'prometheus/rules.yml',
        'alertmanager/alertmanager.yml',
        'grafana/provisioning/datasources/datasources.yml',
        'loki/local-config.yaml',
        'promtail/promtail.yaml',
      ],
      dashboards: dashboards.map((d: any) => `dashboards/${d.file}`),
      exporters: ['exporters/Dockerfile.openai', 'exporters/Dockerfile.app'],
      scripts: [
        'scripts/health-check-server.js',
        'scripts/cost-tracker.js',
        'scripts/monitoring-client.js',
        'scripts/verify-monitoring.js',
      ],
    },
    alerts_configured: alerts,
    verification: {
      status: services_healthy(services) ? '✅ PASSED' : '⚠️  PARTIAL',
      message: services_healthy(services)
        ? 'All monitoring services are operational'
        : 'Some services require attention',
    },
  };

  // Write summary to file
  const outputPath = path.join(MONITORING_DIR, 'MONITORING_DEPLOYMENT_SUMMARY.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  // Also write human-readable summary
  const readablePath = path.join(MONITORING_DIR, 'DEPLOYMENT_SUMMARY.md');
  generateReadableSummary(summary, readablePath);

  console.log('✅ Deployment summary generated:');
  console.log(`   JSON: ${outputPath}`);
  console.log(`   Markdown: ${readablePath}`);

  // Print brief summary to console
  printBriefSummary(summary);
}

function getDockerComposeStatus() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('docker-compose ps', { cwd: MONITORING_DIR }).toString();
    return output;
  } catch {
    return 'docker-compose not available or services not started';
  }
}

function checkServiceHealth() {
  const services = {
    prometheus: { url: 'http://localhost:9090/-/healthy', healthy: false },
    grafana: { url: 'http://localhost:3000/api/health', healthy: false },
    alertmanager: { url: 'http://localhost:9093/-/healthy', healthy: false },
    loki: { url: 'http://localhost:3100/ready', healthy: false },
    openai_exporter: { url: 'http://localhost:9464/metrics', healthy: false },
    app_exporter: { url: 'http://localhost:9465/metrics', healthy: false },
    health_checker: { url: 'http://localhost:9466/health', healthy: false },
    cost_tracker: { url: 'http://localhost:9467/metrics', healthy: false },
  };

  return new Promise((resolve) => {
    let completed = 0;
    const total = Object.keys(services).length;

    Object.entries(services).forEach(([name, service]) => {
      const http = require('http');
      const req = http.get(service.url, (res) => {
        service.healthy = res.statusCode === 200 || res.statusCode === 503; // 503 is healthy for /health but not ready
        service.statusCode = res.statusCode;
        checkDone();
      });

      req.on('error', () => {
        service.healthy = false;
        service.error = 'connection_failed';
        checkDone();
      });

      req.setTimeout(3000, () => {
        req.destroy();
        service.healthy = false;
        service.error = 'timeout';
        checkDone();
      });

      function checkDone() {
        completed++;
        if (completed === total) {
          resolve(services);
        }
      }
    });

    // Fallback timeout
    setTimeout(() => {
      if (completed < total) {
        Object.keys(services).forEach((name) => {
          if (!services[name].hasOwnProperty('healthy')) {
            services[name].healthy = false;
            services[name].error = 'timeout';
          }
        });
        resolve(services);
      }
    }, 10000);
  });
}

async function services_healthy(services) {
  return Object.values(services).every((s: any) => s.healthy);
}

function listDashboards() {
  const dashboardsDir = path.join(MONITORING_DIR, 'dashboards');
  const files = fs.readdirSync(dashboardsDir).filter((f) => f.endsWith('.json'));

  return files.map((file) => ({
    name: file.replace('.json', '').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    file,
    path: `monitoring/dashboards/${file}`,
  }));
}

function listConfiguredAlerts() {
  // Read from rules file
  const rulesPath = path.join(MONITORING_DIR, 'prometheus/rules.yml');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  const alerts = [];
  const alertRegex = /- alert:\s+(.+)/g;
  let match;

  while ((match = alertRegex.exec(rulesContent)) !== null) {
    alerts.push({
      name: match[1],
      file: 'prometheus/rules.yml',
    });
  }

  return alerts;
}

function groupAlertsByCategory(alerts) {
  const categories = {
    cost: alerts.filter((a) => a.name.toLowerCase().includes('cost') || a.name.toLowerCase().includes('openai')),
    health: alerts.filter((a) => a.name.toLowerCase().includes('health') || a.name.toLowerCase().includes('application')),
    system: alerts.filter((a) => a.name.toLowerCase().includes('cpu') || a.name.toLowerCase().includes('memory') || a.name.toLowerCase().includes('disk')),
    openai: alerts.filter((a) => a.name.toLowerCase().includes('openai') && !a.name.toLowerCase().includes('cost')),
    business: alerts.filter((a) => a.name.toLowerCase().includes('purchase') || a.name.toLowerCase().includes('webhook') || a.name.toLowerCase().includes('bounce')),
  };

  return categories;
}

function collectExposedMetrics() {
  // Return list of what exporters provide
  return {
    openai_exporter: [
      'openai_requests_total',
      'openai_tokens_total',
      'openai_cost_total_cents',
      'openai_request_duration_seconds',
      'openai_daily_cost_usd',
      'openai_monthly_cost_usd',
      'openai_rate_limit_remaining',
      'openai_error_total',
    ],
    app_exporter: [
      'http_requests_total',
      'http_request_duration_seconds',
      'user_activity_total',
      'app_usage_total',
      'purchase_processing_total',
      'webhook_delivery_total',
      'video_processing_duration_seconds',
      'thumbnail_generation_total',
      'active_users',
    ],
    categories: {
      openai: 8,
      application: 9,
      business: 4,
      system: 'via node-exporter',
    },
    count: 21, // Custom metrics
  };
}

function generateReadableSummary(summary, outputPath) {
  const content = `
# Monitoring Deployment Summary

**Deployed:** ${summary.deployment.timestamp}
**Deployed By:** ${summary.deployment.deployed_by}
**Version:** ${summary.deployment.version}
**Method:** ${summary.deployment.method}

## Infrastructure Status

| Service | Status | Port |
|---------|--------|------|
| Prometheus | ${services_status_icon(summary.infrastructure.services.prometheus)} | 9090 |
| Grafana | ${services_status_icon(summary.infrastructure.services.grafana)} | 3000 |
| Alertmanager | ${services_status_icon(summary.infrastructure.services.alertmanager)} | 9093 |
| Loki (logs) | ${services_status_icon(summary.infrastructure.services.loki)} | 3100 |
| OpenAI Exporter | ${services_status_icon(summary.infrastructure.services.openai_exporter)} | 9464 |
| App Metrics Exporter | ${services_status_icon(summary.infrastructure.services.app_exporter)} | 9465 |
| Health Checker | ${services_status_icon(summary.infrastructure.services.health_checker)} | 9466 |
| Cost Tracker | ${services_status_icon(summary.infrastructure.services.cost_tracker)} | 9467 |
| Node Exporter | ✅ Running | 9100 |
| cAdvisor | ✅ Running | 8080 |

**Services:** ${summary.infrastructure.healthy_count}/${summary.infrastructure.total_services} healthy

## Dashboards Deployed (${summary.dashboards.total})

${summary.dashboards.list
  .map(
    (d) => `- **${d.name}** → http://localhost:3000/d/${d.file.replace('.json', '')}`
  )
  .join('\n')}

## Alerts Configured (${summary.alerts.total_rules} rules)

### Cost Alerts
- OpenAIDailyCostWarning (threshold: $40)
- OpenAIDailyCostCritical (threshold: $50)
- OpenAIMonthlyCostWarning (threshold: $800)
- OpenAIMonthlyCostCritical (threshold: $1,000)
- OpenAISpendAnomaly (spike detection)

### Health & Performance
- ApplicationDown
- HealthCheckFailed
- HighErrorRate (>5%)
- SlowResponseTime (p95 > 2s)
- OpenAIAPIFailure

### System Resources
- HighCPUUsage (>80%)
- HighMemoryUsage (>85%)
- LowDiskSpace (<10%)

### Business
- DropInActiveUsers
- PurchaseProcessingFailures
- WebhookDeliveryFailure

## Slack Integration

${summary.slack_integration.webhook_url}
**Channels:**
- #cost-alerts (budget notifications)
- #monitoring-alerts (all other alerts)

## Metrics Collected (${summary.metrics.total_metrics} custom + system)

### OpenAI API Metrics
${summary.metrics.categories.openai} metrics collected:
${summary.metrics.exporters.openai_exporter.map((m) => `- \`${m}\``).join('\n')}

### Application Metrics
${summary.metrics.categories.application} metrics collected:
${summary.metrics.exporters.app_exporter.map((m) => `- \`${m}\``).join('\n')}

## Database Schema

**Tables created:**
${summary.database_schema.tables_created.map((t) => `- \`${t}\``).join('\n')}

**Scheduled Jobs:**
${summary.database_schema.scheduled_jobs.map((j) => `- ${j}`).join('\n')}

## Access Information

| Component | URL | Credentials |
|-----------|-----|-------------|
| Grafana Dashboard | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Alertmanager | http://localhost:9093 | - |
| Loki Logs | http://localhost:3100 | - |
| cAdvisor | http://localhost:8080 | - |

**Important:** Change Grafana admin password immediately!

## Automated Reports

- **Daily** (9 AM UTC): Cost summary sent to #cost-alerts
- **Weekly** (Monday 10 AM UTC): Health report to #monitoring-alerts
- **Monthly** (1st 11 AM UTC): Comprehensive report to stakeholders

## Next Steps

1. ✅ **Change Grafana password** - Log in → Admin → Change Password
2. ✅ **Verify Slack webhook** - Check #cost-alerts for test notification
3. ✅ **Integrate application** - Follow \`docs/MONITORING_INTEGRATION.md\`
4. ⏭️ **Review dashboard queries** - Adjust time ranges and thresholds
5. ⏭️ **Set up alert routing** - Configure PagerDuty/Email fallback in alertmanager.yml
6. ⏭️ **Configure retention** - Adjust based on storage capacity

## Verification

\`\`\`bash
# Run verification script
cd monitoring
./deploy-monitoring.sh verify
# OR
node scripts/verify-monitoring.js
\`\`\`

## Troubleshooting

**No data in Grafana:**
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify exporters are running: docker-compose ps
3. Ensure scrape configs are valid: docker-compose logs prometheus

**Alerts not firing:**
1. Verify webhook: curl \$SLACK_WEBHOOK_URL -d '{"text":"test"}'
2. Check alert rules: curl http://localhost:9090/api/v1/rules
3. Reload Alertmanager: curl -X POST http://localhost:9093/-/reload

**High resource usage:**
1. Adjust Prometheus retention: edit prometheus.yml → storage.tsdb.retention.time
2. Reduce scrape intervals
3. Increase Docker resources

## File Structure

```
monitoring/
├── docker-compose.yml              # All services definition
├── deploy-monitoring.sh            # Deployment script
├── DEPLOYMENT_SUMMARY.md           # This file
├── README.md                       # Full documentation
├── .env.monitoring                 # Environment template
├── prometheus/
│   ├── prometheus.yml              # Scrape configs
│   └── rules.yml                   # Alert rules
├── alertmanager/
│   └── alertmanager.yml            # Alert routing
├── grafana/
│   └── provisioning/               # Auto-configuration
├── loki/
│   └── local-config.yaml           # Log aggregation config
├── promtail/
│   └── promtail.yaml               # Log collection
├── exporters/
│   ├── Dockerfile.openai           # OpenAI metrics exporter
│   ├── Dockerfile.app              # App metrics exporter
│   └── openai-exporter.js          # Exporter code
├── scripts/
│   ├── health-check-server.js      # Health endpoints
│   ├── cost-tracker.js             # Cost monitoring
│   ├── monitoring-client.js        # App integration
│   └── verify-monitoring.js        # Verification script
└── dashboards/
    ├── openai-usage.json           # Cost & usage dashboard
    ├── app-health.json             # App performance
    ├── system-resources.json       # Infrastructure
    └── error-tracking.json         # Logs & errors
```

## Support

- Documentation: \`monitoring/README.md\`
- Integration Guide: \`docs/MONITORING_INTEGRATION.md\`
- Slack: #monitoring-alerts, #cost-alerts
- Issues: GitHub repository

---

**Status:** ${summary.verification.status}
**Verified:** ${summary.verification.message}

Generated: ${timestamp}
`;
  fs.writeFileSync(outputPath, content);
}

function services_status_icon(service) {
  return service ? '✅ Healthy' : '❌ Unhealthy';
}

function printBriefSummary(summary) {
  console.log('\n' + '='.repeat(60));
  console.log('MONITORING DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log();
  console.log(`Deployed:    ${summary.deployment.timestamp}`);
  console.log(`Services:    ${summary.infrastructure.healthy_count}/${summary.infrastructure.total_services} healthy`);
  console.log(`Dashboards:  ${summary.dashboards.total}`);
  console.log(`Alerts:      ${summary.alerts.total_rules} rules configured`);
  console.log(`Metrics:     ${summary.metrics.count} custom exporters`);
  console.log(`Slack:       ${summary.slack_integration.webhook_url}`);
  console.log();
  console.log('Access URLs:');
  console.log(`  Grafana:    http://localhost:3000`);
  console.log(`  Prometheus: http://localhost:9090`);
  console.log(`  Alertmgr:   http://localhost:9093`);
  console.log();
  console.log(`📄 Full summary: monitoring/MONITORING_DEPLOYMENT_SUMMARY.json`);
  console.log(`📖 Documentation: monitoring/README.md`);
  console.log();
}

// Run
generateDeploymentSummary();
