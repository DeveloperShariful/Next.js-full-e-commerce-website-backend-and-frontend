// File: app/actions/settings/email/send-test-email.ts

"use server";

import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateEmailHtml } from "./email-generator";

export async function sendTestEmail(recipientEmail: string, templateId?: string) {
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

    // Template-based email or fallback simple test
    let emailSubject = "GoBike SMTP Test Success";
    let emailHtml: string;

    if (templateId) {
      const template = await db.emailTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        emailSubject = `[TEST] ${template.subject || template.name}`;
        const triggerEvent = template.triggerEvent ?? '';
        const nonOrderTriggers = ['WARRANTY','PASSWORD_RESET','NEWSLETTER_SUBSCRIPTION','CONTACT_FORM','AFFILIATE','COMMISSION','KYC','REFERRAL','PAYOUT','TIER','FRAUD'];
        const isOrderTemplate = !nonOrderTriggers.some(t => triggerEvent.includes(t));

        const sampleOrder = isOrderTemplate ? {
          orderNumber: '19809', total: 1005.65, subtotal: 999.00, shippingTotal: 6.65,
          discountTotal: 0, taxTotal: 0, refundedAmount: 0,
          paymentMethod: 'afterpay_clearpay', shippingMethod: 'Couriers Please (1 Day) Dis-50%',
          currency: '$', createdAt: new Date(),
          items: [{ productName: 'GoBike 12 Inch Ebike for Kids', sku: 'GOBIKE 12"', variantName: null, quantity: 1, price: 999.00 }],
          billingAddress: { firstName: 'Benson', lastName: 'Toms', address1: '18 Ellsworth Drive', city: 'TREGEAR', state: 'New South Wales', postcode: '2770', country: 'AU', phone: '0483821059', email: 'bensontoms89@gmail.com' },
          shippingAddress: { firstName: 'Benson', lastName: 'Toms', address1: '18 Ellsworth Drive', city: 'TREGEAR', state: 'New South Wales', postcode: '2770', country: 'AU' },
          user: { name: 'Benson Toms', email: 'bensontoms89@gmail.com' },
          guestEmail: null, shippingTrackingNumber: 'CON123456789',
          shippingTrackingUrl: 'https://tracking.couriersplease.com.au/track/CON123456789',
          shippingProvider: 'Couriers Please',
        } : null;

        const sampleMetadata = {
          customer_name: 'Benson Toms', order_number: '19809', shop_purchased: 'GoBike Australia',
          description: 'Battery not charging.', replacement_part: 'Battery Pack (48V)',
          tracking_number: 'CON123456789', tracking_url: 'https://tracking.couriersplease.com.au',
          courier: 'COURIERS PLEASE', claim_id: 'test-claim-123',
          reset_link: 'https://gobike.au/reset-password?token=test-token',
          message: 'Test message from contact form.', customer_email: recipientEmail,
          customer_phone: '0483 821 059',
        };

        emailHtml = generateEmailHtml({ order: sampleOrder, config, template, metadata: sampleMetadata });
      } else {
        emailHtml = buildSimpleTestHtml(config);
      }
    } else {
      emailHtml = buildSimpleTestHtml(config);
    }

    await transporter.sendMail({
      from: `"${senderName}" <${actualSender}>`,
      replyTo: replyToAddress,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    // Log Success
    await db.emailLog.create({
        data: {
            recipient: recipientEmail,
            subject: emailSubject,
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

function buildSimpleTestHtml(config: any): string {
  const bg = config.backgroundColor || "#f7f7f7";
  const bodyBg = config.bodyBackgroundColor || "#ffffff";
  const baseColor = config.baseColor || "#2271b1";
  return `
    <div style="background: ${bg}; padding: 40px; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: ${bodyBg}; padding: 20px; border-radius: 8px;">
        ${config.headerImage ? `<img src="${config.headerImage}" width="150" style="display:block; margin: 0 auto 20px;" />` : ''}
        <h2 style="color: ${baseColor}; text-align: center;">SMTP Test Successful!</h2>
        <p style="text-align:center; color: #555;">Your email configuration is working correctly.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">${config.footerText || ''}</p>
      </div>
    </div>
  `;
}