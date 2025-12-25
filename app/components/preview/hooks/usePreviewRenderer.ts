/**
 * Unified Preview Renderer Hook
 * Provides automatic fallback from native (App Proxy) to LiquidJS client-side
 * rendering when the native renderer fails.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNativePreviewRenderer } from "./useNativePreviewRenderer";
import { useLiquidRenderer } from "./useLiquidRenderer";
import { buildPreviewContext } from "../utils/buildPreviewContext";
import type { SettingsState, BlockInstance } from "../schema/SchemaTypes";
import type { MockProduct, MockCollection } from "../mockData/types";

export type PreviewMode = "native" | "fallback" | "auto";

interface UsePreviewRendererOptions {
  liquidCode: string;
  settings?: SettingsState;
  blocks?: BlockInstance[];
  resources?: Record<string, MockProduct | MockCollection>;
  shopDomain?: string;
  mode?: PreviewMode;
  debounceMs?: number;
}

interface PreviewResult {
  html: string | null;
  css: string;
  isLoading: boolean;
  error: string | null;
  activeMode: "native" | "fallback";
  refetch: () => void;
}

/**
 * Unified hook that tries native rendering first, then falls back to LiquidJS
 *
 * Modes:
 * - "native": Only use App Proxy rendering (requires shopDomain)
 * - "fallback": Only use LiquidJS client-side rendering
 * - "auto": Try native first, automatically fall back on error
 */
export function usePreviewRenderer({
  liquidCode,
  settings = {},
  blocks = [],
  resources = {},
  shopDomain,
  mode = "auto",
  debounceMs = 600,
}: UsePreviewRendererOptions): PreviewResult {
  const [activeMode, setActiveMode] = useState<"native" | "fallback">(
    mode === "fallback" ? "fallback" : "native"
  );
  const fallbackTriggeredRef = useRef(false);

  // Native renderer (App Proxy)
  const native = useNativePreviewRenderer({
    liquidCode,
    settings,
    blocks,
    resources,
    shopDomain: shopDomain || "",
    debounceMs,
    enabled: activeMode === "native" && !!shopDomain,
  });

  // Fallback renderer (LiquidJS client-side)
  const { render: fallbackRender, isRendering: fallbackLoading } = useLiquidRenderer();
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [fallbackCss, setFallbackCss] = useState<string>("");
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  // Trigger fallback on native failure or server-indicated fallback (auto mode only)
  useEffect(() => {
    if (mode === "auto" && !fallbackTriggeredRef.current) {
      // Server explicitly indicated fallback mode (password protection, etc.)
      if (native.shouldFallback) {
        fallbackTriggeredRef.current = true;
        setActiveMode("fallback");
        console.log("[Preview] Server indicated fallback:", native.error);
        return;
      }
      // Legacy: fallback on error
      if (native.error) {
        fallbackTriggeredRef.current = true;
        setActiveMode("fallback");
      }
    }
  }, [native.error, native.shouldFallback, mode]);

  // Run fallback renderer when in fallback mode
  useEffect(() => {
    if (activeMode !== "fallback") return;

    const runFallback = async () => {
      try {
        setFallbackError(null);
        const context = buildPreviewContext({ settingsResources: resources });
        const { html, css } = await fallbackRender(liquidCode, settings, blocks, context);
        setFallbackHtml(html);
        setFallbackCss(css);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Fallback render failed";
        console.error("[Preview] Fallback render error:", message);
        setFallbackError(message);
      }
    };

    // Debounce fallback render
    const timeout = setTimeout(runFallback, debounceMs);
    return () => clearTimeout(timeout);
  }, [activeMode, liquidCode, settings, blocks, resources, fallbackRender, debounceMs]);

  // Manual refetch
  const refetch = useCallback(() => {
    if (activeMode === "native") {
      native.refetch();
    } else {
      // Re-trigger fallback by clearing html
      setFallbackHtml(null);
    }
  }, [activeMode, native]);

  // Return appropriate result based on active mode
  if (activeMode === "native") {
    return {
      html: native.html,
      css: "",
      isLoading: native.isLoading,
      error: native.error,
      activeMode: "native",
      refetch: native.refetch,
    };
  }

  return {
    html: fallbackHtml,
    css: fallbackCss,
    isLoading: fallbackLoading,
    error: fallbackError,
    activeMode: "fallback",
    refetch,
  };
}
