// app/api/cron/check-bounces/route.ts
//
// SMTP পাঠানোর সময় সাথে সাথে সফল/ব্যর্থ বোঝা যায় না — server শুধু "গ্রহণ করলাম"
// বলে, আসল ডেলিভারি fail হয় পরে receiving server-এ, আর সেই bounce notice
// (Mail Delivery Subsystem / mailer-daemon) ফিরে আসে আমাদের নিজের sending
// mailbox-এ একটা সাধারণ email হিসেবে। প্লেইন SMTP-তে কোনো real-time bounce
// webhook নেই, তাই এই cron সেই একই mailbox-টা IMAP দিয়ে পড়ে, bounce notice
// খুঁজে বের করে, parse করে "hard bounce" (address/domain স্থায়ীভাবে নেই)
// পেলে SuppressedEmail-এ যোগ করে — যাতে process-email-queue ভবিষ্যতে ওই
// ঠিকানায় আর পাঠানোর চেষ্টা না করে।
//
// ★ নতুন কোনো credential লাগে না — EmailConfiguration-এর একই smtpUser/
//   smtpPassword (Gmail App Password) IMAP-এও কাজ করে, কারণ Google App
//   Password account-ভিত্তিক, protocol-ভিত্তিক নয়।
// ★ শুধু HARD bounce (permanent — address/domain নেই) suppress করা হয়।
//   soft/temporary bounce (mailbox full, server busy) বাদ — retry হতে পারে।
// ★ প্রতিটা bounce message প্রসেস হওয়ার পর IMAP delete করা হয় — এই Gmail
//   account-এ "expunge → Archive the message" সেট করা থাকায় এটা permanently
//   মোছে না, শুধু Inbox থেকে সরে Archive/All Mail-এ যায় (inbox পরিষ্কার থাকে,
//   একই bounce বারবার re-scan হয় না, কিন্তু প্রমাণ হারায় না)।

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { toZonedTime } from "date-fns-tz";

export const maxDuration = 60;

// Gmail-এর SMTP host থেকে IMAP host বের করা — আপাতত শুধু Gmail/Google Workspace
// সমর্থিত (GoBike-এর বর্তমান provider); অন্য SMTP host হলে imap prefix বসানো হয়,
// ভুল হলে connect-এই fail করবে (silent data loss নেই)।
function resolveImapHost(smtpHost: string): string {
  if (/gmail\.com$/i.test(smtpHost) || /google\.com$/i.test(smtpHost)) {
    return "imap.gmail.com";
  }
  return smtpHost.replace(/^smtp\./i, "imap.");
}

// bounce mail পাঠায় এমন common sender pattern
const BOUNCE_SENDER_PATTERNS = ["mailer-daemon", "postmaster", "mail delivery subsystem"];

function looksLikeBounce(fromText: string): boolean {
  const lower = fromText.toLowerCase();
  return BOUNCE_SENDER_PATTERNS.some((p) => lower.includes(p));
}

// bounce message-এর body থেকে failed recipient বের করা — প্রথমে RFC3464
// structured "message/delivery-status" অংশ (বেশি নির্ভরযোগ্য), না পেলে Gmail-এর
// নিজস্ব "wasn't delivered to X" প্যাটার্নে fallback।
function extractFailedRecipient(parsed: ParsedMail): string | null {
  const statusPart = parsed.attachments.find(
    (a) => a.contentType === "message/delivery-status"
  );
  if (statusPart) {
    const text = statusPart.content.toString("utf-8");
    const m = text.match(/Final-Recipient:\s*rfc822;\s*(\S+)/i) || text.match(/Original-Recipient:\s*rfc822;\s*(\S+)/i);
    if (m) return m[1].trim().replace(/[<>]/g, "").toLowerCase();
  }

  const bodyText = (parsed.text || "") + " " + (parsed.html ? String(parsed.html) : "");
  const patterns = [
    /wasn['’]t delivered to\s*\*{0,2}\s*([^\s*<>]+@[^\s*<>]+?)\s*\*{0,2}\s+because/i,
    /delivery to the following recipient(?:s)? (?:failed|was delayed)[^:]*:\s*\n*\s*([^\s<>]+@[^\s<>]+)/i,
    /Your message wasn['’]t delivered to\s*\*{0,2}\s*([^\s*<>]+@[^\s*<>]+)/i,
  ];
  for (const re of patterns) {
    const m = bodyText.match(re);
    if (m) return m[1].trim().replace(/[.,;]+$/, "").toLowerCase();
  }
  return null;
}

// HARD (স্থায়ী — suppress করা উচিত) নাকি SOFT (সাময়িক — retry হতে পারে) সেটা
// bounce message-এর টেক্সট দেখে classify করা। অনিশ্চিত হলে SOFT ধরাই নিরাপদ —
// একটা আসল কাস্টমারকে ভুলভাবে suppress করার চেয়ে মাঝেমধ্যে bad address-এ আবার
// চেষ্টা করা কম ক্ষতিকর।
function classifyBounce(parsed: ParsedMail): { isHard: boolean; detail: string } {
  const bodyText = ((parsed.text || "") + " " + (parsed.html ? String(parsed.html) : "")).slice(0, 2000);
  const lower = bodyText.toLowerCase();

  const hardSignals = [
    "nxdomain",
    "domain name not found",
    "does not exist",
    "no such user",
    "couldn't be found",
    "could not be found",
    "address not found",
    "mailbox unavailable",
    "user unknown",
    "recipient address rejected",
  ];
  const softSignals = [
    "mailbox full",
    "quota exceeded",
    "over quota",
    "try again later",
    "temporarily",
    "temporary failure",
    "greylist",
  ];

  // enhanced status code: 5.x.x = permanent, 4.x.x = temporary
  const statusCode = bodyText.match(/\b([45])\.\d{1,3}\.\d{1,3}\b/);

  const hasSoftSignal = softSignals.some((s) => lower.includes(s));
  const hasHardSignal = hardSignals.some((s) => lower.includes(s));

  let isHard = false;
  if (statusCode) {
    isHard = statusCode[1] === "5";
  } else if (hasHardSignal && !hasSoftSignal) {
    isHard = true;
  }

  return { isHard, detail: bodyText.replace(/\s+/g, " ").trim().slice(0, 500) };
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

  // অন্য cron-গুলোর (process-email-queue, transdirect-status-sync) মতোই —
  // শুধু Sydney local সকাল ৯টা-সন্ধ্যা ৬টার মধ্যে চলবে, বাকি সময় skip।
  const storeTimezone = await getStoreTimezone();
  const localHour = toZonedTime(new Date(), storeTimezone).getHours();
  if (localHour < 9 || localHour >= 18) {
    return NextResponse.json({ message: `Outside business hours (${storeTimezone} ${localHour}:00) — skipped.` }, { status: 200 });
  }

  const config = await db.emailConfiguration.findUnique({ where: { id: "email_config" } });
  if (!config?.smtpHost || !config.smtpUser || !config.smtpPassword) {
    return NextResponse.json({ message: "Email SMTP not configured — nothing to check." }, { status: 200 });
  }

  const imapHost = resolveImapHost(config.smtpHost);
  const client = new ImapFlow({
    host: imapHost,
    port: 993,
    secure: true,
    auth: { user: config.smtpUser, pass: config.smtpPassword },
    logger: false,
  });

  let suppressed = 0;
  let scanned = 0;
  let softSkipped = 0;
  let backlogRemaining = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      // ⚠️ FIX: আগে শুধু `seen: false` (unread) খুঁজত — কিন্তু যে bounce email
      // ইতিমধ্যে খুলে পড়া হয়ে গেছে (যেমন এই screenshot-গুলোর জন্য), সেগুলো
      // \Seen=true, তাই কখনো ধরা পড়ত না, Inbox-এ পড়েই থাকত। এখন read/unread
      // নির্বিশেষে Gmail-এর নিজস্ব সার্চ (gmraw) দিয়ে bounce sender/subject
      // দিয়ে খোঁজা হয় — পুরনো backlog-ও এই fix-এর প্রথম রানেই ধরা পড়বে ও
      // archive হয়ে যাবে। প্রসেস হওয়া message Inbox থেকে সরে যায় বলে (নিচে
      // messageDelete) পরের রান থেকে সার্চের পরিধি ছোটই থাকে, পুরো inbox নয়।
      const allUids =
        (await client.search(
          { gmraw: 'from:(mailer-daemon OR postmaster) OR subject:("Delivery Status Notification" OR "Undelivered Mail")' },
          { uid: true }
        )) || [];

      // পুরনো backlog একসাথে অনেক বড় হতে পারে (৬০ সেকেন্ড cron limit-এ সব
      // প্রসেস করতে গেলে timeout হতে পারে) — তাই প্রতি রানে সর্বোচ্চ এতগুলো,
      // বাকিটা পরের ৩০-মিনিট-পরের রানে (প্রসেস হওয়া message Inbox থেকে সরে
      // যায় বলে পরের বার এগুলো আর সার্চে আসবে না, ধীরে ধীরে পুরো backlog শেষ হবে)।
      const BATCH_LIMIT = 40;
      const uids = allUids.slice(0, BATCH_LIMIT);
      backlogRemaining = Math.max(0, allUids.length - uids.length);

      for (const uid of uids) {
        const msg = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
        if (!msg || !msg.source) continue;

        const fromText = msg.envelope?.from?.map((f) => `${f.name || ""} ${f.address || ""}`).join(" ") || "";
        if (!looksLikeBounce(fromText)) continue; // bounce না হলে ছুঁয়েও দেখি না — inbox-এর অন্য mail অক্ষত থাকে

        scanned++;
        const parsed = await simpleParser(msg.source);
        const recipient = extractFailedRecipient(parsed);

        if (recipient) {
          const { isHard, detail } = classifyBounce(parsed);
          if (isHard) {
            await db.suppressedEmail.upsert({
              where: { email: recipient },
              update: { detail },
              create: { email: recipient, reason: "HARD_BOUNCE", detail },
            });
            suppressed++;
          } else {
            softSkipped++;
          }
        }

        // প্রসেস হয়ে গেছে — Inbox থেকে সরিয়ে দেওয়া হলো, যাতে জমে থেকে inbox
        // ভরে না যায় এবং একই bounce বারবার re-scan না হয়। এই Gmail account-এ
        // "When a message is marked as deleted and expunged... → Archive the
        // message" সেট করা (Settings → Forwarding and POP/IMAP → IMAP access),
        // তাই এটা permanently মোছে না — শুধু Archive/All Mail-এ চলে যায়,
        // দরকারে পরে খুঁজে পাওয়া যাবে।
        await client.messageDelete(uid, { uid: true });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (error: unknown) {
    try { await client.logout(); } catch { /* ignore */ }
    const msg = error instanceof Error ? error.message : "Unknown IMAP error";
    console.error("[check-bounces] IMAP error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    bounceEmailsScanned: scanned,
    newlySuppressed: suppressed,
    softBouncesSkipped: softSkipped,
    backlogRemaining, // 0 না হলে পরের রানে বাকিটা প্রসেস হবে
  });
}
