// File Location: app/actions/admin/orders/get-orders.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { storeDayStart, storeDayEnd } from "@/lib/store-time";
import { getStoreTimezone } from "@/lib/get-store-timezone";

export async function getOrders(
  page: number = 1, 
  limit: number = 20, 
  status?: string, 
  query?: string,
  startDate?: string,
  endDate?: string,
  paymentMethod?: string
) {
  try {
    const skip = (page - 1) * limit;
    const isTrashMode = status === 'trash';

    // Accurate Timezone Calculation for Full Day — store-এর local timezone
    // অনুযায়ী (server-এর নিজের UTC ঘড়ি অনুযায়ী না, যেটা আগে .setHours()
    // ব্যবহার করে ভুলভাবে করা হচ্ছিল — Sydney-তে সকাল ১০টার আগে "আজ"-এর
    // অর্ডার "গতকাল"-এর bucket-এ পড়ে যেত)।
    const timezone = await getStoreTimezone();
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = storeDayStart(startDate, timezone);
    }

    if (endDate) {
      parsedEndDate = storeDayEnd(endDate, timezone);
    }

    // 🔥 FIXED: Separate Base Filter array created
    // এটি ডেট, পেমেন্ট মেথড এবং সার্চ কোয়ারিগুলো ধরে রাখবে।
    const baseFilterParams: Prisma.OrderWhereInput[] = [];

    const trimmedQuery = (query || '').trim();
    if (trimmedQuery.length >= 3) {
      // JSON path string_contains is case-sensitive in PostgreSQL.
      // Generate all practical case variants so "shariful" finds "Shariful" etc.
      const qLower = trimmedQuery.toLowerCase();
      const qUpper = trimmedQuery.toUpperCase();
      const qTitle = trimmedQuery.charAt(0).toUpperCase() + trimmedQuery.slice(1).toLowerCase();
      const qVariants = [...new Set([trimmedQuery, qLower, qUpper, qTitle])];

      // Expands one JSON field into OR conditions for every case variant
      const jSearch = (
        field: 'billingAddress' | 'shippingAddress',
        path: string[]
      ): Prisma.OrderWhereInput[] =>
        qVariants.map(q => ({ [field]: { path, string_contains: q } } as Prisma.OrderWhereInput));

      baseFilterParams.push({
        OR: [
          // Standard string fields — already case-insensitive via mode: 'insensitive'
          { orderNumber:           { contains: trimmedQuery, mode: 'insensitive' } },
          { paymentId:             { contains: trimmedQuery, mode: 'insensitive' } },
          { transdirectBookingRef: { contains: trimmedQuery, mode: 'insensitive' } },
          { user: { name:  { contains: trimmedQuery, mode: 'insensitive' } } },
          { user: { email: { contains: trimmedQuery, mode: 'insensitive' } } },
          { guestEmail: { contains: trimmedQuery, mode: 'insensitive' } },
          { items: { some: { productName: { contains: trimmedQuery, mode: 'insensitive' } } } },
          // JSON address fields — case-insensitive via case variants
          ...jSearch('billingAddress',  ['firstName']),
          ...jSearch('billingAddress',  ['lastName']),
          ...jSearch('billingAddress',  ['email']),
          ...jSearch('billingAddress',  ['phone']),
          ...jSearch('billingAddress',  ['address1']),
          ...jSearch('billingAddress',  ['city']),
          ...jSearch('shippingAddress', ['firstName']),
          ...jSearch('shippingAddress', ['lastName']),
          ...jSearch('shippingAddress', ['phone']),
          ...jSearch('shippingAddress', ['address1']),
          ...jSearch('shippingAddress', ['city']),
        ]
      });
    }

    if (parsedStartDate) {
      baseFilterParams.push({ createdAt: { gte: parsedStartDate } });
    }

    if (parsedEndDate) {
      baseFilterParams.push({ createdAt: { lte: parsedEndDate } });
    }

    if (paymentMethod && paymentMethod !== "all") {
      baseFilterParams.push({
        OR: [
            { paymentGateway: { contains: paymentMethod, mode: 'insensitive' } },
            { paymentMethod: { contains: paymentMethod, mode: 'insensitive' } }
        ]
      });
    }

    const whereCondition: Prisma.OrderWhereInput = {
      AND: [
        ...baseFilterParams,
        isTrashMode ? { deletedAt: { not: null } } : { deletedAt: null },
        status && status !== "all" && status !== "trash" ? { status: status as OrderStatus } : {}
      ]
    };

    const [orders, totalCount, statusCounts, trashCount] = await Promise.all([
      db.order.findMany({
        where: whereCondition,
        include: {
          user: { select: { name: true, email: true } },
          affiliate: {
            include: {
              user: { select: { name: true } }
            }
          },
          items: { select: { quantity: true } }, 
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),

      db.order.count({ where: whereCondition }),

      // 🔥 FIXED: GroupBy now uses baseFilterParams 
      // ফলে ডেট সিলেক্ট করলে শুধু ওই ডেটের Pending, Processing কাউন্ট হবে!
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { 
          AND: [
            ...baseFilterParams,
            { deletedAt: null }
          ] 
        }
      }),

      // 🔥 FIXED: Trash count also respects date & search filters
      db.order.count({
        where: { 
          AND: [
            ...baseFilterParams,
            { deletedAt: { not: null } }
          ] 
        }
      })
    ]);

    const serializedOrders = orders.map(order => ({
        ...order,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        taxTotal: Number(order.taxTotal),
        shippingTotal: Number(order.shippingTotal),
        discountTotal: Number(order.discountTotal),
        refundedAmount: Number(order.refundedAmount || 0),
    }));

    // যে order-এর নিজস্ব utmSource/referringSite নেই (checkout-এর সময়
    // localStorage খালি ছিল — যেমন device বদল করে অর্ডার করা, বা browser data
    // মুছে ফেলা), তাদের জন্য visitorId দিয়ে SiteVisit-এ ওই visitor-এর প্রথম
    // (first-touch) সেশনের real channel খুঁজে fallback হিসেবে দেওয়া হচ্ছে —
    // batched, একটাই extra query (N+1 না), তাই performance ঠিক থাকে।
    const missingAttributionVisitorIds = [...new Set(
      serializedOrders
        .filter((o) => !o.utmSource && !o.referringSite && o.visitorId)
        .map((o) => o.visitorId as string)
    )];

    let fallbackChannelByVisitorId = new Map<string, string>();
    if (missingAttributionVisitorIds.length > 0) {
      const fallbackVisits = await db.siteVisit.findMany({
        where: { visitorId: { in: missingAttributionVisitorIds } },
        orderBy: { createdAt: "asc" },
        select: { visitorId: true, channel: true },
        distinct: ["visitorId"],
      });
      fallbackChannelByVisitorId = new Map(fallbackVisits.map((v) => [v.visitorId, v.channel]));
    }

    const enrichedOrders = serializedOrders.map((order) => ({
      ...order,
      fallbackChannel: order.visitorId ? fallbackChannelByVisitorId.get(order.visitorId) ?? null : null,
    }));

    const counts = {
      all:             statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
      pending:         statusCounts.find(s => s.status === 'PENDING')?._count.status || 0,
      processing:      statusCounts.find(s => s.status === 'PROCESSING')?._count.status || 0,
      completed:       statusCounts.find(s => s.status === 'DELIVERED')?._count.status || 0,
      cancelled:       statusCounts.find(s => s.status === 'CANCELLED')?._count.status || 0,
      refunded:        statusCounts.find(s => s.status === 'REFUNDED')?._count.status || 0,
      failed:          statusCounts.find(s => s.status === 'FAILED')?._count.status || 0,
      draft:           statusCounts.find(s => s.status === 'DRAFT')?._count.status || 0,
      awaitingPayment: statusCounts.find(s => s.status === 'AWAITING_PAYMENT')?._count.status || 0,
      packed:          statusCounts.find(s => s.status === 'PACKED')?._count.status || 0,
      shipped:         statusCounts.find(s => s.status === 'SHIPPED')?._count.status || 0,
      returned:        statusCounts.find(s => s.status === 'RETURNED')?._count.status || 0,
      readyForPickup:  statusCounts.find(s => s.status === 'READY_FOR_PICKUP')?._count.status || 0,
      partiallyPaid:   statusCounts.find(s => s.status === 'PARTIALLY_PAID')?._count.status || 0,
      trash:           trashCount
    };

    return {
      success: true,
      data: enrichedOrders,
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit), counts }
    };

  } catch (error: unknown) {
    console.error("GET_ORDERS_ERROR", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        affiliate: { include: { user: true } },
        referrals: { select: { commissionRate: true, commissionType: true, commissionAmount: true }, take: 1 },
        subscription: true,
        items: {
            include: {
                product: {
                  select: {
                    id: true,
                    stock: true,
                    name: true,
                    featuredImage: true,
                    costPerItem: true
                  }
                }
            }
        },
        shipments: { orderBy: { shippedDate: 'desc' } },
        pickupLocation: true, 
        transactions: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        disputes: true, 
        discount: true, 
        returns: true, 
        orderNotes: { orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!order) return { success: false, error: "Order not found" };

    // checkout-এর সময় নিজস্ব UTM/referrer capture না হলে (device বদল, browser
    // data মোছা ইত্যাদি), visitorId দিয়ে SiteVisit-এ ওই visitor-এর প্রথম সেশনের
    // real channel খুঁজে fallback হিসেবে দেওয়া হচ্ছে (উচ্চ নির্ভরযোগ্যতা — একই
    // browser cookie)। visitorId দিয়েও কিছু না পেলে (cookie block/private
    // browsing), IP দিয়ে শেষ চেষ্টা — কিন্তু IP shared হতে পারে (office wifi,
    // mobile carrier NAT), তাই এটা কম নির্ভরযোগ্য: order-এর ২৪ ঘণ্টার মধ্যে,
    // সবচেয়ে কাছের সময়ের match নেওয়া হচ্ছে (দূরের match ভুল হওয়ার ঝুঁকি বেশি),
    // আর fallbackSource দিয়ে UI-তে confidence আলাদা করে দেখানো হয়।
    let fallbackChannel: string | null = null;
    let fallbackSource: "visitor" | "ip" | null = null;
    const hasOwnAttribution = order.utmSource || order.utmMedium || order.utmCampaign || order.referringSite;

    if (!hasOwnAttribution) {
      if (order.visitorId) {
        const firstVisit = await db.siteVisit.findFirst({
          where: { visitorId: order.visitorId },
          orderBy: { createdAt: "asc" },
          select: { channel: true },
        });
        if (firstVisit) {
          fallbackChannel = firstVisit.channel;
          fallbackSource = "visitor";
        }
      }

      if (!fallbackChannel && order.ipAddress) {
        const windowStart = new Date(order.createdAt.getTime() - 24 * 60 * 60 * 1000);
        const ipMatch = await db.siteVisit.findFirst({
          where: { ipAddress: order.ipAddress, createdAt: { gte: windowStart, lte: order.createdAt } },
          orderBy: { createdAt: "desc" },
          select: { channel: true },
        });
        if (ipMatch) {
          fallbackChannel = ipMatch.channel;
          fallbackSource = "ip";
        }
      }
    }

    return { success: true, data: { ...order, fallbackChannel, fallbackSource } };

  } catch (error) {
    console.error("GET_ORDER_DETAILS_ERROR", error);
    return { success: false, error: "Database error" };
  }
}