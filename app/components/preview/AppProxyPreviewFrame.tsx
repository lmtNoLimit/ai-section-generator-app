/**
 * App Proxy Preview Frame
 *
 * Renders Liquid code via server-side fetch and srcDoc injection.
 * Bypasses CORS/CSP restrictions by fetching HTML server-side.
 *
 * Flow:
 * 1. Client sends code/settings to /api/preview/render
 * 2. Server fetches from App Proxy with auth cookies
 * 3. Server returns rendered HTML
 * 4. Client injects HTML via srcDoc (bypasses CORS)
 *
 * Security:
 * - sandbox="allow-scripts" isolates iframe from parent DOM
 * - Server-side DOMPurify sanitizes HTML (Phase 02)
 *
 * Element Targeting (Phase 03):
 * - Injects targeting script for click-to-select functionality
 * - Uses postMessage with nonce for secure communication
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useNativePreviewRenderer } from "./hooks/useNativePreviewRenderer";
import { generateTargetingScript } from "./targeting/iframe-injection-script";
import { PasswordConfigModal } from "./PasswordConfigModal";
import type { DeviceSize } from "./types";
import type { SettingsState, BlockInstance } from "./schema/SchemaTypes";
import type { MockProduct, MockCollection } from "./mockData/types";

/**
 * Password error detection patterns matching api.preview.render.tsx error messages:
 * - "Storefront password expired or invalid"
 * - "Store is password-protected - configure password in settings"
 * - "Store is password-protected"
 */
const PASSWORD_ERROR_PATTERNS = [
  "password-protected",
  "password expired",
  "storefront password",
];

/**
 * Checks if error message indicates a password-related issue
 */
function isPasswordError(error: string | null): boolean {
  if (!error) return false;
  const lowerError = error.toLowerCase();
  return PASSWORD_ERROR_PATTERNS.some((p) => lowerError.includes(p));
}

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
  /** Nonce for element targeting postMessage authentication */
  targetingNonce?: string;
}

// Generate crypto-safe random ID for nonce
function generateNonce(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
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
  targetingNonce,
}: AppProxyPreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [iframeHeight, setIframeHeight] = useState<number>(400);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // Nonce for postMessage authentication (prevents message spoofing)
  const [messageNonce] = useState(generateNonce);
  // Use provided targeting nonce or generate one
  const effectiveTargetingNonce = targetingNonce || messageNonce;

  // Use server-side fetch hook (bypasses CORS)
  const { html, isLoading, error, refetch } = useNativePreviewRenderer({
    liquidCode,
    settings,
    blocks,
    resources,
    shopDomain,
    debounceMs,
  });

  // Notify parent of render state changes
  useEffect(() => {
    onRenderStateChange?.(isLoading);
  }, [isLoading, onRenderStateChange]);

  // Expose refetch to parent
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = refetch;
    }
  }, [onRefreshRef, refetch]);

  // Detect password errors for modal display
  const passwordError = isPasswordError(error);

  // Auto-show modal on password error (first occurrence only)
  useEffect(() => {
    if (passwordError && !showPasswordModal) {
      setShowPasswordModal(true);
    }
  }, [passwordError, showPasswordModal]);

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

  // Listen for height updates from iframe via postMessage (with nonce validation)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Accept messages from srcdoc iframe (null origin) or same origin
      if (event.origin !== "null" && event.origin !== window.location.origin) return;
      // Validate message type and nonce to prevent spoofing
      if (event.data?.type !== "PREVIEW_HEIGHT" || event.data?.nonce !== messageNonce) return;
      const height = parseInt(event.data.height, 10);
      if (!isNaN(height) && height > 0) {
        setIframeHeight(Math.max(300, height));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [messageNonce]);

  // Build full HTML document for srcDoc with targeting script
  const fullHtml = useMemo(() => {
    if (!html) return null;
    const targetingScript = generateTargetingScript(effectiveTargetingNonce);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      overflow: hidden;
    }
    html {
      overflow: hidden;
    }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${html}
  <script>
    // Report content height to parent for dynamic iframe sizing
    // Nonce prevents message spoofing from other iframes
    function reportHeight() {
      window.parent.postMessage({ type: 'PREVIEW_HEIGHT', height: document.body.scrollHeight, nonce: '${messageNonce}' }, '*');
    }
    window.addEventListener('load', reportHeight);
    new MutationObserver(reportHeight).observe(document.body, { childList: true, subtree: true });
  </script>
  <script>
    // Element targeting script (Phase 03)
    ${targetingScript}
  </script>
</body>
</html>`;
  }, [html, messageNonce, effectiveTargetingNonce]);

  // Calculate scaling
  const targetWidth = DEVICE_WIDTHS[deviceSize];
  const needsScaling = containerWidth > 0 && containerWidth < targetWidth;
  const scale = needsScaling ? containerWidth / targetWidth : 1;
  const scaledHeight = iframeHeight * scale;

  // Determine what to show
  const showNoCode = !liquidCode.trim();

  return (
    <s-box
      background="subdued"
      borderRadius="base"
      padding="base"
      blockSize={fullHtml ? `${scaledHeight + 32}px` : "100%"}
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
        {/* Non-password errors - show dismissible banner with retry */}
        {error && !passwordError && (
          <s-box padding="base">
            <s-banner tone="warning" dismissible>
              {error}
              <s-button slot="secondary-actions" variant="tertiary" onClick={refetch}>
                Retry
              </s-button>
            </s-banner>
          </s-box>
        )}

        {/* Password error - show configure option */}
        {error && passwordError && (
          <s-box padding="base">
            <s-banner tone="warning">
              {error}
              <s-button
                slot="secondary-actions"
                variant="tertiary"
                onClick={() => setShowPasswordModal(true)}
              >
                Configure Password
              </s-button>
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
        {isLoading && !showNoCode && (
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
              Loading preview...
            </span>
          </div>
        )}

        {/* Preview iframe with srcDoc (bypasses CORS) */}
        {fullHtml && !showNoCode && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: `${targetWidth}px`,
              marginLeft: `-${targetWidth / 2}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
            }}
          >
            <iframe
              srcDoc={fullHtml}
              // Sandbox: allow-scripts but NOT allow-same-origin
              // This isolates iframe from parent DOM/cookies while enabling interactivity
              sandbox="allow-scripts"
              style={{
                width: "100%",
                height: `${iframeHeight}px`,
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

      {/* Password Configuration Modal */}
      <PasswordConfigModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          // Auto-reload preview after password configured
          refetch();
        }}
      />
    </s-box>
  );
}
