/**
 * Preview Mode Indicator
 * Displays current rendering mode (native/fallback) with optional toggle
 */

interface PreviewModeIndicatorProps {
  mode: "native" | "fallback";
  onRetryNative?: () => void;
}

/**
 * Visual indicator showing which rendering mode is active
 * Native = App Proxy (server-side Shopify Liquid)
 * Fallback = LiquidJS (client-side approximation)
 */
export function PreviewModeIndicator({ mode, onRetryNative }: PreviewModeIndicatorProps) {
  return (
    <s-stack gap="small" direction="inline" alignItems="center">
      <s-badge tone={mode === "native" ? "success" : "warning"}>
        {mode === "native" ? "Native" : "Fallback"}
      </s-badge>
      {mode === "fallback" && (
        <s-text tone="neutral">
          Using client-side rendering
        </s-text>
      )}
      {mode === "fallback" && onRetryNative && (
        <s-button variant="tertiary" onClick={onRetryNative}>
          Retry native
        </s-button>
      )}
    </s-stack>
  );
}
