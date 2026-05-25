#!/usr/bin/env node

/**
 * Unified Logging & Monitoring Client for VideoRemix
 * Provides structured logging, metrics collection, and error reporting
 */

const { v4: uuidv4 } = require('uuid');

class MonitoringClient {
  constructor(options = {}) {
    this.service = options.service || 'videoremix-app';
    this.environment = options.environment || 'production';
    this.enabled = options.enabled !== false;

    // Loki endpoint
    this.lokiEndpoint = options.lokiEndpoint || 'http://localhost:3100/loki/api/v1/push';

    // Prometheus push gateway (if using push model instead of pull)
    this.pushgateway = options.pushgateway || 'http://localhost:9091';

    // Buffered logs for batch sending
    this.logBuffer = [];
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 5000; // 5 seconds

    // Start flush interval
    if (this.enabled && typeof window === 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Structured logging
   */
  log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: this.service,
      environment: this.environment,
      ...context,
    };

    // Console output (local development)
    if (this.enabled) {
      const colorMap = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[32m',
        debug: '\x1b[36m',
      };
      const color = colorMap[level.toLowerCase()] || '\x1b[0m';
      const reset = '\x1b[0m';
      console.log(`${color}${logEntry.timestamp} [${level.toUpperCase()}] ${message}${reset}`, context);
    }

    // Buffer for Loki
    this.logBuffer.push(logEntry);

    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  error(message, error = null, context = {}) {
    const errContext = {
      ...context,
      error_type: error?.name || 'Error',
      error_message: error?.message || message,
      stack: error?.stack,
    };
    this.log('error', message, errContext);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  debug(message, context = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  }

  /**
   * Send logs to Loki
   */
  async flush() {
    if (!this.enabled || this.logBuffer.length === 0) return;

    const logs = this.logBuffer.slice(0, this.bufferSize);
    this.logBuffer = this.logBuffer.slice(this.bufferSize);

    const streams = [
      {
        stream: {
          job: this.service,
          environment: this.environment,
          level: 'all',
          service: this.service,
        },
        values: logs.map(log => [
          Math.floor(new Date(log.timestamp).getTime() / 1000000).toString(),
          JSON.stringify(log),
        ]),
      },
    ];

    try {
      const response = await fetch(this.lokiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streams }),
      });

      if (!response.ok) {
        throw new Error(`Loki push failed: ${response.status}`);
      }

      this.debug(`Flushed ${logs.length} log entries to Loki`);
    } catch (error) {
      this.error('Failed to flush logs to Loki', error);
    }
  }

  /**
   * Track metrics
   */
  trackMetric(name, value, labels = {}) {
    // Prometheus push model
    const metric = {
      name,
      value,
      labels: {
        service: this.service,
        environment: this.environment,
        ...labels,
      },
      timestamp: Date.now(),
    };

    this.log('debug', `Metric: ${name}=${value}`, { metric: true, ...labels });
  }

  /**
   * Track API request
   */
  trackRequest(method, path, statusCode, durationMs, userId = null) {
    this.trackMetric('http_request_duration_seconds', durationMs / 1000, {
      method,
      path,
      status: statusCode,
      userId: userId || 'anonymous',
    });

    this.trackMetric('http_requests_total', 1, {
      method,
      path,
      status: statusCode,
    });
  }

  /**
   * Track OpenAI API call
   */
  trackOpenAIRequest(model, endpoint, status, tokensUsed = 0, cost = 0, durationMs = 0) {
    this.trackMetric('openai_requests_total', 1, {
      model,
      endpoint,
      status,
    });

    if (tokensUsed > 0) {
      this.trackMetric('openai_tokens_total', tokensUsed, { model });
    }

    if (cost > 0) {
      this.trackMetric('openai_cost_total_cents', cost * 100, { model });
    }

    this.trackMetric('openai_request_duration_seconds', durationMs / 1000, {
      model,
      endpoint,
    });
  }

  /**
   * Track business events
   */
  trackEvent(eventName, properties = {}) {
    this.trackMetric('business_event_total', 1, {
      event: eventName,
      ...properties,
    });

    this.info(`Event: ${eventName}`, properties);
  }

  /**
   * Track user activity
   */
  trackUserAction(userId, action, details = {}) {
    this.trackMetric('user_activity_total', 1, {
      userId,
      action,
      ...details,
    });
  }

  /**
   * Track video processing
   */
  trackVideoProcessing(operation, status, durationMs, metadata = {}) {
    this.trackMetric('video_processing_duration_seconds', durationMs / 1000, {
      operation,
      status,
      ...metadata,
    });
  }

  /**
   * Track purchase
   */
  trackPurchase(platform, productId, status, amount = null) {
    this.trackMetric('purchase_total', 1, {
      platform,
      productId,
      status,
      amount,
    });
  }

  /**
   * Track webhook delivery
   */
  trackWebhook(platform, eventType, status, durationMs = null) {
    const labels = { platform, eventType, status };
    this.trackMetric('webhook_delivery_total', 1, labels);
    if (durationMs) {
      this.trackMetric('webhook_delivery_duration_seconds', durationMs / 1000, labels);
    }
  }

  /**
   * Report error with full context
   */
  reportError(error, context = {}) {
    const errorContext = {
      error_type: error?.name || 'Error',
      error_message: error?.message || String(error),
      stack: error?.stack,
      ...context,
    };

    this.error('Application error', error, errorContext);

    // Also send to external error tracking if configured
    if (process.env.SENTRY_DSN) {
      // this.sendToSentry(error, errorContext);
    }
  }

  /**
   * Create span for distributed tracing
   */
  startSpan(operationName) {
    const span = {
      id: uuidv4(),
      operationName,
      startTime: Date.now(),
      tags: {},
    };

    return {
      end: (tags = {}) => {
        const durationMs = Date.now() - span.startTime;
        this.trackMetric('span_duration_seconds', durationMs / 1000, {
          span_id: span.id,
          operation: operationName,
          ...span.tags,
          ...tags,
        });
      },
      setTag: (key, value) => {
        span.tags[key] = value;
      },
    };
  }

  /**
   * Health check
   */
  healthy() {
    return {
      status: 'healthy',
      service: this.service,
      uptime: process.uptime(),
      bufferSize: this.logBuffer.length,
      timestamp: new Date().toISOString(),
    };
  }
}

// Create singleton instance
const monitoring = new MonitoringClient({
  service: 'videoremix-app',
  environment: process.env.NODE_ENV || 'development',
  enabled: true,
});

// Export for use
module.exports = monitoring;
module.exports.MonitoringClient = MonitoringClient;

// Global error handlers (Node.js)
if (typeof window === 'undefined') {
  process.on('uncaughtException', (error) => {
    monitoring.reportError(error, { fatal: true });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    monitoring.reportError(reason instanceof Error ? reason : new Error(String(reason)), {
      unhandledRejection: true,
    });
  });
}

// Browser global
if (typeof window !== 'undefined') {
  window.monitoring = monitoring;
}
