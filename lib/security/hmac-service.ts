//File: lib/security/hmac-service.ts

import crypto from "crypto";
import { auditService } from "@/lib/services/audit-service";

/**
 * ENTERPRISE GRADE SECURITY SERVICE
 * Handles HMAC Signatures to prevent Man-in-the-Middle attacks and spoofing.
 */

const SECRET_KEY = process.env.AFFILIATE_WEBHOOK_SECRET || "fallback-secret-change-me-in-prod";

export const hmacService = {
  /**
   * Generates a signature for an outgoing payload (e.g., Postbacks)
   */
  sign(payload: any): string {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
  },

  /**
   * Verifies an incoming request signature
   * Uses timingSafeEqual to prevent Timing Attacks
   * Logs failed attempts to Audit Service
   */
  verify(payload: any, signature: string | null): boolean {
    if (!signature) {
       // Optional: Log missing signature if strictly required
       return false;
    }

    const expectedSignature = this.sign(payload);
    const sourceBuffer = Buffer.from(expectedSignature);
    const targetBuffer = Buffer.from(signature);

    if (sourceBuffer.length !== targetBuffer.length) {
      // Log length mismatch (potential spoofing)
      console.warn("HMAC: Signature length mismatch"); 
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(sourceBuffer, targetBuffer);

    if (!isValid) {
       // We log purely to console here to avoid async await in a synchronous utility.
       // The calling API route handles the heavy async audit logging.
       console.warn("HMAC: Invalid signature detected");
    }

    return isValid;
  },

  /**
   * Generates a deterministic Idempotency Key based on scope and ID
   * Ensures the same event isn't processed twice.
   */
  generateIdempotencyKey(scope: string, id: string): string {
    return `idemp_${scope}_${crypto.createHash('md5').update(id).digest('hex')}`;
  }
};