// app/api/email/process-email-queue/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateEmailHtml } from "@/app/actions/backend/settings/email/email-generator";

export async function GET(req: Request) {
  // CRON_SECRET set থাকলেই auth enforce করা হবে (localhost-এ সাধারণত set থাকে না → skip)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");
    const authHeader = req.headers instanceof Headers ? req.headers.get("authorization") : null;
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (querySecret !== cronSecret && bearerSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    for (const item of pendingItems) {
      // Atomic lock: only one worker can flip PENDING → PROCESSING per item
      const lock = await db.notificationQueue.updateMany({
        where: { id: item.id, status: "PENDING" },
        data: { status: "PROCESSING" }
      });

      if (lock.count === 0) continue; // Already locked by another worker

      let subject = `[${item.templateSlug}]`;

      try {
        const template = await db.emailTemplate.findUnique({
          where: { slug: item.templateSlug || "" }
        });

        if (!template) throw new Error("Template not found in DB");

        let htmlBody = "";
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
            htmlBody = generateEmailHtml({ order: serializedOrder, config, template, metadata: meta });
            const billing = order.billingAddress as Record<string, string> | null;
            const guestName = billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "";
            subject = subject
              .replace(/{order_number}/g, order.orderNumber)
              .replace(/{customer_name}/g, order.user?.name || guestName || order.guestEmail || "Customer");
          }
        }

        if (!htmlBody) {
          htmlBody = generateEmailHtml({ config, template, metadata: meta });
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
              recipient: item.recipient,
              subject,
              templateSlug: template.slug,
              status: "SENT",
              orderId: item.orderId,
              userId: item.userId,
              metadata: item.metadata ?? {}
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
              metadata: item.metadata ?? {}
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

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
