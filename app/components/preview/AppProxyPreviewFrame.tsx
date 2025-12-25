/**
 * App Proxy Preview Frame
 *
 * Loads Shopify App Proxy URL directly in an iframe for native Liquid rendering.
 * Handles:
 * - Browser-side password authentication for protected stores
 * - URL building with base64-encoded code, settings, blocks
 * - Device size scaling
 * - Loading states and error handling
 *
 * Flow:
 * 1. Authenticate browser (if password protected)
 * 2. Build App Proxy URL with all params
 * 3. Load URL in iframe - Shopify handles HMAC, proxies to our app
 * 4. Our app returns Liquid code, Shopify renders it
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAppProxyAuth } from "./hooks/useAppProxyAuth";
import type { DeviceSize } from "./types";
import type { SettingsState, BlockInstance } from "./schema/SchemaTypes";
import type { MockProduct, MockCollection } from "./mockData/types";

// Fixed widths for each device mode
const DEVICE_WIDTHS: Record<DeviceSize, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1200,
};

interface AppProxyPreviewFrameProps {
  liquidCode: string;
  shopDomain: string;
  deviceSize?: DeviceSize;
  settings?: SettingsState;
  blocks?: BlockInstance[];
  resources?: Record<string, MockProduct | MockCollection>;
  debounceMs?: number;
  onRenderStateChange?: (isRendering: boolean) => void;
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Base64 encode for browser (handles Unicode properly)
 */
function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Build App Proxy URL with all necessary parameters
 */
function buildAppProxyUrl(
  shopDomain: string,
  liquidCode: string,
  settings?: SettingsState,
  blocks?: BlockInstance[],
  resources?: Record<string, MockProduct | MockCollection>
): string {
  const url = new URL(`https://${shopDomain}/apps/blocksmith-preview`);

  // Required: base64-encoded Liquid code
  url.searchParams.set("code", base64Encode(liquidCode));
  url.searchParams.set("section_id", "preview");

  // Optional: settings
  if (settings && Object.keys(settings).length > 0) {
    url.searchParams.set("settings", base64Encode(JSON.stringify(settings)));
  }

  // Optional: blocks
  if (blocks && blocks.length > 0) {
    url.searchParams.set("blocks", base64Encode(JSON.stringify(blocks)));
  }

  // Optional: resource handles for context
  if (resources) {
    for (const resource of Object.values(resources)) {
      if ("products" in resource && Array.isArray(resource.products)) {
        // It's a collection
        const collection = resource as MockCollection;
        if (collection.handle) {
          url.searchParams.set("collection", collection.handle);
        }
      } else if ("variants" in resource) {
        // It's a product
        const product = resource as MockProduct;
        if (product.handle) {
          url.searchParams.set("product", product.handle);
        }
      }
    }
  }

  return url.toString();
}

export function AppProxyPreviewFrame({
  liquidCode,
  shopDomain,
  deviceSize = "desktop",
  settings = {},
  blocks = [],
  resources = {},
  debounceMs = 600,
  onRenderStateChange,
  onRefreshRef,
}: AppProxyPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Auth hook for password-protected stores
  const { authState, error: authError, authenticate, isReady } = useAppProxyAuth({ shopDomain });

  // Build URL (memoized)
  const proxyUrl = useMemo(() => {
    if (!liquidCode.trim()) return null;
    return buildAppProxyUrl(shopDomain, liquidCode, settings, blocks, resources);
  }, [shopDomain, liquidCode, settings, blocks, resources]);

  // Measure container width for scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Authenticate on mount
  useEffect(() => {
    authenticate();
  }, [authenticate]);

  // Update iframe src with debounce when code/settings change
  useEffect(() => {
    if (!isReady || !proxyUrl) {
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    setIsLoading(true);
    onRenderStateChange?.(true);

    debounceRef.current = window.setTimeout(() => {
      console.log("[AppProxyPreview] Loading URL:", proxyUrl.substring(0, 100) + "...");
      setIframeSrc(proxyUrl);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [proxyUrl, isReady, debounceMs, onRenderStateChange]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    onRenderStateChange?.(false);
    console.log("[AppProxyPreview] Iframe loaded");
  }, [onRenderStateChange]);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError("Failed to load preview");
    onRenderStateChange?.(false);
    console.error("[AppProxyPreview] Iframe error");
  }, [onRenderStateChange]);

  // Expose refetch to parent
  const refetch = useCallback(() => {
    if (iframeRef.current && iframeSrc) {
      setIsLoading(true);
      onRenderStateChange?.(true);
      // Force reload by temporarily clearing and re-setting src
      iframeRef.current.src = "";
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = iframeSrc;
        }
      });
    }
  }, [iframeSrc, onRenderStateChange]);

  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = refetch;
    }
  }, [onRefreshRef, refetch]);

  // Calculate scaling
  const targetWidth = DEVICE_WIDTHS[deviceSize];
  const needsScaling = containerWidth > 0 && containerWidth < targetWidth;
  const scale = needsScaling ? containerWidth / targetWidth : 1;

  // Determine what to show
  const displayError = error || authError;
  const showLoading = isLoading || authState === "checking" || authState === "authenticating";
  const showNoCode = !liquidCode.trim();

  return (
    <s-box
      background="subdued"
      borderRadius="base"
      padding="base"
      blockSize="100%"
      overflow="hidden"
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
        }}
      >
        {/* Error display */}
        {displayError && (
          <s-box padding="base">
            <s-banner tone="warning" dismissible onDismiss={() => setError(null)}>
              {displayError}
            </s-banner>
          </s-box>
        )}

        {/* No code message */}
        {showNoCode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "#6d7175",
            }}
          >
            No code to preview
          </div>
        )}

        {/* Loading indicator */}
        {showLoading && !showNoCode && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 10,
            }}
          >
            <s-spinner size="large" />
            <span style={{ marginLeft: "8px", color: "#6d7175" }}>
              {authState === "authenticating" ? "Authenticating..." : "Loading preview..."}
            </span>
          </div>
        )}

        {/* Preview iframe (only render when ready and have URL) */}
        {isReady && iframeSrc && !showNoCode && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: `${targetWidth}px`,
              marginLeft: `-${targetWidth / 2}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              height: "100%",
            }}
          >
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                width: "100%",
                height: "100%",
                border: "1px solid var(--p-color-border)",
                borderRadius: "var(--p-border-radius-200)",
                backgroundColor: "var(--p-color-bg-surface)",
                display: "block",
              }}
              title="Section Preview"
              aria-label="Live preview of generated section"
            />
          </div>
        )}
      </div>
    </s-box>
  );
}
