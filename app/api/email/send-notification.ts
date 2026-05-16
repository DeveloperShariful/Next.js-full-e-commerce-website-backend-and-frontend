// File: app/api/email/send-notification.ts

"use server";

import { db } from "@/lib/prisma";

interface NotificationPayload {
  trigger: string;      
  recipient: string;    
  channel?: "EMAIL" | "SMS" | "PUSH";
  data?: any;           
  orderId?: string;     
  userId?: string;     
  replyTo?: string; // <<< নতুন অপশন যুক্ত করা হলো >>>
}

export async function sendNotification({ 
  trigger, 
  recipient, 
  channel = "EMAIL", 
  data, 
  orderId, 
  userId,
  replyTo // <<< রিসিভ করা হলো >>>
}: NotificationPayload) {
  try {
    if (channel === "SMS") {
      console.log(`📲 [SMS QUEUE] To: ${recipient}, Trigger: ${trigger}`);
      return { success: true };
    }

    if (channel === "PUSH") {
      console.log(`🔔 [PUSH QUEUE] To: ${recipient}, Trigger: ${trigger}`);
      return { success: true };
    }

    const template = await db.emailTemplate.findUnique({
      where: { triggerEvent: trigger },
      select: { slug: true, isEnabled: true, recipientType: true }
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    if (!template.isEnabled) {
      return { success: false, error: "Template disabled" };
    }

    let finalRecipient = recipient;

    // =====================================================================
    // 🛑 FIX: BULLETPROOF ADMIN EMAIL ROUTING LOGIC (No Duplicate Emails)
    // =====================================================================
    if (template.recipientType === 'admin' && !finalRecipient) {
        const settings = await db.storeSettings.findUnique({
            where: { id: "settings" },
            select: { storeEmail: true }
        });
        
        const emailConfig = await db.emailConfiguration.findUnique({
            where: { id: "email_config" },
            select: { senderEmail: true }
        });
        
        const adminEmails = new Set<string>();

        if (settings?.storeEmail && settings.storeEmail.trim() !== '') {
            adminEmails.add(settings.storeEmail.trim().toLowerCase());
        }
        if (emailConfig?.senderEmail && emailConfig.senderEmail.trim() !== '') {
            adminEmails.add(emailConfig.senderEmail.trim().toLowerCase());
        }

        const uniqueEmails = Array.from(adminEmails);
        
        if (uniqueEmails.length === 0) {
            return { success: false, error: "No admin email configured" };
        }

        finalRecipient = uniqueEmails.join(", ");
    }

    // ডাটাবেসে কিউ (Queue) তৈরি
    await db.notificationQueue.create({
      data: {
        channel: "EMAIL",
        recipient: finalRecipient,
        templateSlug: template.slug, 
        content: "",
        status: "PENDING",
        attempts: 0,
        orderId: orderId || null,
        userId: userId || null,
        // <<< FIX: metadata এর ভেতরে হিডেনভাবে replyTo সেভ করা হচ্ছে >>>
        metadata: { ...(data || {}), _replyTo: replyTo || null }, 
      }
    });

    // ব্যাকগ্রাউন্ডে কিউ প্রসেসরকে কল করা হচ্ছে
    try {
        const isLocal = process.env.NODE_ENV === 'development';
        const fallbackUrl = isLocal ? "http://localhost:3000" : "https://gobike.au";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || fallbackUrl;
        
        fetch(`${appUrl}/api/email/process-email-queue`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        }).catch(err => console.error("Auto-trigger queue failed", err));
    } catch (e) {
        // Ignore trigger errors, cron will pick it up
    }

    return { success: true };

  } catch (error: any) {
    console.error("NOTIFICATION_ERROR", error);
    return { success: false, error: error.message };
  }
}