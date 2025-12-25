import { settingsService } from "./settings.server";

/**
 * Storefront authentication service for bypassing password-protected stores
 *
 * Authenticates against Shopify storefront POST /password endpoint,
 * captures session cookies (especially _shopify_essential), and caches
 * them for subsequent requests.
 */

interface StorefrontAuthResult {
  success: boolean;
  cookies: string | null;
  error?: string;
}

interface CacheEntry {
  cookies: string;
  expiresAt: number;
}

// In-memory cache for session cookies (per shop)
const cookieCache = new Map<string, CacheEntry>();
const COOKIE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Authenticate against storefront and get session cookies
 *
 * POST to https://{shop}/password with password returns session cookies.
 * - 302 = success (redirect to storefront)
 * - 200 = failure (re-render password page)
 *
 * Critical cookie: _shopify_essential is required for password bypass
 */
export async function authenticateStorefront(
  shop: string,
  password: string
): Promise<StorefrontAuthResult> {
  try {
    console.log("[StorefrontAuth] Authenticating", shop);

    const response = await fetch(`https://${shop}/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Blocksmith-Preview/1.0",
      },
      body: new URLSearchParams({
        password: password,
        form_type: "storefront_password",
        utf8: "✓",
      }),
      redirect: "manual", // Capture cookies before redirect
    });

    console.log("[StorefrontAuth] Response:", response.status, response.statusText);

    // 302 = success (redirect to storefront)
    // 200 = failure (re-render password page)
    if (response.status === 302) {
      const cookies = extractCookies(response);

      if (cookies) {
        console.log("[StorefrontAuth] Cookies obtained:", cookies.substring(0, 50) + "...");
        // Cache cookies
        cookieCache.set(shop, {
          cookies,
          expiresAt: Date.now() + COOKIE_TTL_MS,
        });

        return { success: true, cookies };
      } else {
        console.warn("[StorefrontAuth] 302 but no cookies extracted");
      }
    }

    // Authentication failed
    cookieCache.delete(shop);
    console.log("[StorefrontAuth] Authentication failed for", shop, "status:", response.status);
    return {
      success: false,
      cookies: null,
      error: response.status === 200
        ? "Invalid storefront password"
        : `Unexpected response: ${response.status}`,
    };
  } catch (error) {
    console.error("[StorefrontAuth] Error:", error);
    return {
      success: false,
      cookies: null,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Get cached cookies or re-authenticate
 * Returns cached cookies if valid, otherwise authenticates again
 */
export async function getStorefrontCookies(
  shop: string,
  password: string
): Promise<string | null> {
  // Check cache first
  const cached = cookieCache.get(shop);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.cookies;
  }

  // Re-authenticate
  const result = await authenticateStorefront(shop, password);
  return result.cookies;
}

/**
 * Extract cookies from Set-Cookie headers
 *
 * CRITICAL: _shopify_essential is the required cookie for password bypass.
 * Other cookies (_shopify_s, _fd, etc.) may be present but are not required.
 */
function extractCookies(response: Response): string | null {
  // getSetCookie() returns array of Set-Cookie header values
  // Fallback to get('set-cookie') for older runtimes
  const setCookieHeaders =
    response.headers.getSetCookie?.() ||
    [response.headers.get("set-cookie")].filter(Boolean);

  console.log("[StorefrontAuth] Set-Cookie headers count:", setCookieHeaders.length);

  if (!setCookieHeaders.length) {
    console.log("[StorefrontAuth] No Set-Cookie headers found");
    return null;
  }

  // Parse and format cookies for Cookie header
  // Extract name=value before first semicolon from each Set-Cookie header
  const cookies = setCookieHeaders
    .map((header) => {
      const match = header?.match(/^([^;]+)/);
      return match ? match[1] : null;
    })
    .filter(Boolean)
    .join("; ");

  // Verify _shopify_essential is present (required for password bypass)
  if (!cookies.includes("_shopify_essential")) {
    console.warn(
      "[StorefrontAuth] Warning: _shopify_essential cookie not found"
    );
  }

  return cookies || null;
}

/**
 * Clear cached cookies for a shop
 * Call this when password is changed or cleared
 */
export function clearCookieCache(shop: string): void {
  cookieCache.delete(shop);
}

/**
 * Validate password by attempting authentication
 * Used to verify password before storing
 */
export async function validateStorefrontPassword(
  shop: string,
  password: string
): Promise<boolean> {
  const result = await authenticateStorefront(shop, password);
  return result.success;
}

/**
 * Get authenticated cookies for preview requests
 * Retrieves stored password, authenticates if needed, returns cookies
 *
 * Returns null if:
 * - No password configured
 * - Authentication fails
 * - Encryption not configured
 */
export async function getAuthenticatedCookiesForShop(
  shop: string
): Promise<string | null> {
  const password = await settingsService.getStorefrontPassword(shop);

  if (!password) {
    console.log("[StorefrontAuth] No password configured for", shop);
    return null; // No password configured
  }

  console.log("[StorefrontAuth] Found password for", shop, "attempting auth...");
  const cookies = await getStorefrontCookies(shop, password);
  console.log("[StorefrontAuth] Auth result for", shop, ":", cookies ? "success" : "failed");
  return cookies;
}

/**
 * Validate and save storefront password
 * First validates password works, then saves if valid
 *
 * Returns success/error result to avoid silent failures
 */
export async function validateAndSaveStorefrontPassword(
  shop: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // First validate password works
  const isValid = await validateStorefrontPassword(shop, password);

  if (!isValid) {
    return { success: false, error: "Invalid storefront password" };
  }

  try {
    // Save password (already validated)
    await settingsService.saveStorefrontPassword(shop, password);
    // Mark as verified since we just authenticated
    await settingsService.markPasswordVerified(shop);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save password",
    };
  }
}

/**
 * Clear storefront password and cache
 * Use this instead of settingsService.clearStorefrontPassword directly
 */
export async function clearStorefrontPasswordAndCache(
  shop: string
): Promise<void> {
  clearCookieCache(shop);
  await settingsService.clearStorefrontPassword(shop);
}
