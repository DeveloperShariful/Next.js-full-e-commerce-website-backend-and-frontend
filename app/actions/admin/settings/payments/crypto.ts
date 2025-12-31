// app/actions/settings/payments/crypto.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'default-32-char-key-must-change-it'; 
const IV_LENGTH = 16; // AES ব্লকের জন্য

export function encrypt(text: string): string {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error("Encryption Error:", error);

    return text;
  }
}

export function decrypt(text: string): string {
  if (!text) return text;
  
  if (!text.includes(':')) return text;

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption Error:", error);
    return text;
  }
}