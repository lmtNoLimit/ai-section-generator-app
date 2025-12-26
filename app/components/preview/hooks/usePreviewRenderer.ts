/**
 * Preview Renderer Hook - Native Only
 * Renders Liquid via App Proxy (Shopify's native engine)
 */

import { useNativePreviewRenderer } from "./useNativePreviewRenderer";
import type { SettingsState, BlockInstance } from "../schema/SchemaTypes";
import type { MockProduct, MockCollection } from "../mockData/types";

interface UsePreviewRendererOptions {
  liquidCode: string;
  settings?: SettingsState;
  blocks?: BlockInstance[];
  resources?: Record<string, MockProduct | MockCollection>;
  shopDomain: string;
  debounceMs?: number;
}

interface PreviewResult {
  html: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Renders Liquid code via App Proxy (native Shopify engine)
 */
export function usePreviewRenderer({
  liquidCode,
  settings = {},
  blocks = [],
  resources = {},
  shopDomain,
  debounceMs = 600,
}: UsePreviewRendererOptions): PreviewResult {
  const { html, isLoading, error, refetch } = useNativePreviewRenderer({
    liquidCode,
    settings,
    blocks,
    resources,
    shopDomain,
    debounceMs,
    enabled: true,
  });

  return { html, isLoading, error, refetch };
}
