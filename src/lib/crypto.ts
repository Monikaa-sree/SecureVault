/**
 * Client-side AES-GCM encryption/decryption using Web Crypto API.
 * The user's secret key is used to derive a CryptoKey via PBKDF2.
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100_000;

/** Convert a Uint8Array to a plain ArrayBuffer (avoids SharedArrayBuffer issues). */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(arr);
  return buf;
}

async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(rawKey),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a File, returning an encrypted Blob. Format: [salt(16)][iv(12)][ciphertext] */
export async function encryptFile(file: File, secret: string): Promise<Blob> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(secret, salt);

  const plaintext = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    plaintext
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return new Blob([toArrayBuffer(combined)], { type: "application/octet-stream" });
}

/** Decrypt an encrypted Blob back to a Blob with the original mime type. */
export async function decryptFile(
  encryptedBlob: Blob,
  secret: string,
  mimeType: string
): Promise<Blob> {
  const raw = new Uint8Array(await encryptedBlob.arrayBuffer());

  const salt = raw.slice(0, SALT_LENGTH);
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(secret, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(ciphertext)
  );

  return new Blob([plaintext], { type: mimeType || "application/octet-stream" });
}
