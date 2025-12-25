/**
 * Hook for browser-side storefront password authentication
 *
 * Handles authentication against password-protected Shopify stores by:
 * 1. Fetching the stored password from the server
 * 2. POSTing to the store's /password endpoint via hidden form
 * 3. Tracking authentication state for preview iframe
 *
 * The form POST sets cookies in the browser for the store's domain,
 * allowing subsequent requests (like App Proxy iframe) to bypass password.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type AuthState = "idle" | "checking" | "authenticating" | "authenticated" | "no-password" | "error";

interface UseAppProxyAuthOptions {
  shopDomain: string;
}

interface UseAppProxyAuthResult {
  authState: AuthState;
  error: string | null;
  /** Trigger authentication flow */
  authenticate: () => Promise<boolean>;
  /** Whether preview can be loaded (authenticated or no password required) */
  isReady: boolean;
}

// Cache auth state per shop to avoid re-auth on every code change
const authCache = new Map<string, { authenticated: boolean; expiresAt: number }>();
const AUTH_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook for managing storefront password authentication
 *
 * Usage:
 * 1. Call authenticate() before loading App Proxy iframe
 * 2. Wait for isReady to be true
 * 3. Load iframe - browser will have cookies for the store domain
 */
export function useAppProxyAuth({ shopDomain }: UseAppProxyAuthOptions): UseAppProxyAuthResult {
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState<string | null>(null);
  const authFormRef = useRef<HTMLFormElement | null>(null);
  const authIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Check cache on mount
  useEffect(() => {
    const cached = authCache.get(shopDomain);
    if (cached && cached.expiresAt > Date.now()) {
      setAuthState(cached.authenticated ? "authenticated" : "no-password");
    }
  }, [shopDomain]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    // Check cache first
    const cached = authCache.get(shopDomain);
    if (cached && cached.expiresAt > Date.now()) {
      setAuthState(cached.authenticated ? "authenticated" : "no-password");
      return true;
    }

    setAuthState("checking");
    setError(null);

    try {
      // Fetch password from server
      const response = await fetch("/api/storefront-password");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check password");
      }

      if (!data.hasPassword) {
        // No password configured - store might not be password protected
        // Or user hasn't set up password bypass yet
        setAuthState("no-password");
        authCache.set(shopDomain, { authenticated: false, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
        return true; // Can still try loading preview directly
      }

      // Have password - need to authenticate browser
      setAuthState("authenticating");

      const success = await authenticateViaForm(shopDomain, data.password);

      if (success) {
        setAuthState("authenticated");
        authCache.set(shopDomain, { authenticated: true, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
        return true;
      } else {
        setAuthState("error");
        setError("Storefront authentication failed");
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      setAuthState("error");
      return false;
    }
  }, [shopDomain]);

  const isReady = authState === "authenticated" || authState === "no-password";

  return { authState, error, authenticate, isReady };
}

/**
 * Authenticate browser by POSTing to storefront password page via hidden form
 *
 * Creates a hidden iframe + form, submits the password, waits for response.
 * The response sets cookies in the browser for the store's domain.
 */
async function authenticateViaForm(shopDomain: string, password: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Create hidden iframe to receive form response
    const iframe = document.createElement("iframe");
    iframe.name = "blocksmith-auth-frame";
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);

    // Create form targeting the iframe
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `https://${shopDomain}/password`;
    form.target = "blocksmith-auth-frame";
    form.style.display = "none";

    // Add form fields
    const fields = [
      { name: "form_type", value: "storefront_password" },
      { name: "utf8", value: "✓" },
      { name: "password", value: password },
    ];

    for (const field of fields) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = field.name;
      input.value = field.value;
      form.appendChild(input);
    }

    document.body.appendChild(form);

    // Set timeout for auth completion
    const timeout = setTimeout(() => {
      cleanup();
      console.warn("[AppProxyAuth] Authentication timeout");
      resolve(false);
    }, 10000);

    // Listen for iframe load (indicates form submitted and response received)
    const onLoad = () => {
      // Check if we got redirected to storefront (success) or stayed on password page (failure)
      // We can't read cross-origin iframe content, but the form POST sets cookies regardless
      clearTimeout(timeout);

      // Give cookies a moment to be set
      setTimeout(() => {
        cleanup();
        // Assume success if we got a response - cookies should be set
        // If auth actually failed, the preview request will still fail
        console.log("[AppProxyAuth] Form submitted, assuming cookies set");
        resolve(true);
      }, 500);
    };

    iframe.addEventListener("load", onLoad);

    // Cleanup function
    const cleanup = () => {
      iframe.removeEventListener("load", onLoad);
      form.remove();
      iframe.remove();
    };

    // Submit form
    console.log("[AppProxyAuth] Submitting password form to", shopDomain);
    form.submit();
  });
}

/**
 * Clear auth cache for a shop
 * Call this when password is changed
 */
export function clearAuthCache(shopDomain?: string): void {
  if (shopDomain) {
    authCache.delete(shopDomain);
  } else {
    authCache.clear();
  }
}
