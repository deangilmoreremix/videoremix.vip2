import { v4 as uuidv4 } from 'uuid';

// Analytics event types
export interface AnalyticsEvent {
  event_type: string;
  event_name: string;
  timestamp: string;
  session_id: string;
  user_id?: string;
  app_id?: string;
  user_owned?: boolean;
  modal_section?: string;
  cta_type?: string;
  performance_metric?: string;
  performance_value?: number;
  error_message?: string;
  url?: string;
  user_agent?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

// Session management
class SessionManager {
  private static SESSION_KEY = 'videoremix_session_id';
  private static SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

  static getSessionId(): string {
    const stored = localStorage.getItem(this.SESSION_KEY);
    if (stored) {
      const [sessionId, timestamp] = stored.split('|');
      const sessionTime = parseInt(timestamp);
      if (Date.now() - sessionTime < this.SESSION_EXPIRY) {
        return sessionId;
      }
    }

    const newSessionId = uuidv4();
    localStorage.setItem(this.SESSION_KEY, `${newSessionId}|${Date.now()}`);
    return newSessionId;
  }

  static extendSession(): void {
    const sessionId = this.getSessionId();
    localStorage.setItem(this.SESSION_KEY, `${sessionId}|${Date.now()}`);
  }
}

// Event queue for batching
class EventQueue {
  private static queue: AnalyticsEvent[] = [];
  private static readonly BATCH_SIZE = 10;
  private static readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private static intervalId: number | null = null;

  static addEvent(event: AnalyticsEvent): void {
    this.queue.push(event);

    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    }

    if (!this.intervalId) {
      this.intervalId = window.setInterval(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  static flush(): void {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Send to analytics endpoint
    this.sendToAnalytics(events).catch(error => {
      console.error('Analytics flush failed:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    });
  }

  private static async sendToAnalytics(events: AnalyticsEvent[]): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      // Store in localStorage as fallback for offline functionality
      const existing = JSON.parse(localStorage.getItem('analytics_queue') || '[]');
      localStorage.setItem('analytics_queue', JSON.stringify([...existing, ...events]));
      throw error;
    }
  }

  static getPendingEvents(): AnalyticsEvent[] {
    return JSON.parse(localStorage.getItem('analytics_queue') || '[]');
  }

  static clearPendingEvents(): void {
    localStorage.removeItem('analytics_queue');
  }
}

// Main analytics class
export class Analytics {
  private static userId: string | null = null;
  private static initialized = false;

  static init(userId?: string): void {
    if (this.initialized) return;

    this.userId = userId || null;
    this.initialized = true;

    // Track page view on init
    this.trackEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden');
      } else {
        this.trackEvent('page_visible');
        SessionManager.extendSession();
      }
    });

    // Handle before unload
    window.addEventListener('beforeunload', () => {
      EventQueue.flush();
    });

    // Periodic session extension
    setInterval(() => {
      SessionManager.extendSession();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  static setUserId(userId: string): void {
    this.userId = userId;
  }

  static trackEvent(
    eventName: string,
    metadata: Record<string, any> = {},
    eventType: string = 'user_interaction'
  ): void {
    const event: AnalyticsEvent = {
      event_type: eventType,
      event_name: eventName,
      timestamp: new Date().toISOString(),
      session_id: SessionManager.getSessionId(),
      user_id: this.userId || undefined,
      url: window.location.href,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      metadata,
    };

    EventQueue.addEvent(event);
  }

  // Specific tracking methods for modal analytics
  static trackCardHover(appId: string, userOwned: boolean): void {
    this.trackEvent('card_hovered', { app_id: appId, user_owned: userOwned });
  }

  static trackCardClick(appId: string, userOwned: boolean): void {
    this.trackEvent('card_clicked', { app_id: appId, user_owned: userOwned });
  }

  static trackModalOpen(appId: string, modalType: string = 'purchase'): void {
    this.trackEvent('modal_opened', { app_id: appId, modal_type: modalType });
  }

  static trackModalClose(appId: string, modalType: string = 'purchase', duration?: number): void {
    this.trackEvent('modal_closed', {
      app_id: appId,
      modal_type: modalType,
      duration_ms: duration
    });
  }

  static trackSectionView(appId: string, section: string): void {
    this.trackEvent('section_viewed', { app_id: appId, modal_section: section });
  }

  static trackCtaClick(appId: string, ctaType: string, metadata?: Record<string, any>): void {
    this.trackEvent('cta_clicked', {
      app_id: appId,
      cta_type: ctaType,
      ...metadata
    });
  }

  static trackPurchaseStart(appId: string, price: number): void {
    this.trackEvent('purchase_start', { app_id: appId, price });
  }

  static trackPurchaseComplete(appId: string, price: number, transactionId?: string): void {
    this.trackEvent('purchase_complete', {
      app_id: appId,
      price,
      transaction_id: transactionId
    });
  }

  static trackPerformanceMetric(
    metric: string,
    value: number,
    appId?: string
  ): void {
    this.trackEvent('performance_metric', {
      performance_metric: metric,
      performance_value: value,
      app_id: appId
    }, 'performance');
  }

  static trackError(
    errorMessage: string,
    errorType: string = 'unknown',
    appId?: string
  ): void {
    this.trackEvent('error', {
      error_message: errorMessage,
      error_type: errorType,
      app_id: appId
    }, 'error');
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  static trackModalLoadTime(appId: string): () => void {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      Analytics.trackPerformanceMetric('modal_load_time', loadTime, appId);
    };
  }

  static trackImageLoad(appId: string, imageUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      const startTime = performance.now();

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        Analytics.trackPerformanceMetric('image_load_time', loadTime, appId);
        Analytics.trackEvent('image_load_success', {
          app_id: appId,
          image_url: imageUrl,
          load_time_ms: loadTime
        });
        resolve();
      };

      img.onerror = () => {
        Analytics.trackError(`Image load failed: ${imageUrl}`, 'image_load_error', appId);
        resolve();
      };

      img.src = imageUrl;
    });
  }

  static trackAnimationSmoothness(appId: string, animationName: string): void {
    // Monitor frame drops during animations
    let frameCount = 0;
    let lastTime = performance.now();

    const checkFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime > 16.67) { // More than one frame at 60fps
        frameCount++;
      }

      lastTime = currentTime;

      if (frameCount < 60) { // Monitor for 1 second
        requestAnimationFrame(checkFrame);
      } else {
        const smoothness = Math.max(0, 1 - (frameCount / 60)); // 0-1 scale
        Analytics.trackPerformanceMetric(
          `animation_smoothness_${animationName}`,
          smoothness,
          appId
        );
      }
    };

    requestAnimationFrame(checkFrame);
  }
}

// Performance monitoring is handled by the PerformanceMonitor class above
