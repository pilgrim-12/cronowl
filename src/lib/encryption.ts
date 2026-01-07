// AES-256 encryption for sensitive data (headers, body)
// Uses Web Crypto API for cross-platform compatibility

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Get encryption key from environment variable
 * Key should be 32 bytes (256 bits) base64 encoded
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("ENCRYPTION_KEY not set - sensitive data will not be encrypted");
    return "";
  }
  return key;
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Import encryption key for Web Crypto API
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBytes = base64ToBytes(keyBase64);
  return crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string value
 * Returns base64 encoded: IV + ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const keyBase64 = getEncryptionKey();

  // If no key, return plaintext (development mode)
  if (!keyBase64) {
    return plaintext;
  }

  try {
    const key = await importKey(keyBase64);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encode plaintext to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64 with prefix to identify encrypted data
    return "enc:" + bytesToBase64(combined);
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a string value
 * Expects base64 encoded: IV + ciphertext
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const keyBase64 = getEncryptionKey();

  // If no key or not encrypted, return as-is
  if (!keyBase64 || !ciphertext.startsWith("enc:")) {
    return ciphertext;
  }

  try {
    const key = await importKey(keyBase64);

    // Remove prefix and decode base64
    const combined = base64ToBytes(ciphertext.slice(4));

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedData
    );

    // Decode to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt headers object
 */
export async function encryptHeaders(
  headers: Record<string, string>
): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    // Only encrypt sensitive header values
    const lowerKey = key.toLowerCase();
    const isSensitive =
      lowerKey.includes("authorization") ||
      lowerKey.includes("api-key") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("password") ||
      lowerKey.includes("cookie");

    if (isSensitive) {
      encrypted[key] = await encrypt(value);
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted;
}

/**
 * Decrypt headers object
 */
export async function decryptHeaders(
  headers: Record<string, string>
): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (value.startsWith("enc:")) {
      decrypted[key] = await decrypt(value);
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted;
}

/**
 * Encrypt request body if it contains sensitive data
 */
export async function encryptBody(body: string): Promise<string> {
  if (!body) return body;

  // Always encrypt body as it may contain credentials
  return encrypt(body);
}

/**
 * Decrypt request body
 */
export async function decryptBody(body: string): Promise<string> {
  if (!body) return body;

  if (body.startsWith("enc:")) {
    return decrypt(body);
  }

  return body;
}

/**
 * Check if encryption is available
 */
export function isEncryptionEnabled(): boolean {
  return !!getEncryptionKey();
}

/**
 * Generate a new encryption key (for initial setup)
 * Returns base64 encoded 256-bit key
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64(key);
}
