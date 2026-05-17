// File: app/actions/order/create-order/generate-order-number.ts

"use server";

import { db } from "@/lib/prisma";

export async function generateNextOrderNumber() {
  try {
    // ১. ডাটাবেস থেকে সর্বশেষ অর্ডারটি খুঁজে বের করা
    const lastOrder = await db.order.findFirst({
      orderBy: { createdAt: 'desc' }, // একদম লেটেস্ট অর্ডার
      select: { orderNumber: true }
    });

    let nextNumber = 1001; // ডিফল্ট শুরু হবে ১০০১ থেকে

    if (lastOrder && lastOrder.orderNumber) {
        // যদি আগের অর্ডার থাকে, সেখান থেকে নাম্বার বের করা (যেমন "#1005" -> 1005)
        const cleanString = lastOrder.orderNumber.replace(/\D/g, ''); // শুধু সংখ্যা রাখা
        const lastNumber = parseInt(cleanString);

        if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    // নতুন নাম্বার রিটার্ন করা (যেমন: "#1006")
    return `#${nextNumber}`;

  } catch (error) {
    // যদি কোনো সমস্যা হয়, ফলব্যাক হিসেবে টাইমস্ট্যাম্প ব্যবহার করা হবে
    return `#${Date.now()}`; 
  }
}