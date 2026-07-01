// app/actions/settings/payments/crypto.ts

import crypto from 'crypto';

// SECURITY: Must be set in .env. Never falls back to a default.
// Must be exactly 32 characters for AES-256.
function getEncryptionKey(): Buffer {
  const key = process.env.PAYMENT_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error(
      'PAYMENT_ENCRYPTION_KEY environment variable is missing or too short (must be ≥32 chars). Payment gateway secrets cannot be stored safely.'
    );
  }
  return Buffer.from(key.slice(0, 32));
}

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return text;
  // SECURITY: Never fall back to plaintext — throw so the caller knows encryption failed.
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return text;
  if (!text.includes(':')) return text;
  // SECURITY: Never fall back to ciphertext — throw so callers know decryption failed.
  const key = getEncryptionKey();
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Returns null if decryption fails (e.g. key rotation) — caller should treat as "secret lost, re-enter"
export function safeDecrypt(text: string): string | null {
  try {
    return decrypt(text);
  } catch {
    return null;
  }
}