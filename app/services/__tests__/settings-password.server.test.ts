// @jest-environment node
import crypto from "crypto";

// Store original env
const originalEnv = process.env;
const TEST_KEY = crypto.randomBytes(32).toString("hex");

// Mock Prisma
jest.mock("../../db.server", () => ({
  __esModule: true,
  default: {
    shopSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("SettingsService - Storefront Password", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, ENCRYPTION_KEY: TEST_KEY };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("saveStorefrontPassword", () => {
    it("should encrypt and save password", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.upsert as jest.Mock).mockResolvedValueOnce({
        shop: "test.myshopify.com",
        storefrontPassword: "encrypted-value",
      });

      await settingsService.saveStorefrontPassword(
        "test.myshopify.com",
        "my-password"
      );

      expect(prisma.shopSettings.upsert).toHaveBeenCalledWith({
        where: { shop: "test.myshopify.com" },
        update: {
          storefrontPassword: expect.any(String),
          passwordVerifiedAt: null,
        },
        create: {
          shop: "test.myshopify.com",
          storefrontPassword: expect.any(String),
        },
      });

      // Verify password is not stored as plaintext
      const call = (prisma.shopSettings.upsert as jest.Mock).mock.calls[0][0];
      expect(call.update.storefrontPassword).not.toBe("my-password");
    });

    it("should throw when encryption not configured", async () => {
      delete process.env.ENCRYPTION_KEY;
      jest.resetModules();
      const { settingsService } = await import("../settings.server");

      await expect(
        settingsService.saveStorefrontPassword(
          "test.myshopify.com",
          "password"
        )
      ).rejects.toThrow(/Encryption not configured/);
    });
  });

  describe("getStorefrontPassword", () => {
    it("should decrypt and return password", async () => {
      const { settingsService } = await import("../settings.server");
      const { encrypt } = await import("../encryption.server");
      const prisma = (await import("../../db.server")).default;

      const encryptedPassword = encrypt("my-secret-password");

      (prisma.shopSettings.findUnique as jest.Mock).mockResolvedValueOnce({
        storefrontPassword: encryptedPassword,
      });

      const result = await settingsService.getStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBe("my-secret-password");
    });

    it("should return null when no password stored", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.findUnique as jest.Mock).mockResolvedValueOnce({
        storefrontPassword: null,
      });

      const result = await settingsService.getStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBeNull();
    });

    it("should return null when settings not found", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await settingsService.getStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBeNull();
    });

    it("should return null when encryption not configured", async () => {
      delete process.env.ENCRYPTION_KEY;
      jest.resetModules();
      const { settingsService } = await import("../settings.server");

      const result = await settingsService.getStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBeNull();
    });
  });

  describe("markPasswordVerified", () => {
    it("should update passwordVerifiedAt timestamp", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.update as jest.Mock).mockResolvedValueOnce({
        shop: "test.myshopify.com",
        passwordVerifiedAt: new Date(),
      });

      await settingsService.markPasswordVerified("test.myshopify.com");

      expect(prisma.shopSettings.update).toHaveBeenCalledWith({
        where: { shop: "test.myshopify.com" },
        data: { passwordVerifiedAt: expect.any(Date) },
      });
    });
  });

  describe("clearStorefrontPassword", () => {
    it("should clear password and verification timestamp", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.update as jest.Mock).mockResolvedValueOnce({
        shop: "test.myshopify.com",
        storefrontPassword: null,
        passwordVerifiedAt: null,
      });

      await settingsService.clearStorefrontPassword("test.myshopify.com");

      expect(prisma.shopSettings.update).toHaveBeenCalledWith({
        where: { shop: "test.myshopify.com" },
        data: {
          storefrontPassword: null,
          passwordVerifiedAt: null,
        },
      });
    });
  });

  describe("hasStorefrontPassword", () => {
    it("should return true when password exists", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.findUnique as jest.Mock).mockResolvedValueOnce({
        storefrontPassword: "encrypted-value",
      });

      const result = await settingsService.hasStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBe(true);
    });

    it("should return false when password is null", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.findUnique as jest.Mock).mockResolvedValueOnce({
        storefrontPassword: null,
      });

      const result = await settingsService.hasStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBe(false);
    });

    it("should return false when settings not found", async () => {
      const { settingsService } = await import("../settings.server");
      const prisma = (await import("../../db.server")).default;

      (prisma.shopSettings.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await settingsService.hasStorefrontPassword(
        "test.myshopify.com"
      );

      expect(result).toBe(false);
    });
  });

  describe("Integration: save and retrieve", () => {
    it("should save and retrieve password correctly", async () => {
      const { settingsService } = await import("../settings.server");
      const { encrypt } = await import("../encryption.server");
      const prisma = (await import("../../db.server")).default;

      let storedPassword: string | null = null;

      // Mock save
      (prisma.shopSettings.upsert as jest.Mock).mockImplementation((args) => {
        storedPassword = args.update.storefrontPassword;
        return Promise.resolve({ shop: "test.myshopify.com" });
      });

      // Mock retrieve
      (prisma.shopSettings.findUnique as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ storefrontPassword: storedPassword });
      });

      // Save password
      await settingsService.saveStorefrontPassword(
        "test.myshopify.com",
        "super-secret"
      );

      // Retrieve password
      const retrieved = await settingsService.getStorefrontPassword(
        "test.myshopify.com"
      );

      expect(retrieved).toBe("super-secret");
    });
  });
});
