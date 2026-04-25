// Performance monitoring and error reporting utility
import { supabase } from './supabaseClient';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private isEnabled = true;

  // Performance tracking
  trackMetric(name: string, value: number) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.metrics.push(metric);
    console.log(`📊 Performance: ${name} = ${value}ms`);

    // Keep only last 50 metrics
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  // Error tracking
  reportError(error: Error, component?: string, context?: any) {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      component,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errors.push(errorReport);
    console.error(`❌ Error in ${component || 'unknown'}:`, error, context);

    // Keep only last 20 errors
    if (this.errors.length > 20) {
      this.errors = this.errors.slice(-20);
    }
  }

  // Resource loading tracking
  trackResourceLoad(resource: string, success: boolean, loadTime?: number) {
    if (!this.isEnabled) return;

    if (!success) {
      console.warn(`⚠️ Resource failed to load: ${resource}`);
      this.reportError(new Error(`Resource load failed: ${resource}`), 'ResourceLoader');
    } else if (loadTime) {
      this.trackMetric(`resource_load_${resource}`, loadTime);
    }
  }

  // Network request monitoring
  interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];

      try {
        const response = await originalFetch(...args);
        const loadTime = Date.now() - startTime;

        if (!response.ok && response.status >= 400) {
          console.warn(`⚠️ HTTP ${response.status} for ${url}`);
          this.reportError(
            new Error(`HTTP ${response.status}: ${url}`),
            'NetworkRequest',
            { url, status: response.status }
          );
        } else {
          this.trackMetric(`fetch_${url}`, loadTime);
        }

        return response;
      } catch (error) {
        const loadTime = Date.now() - startTime;
        console.error(`❌ Network error for ${url}:`, error);
        this.reportError(error as Error, 'NetworkRequest', { url, loadTime });
        throw error;
      }
    };
  }

  // Component render time tracking
  startComponentRender(componentName: string) {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      this.trackMetric(`render_${componentName}`, renderTime);
    };
  }

  // Memory usage monitoring
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.trackMetric('memory_used', memInfo.usedJSHeapSize);
      this.trackMetric('memory_total', memInfo.totalJSHeapSize);
      this.trackMetric('memory_limit', memInfo.jsHeapSizeLimit);
    }
  }

  // Get diagnostics report
  getDiagnostics() {
    return {
      metrics: this.metrics.slice(-10), // Last 10 metrics
      errors: this.errors.slice(-5), // Last 5 errors
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring
if (typeof window !== 'undefined') {
  // Intercept fetch for network monitoring
  performanceMonitor.interceptFetch();

  // Track memory usage periodically
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, 30000); // Every 30 seconds

  // Global error handler
  window.addEventListener('error', (event) => {
    performanceMonitor.reportError(event.error || new Error(event.message), 'GlobalError', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    performanceMonitor.reportError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      'UnhandledRejection'
    );
  });
}

// Export for use in components
export default performanceMonitor;