// File: app/actions/admin/email/send-notification.ts

"use server";

import { db } from "@/lib/prisma";

interface EmailPayload {
  trigger: string;      
  recipient: string;    
  data?: any;           
  orderId?: string;     
  userId?: string;     
}

export async function sendNotification({ trigger, recipient, data, orderId, userId }: EmailPayload) {
  try {
    console.log(`📥 [QUEUE] Adding email to queue: ${trigger} for ${recipient}`);

    // ১. ডাটাবেস থেকে টেমপ্লেট চেক করা (Optional validation)
    const template = await db.emailTemplate.findUnique({
      where: { triggerEvent: trigger },
      select: { slug: true, isEnabled: true }
    });

    if (!template) {
      console.warn(`⚠️ [QUEUE SKIPPED] No template found for trigger: ${trigger}`);
      return { success: false, error: "Template not found" };
    }

    if (!template.isEnabled) {
      console.log(`ℹ️ [QUEUE SKIPPED] Template is disabled: ${trigger}`);
      return { success: false, error: "Template disabled" };
    }

    // ২. Queue তে ডাটা ইনসার্ট করা
    await db.notificationQueue.create({
      data: {
        channel: "EMAIL",
        recipient: recipient,
        templateSlug: template.slug, 
        content: "",
        status: "PENDING",
        attempts: 0,
        orderId: orderId || null,
        userId: userId || null,
        metadata: data || {}, 
      }
    });

    console.log(`✅ [QUEUE SUCCESS] Email queued successfully.`);
    return { success: true };

  } catch (error: any) {
    console.error("🔥 [QUEUE ERROR]", error);
    return { success: false, error: error.message };
  }
}