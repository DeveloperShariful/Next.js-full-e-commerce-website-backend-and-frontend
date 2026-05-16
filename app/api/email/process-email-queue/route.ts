// app/api/email/process-email-queue/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
	import { generateEmailHtml } from "@/app/actions/admin/settings/email/email-generator";

export async function GET(req: Request) {
  try {
    const config = await db.emailConfiguration.findUnique({ where: { id: "email_config" } });
    
    if (!config || !config.isActive) {
      return NextResponse.json({ message: "Email system disabled or config missing." }, { status: 200 });
    }

    const pendingItems = await db.notificationQueue.findMany({
      where: { 
        status: "PENDING",
        attempts: { lt: 3 } 
      },
      take: 5,
      orderBy: { createdAt: 'asc' } 
    });

    if (pendingItems.length === 0) {
      return NextResponse.json({ message: "No pending emails in queue." }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: Number(config.smtpPort) || 587,
      secure: config.encryption === 'ssl',
      auth: { user: config.smtpUser, pass: config.smtpPassword },
      tls: { rejectUnauthorized: false }
    } as any);

    let processedCount = 0;

    for (const item of pendingItems) {
      
      // ====================================================================
      // 🛑 FIX: ATOMIC LOCK TO PREVENT DUPLICATE EMAILS (Race Condition Fix)
      // ====================================================================
      // কোনো প্রসেসর মেইল পাঠানোর আগে ডাটাবেসে সেটিকে সাময়িকভাবে লক করে দিচ্ছে।
      // যদি অন্য কোনো প্রসেসর আগেই এটি লক করে ফেলে, তবে count 0 আসবে এবং এটি স্কিপ করবে।
      const lock = await db.notificationQueue.updateMany({
          where: { id: item.id, status: "PENDING" },
          data: { status: "FAILED", error: "Processing_Lock" }
      });

      if (lock.count === 0) {
          // Item is already being processed by another thread. Skip it!
          continue; 
      }
      // ====================================================================

      try {
        const template = await db.emailTemplate.findUnique({ 
          where: { slug: item.templateSlug || "" } 
        });

        if (!template) {
            throw new Error("Template not found in DB");
        }

        let htmlBody = "";
        let subject = template.subject;
        const meta = item.metadata as any;
        
        // <<< FIX: হিডেন replyTo বের করে আনা হচ্ছে >>>
        const customReplyTo = meta?._replyTo;

        // 🛑 ১. যদি orderId থাকে, তাহলে অর্ডারের ডেটা দিয়ে ইমেইল জেনারেট করবে
        if (item.orderId) {
          const order = await db.order.findUnique({
            where: { id: item.orderId },
            include: { items: true, user: true }
          });

          if (order) {
            htmlBody = generateEmailHtml({ order, config, template, metadata: meta });
            
            subject = subject
                .replace(/{order_number}/g, order.orderNumber)
                .replace(/{customer_name}/g, order.user?.name || order.guestEmail || "Customer");
          }
        } 
        
        // 🛑 ২. যদি orderId না থাকে (যেমন Warranty Claim), তবে শুধু metadata দিয়ে জেনারেট করবে
        if (!htmlBody) {
           htmlBody = generateEmailHtml({ config, template, metadata: meta });
           if (meta) {
             Object.keys(meta).forEach(key => {
                if (key !== '_replyTo') {
                    const regex = new RegExp(`{${key}}`, "g");
                    subject = subject.replace(regex, meta[key]);
                }
             });
           }
        }

        // ইমেইল সেন্ড করা হচ্ছে
        await transporter.sendMail({
          // <<< FIX: From অ্যাড্রেসটি Gmail এর ইউজারনেমের বদলে স্টোরের ইমেইল করা হলো >>>
          from: `"${config.senderName}" <${config.senderEmail}>`,
          // <<< FIX: ডাইনামিক Reply-To বসানো হলো >>>
          replyTo: customReplyTo || config.senderEmail,
          to: item.recipient,
          subject: subject,
          html: htmlBody,
        });

        // 🛑 সফল হলে Lock খুলে স্ট্যাটাস SENT করে দেওয়া হচ্ছে
        await db.$transaction([
          db.notificationQueue.update({
            where: { id: item.id },
            data: { 
              status: "SENT", // Prisma Enum অনুযায়ী SENT
              sentAt: new Date(),
              error: null
            }
          }),
          db.emailLog.create({
            data: {
              recipient: item.recipient,
              subject: subject,
              templateSlug: template.slug,
              status: "SENT",
              orderId: item.orderId,
              userId: item.userId, 
              metadata: item.metadata || {}
            }
          })
        ]);

        processedCount++;

      } catch (error: any) {
        console.error(`Queue Item Fail ID: ${item.id} - ${error.message}`);
      
        // 🛑 ফেইল করলে Lock খুলে আবার PENDING বা FAILED করে দেওয়া হচ্ছে
        await db.$transaction([
          db.notificationQueue.update({
            where: { id: item.id },
            data: { 
              attempts: { increment: 1 },
              error: error.message,
              status: item.attempts >= 2 ? "FAILED" : "PENDING" 
            }
          }),
          db.emailLog.create({
            data: {
              recipient: item.recipient,
              subject: item.subject || "Unknown Subject",
              templateSlug: item.templateSlug,
              status: "FAILED",
              errorMessage: error.message,
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata || {}
            }
          })
        ]);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount, 
      total: pendingItems.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}