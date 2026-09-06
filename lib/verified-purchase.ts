// lib/verified-purchase.ts
//
// একটা review-কে সত্যিই "Verified Purchase" বলা যাবে কিনা — এটা চেক করার একটাই
// জায়গা, যাতে নতুন review submit হওয়ার সময় আর পুরনো review backfill করার সময়
// দুই জায়গায় একই logic ব্যবহার হয় (কখনো আলাদা হয়ে না যায়)।
//
// শর্ত (তিনটাই একসাথে সত্যি হতে হবে):
//   ১. Order-টা সত্যিই সম্পন্ন হয়েছে (DELIVERED/COMPLETED — শুধু PENDING/PROCESSING
//      না, কারণ টাকা দেওয়া বা জিনিস হাতে পাওয়ার আগে "verified" বলা যায় না)
//   ২. Order-টা এই reviewer-এরই (account থাকলে userId মিলিয়ে, নাহলে email মিলিয়ে)
//   ৩. সেই Order-এ ঠিক এই productId-টাই ছিল
//
// এটা ইচ্ছাকৃতভাবে রক্ষণশীল — email/product না মিললে false-ই থাকে, কখনো অনুমান
// করে true ধরে নেওয়া হয় না (fake verified-purchase claim এড়াতে)।

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

const QUALIFYING_ORDER_STATUSES: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.COMPLETED];

export async function checkVerifiedPurchase(params: {
  userId?: string | null;
  email?: string | null;
  productId: string;
}): Promise<boolean> {
  const { userId, email, productId } = params;
  if (!userId && !email) return false;

  const normalizedEmail = email?.toLowerCase().trim();

  const order = await db.order.findFirst({
    where: {
      status: { in: QUALIFYING_ORDER_STATUSES },
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(normalizedEmail ? [{ guestEmail: normalizedEmail }] : []),
      ],
      items: { some: { productId } },
    },
    select: { id: true },
  });

  return !!order;
}
