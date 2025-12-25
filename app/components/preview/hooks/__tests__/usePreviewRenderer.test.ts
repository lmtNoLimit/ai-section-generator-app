/**
 * Tests for usePreviewRenderer hook
 * Verifies fallback behavior from native to LiquidJS rendering
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { usePreviewRenderer } from "../usePreviewRenderer";

// Mock the native preview renderer
jest.mock("../useNativePreviewRenderer", () => ({
  useNativePreviewRenderer: jest.fn(),
}));

// Mock the LiquidJS renderer
jest.mock("../useLiquidRenderer", () => ({
  useLiquidRenderer: jest.fn(),
}));

// Mock buildPreviewContext
jest.mock("../../utils/buildPreviewContext", () => ({
  buildPreviewContext: jest.fn(() => ({ shop: {} })),
}));

import { useNativePreviewRenderer } from "../useNativePreviewRenderer";
import { useLiquidRenderer } from "../useLiquidRenderer";

describe("usePreviewRenderer", () => {
  const mockNativeRenderer = useNativePreviewRenderer as jest.Mock;
  const mockLiquidRenderer = useLiquidRenderer as jest.Mock;
  const mockRender = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mock implementations
    mockNativeRenderer.mockReturnValue({
      html: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockLiquidRenderer.mockReturnValue({
      render: mockRender,
      isRendering: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("mode selection", () => {
    it("should default to native mode when shopDomain provided", () => {
      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
          mode: "auto",
        })
      );

      expect(result.current.activeMode).toBe("native");
    });

    it("should use fallback mode when explicitly set", () => {
      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
          mode: "fallback",
        })
      );

      expect(result.current.activeMode).toBe("fallback");
    });

    it("should start with native mode in auto mode", () => {
      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
        })
      );

      expect(result.current.activeMode).toBe("native");
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
      expect(result.current.activeMode).toBe("native");
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
          mode: "native",
        })
      );

      expect(result.current.error).toBe("Network error");
    });
  });

  describe("automatic fallback", () => {
    it("should switch to fallback mode on native error in auto mode", async () => {
      // Start with error
      mockNativeRenderer.mockReturnValue({
        html: null,
        isLoading: false,
        error: "Connection failed",
        refetch: mockRefetch,
      });

      mockRender.mockResolvedValue({
        html: "<div>Fallback Content</div>",
        css: ".fallback { color: red; }",
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
          mode: "auto",
          debounceMs: 100,
        })
      );

      // Wait for fallback to trigger
      await waitFor(() => {
        expect(result.current.activeMode).toBe("fallback");
      });
    });

    it("should NOT switch to fallback in native-only mode", () => {
      mockNativeRenderer.mockReturnValue({
        html: null,
        isLoading: false,
        error: "Connection failed",
        refetch: mockRefetch,
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
          mode: "native",
        })
      );

      // Should stay in native mode despite error
      expect(result.current.activeMode).toBe("native");
      expect(result.current.error).toBe("Connection failed");
    });
  });

  describe("fallback rendering", () => {
    it("should call LiquidJS render when in fallback mode", async () => {
      mockRender.mockResolvedValue({
        html: "<div>LiquidJS Output</div>",
        css: "",
      });

      renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>{{ shop.name }}</p>",
          mode: "fallback",
          debounceMs: 100,
        })
      );

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });
    });

    it("should return CSS from fallback renderer", async () => {
      mockRender.mockResolvedValue({
        html: "<div>Content</div>",
        css: ".my-class { color: blue; }",
      });

      const { result } = renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          mode: "fallback",
          debounceMs: 100,
        })
      );

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(result.current.css).toBe(".my-class { color: blue; }");
      });
    });
  });

  describe("enabled flag forwarding", () => {
    it("should disable native renderer when in fallback mode", () => {
      renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
          mode: "fallback",
        })
      );

      // Check that useNativePreviewRenderer was called with enabled: false
      expect(mockNativeRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it("should enable native renderer when shopDomain provided and mode is native", () => {
      renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          shopDomain: "test.myshopify.com",
          mode: "native",
        })
      );

      expect(mockNativeRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          shopDomain: "test.myshopify.com",
        })
      );
    });

    it("should disable native renderer when no shopDomain", () => {
      renderHook(() =>
        usePreviewRenderer({
          liquidCode: "<p>Test</p>",
          mode: "auto",
        })
      );

      expect(mockNativeRenderer).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe("refetch", () => {
    it("should call native refetch when in native mode", () => {
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

      act(() => {
        result.current.refetch();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
