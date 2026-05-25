import { Analytics } from './analytics';

// A/B Test configuration
export interface ABTest {
  id: string;
  name: string;
  variants: string[];
  weights?: number[];
  audience?: {
    user_type?: 'all' | 'new' | 'existing' | 'premium';
    device_type?: 'mobile' | 'tablet' | 'desktop';
    traffic_source?: string;
  };
  active: boolean;
}

// A/B Test results
export interface ABTestResult {
  test_id: string;
  variant: string;
  user_id?: string;
  session_id: string;
  event_name: string;
  event_value?: number;
  timestamp: string;
}

// Active A/B tests configuration
const ACTIVE_TESTS: ABTest[] = [
  {
    id: 'cta_button_text',
    name: 'CTA Button Text Variation',
    variants: ['Get Instant Access Now', 'Buy Now - Limited Time', 'Unlock Lifetime Access', 'Start Using Today'],
    weights: [0.4, 0.3, 0.2, 0.1],
    active: true,
  },
  {
    id: 'pricing_display',
    name: 'Pricing Display Format',
    variants: ['one_time', 'monthly_equivalent', 'with_savings'],
    weights: [0.5, 0.3, 0.2],
    active: true,
  },
  {
    id: 'modal_layout',
    name: 'Modal Layout Variation',
    variants: ['standard', 'compact', 'feature_focused'],
    active: true,
  },
  {
    id: 'urgency_signals',
    name: 'Urgency and Scarcity Signals',
    variants: ['none', 'limited_time', 'popular_choice', 'last_chance'],
    weights: [0.2, 0.4, 0.3, 0.1],
    active: true,
  },
];

class ABTesting {
  private static userVariants: Map<string, Map<string, string>> = new Map();

  // Get variant for a user in a specific test
  static getVariant(testId: string, userId?: string, sessionId?: string): string {
    const identifier = userId || sessionId || 'anonymous';

    // Check if we already assigned a variant for this user/test
    if (!this.userVariants.has(identifier)) {
      this.userVariants.set(identifier, new Map());
    }

    const userTests = this.userVariants.get(identifier)!;

    if (userTests.has(testId)) {
      return userTests.get(testId)!;
    }

    // Find the test configuration
    const test = ACTIVE_TESTS.find(t => t.id === testId);
    if (!test || !test.active) {
      return test?.variants[0] || 'default';
    }

    // Assign variant based on weighted random selection
    const variant = this.selectWeightedVariant(test);
    userTests.set(testId, variant);

    // Track variant assignment
    Analytics.trackEvent('ab_test_variant_assigned', {
      test_id: testId,
      test_name: test.name,
      variant,
      user_id: userId,
      session_id: sessionId,
    });

    return variant;
  }

  // Select variant based on weights
  private static selectWeightedVariant(test: ABTest): string {
    if (!test.weights || test.weights.length !== test.variants.length) {
      // Equal distribution if no weights provided
      const index = Math.floor(Math.random() * test.variants.length);
      return test.variants[index];
    }

    const totalWeight = test.weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < test.variants.length; i++) {
      random -= test.weights[i];
      if (random <= 0) {
        return test.variants[i];
      }
    }

    return test.variants[0]; // Fallback
  }

  // Track conversion events for A/B testing
  static trackConversion(testId: string, variant: string, eventName: string, value?: number): void {
    Analytics.trackEvent('ab_test_conversion', {
      test_id: testId,
      variant,
      event_name: eventName,
      event_value: value,
    });
  }

  // Get test configuration
  static getTest(testId: string): ABTest | undefined {
    return ACTIVE_TESTS.find(t => t.id === testId);
  }

  // Get all active tests
  static getActiveTests(): ABTest[] {
    return ACTIVE_TESTS.filter(t => t.active);
  }

  // Check if user qualifies for test based on audience criteria
  static qualifiesForTest(test: ABTest, userType?: string, deviceType?: string): boolean {
    if (!test.audience) return true;

    if (test.audience.user_type && test.audience.user_type !== 'all') {
      if (test.audience.user_type !== userType) return false;
    }

    if (test.audience.device_type) {
      if (test.audience.device_type !== deviceType) return false;
    }

    return true;
  }
}

// Utility functions for common A/B test scenarios
export const ABTestUtils = {
  // Get CTA button text variant
  getCtaButtonText(userId?: string, sessionId?: string): string {
    return ABTesting.getVariant('cta_button_text', userId, sessionId);
  },

  // Get pricing display variant
  getPricingDisplay(userId?: string, sessionId?: string): string {
    return ABTesting.getVariant('pricing_display', userId, sessionId);
  },

  // Get modal layout variant
  getModalLayout(userId?: string, sessionId?: string): string {
    return ABTesting.getVariant('modal_layout', userId, sessionId);
  },

  // Get urgency signals variant
  getUrgencySignals(userId?: string, sessionId?: string): string {
    return ABTesting.getVariant('urgency_signals', userId, sessionId);
  },

  // Track purchase conversion
  trackPurchase(testId: string, variant: string, price: number): void {
    ABTesting.trackConversion(testId, variant, 'purchase_complete', price);
  },

  // Track modal engagement
  trackModalEngagement(testId: string, variant: string, duration: number): void {
    ABTesting.trackConversion(testId, variant, 'modal_engagement', duration);
  },

  // Track CTA click
  trackCtaClick(testId: string, variant: string): void {
    ABTesting.trackConversion(testId, variant, 'cta_click');
  },
};

export default ABTesting;