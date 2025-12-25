// @jest-environment node
import crypto from "crypto";

// Store original env
const originalEnv = process.env;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock settings service
jest.mock("../settings.server", () => ({
  settingsService: {
    getStorefrontPassword: jest.fn(),
    saveStorefrontPassword: jest.fn(),
    markPasswordVerified: jest.fn(),
    clearStorefrontPassword: jest.fn(),
  },
}));

describe("StorefrontAuthService", () => {
  const TEST_KEY = crypto.randomBytes(32).toString("hex");
  const TEST_SHOP = "test-shop.myshopify.com";
  const TEST_PASSWORD = "test-password-123";

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, ENCRYPTION_KEY: TEST_KEY };
    mockFetch.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("authenticateStorefront", () => {
    it("should return success with cookies on 302 redirect", async () => {
      const { authenticateStorefront } = await import(
        "../storefront-auth.server"
      );

      // Mock successful auth response with Set-Cookie headers
      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => [
            "_shopify_essential=abc123; Path=/; Secure; HttpOnly",
            "_shopify_s=xyz789; Path=/; Secure",
          ],
          get: () => null,
        },
      });

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.success).toBe(true);
      expect(result.cookies).toContain("_shopify_essential=abc123");
      expect(result.cookies).toContain("_shopify_s=xyz789");
      expect(result.error).toBeUndefined();
    });

    it("should return failure on 200 response (password invalid)", async () => {
      const { authenticateStorefront } = await import(
        "../storefront-auth.server"
      );

      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          getSetCookie: () => [],
          get: () => null,
        },
      });

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.success).toBe(false);
      expect(result.cookies).toBeNull();
      expect(result.error).toBe("Invalid storefront password");
    });

    it("should handle network errors gracefully", async () => {
      const { authenticateStorefront } = await import(
        "../storefront-auth.server"
      );

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.success).toBe(false);
      expect(result.cookies).toBeNull();
      expect(result.error).toBe("Network error");
    });

    it("should send correct POST body", async () => {
      const { authenticateStorefront } = await import(
        "../storefront-auth.server"
      );

      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          getSetCookie: () => [],
          get: () => null,
        },
      });

      await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://${TEST_SHOP}/password`,
        expect.objectContaining({
          method: "POST",
          redirect: "manual",
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        })
      );

      // Verify body contains required fields
      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body.toString();
      expect(body).toContain("password=test-password-123");
      expect(body).toContain("form_type=storefront_password");
    });

    it("should use redirect: manual to capture cookies", async () => {
      const { authenticateStorefront } = await import(
        "../storefront-auth.server"
      );

      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          getSetCookie: () => [],
          get: () => null,
        },
      });

      await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          redirect: "manual",
        })
      );
    });
  });

  describe("cookie caching", () => {
    it("should cache cookies after successful auth", async () => {
      const { authenticateStorefront, getStorefrontCookies } = await import(
        "../storefront-auth.server"
      );

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=cached123; Path=/"],
          get: () => null,
        },
      });

      await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      // Second call should use cache, not fetch
      const cookies = await getStorefrontCookies(TEST_SHOP, TEST_PASSWORD);

      expect(cookies).toContain("_shopify_essential=cached123");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should re-authenticate when cache expires", async () => {
      jest.useFakeTimers();

      const { authenticateStorefront, getStorefrontCookies, clearCookieCache } =
        await import("../storefront-auth.server");

      // Clear any existing cache
      clearCookieCache(TEST_SHOP);

      // First auth
      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=first123; Path=/"],
          get: () => null,
        },
      });

      await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      // Advance time past TTL (30 minutes)
      jest.advanceTimersByTime(31 * 60 * 1000);

      // Setup second auth
      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=second456; Path=/"],
          get: () => null,
        },
      });

      const cookies = await getStorefrontCookies(TEST_SHOP, TEST_PASSWORD);

      expect(cookies).toContain("_shopify_essential=second456");
      expect(mockFetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it("should clear cache for shop", async () => {
      const {
        authenticateStorefront,
        getStorefrontCookies,
        clearCookieCache,
      } = await import("../storefront-auth.server");

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=toclear; Path=/"],
          get: () => null,
        },
      });

      await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);
      clearCookieCache(TEST_SHOP);

      // Should fetch again after cache clear
      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=newcookie; Path=/"],
          get: () => null,
        },
      });

      const cookies = await getStorefrontCookies(TEST_SHOP, TEST_PASSWORD);

      expect(cookies).toContain("_shopify_essential=newcookie");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("validateStorefrontPassword", () => {
    it("should return true for valid password", async () => {
      const { validateStorefrontPassword, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=valid; Path=/"],
          get: () => null,
        },
      });

      const isValid = await validateStorefrontPassword(TEST_SHOP, TEST_PASSWORD);

      expect(isValid).toBe(true);
    });

    it("should return false for invalid password", async () => {
      const { validateStorefrontPassword, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          getSetCookie: () => [],
          get: () => null,
        },
      });

      const isValid = await validateStorefrontPassword(
        TEST_SHOP,
        "wrong-password"
      );

      expect(isValid).toBe(false);
    });
  });

  describe("getAuthenticatedCookiesForShop", () => {
    it("should return null when no password configured", async () => {
      const { settingsService } = await import("../settings.server");
      const { getAuthenticatedCookiesForShop, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      (settingsService.getStorefrontPassword as jest.Mock).mockResolvedValueOnce(
        null
      );

      const cookies = await getAuthenticatedCookiesForShop(TEST_SHOP);

      expect(cookies).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should authenticate and return cookies when password exists", async () => {
      const { settingsService } = await import("../settings.server");
      const { getAuthenticatedCookiesForShop, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      (settingsService.getStorefrontPassword as jest.Mock).mockResolvedValueOnce(
        TEST_PASSWORD
      );

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_essential=fromstore; Path=/"],
          get: () => null,
        },
      });

      const cookies = await getAuthenticatedCookiesForShop(TEST_SHOP);

      expect(cookies).toContain("_shopify_essential=fromstore");
    });
  });

  describe("cookie extraction", () => {
    it("should extract cookie name=value before semicolon", async () => {
      const { authenticateStorefront, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => [
            "_shopify_essential=abc; Path=/; Secure; HttpOnly; SameSite=Lax",
          ],
          get: () => null,
        },
      });

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.cookies).toBe("_shopify_essential=abc");
    });

    it("should join multiple cookies with semicolon and space", async () => {
      const { authenticateStorefront, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => [
            "_shopify_essential=abc; Path=/",
            "_shopify_s=def; Path=/",
            "_fd=ghi; Path=/",
          ],
          get: () => null,
        },
      });

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.cookies).toBe(
        "_shopify_essential=abc; _shopify_s=def; _fd=ghi"
      );
    });

    it("should fall back to get() when getSetCookie not available", async () => {
      const { authenticateStorefront, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: undefined, // Not available in all runtimes
          get: (name: string) =>
            name === "set-cookie" ? "_shopify_essential=fallback; Path=/" : null,
        },
      });

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.cookies).toBe("_shopify_essential=fallback");
    });

    it("should warn but still return cookies without _shopify_essential", async () => {
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const { authenticateStorefront, clearCookieCache } = await import(
        "../storefront-auth.server"
      );
      clearCookieCache(TEST_SHOP);

      mockFetch.mockResolvedValueOnce({
        status: 302,
        headers: {
          getSetCookie: () => ["_shopify_s=only_this; Path=/"],
          get: () => null,
        },
      });

      const result = await authenticateStorefront(TEST_SHOP, TEST_PASSWORD);

      expect(result.success).toBe(true);
      expect(result.cookies).toBe("_shopify_s=only_this");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("_shopify_essential cookie not found")
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
