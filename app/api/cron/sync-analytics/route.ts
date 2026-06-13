// Location: app/api/cron/sync-analytics/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const SUCCESS_STATUSES: OrderStatus[] = [
  "PROCESSING", 
  "PACKED", 
  "SHIPPED", 
  "DELIVERED", 
  "READY_FOR_PICKUP", 
  "PARTIALLY_PAID"
];

// স্ট্রিক্ট ইন্টারফেস (No any)
interface DailyStats {
  date: Date;
  grossSales: number;
  netSales: number;
  totalTax: number;
  totalShipping: number;
  totalDiscounts: number;
  totalRefunds: number;
  totalOrders: number;
  productsSold: number;
  variationsSold: number;
  newCustomers: number;
  returningCustomers: number;
  abandonedCheckouts: number;
  recoveredCheckouts: number;
}

interface ProductStats {
  date: Date;
  productId: string;
  categoryId: string | null;
  itemsSold: number;
  netSales: number;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== "sync_all_my_old_data") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting Bulk Aggregation Sync...");

    // ১. ডাটাবেস থেকে সব অর্ডার, আইটেম এবং প্রোডাক্ট একসাথে নিয়ে আসা (শুধু দরকারি ফিল্ড)
    const [orders, orderItems, abandonedCarts, products] = await Promise.all([
      db.order.findMany({
        where: { status: { in: SUCCESS_STATUSES } },
        select: { orderDate: true, subtotal: true, netAmount: true, taxTotal: true, shippingTotal: true, discountTotal: true, refundedAmount: true, isFirstOrder: true }
      }),
      db.orderItem.findMany({
        where: { order: { status: { in: SUCCESS_STATUSES } } },
        select: { order: { select: { orderDate: true } }, quantity: true, total: true, variantId: true, productId: true }
      }),
      db.abandonedCheckout.findMany({
        select: { createdAt: true, recoveredAt: true, isRecovered: true }
      }),
      db.product.findMany({
        select: { id: true, categories: { select: { id: true }, take: 1 } }
      })
    ]);

    if (orders.length === 0) {
      return NextResponse.json({ message: "No successful orders found to sync." });
    }

    // প্রোডাক্ট ক্যাটাগরির ম্যাপ তৈরি (যাতে বার বার ডাটাবেসে না খুঁজতে হয়)
    const productCategoryMap: Record<string, string | null> = {};
    products.forEach(p => {
      productCategoryMap[p.id] = p.categories.length > 0 ? p.categories[0].id : null;
    });

    // ২. ডেট রেঞ্জ বের করা (প্রথম অর্ডার থেকে আজ পর্যন্ত)
    const firstOrderDate = new Date(Math.min(...orders.map(o => o.orderDate.getTime())));
    const today = new Date();
    
    // ৩. মেমোরিতে ডাটা গ্রুপ করার জন্য ম্যাপ তৈরি
    const dailyAnalyticsMap: Record<string, DailyStats> = {};
    const productAnalyticsMap: Record<string, ProductStats> = {};

    // 🔴 ১০০% নিখুঁত ডেট জেনারেটর (যেদিন অর্ডার জিরো, সেদিনও ০ হিসেবে ম্যাপে থাকবে)
    let pointerDate = new Date(firstOrderDate);
    pointerDate.setUTCHours(0,0,0,0);
    const endPointerDate = new Date(today);
    endPointerDate.setUTCHours(0,0,0,0);

    while (pointerDate <= endPointerDate) {
      const dayString = pointerDate.toISOString().split("T")[0]; // Example: "2026-06-01"
      dailyAnalyticsMap[dayString] = {
        date: new Date(pointerDate), // Strict start of day UTC
        grossSales: 0, netSales: 0, totalTax: 0, totalShipping: 0, 
        totalDiscounts: 0, totalRefunds: 0, totalOrders: 0, 
        productsSold: 0, variationsSold: 0, newCustomers: 0, 
        returningCustomers: 0, abandonedCheckouts: 0, recoveredCheckouts: 0
      };
      pointerDate.setUTCDate(pointerDate.getUTCDate() + 1);
    }

    // ৪. Orders Aggregation (মুহূর্তের মধ্যে সব অর্ডার ডেট অনুযায়ী যোগ হবে)
    orders.forEach(order => {
      const dayString = order.orderDate.toISOString().split("T")[0];
      if (!dailyAnalyticsMap[dayString]) return;

      const stat = dailyAnalyticsMap[dayString];
      stat.grossSales += Number(order.subtotal) || 0;
      stat.netSales += Number(order.netAmount) || 0;
      stat.totalTax += Number(order.taxTotal) || 0;
      stat.totalShipping += Number(order.shippingTotal) || 0;
      stat.totalDiscounts += Number(order.discountTotal) || 0;
      stat.totalRefunds += Number(order.refundedAmount) || 0;
      stat.totalOrders += 1;
      
      if (order.isFirstOrder) stat.newCustomers += 1;
      else stat.returningCustomers += 1;
    });

    // ৫. Order Items Aggregation (প্রোডাক্টস ও ভ্যারিয়েশন কাউন্ট)
    orderItems.forEach(item => {
      if (!item.order) return;
      const dayString = item.order.orderDate.toISOString().split("T")[0];
      if (!dailyAnalyticsMap[dayString]) return;

      const stat = dailyAnalyticsMap[dayString];
      stat.productsSold += item.quantity;
      if (item.variantId) stat.variationsSold += item.quantity;

      // Product Analytics (Leaderboards এর জন্য)
      if (item.productId) {
        const prodKey = `${dayString}_${item.productId}`;
        if (!productAnalyticsMap[prodKey]) {
          productAnalyticsMap[prodKey] = {
            date: new Date(stat.date),
            productId: item.productId,
            categoryId: productCategoryMap[item.productId] || null,
            itemsSold: 0,
            netSales: 0
          };
        }
        productAnalyticsMap[prodKey].itemsSold += item.quantity;
        productAnalyticsMap[prodKey].netSales += Number(item.total) || 0;
      }
    });

    // ৬. Abandoned Carts Aggregation
    abandonedCarts.forEach(cart => {
      const createdStr = cart.createdAt.toISOString().split("T")[0];
      if (dailyAnalyticsMap[createdStr]) {
        dailyAnalyticsMap[createdStr].abandonedCheckouts += 1;
      }
      if (cart.isRecovered && cart.recoveredAt) {
        const recoveredStr = cart.recoveredAt.toISOString().split("T")[0];
        if (dailyAnalyticsMap[recoveredStr]) {
          dailyAnalyticsMap[recoveredStr].recoveredCheckouts += 1;
        }
      }
    });

    // ৭. Bulk Database Upsert (ব্যাচ আকারে সেভ করা, সার্ভার হ্যাং হবে না)
    console.log("💾 Saving Analytics to Database...");
    
    const analyticsArray = Object.values(dailyAnalyticsMap);
    const productAnalyticsArray = Object.values(productAnalyticsMap);

    // 1000 টা করে চাংক তৈরি করা যাতে ডাটাবেস লক না হয়
    for (let i = 0; i < analyticsArray.length; i += 1000) {
      const chunk = analyticsArray.slice(i, i + 1000);
      await Promise.all(chunk.map(stat => 
        db.analytics.upsert({
          where: { date: stat.date },
          update: { ...stat },
          create: { ...stat }
        })
      ));
    }

    for (let i = 0; i < productAnalyticsArray.length; i += 1000) {
      const chunk = productAnalyticsArray.slice(i, i + 1000);
      await Promise.all(chunk.map(stat => 
        db.productAnalytics.upsert({
          where: { date_productId: { date: stat.date, productId: stat.productId } },
          update: { itemsSold: stat.itemsSold, netSales: stat.netSales, categoryId: stat.categoryId },
          create: { ...stat }
        })
      ));
    }

    return NextResponse.json({ 
      success: true, 
      message: `Historical data synced successfully! Processed ${analyticsArray.length} days and ${productAnalyticsArray.length} product records.` 
    });

  } catch (error) {
    console.error("Historical Sync Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}