// File: app/actions/settings/email/send-test-email.ts

"use server";

import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function sendTestEmail(recipientEmail: string) {
  try {
    const config = await db.emailConfiguration.findUnique({
      where: { id: "email_config" }
    });

    if (!config || !config.smtpUser || !config.smtpPassword) {
      return { success: false, error: "SMTP settings missing" };
    }

    // ============================================================
    // ✅ PLUGIN LOGIC (NO VERIFICATION NEEDED)
    // ============================================================
    
    // ১. মেইল আসলে যাবে তোমার জিমেইল থেকেই (যাতে গুগল না আটকায়)
    const actualSender = config.smtpUser; 

    // ২. কিন্তু কাস্টমার দেখবে মেইলের নাম "GoBike" বা তুমি যা সেট করেছ
    const senderName = config.senderName || "GoBike";

    // ৩. আর "Reply-To" হবে gobike@gobike.au (যদি সেটিংসে দেওয়া থাকে)
    const replyToAddress = config.senderEmail || config.smtpUser;

    const transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 587,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    // Branding Colors
    const bg = config.backgroundColor || "#f7f7f7";
    const bodyBg = config.bodyBackgroundColor || "#ffffff";
    const baseColor = config.baseColor || "#2271b1";

    await transporter.sendMail({
      // ✅ HERE IS THE TRICK:
      // মেইল যাবে: "GoBike <sharifulislam78009@gmail.com>"
      // হুবহু তোমার প্লাগিনের মতো
      from: `"${senderName}" <${actualSender}>`, 
      
      // কাস্টমার রিপ্লাই দিলে যাবে: gobike@gobike.au তে
      replyTo: replyToAddress,
      
      to: recipientEmail,
      subject: "GoBike SMTP Test Success",
      html: `
        <div style="background: ${bg}; padding: 40px; font-family: sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: ${bodyBg}; padding: 20px; border-radius: 8px;">
                ${config.headerImage ? `<img src="${config.headerImage}" width="150" style="display:block; margin: 0 auto 20px;" />` : ''}
                <h2 style="color: ${baseColor}; text-align: center;">It Works! 🎉</h2>
                <p style="text-align:center; color: #555;">This email is sent via ${actualSender} but replies will go to ${replyToAddress}.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">${config.footerText}</p>
            </div>
        </div>
      `
    });

    // Log Success
    await db.emailLog.create({
        data: {
            recipient: recipientEmail,
            subject: "GoBike SMTP Test Success",
            status: "SENT",
            templateSlug: "test_email"
        }
    });

    return { success: true, message: "Test email sent successfully!" };

  } catch (error: any) {
    console.error("SMTP_TEST_ERROR", error);
    await db.emailLog.create({
        data: {
            recipient: recipientEmail,
            subject: "Test Email Failed",
            status: "FAILED",
            errorMessage: error.message
        }
    });
    return { success: false, error: error.message };
  }
}