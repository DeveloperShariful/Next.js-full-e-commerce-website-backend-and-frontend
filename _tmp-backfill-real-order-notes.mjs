// backfill-real-order-notes.mjs
//
// একটা সম্পূর্ণ আলাদা, one-off backfill script — app/actions/backend/order/
// import-export.ts-এর একটা লাইনও ছোঁয়া হয় না, শুধু OrderNote টেবিলে লিখে।
// কখনো db.order.update() কল হয় না — Order-এর কোনো field স্পর্শ করা হয় না।
//
// ব্যবহার: node _tmp-backfill-real-order-notes.mjs <path-to-wc-notes-export-v1.csv> [--commit]
//
// ধাপ:
//   ১. CSV পড়া (Order ID, Notes JSON — wc-notes-export-v1.php যা বানায়)
//   ২. প্রতিটা row-এর "Order ID" দিয়ে আমাদের DB-তে ইতিমধ্যে থাকা Order খুঁজে বের করা
//      (orderNumber সরাসরি WooCommerce Order ID, import-export.ts:529 দেখুন)
//   ৩. পাওয়া গেলে: সেই order-এ প্রতিটা real note তার আসল তারিখ সহ db.orderNote.create()
//      দিয়ে সরাসরি বসানো — কখনো addOrderNote()/sendOrderEmail() কল হয় না, তাই
//      পুরনো কোনো customer email এখন আবার পাঠানো হয় না।
//   ৪. সেই order-এর পুরনো generic "WooCommerce থেকে import করা হয়েছে (v15 CSV)"
//      placeholder note থাকলে সেটা মুছে দেওয়া (আসল note চলে এসেছে বলে)।
//
// প্রথমে DRY RUN (কিছু লেখে না, শুধু কী হতো তা দেখায়) — --commit ফ্ল্যাগ ছাড়া কিছু
// সেভ হবে না।

import 'dotenv/config';
import fs from 'fs';
import Papa from 'papaparse';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const csvPath = process.argv[2];
const COMMIT = process.argv.includes('--commit');

if (!csvPath) {
  console.error('Usage: node _tmp-backfill-real-order-notes.mjs <csv-path> [--commit]');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const PLACEHOLDER_NOTE = 'WooCommerce থেকে import করা হয়েছে (v15 CSV)';

// WordPress-এর comment_date স্থানীয় (Sydney) সময়ে থাকে, UTC না — import-export.ts-এর
// orderDate parsing-এর সাথে সামঞ্জস্যপূর্ণ রাখতে একই +10:00 trick ব্যবহার করা হলো।
function parseWpLocalDate(raw) {
  if (!raw) return new Date();
  const iso = raw.trim().replace(' ', 'T') + '+10:00';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function main() {
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  console.log(`CSV rows: ${rows.length} | mode: ${COMMIT ? 'COMMIT' : 'DRY RUN'}`);

  let ordersMatched = 0;
  let ordersNotFound = 0;
  let notesCreated = 0;
  let placeholdersRemoved = 0;
  let ordersWithPlaceholder = 0;
  const notFoundIds = [];

  for (const row of rows) {
    const orderNum = String(row['Order ID'] || '').trim();
    const notesJsonRaw = row['Notes JSON'];
    if (!orderNum || !notesJsonRaw) continue;

    let notes;
    try {
      notes = JSON.parse(notesJsonRaw);
    } catch {
      console.warn(`  ⚠ Skipping order ${orderNum} — invalid Notes JSON`);
      continue;
    }
    if (!Array.isArray(notes) || notes.length === 0) continue;

    const order = await db.order.findUnique({
      where: { orderNumber: orderNum },
      select: { id: true },
    });

    if (!order) {
      ordersNotFound++;
      notFoundIds.push(orderNum);
      continue;
    }

    ordersMatched++;

    const existingPlaceholder = await db.orderNote.findFirst({
      where: { orderId: order.id, content: PLACEHOLDER_NOTE },
      select: { id: true },
    });
    if (existingPlaceholder) ordersWithPlaceholder++;

    if (COMMIT) {
      for (const note of notes) {
        await db.orderNote.create({
          data: {
            orderId: order.id,
            content: note.content || '(empty note)',
            isSystem: false, // real, historically-typed content — not our synthetic placeholder
            notify: false,   // কখনো email trigger করা হয় না — শুধু raw create
            createdAt: parseWpLocalDate(note.date),
          },
        });
        notesCreated++;
      }

      if (existingPlaceholder) {
        await db.orderNote.delete({ where: { id: existingPlaceholder.id } });
        placeholdersRemoved++;
      }
    } else {
      notesCreated += notes.length;
    }
  }

  console.log('---');
  console.log(`Orders matched:            ${ordersMatched}`);
  console.log(`Orders NOT found in DB:    ${ordersNotFound}`);
  if (notFoundIds.length) console.log(`  (missing IDs sample): ${notFoundIds.slice(0, 15).join(', ')}`);
  console.log(`Orders with placeholder note: ${ordersWithPlaceholder}`);
  console.log(`Real notes ${COMMIT ? 'created' : 'that would be created'}: ${notesCreated}`);
  if (COMMIT) console.log(`Placeholder notes removed: ${placeholdersRemoved}`);
  console.log(COMMIT ? '\n✅ Committed.' : '\nThis was a DRY RUN — re-run with --commit to actually write.');

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
