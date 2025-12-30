// File: app/actions/admin/email/send-notification.ts

"use server";

import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateEmailHtml } from "./email-generator"; // Ensure this path is correct relative to this file

interface EmailPayload {
  trigger: string;
  recipient: string;
  data: any; 
  orderId?: string; 
}

export async function sendNotification({ trigger, recipient, data, orderId }: EmailPayload) {
  try {
    const config = await db.emailConfiguration.findUnique({ where: { id: "email_config" } });
    if (!config || !config.isActive) return { success: false, error: "Email disabled" };

    const template = await db.emailTemplate.findUnique({ where: { triggerEvent: trigger } });
    if (!template || !template.isEnabled) return { success: false, error: "Template disabled" };

    // --- HTML GENERATION LOGIC ---
    let htmlBody = "";
    let subject = template.subject;

    // ১. যদি Order ID থাকে
    if (orderId) {
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { items: true, user: true }
        });

        if (order) {
            htmlBody = generateEmailHtml({ order, config, template });
            
            subject = subject.replace(/{order_number}/g, order.orderNumber)
                             .replace(/{customer_name}/g, order.user?.name || "Customer");
        }
    } 
    
    // ২. যদি Order ID না থাকে (Normal Email)
    if (!htmlBody) {
        let content = template.content;
        Object.keys(data).forEach((key) => {
            const regex = new RegExp(`{${key}}`, "g");
            content = content.replace(regex, String(data[key] || ""));
            subject = subject.replace(regex, String(data[key] || ""));
        });
        
        // Simple Wrapper
        htmlBody = `
            <div style="background:${config.backgroundColor}; padding:40px; font-family:Arial;">
                <div style="max-width:600px; margin:0 auto; background:${config.bodyBackgroundColor}; padding:30px; border-radius:8px;">
                    ${config.headerImage ? `<img src="${config.headerImage}" width="150" style="display:block; margin:0 auto 20px;">` : ''}
                    ${template.heading ? `<h2 style="color:${config.baseColor};">${template.heading}</h2>` : ''}
                    ${content}
                    <div style="margin-top:20px; font-size:12px; color:#999; text-align:center;">${config.footerText}</div>
                </div>
            </div>
        `;
    }

    // --- SENDING LOGIC ---
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 587,
      secure: config.encryption === 'ssl',
      auth: { user: config.smtpUser, pass: config.smtpPassword },
      tls: {
        rejectUnauthorized: false
      }
    } as any);

    let finalRecipient = recipient;

    // ✅ UPDATE: Admin Email Logic Added Here
    // যদি টেমপ্লেট অ্যাডমিনের জন্য হয়, তাহলে StoreSettings থেকে মেইল আনবে
    if (template.recipientType === 'admin') {
        const storeSettings = await db.storeSettings.findUnique({ 
            where: { id: "settings" },
            select: { storeEmail: true }
        });
        
        // স্টোর ইমেইল না পেলে কনফিগারের সেন্ডার ইমেইল ব্যবহার হবে
        finalRecipient = storeSettings?.storeEmail || config.senderEmail;
    }

    const info = await transporter.sendMail({
      from: `"${config.senderName}" <${config.senderEmail}>`,
      to: finalRecipient,
      cc: template.cc,
      bcc: template.bcc,
      subject: subject,
      html: htmlBody,
    });

    await db.emailLog.create({
      data: {
        recipient: finalRecipient,
        subject: subject,
        templateSlug: template.slug,
        status: "SENT",
        orderId: orderId || null,
        metadata: info as any 
      }
    });

    return { success: true };

  } catch (error: any) {
    console.error("EMAIL_ERROR", error);
    await db.emailLog.create({
      data: {
        recipient, 
        subject: `Error: ${trigger}`, 
        status: "FAILED", 
        errorMessage: error.message
      }
    });
    return { success: false, error: error.message };
  }
}