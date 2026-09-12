// app/api/cron/review-reminders/route.ts
//
// COMPLETED/DELIVERED order হওয়ার পর কাস্টমারকে review দিতে সর্বোচ্চ ৫বার মনে
// করিয়ে দেওয়া হয় (~২ দিন gap), প্রতিটা reminder-এ order-এর সব product-এর
// review লিংক (/product/{slug}#reviews) সহ। কাস্টমার order-এর যেকোনো একটা
// product review করলেই পুরো sequence বন্ধ হয়ে যায় — app/api/cron/
// abandoned-checkout/route.ts-এর remindersSent/lastReminder প্যাটার্ন অনুসরণ
// করা হয়েছে।
//
// Order মডেলে কোনো deliveredAt/completedAt timestamp নেই — তাই এই cron যখন
// প্রথমবার কোনো order-কে COMPLETED/DELIVERED অবস্থায় দেখে, তখনই একটা
// ReviewReminder row তৈরি করে (remindersSent=0); সেই row-এর createdAt-ই
// কার্যত "eligible হওয়ার সময়" হিসেবে ব্যবহৃত হয়। Review মডেলে orderId নেই
// (শুধু userId+productId), তাই "ইতিমধ্যে review করেছে কিনা" চেক করা হয়
// user+product গ্রানুলারিটিতে — order-ভিত্তিক নয়।

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendNotification } from "@/app/api/email/send-notification";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { toZonedTime } from "date-fns-tz";

export const maxDuration = 60;

const QUALIFYING_STATUSES: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.DELIVERED];
const REMINDER_GAP_MS = 2 * 24 * 60 * 60 * 1000; // ২ দিন
const MAX_REMINDERS = 5;
// পুরনো backlog (অনেক পুরনো delivered/completed order যেগুলো কখনো review
// পায়নি) — সবগুলোকে একসাথে না পাঠিয়ে, প্রতি cron *hit*-এ সর্বোচ্চ এতগুলো real
// send — বাকিটা "due" অবস্থায়ই থেকে যায় (lastReminderAt না বদলানোয় পরের
// hit-এ আবার এই batch-এর সামনের দিকেই আসবে)। vercel.json অনুযায়ী এই cron
// দিনে ৬বার হিট হয় (Sydney business hours-এর ভেতরে ছড়ানো), তাই প্রতিদিন
// সর্বোচ্চ ৬×১৫=৯০টা reminder mail যেতে পারে — dhape-dhape কিন্তু আগের
// তুলনায় দ্রুত পুরো backlog শেষ হয়, inbox/SMTP-তে হঠাৎ বড় burst পড়ে না।
const MAX_SENDS_PER_RUN = 15;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gobike.au").replace(/\/+$/, "");

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const { searchParams } = new URL(req.url);
    if (bearerSecret !== cronSecret && searchParams.get("secret") !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // অন্য cron-গুলোর (check-bounces, abandoned-checkout) মতোই — শুধু Sydney
  // local সকাল ৯টা-সন্ধ্যা ৬টার মধ্যেই চলবে, বাকি সময় skip। vercel.json-এ
  // দিনে ৬বার (23,1,3,5,7,8 UTC = Sydney 9am,11am,1pm,3pm,5pm,6pm) হিট হয়,
  // প্রতিবারে সর্বোচ্চ MAX_SENDS_PER_RUN — তাই সারাদিনে সর্বোচ্চ ৬×১৫=৯০টা
  // reminder mail যেতে পারে, বড় backlog দ্রুত (কিন্তু এখনো নিয়ন্ত্রিতভাবে)
  // শেষ করার জন্য। এই explicit check থাকায় schedule বদলালে বা কেউ manually
  // URL হিট করলেও ৯টা-৬টার বাইরে কিছু পাঠাবে না।
  const storeTimezone = await getStoreTimezone();
  const localHour = toZonedTime(new Date(), storeTimezone).getHours();
  if (localHour < 9 || localHour >= 18) {
    return NextResponse.json({ message: `Outside business hours (${storeTimezone} ${localHour}:00) — skipped.` }, { status: 200 });
  }

  // ধাপ ১ — নতুন eligible order (COMPLETED/DELIVERED, এখনো কোনো ReviewReminder row নেই)
  const newlyQualifying = await db.order.findMany({
    where: {
      status: { in: QUALIFYING_STATUSES },
      deletedAt: null,
      reviewReminder: null,
    },
    select: { id: true },
    take: 200,
  });
  if (newlyQualifying.length > 0) {
    await db.reviewReminder.createMany({
      data: newlyQualifying.map((o) => ({ orderId: o.id })),
      skipDuplicates: true,
    });
  }

  // ধাপ ২ — কার পালা এখন (২ দিন পার হয়ে গেছে এমন active row)। take এখানে
  // বড় রাখা হয়েছে (housekeeping — already-reviewed/status-changed row বাদ
  // দেওয়া — কোনো mail পাঠায় না, তাই এগুলোতে দৈনিক send-cap খরচ হয় না) কিন্তু
  // আসল email পাঠানো নিচে MAX_SENDS_PER_RUN দিয়ে সীমাবদ্ধ। সবচেয়ে পুরনো
  // (createdAt আগে) row আগে process হয় — FIFO, যাতে backlog ধাপে ধাপে
  // সুষমভাবে শেষ হয়।
  const dueThreshold = new Date(Date.now() - REMINDER_GAP_MS);
  const dueReminders = await db.reviewReminder.findMany({
    where: {
      isActive: true,
      remindersSent: { lt: MAX_REMINDERS },
      OR: [
        { lastReminderAt: null, createdAt: { lte: dueThreshold } },
        { lastReminderAt: { lte: dueThreshold } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 300,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          userId: true,
          guestEmail: true,
          user: { select: { name: true, email: true } },
          items: {
            select: {
              productId: true,
              productName: true,
              product: { select: { slug: true, name: true } },
            },
          },
        },
      },
    },
  });

  let sent = 0;
  let stoppedReviewed = 0;
  let stoppedStatusChanged = 0;
  let skippedNoEmail = 0;

  for (const reminder of dueReminders) {
    // দৈনিক cap পৌঁছে গেলে বাকি সব (backlog সহ) পরের দিনের run-এর জন্য রেখে
    // দেওয়া হয় — lastReminderAt/remindersSent কিছুই বদলায়নি, তাই এরা কাল
    // আবার এই একই queue-এর সামনের দিকেই থাকবে (FIFO)।
    if (sent >= MAX_SENDS_PER_RUN) break;

    const order = reminder.order;

    // ধাপ ৩ — status আর qualifying নেই (যেমন delivery-পরবর্তী refund/cancel)
    if (!QUALIFYING_STATUSES.includes(order.status)) {
      await db.reviewReminder.update({
        where: { id: reminder.id },
        data: { isActive: false, stoppedReason: "STATUS_CHANGED" },
      });
      stoppedStatusChanged++;
      continue;
    }

    const email = order.guestEmail?.trim().toLowerCase() || order.user?.email?.trim().toLowerCase() || null;
    if (!email) {
      skippedNoEmail++;
      continue; // বাস্তবে guestEmail/user প্রায় সবসময় থাকে — পরের রানে আবার চেষ্টা হবে
    }

    const productIds: string[] = [
      ...new Set(
        order.items
          .map((i: { productId: string | null }) => i.productId)
          .filter((id: string | null): id is string => !!id)
      ),
    ];

    // ধাপ ৪ — এই কাস্টমার order-এর কোনো product ইতিমধ্যে review করে ফেলেছে কিনা
    // (Review-এ orderId নেই, তাই user+product দিয়েই চেক — guest হলে email
    // দিয়ে matching User row খুঁজে)
    let alreadyReviewed = false;
    if (productIds.length > 0) {
      if (order.userId) {
        alreadyReviewed = !!(await db.review.findFirst({
          where: { userId: order.userId, productId: { in: productIds }, deletedAt: null },
          select: { id: true },
        }));
      } else {
        alreadyReviewed = !!(await db.review.findFirst({
          where: { productId: { in: productIds }, deletedAt: null, user: { email } },
          select: { id: true },
        }));
      }
    }
    if (alreadyReviewed) {
      await db.reviewReminder.update({
        where: { id: reminder.id },
        data: { isActive: false, stoppedReason: "REVIEWED" },
      });
      stoppedReviewed++;
      continue;
    }

    // ধাপ ৫ — product review-লিংক টেবিল বানানো (deleted product বাদ)
    const uniqueProducts = new Map<string, { name: string; slug: string }>();
    for (const item of order.items) {
      if (item.product?.slug) {
        uniqueProducts.set(item.product.slug, { name: item.product.name || item.productName, slug: item.product.slug });
      }
    }
    if (uniqueProducts.size === 0) {
      // review করার মতো linkable কোনো product নেই (সব deleted) — আর মনে করানোর কিছু নেই
      await db.reviewReminder.update({
        where: { id: reminder.id },
        data: { isActive: false, stoppedReason: "STATUS_CHANGED" },
      });
      continue;
    }

    const rows = [...uniqueProducts.values()]
      .map(
        (p) => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:14px 16px;font-size:14px;font-weight:600;color:#1a1a1a;text-align:left;">${escapeHtml(p.name)}</td>
          <td style="padding:14px 16px;text-align:right;white-space:nowrap;">
            <a href="${SITE_URL}/product/${p.slug}#reviews" style="background-color:#2271b1;color:#ffffff;padding:9px 16px;text-decoration:none;font-weight:700;border-radius:6px;font-size:13px;display:inline-block;">Leave a Review &rarr;</a>
          </td>
        </tr>`
      )
      .join("");

    const productsListHtml = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;border-collapse:collapse;max-width:460px;margin:10px auto;">
        <tbody>${rows}</tbody>
      </table>
    `;

    const step = reminder.remindersSent + 1; // 1..5
    const trigger = `REVIEW_REMINDER_${step}`;
    const customerName = order.user?.name?.trim() || (order.guestEmail ? order.guestEmail.split("@")[0] : "there");

    const result = await sendNotification({
      trigger,
      recipient: email,
      orderId: order.id,
      userId: order.userId || undefined,
      data: {
        customer_name: customerName,
        order_number: order.orderNumber,
        products_html: productsListHtml,
      },
    });

    if (!result.success) continue; // template missing/disabled — পরের রানে আবার চেষ্টা, step advance হয় না

    const nextSent = reminder.remindersSent + 1;
    await db.reviewReminder.update({
      where: { id: reminder.id },
      data: {
        remindersSent: nextSent,
        lastReminderAt: new Date(),
        ...(nextSent >= MAX_REMINDERS ? { isActive: false, stoppedReason: "EXHAUSTED" } : {}),
      },
    });
    sent++;
  }

  return NextResponse.json({
    success: true,
    newlyTracked: newlyQualifying.length,
    reminderCandidates: dueReminders.length,
    sendCapPerRun: MAX_SENDS_PER_RUN,
    sent,
    stoppedReviewed,
    stoppedStatusChanged,
    skippedNoEmail,
  });
}
