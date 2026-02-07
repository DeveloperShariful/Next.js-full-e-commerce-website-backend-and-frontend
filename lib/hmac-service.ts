//File: lib/hmac-service.ts

import crypto from "crypto";
const SECRET_KEY = process.env.AFFILIATE_WEBHOOK_SECRET || "fallback-secret-change-me-in-prod";

export const hmacService = {
  sign(payload: any): string {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
  },
  verify(payload: any, signature: string | null): boolean {
    if (!signature) {
       return false;
    }

    const expectedSignature = this.sign(payload);
    const sourceBuffer = Buffer.from(expectedSignature);
    const targetBuffer = Buffer.from(signature);

    if (sourceBuffer.length !== targetBuffer.length) {
      console.warn("HMAC: Signature length mismatch"); 
      return false;
    }

    const isValid = crypto.timingSafeEqual(sourceBuffer, targetBuffer);

    if (!isValid) {
       console.warn("HMAC: Invalid signature detected");
    }

    return isValid;
  },
  generateIdempotencyKey(scope: string, id: string): string {
    return `idemp_${scope}_${crypto.createHash('md5').update(id).digest('hex')}`;
  }
};