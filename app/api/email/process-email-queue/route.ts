// app/api/email/process-email-queue/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateEmailHtml } from "@/app/actions/backend/settings/email/email-generator";

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

    // FIX 1: Lock uses "PROCESSING" not "FAILED" — a server crash leaves items
    //         in "PROCESSING" (recoverable) instead of permanently "FAILED".
    // FIX 2: Promise.allSettled replaces sequential for-loop — all items send concurrently.
    const results = await Promise.allSettled(pendingItems.map(async (item) => {
      // Atomic lock: only one worker can flip PENDING → PROCESSING per item
      const lock = await db.notificationQueue.updateMany({
        where: { id: item.id, status: "PENDING" },
        data: { status: "PROCESSING" }
      });

      if (lock.count === 0) return false; // Already locked by another worker

      let subject = `[${item.templateSlug}]`;

      try {
        const template = await db.emailTemplate.findUnique({
          where: { slug: item.templateSlug || "" }
        });

        if (!template) throw new Error("Template not found in DB");

        let htmlBody = "";
        subject = template.subject;
        const meta = item.metadata as any;
        const customReplyTo = meta?._replyTo;

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

        if (!htmlBody) {
          htmlBody = generateEmailHtml({ config, template, metadata: meta });
          if (meta) {
            Object.keys(meta).forEach(key => {
              if (key !== '_replyTo') {
                subject = subject.replace(new RegExp(`{${key}}`, "g"), meta[key]);
              }
            });
          }
        }

        await transporter.sendMail({
          from: `"${config.senderName}" <${config.senderEmail}>`,
          replyTo: customReplyTo || config.senderEmail,
          to: item.recipient,
          subject,
          html: htmlBody,
        });

        await db.$transaction([
          db.notificationQueue.update({
            where: { id: item.id },
            data: { status: "SENT", sentAt: new Date(), error: null }
          }),
          db.emailLog.create({
            data: {
              recipient: item.recipient,
              subject,
              templateSlug: template.slug,
              status: "SENT",
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata || {}
            }
          })
        ]);

        return true;

      } catch (error: any) {
        console.error(`Queue Item Fail ID: ${item.id} - ${error.message}`);

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
              subject: subject || `[${item.templateSlug}]`,
              templateSlug: item.templateSlug,
              status: "FAILED",
              errorMessage: error.message,
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata || {}
            }
          })
        ]);

        return false;
      }
    }));

    const processedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: pendingItems.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
