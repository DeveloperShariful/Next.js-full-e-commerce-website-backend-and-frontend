// _tmp-fix-backfilled-notes-design.mjs
//
// একটা সম্পূর্ণ আলাদা, one-off follow-up script — শুধু design ঠিক করার জন্য।
// আগের backfill script (_tmp-backfill-real-order-notes.mjs) সব real note-কে
// isSystem: false দিয়ে বসিয়েছিল (blue "private note" style), কিন্তু এই
// content-গুলো আসলে সব automated/system-generated log (Stripe/PayPal
// confirmation, status change, ইত্যাদি) — ঠিক এই app-এর অন্য জায়গার মতোই
// (webhook, status-update ইত্যাদি) এগুলোকেও isSystem: true হওয়া উচিত
// (gray "(System)" style)।
//
// এই script একই CSV থেকে প্রতিটা note-এর orderId + content + createdAt
// মিলিয়ে খুঁজে বের করে *শুধু* সেই note-গুলোর isSystem flag true করে —
// content/date/orderId কিছুই বদলায় না, অন্য কোনো (মানুষের হাতে লেখা)
// note-ও ছোঁয়া হয় না।
//
// ব্যবহার: node _tmp-fix-backfilled-notes-design.mjs <csv-path> [--commit]

import 'dotenv/config';
import fs from 'fs';
import Papa from 'papaparse';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const csvPath = process.argv[2];
const COMMIT = process.argv.includes('--commit');

if (!csvPath) {
  console.error('Usage: node _tmp-fix-backfilled-notes-design.mjs <csv-path> [--commit]');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

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

  let ordersProcessed = 0;
  let ordersNotFound = 0;
  let notesMatched = 0;
  let notesFlipped = 0;
  let notesAlreadySystem = 0;
  let notesNotFound = 0;

  for (const row of rows) {
    const orderNum = String(row['Order ID'] || '').trim();
    const notesJsonRaw = row['Notes JSON'];
    if (!orderNum || !notesJsonRaw) continue;

    let notes;
    try {
      notes = JSON.parse(notesJsonRaw);
    } catch {
      continue;
    }
    if (!Array.isArray(notes) || notes.length === 0) continue;

    const order = await db.order.findUnique({
      where: { orderNumber: orderNum },
      select: { id: true },
    });

    if (!order) {
      ordersNotFound++;
      continue;
    }

    ordersProcessed++;

    for (const note of notes) {
      const content = note.content || '(empty note)';
      const createdAt = parseWpLocalDate(note.date);

      const existing = await db.orderNote.findFirst({
        where: { orderId: order.id, content, createdAt },
        select: { id: true, isSystem: true },
      });

      if (!existing) {
        notesNotFound++;
        continue;
      }

      notesMatched++;

      if (existing.isSystem) {
        notesAlreadySystem++;
        continue;
      }

      if (COMMIT) {
        await db.orderNote.update({
          where: { id: existing.id },
          data: { isSystem: true },
        });
      }
      notesFlipped++;
    }
  }

  console.log('---');
  console.log(`Orders processed:          ${ordersProcessed}`);
  console.log(`Orders NOT found:          ${ordersNotFound}`);
  console.log(`Notes matched (found in DB): ${notesMatched}`);
  console.log(`Notes NOT found in DB:      ${notesNotFound}`);
  console.log(`Notes already isSystem=true: ${notesAlreadySystem}`);
  console.log(`Notes ${COMMIT ? 'flipped to' : 'that would be flipped to'} isSystem=true: ${notesFlipped}`);
  console.log(COMMIT ? '\n✅ Committed.' : '\nThis was a DRY RUN — re-run with --commit to actually write.');

  await db.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
