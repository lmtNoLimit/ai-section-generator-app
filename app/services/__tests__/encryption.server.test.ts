// @jest-environment node
import crypto from "crypto";

// Store original env
const originalEnv = process.env;

describe("EncryptionService", () => {
  // Valid 32-byte key (64 hex chars)
  const TEST_KEY = crypto.randomBytes(32).toString("hex");

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, ENCRYPTION_KEY: TEST_KEY };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("encrypt/decrypt", () => {
    it("should encrypt and decrypt a string correctly", async () => {
      const { encrypt, decrypt } = await import("../encryption.server");
      const plaintext = "my-secret-password";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same input (unique IV)", async () => {
      const { encrypt } = await import("../encryption.server");
      const plaintext = "password123";

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty string", async () => {
      const { encrypt, decrypt } = await import("../encryption.server");
      const plaintext = "";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", async () => {
      const { encrypt, decrypt } = await import("../encryption.server");
      const plaintext = "password123!@#$%^&*()_+-=[]{}|;':\",./<>?";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", async () => {
      const { encrypt, decrypt } = await import("../encryption.server");
      const plaintext = "x".repeat(1000);

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should output base64 encoded string", async () => {
      const { encrypt } = await import("../encryption.server");
      const plaintext = "test";

      const encrypted = encrypt(plaintext);

      // Validate base64 format
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
      expect(Buffer.from(encrypted, "base64").toString("base64")).toBe(
        encrypted
      );
    });
  });

  describe("decrypt error handling", () => {
    it("should throw on tampered ciphertext", async () => {
      const { encrypt, decrypt } = await import("../encryption.server");
      const plaintext = "secret";

      const encrypted = encrypt(plaintext);
      // Tamper with the encrypted data
      const tampered =
        Buffer.from(encrypted, "base64")[0] === 0
          ? "AQ" + encrypted.slice(2)
          : "AA" + encrypted.slice(2);

      expect(() => decrypt(tampered)).toThrow();
    });

    it("should throw on invalid base64 input", async () => {
      const { decrypt } = await import("../encryption.server");

      expect(() => decrypt("!!!not-base64!!!")).toThrow();
    });

    it("should throw on truncated ciphertext", async () => {
      const { encrypt, decrypt } = await import("../encryption.server");
      const plaintext = "secret";

      const encrypted = encrypt(plaintext);
      const truncated = encrypted.slice(0, 10);

      expect(() => decrypt(truncated)).toThrow();
    });
  });

  describe("isEncryptionConfigured", () => {
    it("should return true when valid key is set", async () => {
      const { isEncryptionConfigured } = await import("../encryption.server");

      expect(isEncryptionConfigured()).toBe(true);
    });

    it("should return false when key is missing", async () => {
      delete process.env.ENCRYPTION_KEY;
      jest.resetModules();
      const { isEncryptionConfigured } = await import("../encryption.server");

      expect(isEncryptionConfigured()).toBe(false);
    });

    it("should return false when key is too short", async () => {
      process.env.ENCRYPTION_KEY = "abc123";
      jest.resetModules();
      const { isEncryptionConfigured } = await import("../encryption.server");

      expect(isEncryptionConfigured()).toBe(false);
    });

    it("should return false when key is too long", async () => {
      process.env.ENCRYPTION_KEY = "a".repeat(128);
      jest.resetModules();
      const { isEncryptionConfigured } = await import("../encryption.server");

      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe("getEncryptionKey validation", () => {
    it("should throw descriptive error when key is missing", async () => {
      delete process.env.ENCRYPTION_KEY;
      jest.resetModules();
      const { encrypt } = await import("../encryption.server");

      expect(() => encrypt("test")).toThrow(
        /ENCRYPTION_KEY must be 32 bytes/
      );
    });

    it("should throw when key is wrong length", async () => {
      process.env.ENCRYPTION_KEY = "too-short";
      jest.resetModules();
      const { encrypt } = await import("../encryption.server");

      expect(() => encrypt("test")).toThrow(
        /ENCRYPTION_KEY must be 32 bytes/
      );
    });
  });
});
