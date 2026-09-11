// app/api/email/process-email-queue/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";
import { generateEmailHtml } from "@/app/actions/backend/settings/email/email-generator";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { toZonedTime } from "date-fns-tz";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // CRON_SECRET set থাকলেই auth enforce করা হবে (localhost-এ সাধারণত set থাকে না → skip)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const querySecret = searchParams.get("secret");
    const authHeader = req.headers instanceof Headers ? req.headers.get("authorization") : null;
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (querySecret !== cronSecret && bearerSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 🕘 Business-hours guard — শুধু vercel.json-এর scheduled cron-এর জন্য
  // (?scheduled=1 marker দিয়ে চেনা যায়), send-notification.ts-এর immediate
  // auto-trigger fetch-এ এই param থাকে না — তাই order confirmation/shipping
  // email এখনো সাথে সাথেই যাবে, যেকোনো সময়। এই scheduled cron শুধু
  // backup/catch-up হিসেবে কাজ করে (auto-trigger fail করলে ধরার জন্য), তাই
  // সেটাকেই store-এর local সময় সকাল ৯টা-সন্ধ্যা ৬টার মধ্যে সীমাবদ্ধ রাখা হলো
  // (DB compute কমাতে) — বাস্তব email delivery-তে প্রভাব পড়বে না।
  if (searchParams.get("scheduled") === "1") {
    const storeTimezone = await getStoreTimezone();
    const localHour = toZonedTime(new Date(), storeTimezone).getHours();
    if (localHour < 9 || localHour >= 18) {
      return NextResponse.json({ message: `Outside business hours (${storeTimezone} ${localHour}:00) — scheduled run skipped.` }, { status: 200 });
    }
  }

  try {
    const config = await db.emailConfiguration.findUnique({ where: { id: "email_config" } });

    if (!config || !config.isActive) {
      return NextResponse.json({ message: "Email system disabled or config missing." }, { status: 200 });
    }

    // ─── STUCK RECOVERY ──────────────────────────────────────────────────────
    // Server crash হলে PROCESSING এ আটকে যাওয়া items ৫ মিনিট পরে PENDING এ ফেরে
    const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000);
    const recovered = await db.notificationQueue.updateMany({
      where: {
        status: "PROCESSING",
        updatedAt: { lt: stuckCutoff },
        attempts: { lt: 3 }
      },
      data: { status: "PENDING" }
    });
    if (recovered.count > 0) {
      console.log(`[EmailQueue] Recovered ${recovered.count} stuck PROCESSING items`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const pendingItems = await db.notificationQueue.findMany({
      where: {
        status: "PENDING",
        attempts: { lt: 3 }
      },
      take: 20,
      orderBy: { createdAt: "asc" }
    });

    if (pendingItems.length === 0) {
      return NextResponse.json({ message: "No pending emails in queue." }, { status: 200 });
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost ?? undefined,
      port: Number(config.smtpPort) || 587,
      secure: config.encryption === "ssl",
      auth: {
        user: config.smtpUser ?? undefined,
        pass: config.smtpPassword ?? undefined
      },
      tls: { rejectUnauthorized: false }
    });

    // ── SEQUENTIAL processing: one email at a time (prevents SMTP rate-limit)
    // Even with 50+ emails queued, each is sent individually and safely logged.
    let processedCount = 0;
    let suppressedCount = 0;

    for (const item of pendingItems) {
      // Atomic lock: only one worker can flip PENDING → PROCESSING per item
      const lock = await db.notificationQueue.updateMany({
        where: { id: item.id, status: "PENDING" },
        data: { status: "PROCESSING" }
      });

      if (lock.count === 0) continue; // Already locked by another worker

      // ⛔ Bounce suppression — এই ঠিকানায় আগে hard bounce ধরা পড়েছে (দেখুন
      // app/api/cron/check-bounces/route.ts), তাই আর পাঠানোর চেষ্টাই করা হয় না।
      // CANCELLED করা হলো, FAILED নয় — এটা error নয়, ইচ্ছাকৃত skip, retry-ও হবে না।
      const isSuppressed = await db.suppressedEmail.findUnique({
        where: { email: item.recipient.trim().toLowerCase() },
        select: { id: true }
      });
      if (isSuppressed) {
        await db.$transaction([
          db.notificationQueue.update({
            where: { id: item.id },
            data: { status: "CANCELLED", error: "Recipient is on the bounce suppression list." }
          }),
          db.emailLog.create({
            data: {
              recipient: item.recipient,
              subject: `[${item.templateSlug}]`,
              templateSlug: item.templateSlug,
              status: "SUPPRESSED",
              errorMessage: "Recipient previously hard-bounced — send skipped.",
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata ?? {}
            }
          })
        ]);
        suppressedCount++;
        continue;
      }

      let subject = `[${item.templateSlug}]`;
      // try-এর বাইরে declare করা — catch block-এও access দরকার, যাতে ব্যর্থ
      // হওয়া send-এও (যতটুকু generate হয়েছিল) EmailLog-এ সেভ করা যায়।
      let htmlBody = "";
      // Open/click tracking-এর জন্য আগে থেকেই id বানানো — generateEmailHtml()-কে
      // pixel/click-link বসানোর জন্য এই একই id পাঠানো হবে, আর নিচে EmailLog
      // তৈরির সময়ও এটাই ব্যবহার হবে — তাই email-এর ভেতরের tracking link আর
      // আসল EmailLog row একদম মিলে যায়।
      const emailLogId = randomUUID();

      try {
        const template = await db.emailTemplate.findUnique({
          where: { slug: item.templateSlug || "" }
        });

        if (!template) throw new Error("Template not found in DB");

        subject = template.subject;
        const meta = item.metadata as Record<string, unknown>;
        const customReplyTo = typeof meta?._replyTo === "string" ? meta._replyTo : null;

        if (item.orderId) {
          const order = await db.order.findUnique({
            where: { id: item.orderId },
            include: { items: true, user: true }
          });
          if (order) {
            type GeneratorOrder = NonNullable<Parameters<typeof generateEmailHtml>[0]['order']>;
            const serializedOrder = JSON.parse(JSON.stringify(order)) as unknown as GeneratorOrder;
            htmlBody = generateEmailHtml({ order: serializedOrder, config, template, metadata: meta, emailLogId });
            const billing = order.billingAddress as Record<string, string> | null;
            const guestName = billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "";
            subject = subject
              .replace(/{order_number}/g, order.orderNumber)
              .replace(/{customer_name}/g, order.user?.name || guestName || order.guestEmail || "Customer");
          }
        }

        if (!htmlBody) {
          htmlBody = generateEmailHtml({ config, template, metadata: meta, emailLogId });
          if (meta) {
            Object.keys(meta).forEach(key => {
              if (key !== "_replyTo") {
                subject = subject.replace(new RegExp(`{${key}}`, "g"), String(meta[key]));
              }
            });
          }
        }

        await transporter.sendMail({
          from: `"${config.senderName}" <${config.senderEmail}>`,
          replyTo: customReplyTo || config.senderEmail || undefined,
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
              id: emailLogId,
              recipient: item.recipient,
              subject,
              templateSlug: template.slug,
              status: "SENT",
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata ?? {},
              htmlBody
            }
          })
        ]);

        processedCount++;

      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`[EmailQueue] Failed ID: ${item.id} — ${msg}`);

        await db.$transaction([
          db.notificationQueue.update({
            where: { id: item.id },
            data: {
              attempts: { increment: 1 },
              error: msg,
              status: item.attempts >= 2 ? "FAILED" : "PENDING"
            }
          }),
          db.emailLog.create({
            data: {
              recipient: item.recipient,
              subject: subject || `[${item.templateSlug}]`,
              templateSlug: item.templateSlug,
              status: "FAILED",
              errorMessage: msg,
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata ?? {},
              htmlBody: htmlBody || null
            }
          })
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      suppressed: suppressedCount,
      total: pendingItems.length
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
