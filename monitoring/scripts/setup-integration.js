#!/usr/bin/env node

/**
 * VideoRemix Monitoring Integration Script
 * Instrument the existing application with monitoring
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Files to modify for instrumentation
const INSTRUMENTATION_FILES = [
  'utils/performanceMonitor.ts',
  'utils/errorHandling.ts',
  'hooks/useAgentApiKeys.ts',
  'hooks/usePurchases.ts',
  'hooks/useApps.ts',
  '/services/purchaseService.ts',
  'App.tsx',
];

function createInstrumentationGuide() {
  const guide = `
# Monitoring Integration Guide

## Overview

This guide shows how to integrate the production monitoring system into the VideoRemix application.

## Quick Integration

### 1. Install Monitoring Package

\`\`\`bash
cd /workspaces/videoremix.vip2
# The monitoring package is included in the repo
# No npm install needed - use local files
\`\`\`

### 2. Add Monitoring Client to App

**File:** \`src/main.tsx\` or \`src/App.tsx\`

```typescript
import { monitoring } from '@/monitoring/client';

// Initialize monitoring on app startup
monitoring.info('Application starting', {
  version: process.env.APP_VERSION,
  environment: import.meta.env.MODE,
});
```

### 3. HTTP Request Interception

Add middleware to intercept all API calls:

**File:** \`src/App.tsx\`

```typescript
import { monitoring } from '@/monitoring/client';

// Track all fetch requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const startTime = performance.now();
  const url = args[0] instanceof Request ? args[0].url : args[0];

  try {
    const response = await originalFetch(...args);
    const duration = performance.now() - startTime;

    monitoring.trackRequest(
      'FETCH',
      url,
      response.status,
      duration,
      getCurrentUserId()
    );

    if (!response.ok) {
      monitoring.warn('HTTP request failed', {
        url,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response;
  } catch (error) {
    monitoring.reportError(error, { url });
    throw error;
  }
};
```

### 4. OpenAI API Tracking

Wrap OpenAI client to automatically track usage:

**File:** \`src/lib/openai-instrumented.ts\`

```typescript
import OpenAI from 'openai';
import { monitoring } from '@/monitoring/client';

const originalCreate = OpenAI.prototype.chat.completions.create.bind(
  OpenAI.prototype.chat.completions
);

OpenAI.prototype.chat.completions.create = async function (...args) {
  const startTime = Date.now();
  const model = args[0].model || 'unknown';

  try {
    const result = await originalCreate(...args);
    const duration = Date.now() - startTime;

    const usage = result.usage;
    const tokensUsed = usage?.total_tokens || 0;

    monitoring.trackOpenAIRequest(
      model,
      'chat/completions',
      'success',
      tokensUsed,
      estimateCost(model, tokensUsed),
      duration
    );

    return result;
  } catch (error) {
    monitoring.reportError(error, { model, endpoint: 'chat/completions' });
    throw error;
  }
};
```

### 5. Error Boundary for React

Wrap your app with error boundary component:

**File:** \`src/App.tsx\`

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      onError={(error, info) => {
        monitoring.reportError(error, {
          componentStack: info.componentStack,
        });
      }}
    >
      {/* Existing app component tree */}
    </ErrorBoundary>
  );
}
```

**File:** \`src/components/ErrorBoundary.tsx\`

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error, info: { componentStack: string }) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 6. Track Custom Events

Track important business events:

```typescript
import { monitoring } from '@/monitoring/client';

// Track video processing
monitoring.trackVideoProcessing('encode', 'completed', 15000, {
  videoId: 'vid_123',
  quality: '1080p',
  size: '2MB',
});

// Track purchase
monitoring.trackPurchase('stripe', 'product_videoremix', 'completed', 9900);

// Track app usage
monitoring.trackEvent('app_launched', {
  appId: 'ai-reasoning-agent',
  category: 'ai-agents',
});

// Track user action
monitoring.trackUserAction(userId, 'feature_used', {
  feature: 'ai-video-generation',
  duration: 45.5,
});
```

### 7. Track Performance

Use performance spans for critical operations:

```typescript
const span = monitoring.startSpan('video-upload');
try {
  await uploadVideo(file);
  span.setTag('fileSize', file.size);
  span.setTag('format', file.type);
} catch (error) {
  span.setTag('error', true);
  throw error;
} finally {
  span.end();
}
```

## Environment Variables

Ensure these are set in your \`.env\`:

\`\`\`bash
# Monitoring endpoints (automatically set by docker-compose)
VITE_MONITORING_URL=http://localhost:9464
VITE_MONITORING_ENABLED=true

# Feature flags
REACT_APP_ENABLE_MONITORING=true
REACT_APP_MONITORING_SAMPLE_RATE=1.0  # Sample all events (0.0-1.0)
\`\`\`

## Testing Instrumentation

After integration, verify:

1. Metrics are being sent:
   \`\`\`bash
   curl http://localhost:9464/metrics | head -20
   \`\`\`

2. Logs appear in Loki:
   - Open Grafana → Explore → Select Loki
   - Query: \`{job="videoremix-app"}\`
   - Should see structured log entries

3. Dashboards populate:
   - Open Grafana dashboard "Application Health & Performance"
   - Charts should show real-time data within 30s

4. Alerts work:
   - Temporarily reduce OpenAI daily threshold to $1
   - Generate test request
   - Check Slack for alert

## Troubleshooting

### No metrics appearing
- Check monitoring client is initialized
- Verify endpoints are reachable
- Check browser console for errors

### High volume of logs
- Adjust log level: \`monitoring.setLogLevel('warn')\`
- Reduce sampling rate
- Filter out noisy logs

### CORS errors
- Add monitoring endpoints to CORS whitelist
- Configure proxy in \`vite.config.ts\`:

\`\`\`typescript
export default defineConfig({
  server: {
    proxy: {
      '/metrics': 'http://localhost:9464',
      '/health': 'http://localhost:9466',
    },
  },
});
\`\`\`

## Production Considerations

1. **Sampling**: Only track a percentage of high-volume events
2. **Batching**: Batch metrics submission to reduce overhead
3. **Compression**: Compress log payloads
4. **Privacy**: PII redaction in logs (see utils/logSanitizer.ts)
5. **Security**: Ensure monitoring endpoints are not publicly exposed

## Advanced Usage

### Custom Metrics

Create domain-specific metrics:

```typescript
// Track AI agent usage
monitoring.trackMetric('ai_agent_invocation', 1, {
  agent_type: 'reasoning',
  model: 'gpt-4o',
  complexity: 'high',
});

// Track latency
const timer = monitoring.startTimer('video-processing');
await processVideo();
timer();  // Logs duration
```

### Distributed Tracing

Add trace IDs for request correlation:

```typescript
import { v4 as uuidv4 } from 'uuid';

const traceId = uuidv4();
monitoring.trackRequest(method, path, status, duration, userId, {
  traceId,
});
```

## Support

Contact engineering team for integration issues:
- Slack: #engineering
- Email: devops@videoremix.vip

`;
  return guide;
}

// Create the monitoring client for browser use
const browserClient = `
/**
 * Browser Monitoring Client
 * For use in frontend React application
 */

class BrowserMonitoring {
  constructor() {
    this.endpoint = import.meta.env.VITE_MONITORING_URL || 'http://localhost:9464';
    this.enabled = import.meta.env.MODE === 'production';
  }

  trackPageView(pathname, search) {
    if (!this.enabled) return;

    this.send('page_view', {
      path: pathname,
      search,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
    });
  }

  trackUserAction(action, properties = {}) {
    if (!this.enabled) return;

    this.send('user_action', {
      action,
      ...properties,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    });
  }

  trackPerformance(metric, value, tags = {}) {
    if (!this.enabled) return;

    this.send('performance', {
      metric,
      value,
      ...tags,
    });
  }

  trackError(error, context = {}) {
    this.send('error', {
      message: error.message,
      stack: error.stack,
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  async send(type, data) {
    try {
      const payload = {
        type,
        ...data,
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE,
        appVersion: import.meta.env.APP_VERSION,
      };

      // Send to monitoring endpoint
      await fetch(\`\${this.endpoint}/ingest/browser\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Fail silently - don't break app
      console.warn('Monitoring send failed:', error);
    }
  }

  getUserId() {
    // Get from auth context or localStorage
    return (
      localStorage.getItem('user_id') ||
      (window as any).auth?.user?.id ||
      'anonymous'
    );
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}

export const browserMonitoring = new BrowserMonitoring();
`;

function main() {
  console.log('[Monitor Integration] Creating monitoring integration files...');

  // Create browser monitoring client
  const browserClientPath = path.join(SRC_DIR, 'utils/browserMonitoring.ts');
  fs.writeFileSync(browserClientPath, browserClient);
  console.log(`✅ Created ${browserClientPath}`);

  // Create TypeScript types
  const typesPath = path.join(SRC_DIR, 'types/monitoring.d.ts');
  const typesContent = `
export interface MonitoringEvent {
  type: 'page_view' | 'user_action' | 'performance' | 'error' | 'metric';
  timestamp: string;
  environment: string;
  appVersion?: string;
  [key: string]: any;
}

export interface MonitoringConfig {
  enabled: boolean;
  endpoint: string;
  sampleRate: number;
}
`;
  fs.writeFileSync(typesPath, typesContent);
  console.log(`✅ Created ${typesPath}`);

  // Create tracking hook for React
  const hookPath = path.join(SRC_DIR, 'hooks/useMonitoring.ts');
  const hookContent = `
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { browserMonitoring } from '@/utils/browserMonitoring';

export function useMonitoring() {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    browserMonitoring.trackPageView(location.pathname, location.search);
  }, [location.pathname, location.search]);

  // Expose monitoring instance
  return { monitoring: browserMonitoring };
}
`;
  fs.writeFileSync(hookPath, hookContent);
  console.log(`✅ Created ${hookPath}`);

  // Create integration documentation
  const docsPath = path.join(ROOT_DIR, 'docs/MONITORING_INTEGRATION.md');
  fs.writeFileSync(docsPath, createInstrumentationGuide());
  console.log(`✅ Created ${docsPath}`);

  console.log('\n📋 Integration steps:');
  console.log('1. Import monitoring client into App.tsx');
  console.log('2. Add <ErrorBoundary> wrapper around app');
  console.log('3. Call monitoring.trackPageView() on route changes (useMonitoring hook)');
  console.log('4. Wrap OpenAI calls with instrumentation');
  console.log('5. Add tracking for key user actions');
  console.log('6. Test with: npm run build && npm run preview');
  console.log('\n✅ Integration files created!');
}

main();
