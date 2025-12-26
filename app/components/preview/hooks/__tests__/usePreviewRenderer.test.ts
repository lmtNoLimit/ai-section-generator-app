/**
 * Tests for usePreviewRenderer hook
 * Verifies native-only rendering behavior
 */

import { renderHook } from "@testing-library/react";
import { usePreviewRenderer } from "../usePreviewRenderer";

// Mock the native preview renderer
jest.mock("../useNativePreviewRenderer", () => ({
  useNativePreviewRenderer: jest.fn(),
}));

import { useNativePreviewRenderer } from "../useNativePreviewRenderer";

describe("usePreviewRenderer", () => {
  const mockNativeRenderer = useNativePreviewRenderer as jest.Mock;
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockNativeRenderer.mockReturnValue({
      html: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  describe("native rendering", () => {
    it("should return native html when available", () => {
      mockNativeRenderer.mockReturnValue({
        html: "<div>Native Content</div>",
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
        })
      );

      expect(result.current.html).toBe("<div>Native Content</div>");
    });

    it("should pass loading state from native renderer", () => {
      mockNativeRenderer.mockReturnValue({
        html: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
        })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should pass error from native renderer", () => {
      mockNativeRenderer.mockReturnValue({
        html: null,
        isLoading: false,
        error: "Network error",
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
        })
      );

      expect(result.current.error).toBe("Network error");
    });
  });

  describe("parameter forwarding", () => {
    it("should forward all parameters to native renderer", () => {
      const options = {
        liquidCode: "<p>{{ shop.name }}</p>",
        settings: { color: "red" },
        blocks: [{ id: "1", type: "text", settings: {} }],
        resources: {},
        shopDomain: "test.myshopify.com",
        debounceMs: 500,
      };

      renderHook(() => usePreviewRenderer(options));

      expect(mockNativeRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          liquidCode: options.liquidCode,
          settings: options.settings,
          blocks: options.blocks,
          resources: options.resources,
          shopDomain: options.shopDomain,
          debounceMs: options.debounceMs,
          enabled: true,
        })
      );
    });

    it("should use default debounceMs of 600", () => {
      renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
        })
      );

      expect(mockNativeRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceMs: 600,
        })
      );
    });
  });

  describe("refetch", () => {
    it("should call native refetch", () => {
      mockNativeRenderer.mockReturnValue({
        html: "<div>Content</div>",
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
        })
      );

      result.current.refetch();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
