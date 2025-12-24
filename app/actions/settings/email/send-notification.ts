// File: app/actions/utils/send-notification.ts

"use server";

import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import { generateEmailHtml } from "./email-generator"; 

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
    
    // ✅ FIX 1: Cast options to 'any' to solve 'host does not exist' error
    const transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 587,
      secure: config.encryption === 'ssl',
      auth: { user: config.smtpUser, pass: config.smtpPassword },
      tls: {
        rejectUnauthorized: false // Helps with some self-signed cert issues
      }
    } as any);

    let finalRecipient = recipient;
    if (template.recipientType === 'admin') {
        finalRecipient = template.customRecipients || config.senderEmail;
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
        // ✅ FIX 2: Cast info to 'any' for Prisma Json field
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