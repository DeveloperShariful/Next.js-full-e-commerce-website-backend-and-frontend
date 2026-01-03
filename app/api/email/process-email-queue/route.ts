//app/api/email/process-email-queue/route.ts

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
      take: 10,
      orderBy: { createdAt: 'asc' } 
    });

    if (pendingItems.length === 0) {
      return NextResponse.json({ message: "No pending emails in queue." }, { status: 200 });
    }

    console.log(`🔄 [WORKER] Processing ${pendingItems.length} emails...`);

    const transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 587,
      secure: config.encryption === 'ssl',
      auth: { user: config.smtpUser, pass: config.smtpPassword },
      tls: { rejectUnauthorized: false }
    } as any);

    let processedCount = 0;

    for (const item of pendingItems) {
      try {
        const template = await db.emailTemplate.findUnique({ 
          where: { slug: item.templateSlug || "" } 
        });

        if (!template) {
            throw new Error("Template not found in DB");
        }

        let htmlBody = "";
        let subject = template.subject;

        if (item.orderId) {
          const order = await db.order.findUnique({
            where: { id: item.orderId },
            include: { items: true, user: true }
          });

          if (order) {
            htmlBody = generateEmailHtml({ order, config, template });
            subject = subject.replace(/{order_number}/g, order.orderNumber);
          }
        } 
        
        if (!htmlBody) {
           htmlBody = template.content; 
           const meta = item.metadata as any;
           if(meta) {
             Object.keys(meta).forEach(key => {
                const regex = new RegExp(`{${key}}`, "g");
                htmlBody = htmlBody.replace(regex, meta[key]);
                subject = subject.replace(regex, meta[key]);
             });
           }
        }

        const info = await transporter.sendMail({
          from: `"${config.senderName}" <${config.senderEmail}>`,
          to: item.recipient,
          subject: subject,
          html: htmlBody,
        });

        await db.$transaction([
          db.notificationQueue.update({
            where: { id: item.id },
            data: { 
              status: "COMPLETED", 
              sentAt: new Date() 
            }
          }),
          db.emailLog.create({
            data: {
              recipient: item.recipient,
              subject: subject,
              templateSlug: template.slug,
              status: "SENT",
              orderId: item.orderId,
              metadata: info as any
            }
          })
        ]);

        processedCount++;

      } catch (error: any) {
        console.error(`❌ [WORKER FAIL] ID: ${item.id} - ${error.message}`);
      
        await db.notificationQueue.update({
          where: { id: item.id },
          data: { 
            attempts: { increment: 1 },
            error: error.message,
            status: item.attempts >= 2 ? "FAILED" : "PENDING" 
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount, 
      total: pendingItems.length 
    });

  } catch (error: any) {
    console.error("🔥 [WORKER CRITICAL ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}