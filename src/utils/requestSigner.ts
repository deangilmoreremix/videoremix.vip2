/**
 * 🔐 REQUEST SIGNER - Critical Operation Protection
 *
 * Adds signature validation to prevent replay attacks and unauthorized API calls.
 * This helps compensate for exposed API keys by adding an additional layer of protection.
 *
 * IMPORTANT: This is client-side signing. For production, combine with:
 * 1. Server-side signature verification (edge function)
 * 2. Rate limiting
 * 3. API key domain restrictions
 */

interface SignRequestOptions {
  timestamp: number;
  nonce: string;
  payload: Record<string, unknown>;
  apiKey?: string;
}

interface SignedRequest {
  signature: string;
  timestamp: number;
  nonce: string;
  payload: string;
}

interface VerificationResult {
  valid: boolean;
  reason?: string;
  timestampDiff?: number;
}

// Secret key for client-side signing (limited protection, but adds security layer)
const SIGNING_SECRET =
  import.meta.env.VITE_REQUEST_SIGNING_SECRET ||
  "default-secret-change-in-production";

// Time window for replay attack prevention (5 minutes)
const TIME_WINDOW_MS = 5 * 60 * 1000;

// Track used nonces to prevent replay attacks
const usedNonces = new Set<string>();
const NONCE_CLEANUP_INTERVAL = 10 * 60 * 1000; // Clean up every 10 minutes

// Cleanup old nonces periodically
if (typeof window !== "undefined") {
  setInterval(() => {
    // In a real implementation, track nonce creation time
    // For now, we just limit the Set size
    if (usedNonces.size > 10000) {
      const entries = Array.from(usedNonces.values());
      for (let i = 0; i < Math.min(5000, entries.length); i++) {
        usedNonces.delete(entries[i]);
      }
    }
  }, NONCE_CLEANUP_INTERVAL);
}

/**
 * Generate a random nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for older browsers
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Simple HMAC-like signature (NOT cryptographically secure on client)
 * This is for protection against casual abuse, not sophisticated attacks
 */
async function createSignature(data: string, secret: string): Promise<string> {
  // Use SubtleCrypto if available for better security
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    try {
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signature = await crypto.subtle.sign("HMAC", key, messageData);
      return Array.from(new Uint8Array(signature), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
    } catch {
      // Fallback to simple hash if SubtleCrypto fails
      return simpleHash(data + secret);
    }
  }

  return simpleHash(data + secret);
}

/**
 * Simple hash fallback
 */
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Sign a request
 */
export async function signRequest(
  options: SignRequestOptions,
): Promise<SignedRequest> {
  const { timestamp, nonce, payload } = options;

  // Create payload string
  const payloadString = JSON.stringify({
    ...payload,
    _timestamp: timestamp,
    _nonce: nonce,
  });

  // Create signature
  const signature = await createSignature(payloadString, SIGNING_SECRET);

  return {
    signature,
    timestamp,
    nonce,
    payload: payloadString,
  };
}

/**
 * Verify a signed request (server-side function - stub for client)
 */
export async function verifySignedRequest(
  request: SignedRequest,
): Promise<VerificationResult> {
  const { timestamp, nonce, signature, payload } = request;
  const now = Date.now();
  const timeDiff = Math.abs(now - timestamp);

  // Check timestamp is within window
  if (timeDiff > TIME_WINDOW_MS) {
    return {
      valid: false,
      reason: "Request timestamp outside valid window",
      timestampDiff: timeDiff,
    };
  }

  // Check nonce hasn't been used
  if (usedNonces.has(nonce)) {
    return {
      valid: false,
      reason: "Nonce already used (possible replay attack)",
      timestampDiff: timeDiff,
    };
  }

  // Verify signature
  const expectedSignature = await createSignature(payload, SIGNING_SECRET);
  if (signature !== expectedSignature) {
    return {
      valid: false,
      reason: "Invalid signature",
      timestampDiff: timeDiff,
    };
  }

  // Mark nonce as used
  usedNonces.add(nonce);

  return {
    valid: true,
    timestampDiff: timeDiff,
  };
}

/**
 * Create a signed fetch request
 */
export async function signedFetch(
  url: string,
  options: RequestInit = {},
  payload?: Record<string, unknown>,
): Promise<Response> {
  const timestamp = Date.now();
  const nonce = generateNonce();

  const signed = await signRequest({
    timestamp,
    nonce,
    payload: payload || {},
    apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-Signature": signed.signature,
      "X-Timestamp": signed.timestamp.toString(),
      "X-Nonce": signed.nonce,
      "X-Payload-Hash": await createSignature(signed.payload, SIGNING_SECRET),
    },
  });
}

/**
 * Signed Supabase query
 */
export async function signedSupabaseQuery<T>(
  table: string,
  query: Record<string, unknown> = {},
): Promise<{ data: T | null; error: Error | null }> {
  const timestamp = Date.now();
  const nonce = generateNonce();

  const signed = await signRequest({
    timestamp,
    nonce,
    payload: { table, ...query },
  });

  // In production, this would call an edge function that verifies the signature
  // For now, we just log the signed request info
  if (import.meta.env.DEV) {
    console.log("🔐 Signed request:", {
      table,
      nonce: nonce.slice(0, 8) + "...",
      timestamp: new Date(timestamp).toISOString(),
    });
  }

  // Return unsigned result (signature verification should be server-side)
  // This is a placeholder for the actual implementation
  return { data: null, error: null };
}

// ============================================================================
// API KEY USAGE TRACKING
// ============================================================================

interface APIKeyUsage {
  keyType: string;
  requestCount: number;
  lastUsed: number;
  endpoint: string;
}

const apiUsage = new Map<string, APIKeyUsage>();

/**
 * Track API key usage
 */
export function trackAPIKeyUsage(keyType: string, endpoint: string): void {
  const key = `${keyType}:${endpoint}`;
  const existing = apiUsage.get(key);

  if (existing) {
    existing.requestCount++;
    existing.lastUsed = Date.now();
  } else {
    apiUsage.set(key, {
      keyType,
      requestCount: 1,
      lastUsed: Date.now(),
      endpoint,
    });
  }
}

/**
 * Get API usage report
 */
export function getAPIUsageReport(): Record<string, APIKeyUsage> {
  return Object.fromEntries(apiUsage);
}

/**
 * Check for unusual API usage patterns
 */
export function detectUnusualUsage(): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  for (const [key, usage] of apiUsage) {
    // Check for high request frequency
    if (usage.lastUsed > oneHourAgo && usage.requestCount > 1000) {
      reasons.push(
        `High request frequency on ${key}: ${usage.requestCount} requests/hour`,
      );
    }
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

export type { SignRequestOptions, SignedRequest, VerificationResult };
