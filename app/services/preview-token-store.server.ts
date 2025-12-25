/**
 * Preview Token Store
 *
 * In-memory store for large preview data to bypass URL length limits.
 * Tokens expire after 5 minutes to prevent memory leaks.
 *
 * Flow:
 * 1. Client sends large Liquid code to internal proxy
 * 2. Internal proxy stores code with short token
 * 3. App Proxy URL uses token: ?token=abc123
 * 4. App Proxy retrieves code using token
 */

import { randomBytes } from "crypto";

interface PreviewData {
  code: string;
  settings?: string;
  blocks?: string;
  product?: string;
  collection?: string;
  section_id?: string;
  expiresAt: number;
}

// In-memory store with auto-cleanup
const tokenStore = new Map<string, PreviewData>();

// TTL: 5 minutes (enough for preview round-trip)
const TOKEN_TTL_MS = 5 * 60 * 1000;

// Cleanup interval: every minute
const CLEANUP_INTERVAL_MS = 60 * 1000;

// Generate cryptographically secure short token
function generateToken(): string {
  return randomBytes(16).toString("hex");
}

// Cleanup expired tokens
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
}

// Start cleanup interval (runs on server start)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
if (typeof setInterval !== "undefined" && !cleanupInterval) {
  cleanupInterval = setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);
  // Allow process to exit even with interval running
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Store preview data and return a short token
 */
export function storePreviewData(data: Omit<PreviewData, "expiresAt">): string {
  const token = generateToken();
  tokenStore.set(token, {
    ...data,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

/**
 * Retrieve preview data by token (returns null if expired or not found)
 */
export function getPreviewData(token: string): Omit<PreviewData, "expiresAt"> | null {
  const data = tokenStore.get(token);
  if (!data) {
    return null;
  }

  // Check expiration
  if (data.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return null;
  }

  // Return without expiresAt
  const { expiresAt: _, ...previewData } = data;
  return previewData;
}

/**
 * Delete token after use (optional, auto-expires anyway)
 */
export function deletePreviewToken(token: string): void {
  tokenStore.delete(token);
}
