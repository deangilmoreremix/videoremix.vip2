# Production Monitoring & Alerting System

Comprehensive monitoring stack for VideoRemix VIP2 OpenAI applications, providing real-time usage tracking, cost management, health checks, error logging, and performance metrics.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                        │
├─────────────────────────────────────────────────────────────┤
│  Prometheus  │  Grafana   │ Alertmanager │  Loki  │ cAdvisor │
│  (metrics)   │ (dashboards│  (alerts)    │ (logs)  │ (containers)│
└───────┬───────┴────┬──────┴──────┬───────┴────┬────┴────┬──────┘
        │            │             │            │         │
        ▼            ▼             ▼            ▼         ▼
┌─────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐
│ OpenAI      │ │ App     │ │ Cost    │ │ Health  │ │ Node        │
│ Exporter    │ │ Metrics │ │ Tracker │ │ Checker │ │ Exporter    │
│ (API usage) │ │ (app)   │ │ (costs) │ │ (health)│ │ (host)      │
└─────────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘
        │            │             │            │         │
        └────────────┴─────────────┴────────────┴─────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │ Supabase DB  │
                   │ (Telemetry)  │
                   └──────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Slack webhook URL (for alerts)
- OpenAI API key
- Supabase project

### 1. Clone and Setup

```bash
cd /workspaces/videoremix.vip2
cp monitoring/.env.monitoring .env.monitoring
# Edit .env.monitoring with your values
```

### 2. Configure Environment Variables

```bash
# Copy monitoring variables to main .env
cat monitoring/.env.monitoring >> .env

# Set required variables
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"
export OPENAI_API_KEY="sk-proj-..."
export OPENAI_ORG_ID="org-..."
```

### 3. Deploy Monitoring Stack

```bash
cd monitoring
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Integrate Application

Add monitoring to your application:

```javascript
// In your Node.js/Express app or middleware
const { monitoringClient } = require('@videoremix/monitoring');

// Track requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    monitoringClient.trackRequest(
      req.method,
      req.path,
      res.statusCode,
      Date.now() - start,
      req.user?.id
    );
  });
  next();
});

// Track errors
app.use((err, req, res, next) => {
  monitoringClient.reportError(err, {
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });
  next(err);
});

// Track OpenAI API calls
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Instrumented calls automatically tracked if using monitoring wrapper
```

### 5. Access Dashboards

- **Grafana:** http://localhost:3000 (admin/admin - change immediately!)
- **Prometheus:** http://localhost:9090
- **Alertmanager:** http://localhost:9093
- **Loki:** http://localhost:3100
- **cAdvisor:** http://localhost:8080

### 6. Verify Alerts

```bash
# Check Prometheus targets
curl http://localhost:9090/targets

# Send test alert
curl -X POST http://localhost:9093/-/reload

# Simulate cost threshold (if below threshold)
SLACK_WEBHOOK_URL=$SLACK_WEBHOOK_URL node monitoring/scripts/cost-tracker.js --test-alert
```

## Dashboards

### 1. OpenAI Usage & Cost Monitoring
**Grafana:** Dashboards → OpenAI Usage & Cost Monitoring

Tracks:
- Daily/Monthly spend (real-time)
- Cost by model
- Request rate and error rates
- Token consumption
- Budget utilization gauges with thresholds ($50 daily, $1000 monthly)
- Rate limit remaining

### 2. Application Health & Performance
Shows:
- Liveness/readiness status
- Response time percentiles (p50, p95, p99)
- Error rate breakdown (4xx, 5xx)
- Request rate by route
- Active user sessions

### 3. System Resources
Displays:
- CPU/Memory/Disk usage
- Container resource metrics
- Network I/O
- Resource history graphs

### 4. Error Tracking & Logs
Provides:
- Error rate by level (error, warn, critical)
- Top error messages
- Error trends
- Recent errors table with search
- Component-wise error breakdown

## Alerts

### Alert Routing

| Severity | Channel | Notification |
|----------|---------|-------------|
| Critical | Slack #monitoring-critical | Immediate |
| Warning | Slack #monitoring-warnings | Every 4h |
| Cost - Daily | Slack #cost-alerts | Immediate |
| Cost - Monthly | Slack #cost-alerts + Email | Immediate |
| Info | Logs only | N/A |

### Pre-configured Alerts

**Cost Alerts** (from migration-config.json):
- `OpenAIDailyCostWarning` - >$40 (80% of $50)
- `OpenAIDailyCostCritical` - >$50
- `OpenAIMonthlyCostWarning` - >$800 (80% of $1000)
- `OpenAIMonthlyCostCritical` - >$1000
- `OpenAISpendAnomaly` - Spike detection

**Health Alerts:**
- `ApplicationDown` - App unavailable
- `HealthCheckFailed` - Readiness probe failing
- `HighErrorRate` - >5% errors for 5m
- `SlowResponseTime` - p95 > 2s for 10m
- `OpenAIAPIFailure` - OpenAI API error rate >10%

**Resource Alerts:**
- `HighCPUUsage` - CPU >80% for 5m
- `HighMemoryUsage` - Memory >85%
- `LowDiskSpace` - <10% free
- `ContainerRestart` - Any container restart

### Customizing Alerts

Edit `monitoring/prometheus/rules.yml`:

```yaml
- alert: CustomAlert
  expr: metric_name > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert summary"
    description: "Detailed description"
```

### Silencing Alerts

```bash
# Silence in Alertmanager UI: http://localhost:9093
# Or via API:
curl -XPOST http://localhost:9093/api/v1/silences -d '{"matchers":[...],"startsAt":"...","endsAt":"..."}'
```

## Cost Tracking

### Real-time Cost Monitoring

Costs are tracked from multiple sources:
1. **OpenAI Usage API** - Fetched every 5 minutes
2. **Request Interception** - Real-time cost calculation per API call
3. **Database Logging** - Persistent storage for historical analysis

### Cost Table Schema

Add to Supabase migrations:

```sql
CREATE TABLE IF NOT EXISTS openai_cost_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  month TEXT NOT NULL,
  model TEXT,
  total_cost_cents INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  threshold_exceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_tracking_date ON openai_cost_tracking(date);
CREATE INDEX idx_cost_tracking_month ON openai_cost_tracking(month);
```

### Daily Cost Report

```bash
# Manual trigger
node monitoring/scripts/cost-tracker.js --generate-report --daily

# Output includes:
# - Yesterday's spend
# - Month-to-date total
# - Projected month-end cost
# - Top consuming applications
# - Cost per model breakdown
```

### Cost Optimization Recommendations

The system generates recommendations when cost thresholds approach:
- Switch to cheaper models for non-critical tasks
- Implement caching for frequent requests
- Optimize prompt length to reduce tokens
- Batch API calls when possible
- Review and delete unused AI applications

## Logging

### Structured Log Format

```json
{
  "timestamp": "2026-05-04T02:20:06Z",
  "level": "error",
  "service": "videoremix-app",
  "message": "OpenAI API request failed",
  "model": "gpt-4o",
  "userId": "user_12345",
  "requestId": "req_abc123",
  "duration_ms": 4500,
  "error_code": "rate_limit_exceeded",
  "environment": "production",
  "path": "/api/agents/reasoning",
  "method": "POST"
}
```

### Log Collection

**Sources:**
- Frontend browser console logs
- Backend API logs (Edge Functions)
- Database query logs
- System logs (Docker, Nginx, etc.)

**Retention:**
- Loki: 7 days hot storage
- S3 archive: 30+ days (when configured)

**Querying Logs in Grafana:**
```
{service="videoremix-app", level="error"}
| json
| line_format "{{.timestamp}} {{.level}} {{.message}}"
| status = "5xx"
| rate[5m]
```

### Sending Logs from Application

```javascript
const { monitoring } = require('@videoremix/monitoring');

// Info level
monitoring.info('User logged in', { userId, email });

// Error with stack
try {
  await processVideo();
} catch (error) {
  monitoring.error('Video processing failed', error, { videoId, userId });
}

// Debug
monitoring.debug('Cache hit', { key: 'user_123', ttl: 3600 });
```

## Metrics

### Available Metrics

**OpenAI Metrics:**
- `openai_requests_total` - Counter by model, endpoint, status
- `openai_tokens_total` - Counter by model, type (input/output)
- `openai_cost_total_cents` - Counter by model, service
- `openai_request_duration_seconds` - Histogram by model, endpoint
- `openai_daily_cost_usd` - Gauge by date
- `openai_monthly_cost_usd` - Gauge by month
- `openai_rate_limit_remaining` - Gauge by type (requests/tokens)
- `openai_error_total` - Counter by error_type, model

**Application Metrics:**
- `http_requests_total` - Counter by method, route, status
- `http_request_duration_seconds` - Histogram by method, route
- `user_activity_total` - Counter by action, page
- `app_usage_total` - Counter by app_id, app_name, category
- `purchase_processing_total` - Counter by status, platform, product_id
- `webhook_delivery_total` - Counter by platform, event_type, status
- `video_processing_duration_seconds` - Histogram by operation, status
- `thumbnail_generation_total` - Counter by style, status
- `active_users` - Gauge

**System Metrics:**
- `node_cpu_seconds_total` - CPU usage breakdown
- `node_memory_usage_bytes` - Memory usage
- `node_filesystem_*` - Disk metrics
- `container_*` - Container metrics (cAdvisor)

### Custom Metrics

```javascript
monitoring.trackMetric('custom_metric_name', value, {
  label1: 'value1',
  label2: 'value2',
});
```

## Health Checks

### Endpoints

```
GET /health           - Basic liveness (returns 200 if process running)
GET /health/ready     - Readiness (checks DB, OpenAI, Redis)
GET /health/dependencies - Detailed dependency status
GET /metrics          - Prometheus metrics (JSON)
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-05-04T02:20:06Z",
  "uptime": 3600.45,
  "checks": [
    {
      "name": "openai",
      "status": "healthy",
      "latency_ms": 125,
      "timestamp": "2026-05-04T02:20:06Z"
    },
    {
      "name": "supabase",
      "status": "healthy",
      "latency_ms": 45,
      "timestamp": "2026-05-04T02:20:06Z"
    }
  ]
}
```

### Expected Response Times

| Check | Target | Critical Threshold |
|-------|--------|-------------------|
| OpenAI API | <200ms | >1000ms (timeout) |
| Supabase DB | <50ms | >500ms |
| Health endpoint | <20ms | >100ms |

## Automated Reports

### Daily Report (9 AM UTC)

Sent to: `#cost-alerts` + email

Contents:
- Yesterday's OpenAI spend
- Month-to-date total
- Projected month-end based on average
- Top 5 consuming apps
- Cost per model breakdown
- Anomaly detection

### Weekly Report (Monday 10 AM UTC)

Sent to: `#monitoring-alerts` + email

Contents:
- Week's total spend
- Performance metrics trends
- Error rate summary
- Resource utilization
- Top 10 user sessions
- Recommendations

### Monthly Report (1st of month 11 AM UTC)

Sent to: stakeholders@videoremix.vip

Contents:
- Full month billing analysis
- Comparison vs previous month
- Usage pattern analysis
- Cost optimization opportunities
- Forecasting next month
- Detailed application usage

### Report Storage

Reports archived to:
- `/reports/` in filesystem
- S3 bucket: `s3://videoremix-reports/monthly/`
- Grafana reports folder

## Troubleshooting

### Service not starting

```bash
# Check Docker logs
docker-compose logs <service-name>

# Verify ports not in use
netstat -tulpn | grep :9090

# Check Docker resources
docker stats

# Fix permissions
sudo chown -R $USER:$USER monitoring/data
```

### No data in Grafana

1. Check Prometheus targets: http://localhost:9090/targets
2. Ensure scrapes are successful (green up)
3. Verify exporters are running and exposing /metrics
4. Check Prometheus scrape config syntax
5. Restart Prometheus: `docker-compose restart prometheus`

### Alerts not firing

1. Verify alert rules loaded: `curl http://localhost:9090/api/v1/rules`
2. Check Alertmanager config: `docker-compose logs alertmanager`
3. Test webhook: `curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"test"}'`
4. Reload configuration: `curl -X POST http://localhost:9093/-/reload`

### High memory usage

```yaml
# In docker-compose.yml, adjust Prometheus:
prometheus:
  command:
    - '--storage.tsdb.retention.time=7d'  # Reduce retention
    - '--storage.tsdb.max-block-duration=2h'
```

### Cost alerts not triggering

1. Verify cost tracker is running: `docker-compose logs cost-tracker`
2. Check environment variables: `docker-compose config`
3. Manually run: `docker-compose exec cost-tracker node cost-tracker.js --check-thresholds`
4. Verify thresholds in `.env` or config file

### Loki not receiving logs

```bash
# Check Promtail status
docker-compose logs promtail

# Verify log paths exist
ls -la /app/logs/

# Test Loki write
curl -XPOST http://localhost:3100/loki/api/v1/push -d '{"streams":[{"stream":{"job":"test"},"values":[["$(date +%s%N)","test log message"]]}]}'

# Check Loki health
curl http://localhost:3100/ready
```

## Advanced Configuration

### Add Custom Alert

1. Edit `monitoring/prometheus/rules.yml`
2. Add rule under appropriate group or create new group
3. Reload Prometheus:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```
4. Test expression in Prometheus UI: http://localhost:9090/graph

Example:
```yaml
- alert: HighOpenAIUsageByUser
  expr: sum by (userId) (rate(openai_requests_total[1h])) > 100
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "User {{ $labels.userId }} making excessive OpenAI requests"
    description: "Rate: {{ $value | humanize }} req/sec"
```

### Add Custom Dashboard

1. In Grafana, create new dashboard
2. Add panels from Prometheus/Loki queries
3. Save dashboard
4. Export JSON: Dashboard settings → JSON model
5. Place in `monitoring/dashboards/`
6. Ensure Grafana provisioning includes new file

### Multi-tenant Setup

For multiple projects/environments:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'project-a'
    static_configs:
      - targets: ['project-a-app:9465']
        labels:
          project: 'project-a'
          environment: 'production'

  - job_name: 'project-b'
    static_configs:
      - targets: ['project-b-app:9465']
        labels:
          project: 'project-b'
          environment: 'staging'
```

Use labels for filtering:
```
cost_total{project="project-a"}
```

## Security

### Securing Grafana

```bash
# Change default password
docker-compose exec grafana grafana-cli admin reset-admin-password new-secure-password

# Or set in .env
GRAFANA_ADMIN_PASSWORD=your-secure-password

# Enable auth proxy (optional)
GF_AUTH_PROXY_ENABLED=true
GF_AUTH_PROXY_HEADER_NAME=X-Forwarded-User
```

### Securing Prometheus

```yaml
# docker-compose.yml
prometheus:
  command:
    - '--web.config.file=/etc/prometheus/web.yml'
```

Create `prometheus/web.yml`:
```yaml
auth:
  type: basic
  basic:
    username: admin
    password: ${PROMETHEUS_PASSWORD}
```

### Network Isolation

```yaml
networks:
  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
    driver_opts:
      com.docker.network.bridge.name: br-monitoring
```

## Scaling Production

### High Availability

1. **Prometheus HA**
   - Deploy 2+ Prometheus instances
   - Use Thanos or Cortex for global query
   - Configure remote write to long-term storage

2. **Alertmanager HA**
   - Deploy Alertmanager in cluster mode (3 instances)
   - Configure peer clustering
   - Use consistent hashing for deduplication

3. **Loki HA**
   - Deploy Loki in microservices mode
   - Use object storage (S3, GCS) for chunks
   - Deploy multiple query frontends

### External Storage

**Prometheus Long-term:**
```yaml
prometheus:
  command:
    - '--storage.tsdb.retention.time=30d'
    - '--remote-write.url=https://prometheus-remote-write-endpoint'
    - '--remote-write.basic-auth.username=...'
    - '--remote-write.basic-auth.password=...'
```

**Loki to S3:**
```yaml
loki:
  command:
    - '--config.provider=s3'
    - '--aws.endpoint=s3.amazonaws.com'
    - '--aws.bucketname=videoremix-logs'
    - '--aws.region=us-east-1'
```

### Resource Limits

```yaml
# docker-compose.yml
services:
  prometheus:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

## Maintenance

### Daily

- Check cost alerts in Slack
- Review error rate trends
- Verify all services are up

### Weekly

- Generate weekly report
- Review performance metrics
- Check disk space usage
- Archive old logs to S3

### Monthly

- Cost analysis and forecasting
- Review alert thresholds
- Update dashboards
- Capacity planning
- Security updates

## Integration with Supabase

### Add Database Metrics

Create Supabase Edge Function to expose metrics:

```typescript
// supabase/functions/api/metrics/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const metrics = await getDatabaseMetrics();
  return new Response(JSON.stringify(metrics), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Configure Prometheus to scrape:
```yaml
scrape_configs:
  - job_name: 'supabase-metrics'
    static_configs:
      - targets: ['your-project.supabase.co/functions/v1/metrics']
```

### Cost Tracking via Database

```sql
-- Materialized view for daily cost aggregates
CREATE MATERIALIZED VIEW daily_openai_costs_mv AS
SELECT
  DATE(timestamp) as date,
  model,
  COUNT(*) as request_count,
  SUM(tokens) as total_tokens,
  SUM(cost_cents) / 100.0 as total_cost_usd
FROM openai_usage_logs
GROUP BY DATE(timestamp), model;

-- Refresh daily
CREATE OR REPLACE FUNCTION refresh_daily_costs()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_openai_costs_mv;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily at midnight
SELECT cron.schedule('refresh-daily-costs', '0 0 * * *', 'SELECT refresh_daily_costs();');
```

## Cost Optimization Tips

1. **Model Selection**
   - Use `gpt-3.5-turbo` for simple tasks (10x cheaper)
   - Use `gpt-4o-mini` when available (cheaper than full GPT-4o)

2. **Token Efficiency**
   - Trim prompts to essential content
   - Use system messages instead of repeating instructions
   - Implement caching for common queries

3. **Batch Processing**
   - Group similar requests
   - Use async batching where possible

4. **Rate Limiting**
   - Implement per-user limits
   - Queue background jobs for non-urgent processing

5. **Monitoring**
   - Set alerts at 70%, not 100%
   - Review spending weekly
   - Use cost anomaly detection

## Support

- Documentation: https://github.com/your-org/videoremix.vip2/tree/main/monitoring
- Issues: https://github.com/your-org/videoremix.vip2/issues
- Slack: #monitoring-alerts, #cost-alerts

## License

Proprietary - VideoRemix VIP2 Internal Use Only
