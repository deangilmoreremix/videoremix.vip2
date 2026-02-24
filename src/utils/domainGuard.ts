/**
 * 🔐 DOMAIN GUARD - Request Validation
 * 
 * Protects API keys by validating requests come from allowed domains.
 * This compensates for exposed keys by restricting where they can be used.
 * 
 * IMPORTANT: This is client-side validation only. For complete protection,
 * also configure API key restrictions in:
 * - OpenAI: https://platform.openai.com/docs/api-reference/authentication
 * - Supabase: Dashboard → Settings → API → URL and Key Restrictions
 * - Stripe: Dashboard → Developers → API Keys → Restricted keys
 */

interface DomainConfig {
  allowedDomains: string[];
  blockedPatterns: RegExp[];
  enableLogging: boolean;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Configuration - Update these with your production domains
const config: DomainConfig = {
  // Allowed domains (include localhost for development)
  allowedDomains: [
    'localhost:5173',
    'localhost:3000',
    'videoremix.vip2.netlify.app',
    'videoremix.vip2.vercel.app',
    'videoremix.vip',
    'www.videoremix.vip',
  ],
  
  // Block suspicious patterns
  blockedPatterns: [
    /iframe\.zh/,           // Suspicious Chinese iframe
    /evil\.js/,             // Known malicious pattern
    /crypto-miner/,         // Crypto mining scripts
    /\.xyz\/.*\.js/,        // Suspicious TLD patterns
    /data:text\/html/,      // Data URI attack vector
  ],
  
  // Enable security logging (disable in production to avoid noise)
  enableLogging: import.meta.env.DEV,
};

// Known malicious domains (expand this list)
const KNOWN_MALICIOUS_DOMAINS = new Set([
  'iframe.zhiframe.com',
  'cdn.jsdelivr.net',  // Sometimes used for supply chain attacks
  'unpkg.com',         // Sometimes used for supply chain attacks
]);

/**
 * Validate the current origin against allowed domains
 */
export function validateOrigin(): ValidationResult {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Check for localhost (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (config.enableLogging) {
      console.log('🔒 DomainGuard: Local development detected');
    }
    return { valid: true, severity: 'low' };
  }
  
  // Check if domain is in allowed list
  const isAllowed = config.allowedDomains.some(domain => {
    // Exact match
    if (origin === domain || hostname === domain) {
      return true;
    }
    // Subdomain match (e.g., "app.videoremix.vip" matches "videoremix.vip")
    if (domain.startsWith('*.') && hostname.endsWith(domain.slice(1))) {
      return true;
    }
    // Wildcard match
    if (domain === '*') {
      return true;
    }
    return false;
  });
  
  if (!isAllowed) {
    const reason = `Unauthorized domain: ${origin}`;
    if (config.enableLogging) {
      console.warn('🔒 DomainGuard BLOCKED:', reason);
    }
    return {
      valid: false,
      reason,
      severity: 'high'
    };
  }
  
  if (config.enableLogging) {
    console.log('🔒 DomainGuard: Valid origin:', origin);
  }
  
  return { valid: true, severity: 'low' };
}

/**
 * Check for suspicious patterns in the page
 */
export function detectSuspiciousPatterns(): ValidationResult {
  // Check for iframes with suspicious sources
  const iframes = document.querySelectorAll('iframe[src]');
  for (const iframe of iframes) {
    const src = iframe.getAttribute('src') || '';
    
    for (const pattern of config.blockedPatterns) {
      if (pattern.test(src)) {
        const reason = `Suspicious iframe detected: ${src}`;
        console.error('🔒 DomainGuard:', reason);
        return {
          valid: false,
          reason,
          severity: 'critical'
        };
      }
    }
  }
  
  // Check for known malicious domains
  const allSources = [
    ...Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src')),
    ...Array.from(document.querySelectorAll('iframe[src]')).map(s => s.getAttribute('src')),
    ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(s => s.getAttribute('href')),
  ];
  
  for (const source of allSources) {
    if (source) {
      for (const malicious of KNOWN_MALICIOUS_DOMAINS) {
        if (source.includes(malicious)) {
          const reason = `Known malicious domain detected: ${source}`;
          console.error('🔒 DomainGuard:', reason);
          return {
            valid: false,
            reason,
            severity: 'critical'
          };
        }
      }
    }
  }
  
  return { valid: true, severity: 'low' };
}

/**
 * Validate all outgoing requests (can be used as a middleware)
 */
export function validateOutgoingRequest(url: string): ValidationResult {
  // Check if URL is from allowed domains
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Allow same-origin requests
    if (hostname === window.location.hostname) {
      return { valid: true, severity: 'low' };
    }
    
    // Check allowed API domains
    const allowedApiDomains = [
      'mohueeozazjxyzmikdbs.supabase.co',
      'api.openai.com',
      'api.stripe.com',
      'generativelanguage.googleapis.com',
      'api.mixpanel.com',
      'api.segment.io',
    ];
    
    const isAllowedApi = allowedApiDomains.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });
    
    if (!isAllowedApi) {
      const reason = `Request to unauthorized domain: ${hostname}`;
      return {
        valid: false,
        reason,
        severity: 'medium'
      };
    }
  } catch {
    return {
      valid: false,
      reason: 'Invalid URL format',
      severity: 'medium'
    };
  }
  
  return { valid: true, severity: 'low' };
}

/**
 * Get security report
 */
export function getSecurityReport(): {
  originValid: ValidationResult;
  patternsValid: ValidationResult;
  allValid: boolean;
} {
  const originValid = validateOrigin();
  const patternsValid = detectSuspiciousPatterns();
  
  return {
    originValid,
    patternsValid,
    allValid: originValid.valid && patternsValid.valid
  };
}

// Export configuration for external modification
export function updateDomainConfig(newConfig: Partial<DomainConfig>): void {
  Object.assign(config, newConfig);
}

export function addAllowedDomain(domain: string): void {
  if (!config.allowedDomains.includes(domain)) {
    config.allowedDomains.push(domain);
  }
}

export function blockDomain(pattern: RegExp): void {
  config.blockedPatterns.push(pattern);
}

// Auto-run security check on import (in production, make this optional)
if (import.meta.env.PROD) {
  const report = getSecurityReport();
  if (!report.allValid) {
    console.error('🔒 Security Alert: Invalid security configuration detected');
    // You could block the app here if desired:
    // throw new Error('Security check failed');
  }
}
