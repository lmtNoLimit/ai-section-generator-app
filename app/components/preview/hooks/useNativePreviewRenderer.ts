import { useState, useEffect, useRef, useCallback } from 'react';
import type { SettingsState, BlockInstance } from '../schema/SchemaTypes';
import type { MockProduct, MockCollection } from '../mockData/types';

interface UseNativePreviewRendererOptions {
  liquidCode: string;
  settings?: SettingsState;
  blocks?: BlockInstance[];
  resources?: Record<string, MockProduct | MockCollection>;
  shopDomain: string;
  debounceMs?: number;
  /** When false, skips fetching (for fallback mode) */
  enabled?: boolean;
}

interface NativePreviewResult {
  html: string | null;
  isLoading: boolean;
  error: string | null;
  /** Server indicated fallback mode due to password protection or error */
  shouldFallback: boolean;
  refetch: () => void;
}

/**
 * Hook for rendering Liquid via App Proxy (server-side native rendering)
 * Debounces code changes and fetches rendered HTML from proxy endpoint
 */
export function useNativePreviewRenderer({
  liquidCode,
  settings = {},
  blocks = [],
  resources = {},
  shopDomain,
  debounceMs = 600,
  enabled = true,
}: UseNativePreviewRendererOptions): NativePreviewResult {
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldFallback, setShouldFallback] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Extract product/collection handles from resources
  const getResourceHandles = useCallback(() => {
    let productHandle: string | null = null;
    let collectionHandle: string | null = null;

    for (const resource of Object.values(resources)) {
      if ('products' in resource && Array.isArray(resource.products)) {
        collectionHandle = (resource as MockCollection).handle || null;
      } else if ('variants' in resource) {
        productHandle = (resource as MockProduct).handle || null;
      }
    }

    return { productHandle, collectionHandle };
  }, [resources]);

  // Base64 encode for browser (handles Unicode properly with TextEncoder)
  const base64Encode = useCallback((str: string): string => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Build request body for internal proxy
  const buildProxyBody = useCallback(() => {
    const body: Record<string, string> = {
      shopDomain,
      code: base64Encode(liquidCode),
      section_id: 'preview',
    };

    // Add settings if present
    if (Object.keys(settings).length > 0) {
      body.settings = base64Encode(JSON.stringify(settings));
    }

    // Add blocks if present
    if (blocks.length > 0) {
      body.blocks = base64Encode(JSON.stringify(blocks));
    }

    // Add resource handles
    const { productHandle, collectionHandle } = getResourceHandles();
    if (productHandle) body.product = productHandle;
    if (collectionHandle) body.collection = collectionHandle;

    return body;
  }, [liquidCode, settings, blocks, shopDomain, getResourceHandles, base64Encode]);

  // Fetch preview via internal proxy (bypasses CORS)
  const fetchPreview = useCallback(async () => {
    if (!liquidCode.trim() || !shopDomain) {
      setHtml('<p style="color:#6d7175;text-align:center;">No code to preview</p>');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setShouldFallback(false);

    try {
      // Use internal proxy to bypass CORS
      const response = await fetch('/api/preview/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProxyBody()),
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      // Handle mode-aware response from server
      if (result.mode === 'fallback') {
        // Server indicated to use client-side fallback
        setShouldFallback(true);
        setError(result.error || 'Server indicated fallback mode');
        setHtml(null);
        return;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setHtml(result.html);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request cancelled, ignore
      }
      const message = err instanceof Error ? err.message : 'Fetch failed';
      setError(message);
      setHtml(null);
    } finally {
      setIsLoading(false);
    }
  }, [liquidCode, shopDomain, buildProxyBody]);

  // Debounced fetch on code/settings changes (only when enabled)
  useEffect(() => {
    if (!enabled) {
      return; // Skip fetching when disabled
    }

    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(fetchPreview, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchPreview, debounceMs, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { html, isLoading, error, shouldFallback, refetch: fetchPreview };
}
