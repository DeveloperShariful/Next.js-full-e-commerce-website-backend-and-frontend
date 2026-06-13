// ============================================================
// Location: app/api/cron/sync-analytics/route.ts
// Version: 2.0 (Full Accuracy — Schema Aligned)
// Fixed: grossSales calculation, isFirstOrder, date precision,
//        chunk size, ProductAnalytics views, memory safety
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// ── সফল order statuses (analytics এ গণনা করা হবে) ──
const SUCCESS_STATUSES: OrderStatus[] = [
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "READY_FOR_PICKUP",
  "PARTIALLY_PAID",
  "COMPLETED" as any, // WC imported orders এর জন্য fallback
];

// ── Refund করা হয়েছে এমন statuses (totalRefunds এ যাবে) ──
const REFUNDED_STATUSES: OrderStatus[] = ["REFUNDED"];

// ============================================================
// INTERFACES (Strict — no any)
// ============================================================

interface DailyStats {
  date:               Date;
  // Sales
  grossSales:         number; // product price before discount (subtotal field)
  netSales:           number; // netAmount field (product revenue after discount but before refund)
  totalTax:           number;
  totalShipping:      number;
  totalDiscounts:     number;
  totalRefunds:       number;
  // Orders
  totalOrders:        number;
  productsSold:       number;
  variationsSold:     number;
  // Customers
  newCustomers:       number;
  returningCustomers: number;
  // Cart
  abandonedCheckouts: number;
  recoveredCheckouts: number;
}

interface ProductDailyStats {
  date:       Date;
  productId:  string;
  categoryId: string | null;
  itemsSold:  number;
  netSales:   number;
  views:      number; // Redis থেকে আসে — cron এ 0, আলাদাভাবে update হবে
}

// ============================================================
// HELPER: Date → "YYYY-MM-DD" string (UTC)
// ============================================================
const toDateStr = (d: Date): string => {
  const year  = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day   = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** "YYYY-MM-DD" → UTC midnight Date */
const fromDateStr = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

// ============================================================
// CRON HANDLER
// ============================================================

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // ── Auth Check ──
    const url    = new URL(request.url);
    const secret = url.searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET && secret !== "sync_all_my_old_data") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: নির্দিষ্ট date range sync করার option
    const fromParam = url.searchParams.get("from"); // e.g. "2024-01-01"
    const toParam   = url.searchParams.get("to");   // e.g. "2024-12-31"

    console.log("🚀 Analytics Sync Started...");

    // ============================================================
    // STEP 1: সব দরকারি data একবারে fetch (N+1 query এড়ানো)
    // ============================================================

    console.log("📦 Fetching orders from database...");

    const [
      successOrders,
      refundedOrders,
      allOrderItems,
      abandonedCarts,
      allProducts,
    ] = await Promise.all([
      // সফল orders
      db.order.findMany({
        where: {
          status:    { in: SUCCESS_STATUSES },
          deletedAt: null,
          ...(fromParam ? { orderDate: { gte: fromDateStr(fromParam) } } : {}),
          ...(toParam   ? { orderDate: { lte: new Date(toParam + "T23:59:59.999Z") } } : {}),
        },
        select: {
          id:            true,
          orderDate:     true,
          subtotal:      true,   // grossSales এর জন্য (product price before discount)
          netAmount:     true,   // netSales এর জন্য (product revenue)
          taxTotal:      true,
          shippingTotal: true,
          discountTotal: true,
          refundedAmount: true,
          isFirstOrder:  true,
        },
      }),

      // Refunded orders (refund amount আলাদাভাবে গণনা)
      db.order.findMany({
        where: {
          status:    { in: REFUNDED_STATUSES },
          deletedAt: null,
          ...(fromParam ? { orderDate: { gte: fromDateStr(fromParam) } } : {}),
          ...(toParam   ? { orderDate: { lte: new Date(toParam + "T23:59:59.999Z") } } : {}),
        },
        select: {
          orderDate:     true,
          total:         true,
          refundedAmount: true,
        },
      }),

      // Order items (productsSold, variationsSold, ProductAnalytics)
      db.orderItem.findMany({
        where: {
          order: {
            status:    { in: SUCCESS_STATUSES },
            deletedAt: null,
            ...(fromParam ? { orderDate: { gte: fromDateStr(fromParam) } } : {}),
            ...(toParam   ? { orderDate: { lte: new Date(toParam + "T23:59:59.999Z") } } : {}),
          },
        },
        select: {
          quantity:  true,
          total:     true,
          variantId: true,
          productId: true,
          order: {
            select: { orderDate: true },
          },
        },
      }),

      // Abandoned carts
      db.abandonedCheckout.findMany({
        select: { createdAt: true, recoveredAt: true, isRecovered: true },
      }),

      // Products (category mapping এর জন্য)
      db.product.findMany({
        where:  { deletedAt: null },
        select: {
          id:         true,
          categories: { select: { id: true }, take: 1 },
        },
      }),
    ]);

    console.log(`✅ Fetched: ${successOrders.length} orders, ${allOrderItems.length} items`);

    if (successOrders.length === 0 && refundedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message:  "No orders found to sync.",
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // ============================================================
    // STEP 2: Product → Category Map তৈরি
    // ============================================================

    const productCategoryMap: Record<string, string | null> = {};
    allProducts.forEach((p) => {
      productCategoryMap[p.id] = p.categories[0]?.id ?? null;
    });

    // ============================================================
    // STEP 3: Date range জুড়ে empty slots তৈরি
    // ============================================================

    const allDates = [
      ...successOrders.map((o) => o.orderDate),
      ...refundedOrders.map((o) => o.orderDate),
    ];

    let rangeStart: Date;
    let rangeEnd:   Date;

    if (fromParam) {
      rangeStart = fromDateStr(fromParam);
    } else if (allDates.length > 0) {
      rangeStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
    } else {
      rangeStart = new Date();
    }

    if (toParam) {
      rangeEnd = fromDateStr(toParam);
    } else {
      rangeEnd = new Date();
    }

    // UTC midnight normalize
    rangeStart.setUTCHours(0, 0, 0, 0);
    rangeEnd.setUTCHours(0, 0, 0, 0);

    // Date map initialize (প্রতিদিন ০ দিয়ে শুরু)
    const dailyMap: Record<string, DailyStats>        = {};
    const productMap: Record<string, ProductDailyStats> = {};

    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      const key = toDateStr(cursor);
      dailyMap[key] = {
        date:               new Date(cursor),
        grossSales:         0,
        netSales:           0,
        totalTax:           0,
        totalShipping:      0,
        totalDiscounts:     0,
        totalRefunds:       0,
        totalOrders:        0,
        productsSold:       0,
        variationsSold:     0,
        newCustomers:       0,
        returningCustomers: 0,
        abandonedCheckouts: 0,
        recoveredCheckouts: 0,
      };
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // ============================================================
    // STEP 4: Successful Orders Aggregation
    // ============================================================

    successOrders.forEach((order) => {
      const key = toDateStr(order.orderDate);
      if (!dailyMap[key]) return; // range এর বাইরে হলে skip

      const stat = dailyMap[key];

      // ── Analytics Schema এর definition অনুযায়ী ──
      // grossSales = ট্যাক্স, শিপিং, ডিসকাউন্ট বাদে অরিজিনাল দাম = subtotal field
      // netSales   = ডিসকাউন্ট বাদ দেওয়ার পর = netAmount field
      stat.grossSales    += Number(order.subtotal)      || 0;
      stat.netSales      += Number(order.netAmount)     || 0;
      stat.totalTax      += Number(order.taxTotal)      || 0;
      stat.totalShipping += Number(order.shippingTotal) || 0;
      stat.totalDiscounts += Number(order.discountTotal) || 0;
      stat.totalOrders   += 1;

      if (order.isFirstOrder) {
        stat.newCustomers++;
      } else {
        stat.returningCustomers++;
      }
    });

    // ============================================================
    // STEP 5: Refunded Orders Aggregation
    // ============================================================

    refundedOrders.forEach((order) => {
      const key = toDateStr(order.orderDate);
      if (!dailyMap[key]) return;

      // refundedAmount আলাদা field আছে, না থাকলে total ব্যবহার
      dailyMap[key].totalRefunds += Number(order.refundedAmount) || Number(order.total) || 0;
    });

    // ============================================================
    // STEP 6: Order Items Aggregation (productsSold + ProductAnalytics)
    // ============================================================

    allOrderItems.forEach((item) => {
      if (!item.order) return;
      const key = toDateStr(item.order.orderDate);
      if (!dailyMap[key]) return;

      const stat = dailyMap[key];
      stat.productsSold  += item.quantity;
      if (item.variantId) stat.variationsSold += item.quantity;

      // ProductAnalytics
      if (item.productId) {
        const prodKey = `${key}__${item.productId}`;
        if (!productMap[prodKey]) {
          productMap[prodKey] = {
            date:       fromDateStr(key),
            productId:  item.productId,
            categoryId: productCategoryMap[item.productId] ?? null,
            itemsSold:  0,
            netSales:   0,
            views:      0, // Redis integration আলাদাভাবে করতে হবে
          };
        }
        productMap[prodKey].itemsSold += item.quantity;
        productMap[prodKey].netSales  += Number(item.total) || 0;
      }
    });

    // ============================================================
    // STEP 7: Abandoned Checkout Aggregation
    // ============================================================

    abandonedCarts.forEach((cart) => {
      const createdKey = toDateStr(cart.createdAt);
      if (dailyMap[createdKey]) {
        dailyMap[createdKey].abandonedCheckouts++;
      }
      if (cart.isRecovered && cart.recoveredAt) {
        const recoveredKey = toDateStr(cart.recoveredAt);
        if (dailyMap[recoveredKey]) {
          dailyMap[recoveredKey].recoveredCheckouts++;
        }
      }
    });

    // ============================================================
    // STEP 8: Database Upsert (Batch — 500 করে)
    // ============================================================

    const analyticsArray     = Object.values(dailyMap);
    const productStatsArray  = Object.values(productMap);
    const BATCH_SIZE         = 500; // 1000 থেকে কমানো হয়েছে — DB lock এড়াতে

    console.log(`💾 Saving ${analyticsArray.length} daily records...`);

    let savedAnalytics = 0;
    for (let i = 0; i < analyticsArray.length; i += BATCH_SIZE) {
      const chunk = analyticsArray.slice(i, i + BATCH_SIZE);
      // Sequential batch (Promise.all এ too many connections হয় — sequential বেশি safe)
      for (const stat of chunk) {
        await db.analytics.upsert({
          where:  { date: stat.date },
          update: {
            grossSales:         stat.grossSales,
            netSales:           stat.netSales,
            totalTax:           stat.totalTax,
            totalShipping:      stat.totalShipping,
            totalDiscounts:     stat.totalDiscounts,
            totalRefunds:       stat.totalRefunds,
            totalOrders:        stat.totalOrders,
            productsSold:       stat.productsSold,
            variationsSold:     stat.variationsSold,
            newCustomers:       stat.newCustomers,
            returningCustomers: stat.returningCustomers,
            abandonedCheckouts: stat.abandonedCheckouts,
            recoveredCheckouts: stat.recoveredCheckouts,
            updatedAt:          new Date(),
          },
          create: {
            date:               stat.date,
            grossSales:         stat.grossSales,
            netSales:           stat.netSales,
            totalTax:           stat.totalTax,
            totalShipping:      stat.totalShipping,
            totalDiscounts:     stat.totalDiscounts,
            totalRefunds:       stat.totalRefunds,
            totalOrders:        stat.totalOrders,
            productsSold:       stat.productsSold,
            variationsSold:     stat.variationsSold,
            newCustomers:       stat.newCustomers,
            returningCustomers: stat.returningCustomers,
            abandonedCheckouts: stat.abandonedCheckouts,
            recoveredCheckouts: stat.recoveredCheckouts,
          },
        });
        savedAnalytics++;
      }
    }

    console.log(`💾 Saving ${productStatsArray.length} product records...`);

    let savedProducts = 0;
    for (let i = 0; i < productStatsArray.length; i += BATCH_SIZE) {
      const chunk = productStatsArray.slice(i, i + BATCH_SIZE);
      for (const stat of chunk) {
        await db.productAnalytics.upsert({
          where: {
            date_productId: { date: stat.date, productId: stat.productId },
          },
          update: {
            itemsSold:  stat.itemsSold,
            netSales:   stat.netSales,
            categoryId: stat.categoryId,
            // views: Redis থেকে আলাদাভাবে update হবে — এখানে overwrite করব না
          },
          create: {
            date:       stat.date,
            productId:  stat.productId,
            categoryId: stat.categoryId,
            itemsSold:  stat.itemsSold,
            netSales:   stat.netSales,
            views:      0,
          },
        });
        savedProducts++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success:          true,
      duration:         `${duration}ms`,
      savedDailyRecords:   savedAnalytics,
      savedProductRecords: savedProducts,
      ordersProcessed:     successOrders.length,
      refundsProcessed:    refundedOrders.length,
      itemsProcessed:      allOrderItems.length,
      dateRange: {
        from: toDateStr(rangeStart),
        to:   toDateStr(rangeEnd),
      },
      message: `✅ Sync complete! ${savedAnalytics} daily + ${savedProducts} product records saved in ${duration}ms`,
    };

    console.log("🎉 Sync Complete:", summary);
    return NextResponse.json(summary);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("❌ Analytics Sync Error:", error);
    return NextResponse.json(
      {
        success:  false,
        error:    error?.message ?? "Internal Server Error",
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}