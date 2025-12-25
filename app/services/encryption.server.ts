import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encryption service for secure password storage using AES-256-GCM
 * - Authenticated encryption (integrity + confidentiality)
 * - Unique IV per encryption for security
 * - Key stored in ENCRYPTION_KEY environment variable
 */

/**
 * Encrypt plaintext using AES-256-GCM
 * Output format: base64(IV + ciphertext + authTag)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString("base64");
}

/**
 * Decrypt AES-256-GCM encrypted data
 * Input format: base64(IV + ciphertext + authTag)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(-AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, -AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Check if encryption key is configured
 */
export function isEncryptionConfigured(): boolean {
  const keyHex = process.env.ENCRYPTION_KEY;
  return typeof keyHex === "string" && keyHex.length === 64;
}

/**
 * Get encryption key from environment
 * Throws if key is missing or invalid
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 bytes (64 hex chars). " +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(keyHex, "hex");
}
