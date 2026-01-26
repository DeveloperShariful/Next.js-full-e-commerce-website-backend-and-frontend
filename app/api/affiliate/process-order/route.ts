//app/api/affiliate/process-order/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { commissionService } from "@/app/actions/storefront/affiliates/_services/commission-service";
import { AffiliateConfigDTO } from "@/app/actions/admin/settings/affiliates/types";

// এটি ইন্টারনাল API, তাই সিকিউরিটি টোকেন ব্যবহার করা ভালো
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      orderId, 
      userId, 
      affiliateSlug, // কুকি থেকে পাওয়া স্লাগ
      totalAmount, 
      subtotal, 
      items 
    } = body;

    // ১. অর্ডার চেক করা
    const order = await db.order.findUnique({ 
      where: { id: orderId },
      include: { referral: true }
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.referral) return NextResponse.json({ message: "Referral already processed" });

    // ২. এফিলিয়েট আইডেন্টিফাই করা
    let affiliateId: string | null = null;

    // A. কুকি থেকে চেক
    if (affiliateSlug) {
      const affiliate = await db.affiliateAccount.findUnique({ where: { slug: affiliateSlug } });
      if (affiliate && affiliate.status === "ACTIVE") {
        // Self-Referral চেক
        const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
        const config = (settings?.affiliateConfig as AffiliateConfigDTO) || {};
        
        const isOwnOrder = affiliate.userId === userId;
        if (!isOwnOrder || config.allowSelfReferral) {
          affiliateId = affiliate.id;
        }
      }
    }

    // B. লাইফটাইম লিংকিং চেক (যদি কুকি না থাকে)
    if (!affiliateId && userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.referredByAffiliateId) {
        affiliateId = user.referredByAffiliateId;
      }
    }

    if (!affiliateId) {
      return NextResponse.json({ message: "No affiliate attribution found" });
    }

    // ৩. কমিশন ক্যালকুলেশন
    // কনফিগ চেক করা (Tax/Shipping বাদ দেওয়া হবে কিনা)
    const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const config = (settings?.affiliateConfig as AffiliateConfigDTO) || {};
    
    // কনফিগ অনুযায়ী বেস অ্যামাউন্ট ঠিক করা (Subtotal নাকি Total)
    const baseAmount = (config.excludeShipping || config.excludeTax) 
      ? Number(subtotal) 
      : Number(totalAmount);

    // সার্ভিস কল করে কমিশন বের করা
    const commissionData = await commissionService.calculateCommission(affiliateId, {
      orderTotal: baseAmount,
      itemCount: items.length,
      isNewCustomer: false, // এটি চেক করার লজিক বসাতে হবে
      productIds: items.map((i: any) => i.productId),
      categoryIds: [] // প্রোডাক্ট থেকে ক্যাটাগরি বের করে পাঠাতে হবে
    });

    if (commissionData.amount <= 0) {
      return NextResponse.json({ message: "Commission amount is zero" });
    }

    // ৪. ডাটাবেস আপডেট (Transaction)
    await db.$transaction(async (tx) => {
      
      // A. Referral রেকর্ড তৈরি
      const referral = await tx.referral.create({
        data: {
          affiliateId: affiliateId!,
          orderId: order.id,
          totalOrderAmount: baseAmount,
          netOrderAmount: baseAmount,
          commissionAmount: commissionData.amount,
          commissionRate: commissionData.rate,
          commissionType: commissionData.type,
          status: "APPROVED", // অথবা "PENDING" (যদি হোল্ডিং পিরিয়ড থাকে)
          metadata: { source: commissionData.source }
        }
      });

      // B. এফিলিয়েট ব্যালেন্স আপডেট
      const updatedAffiliate = await tx.affiliateAccount.update({
        where: { id: affiliateId! },
        data: {
          balance: { increment: commissionData.amount },
          totalEarnings: { increment: commissionData.amount },
          // লাইফটাইম লিংকিং সেট করা (যদি কনফিগার করা থাকে)
          ...(userId && config.isLifetimeLinkOnPurchase ? {
             customerReferrals: { connect: { id: userId } }
          } : {})
        }
      });

      // C. লেজার এন্ট্রি (অডিট লগ)
      await tx.affiliateLedger.create({
        data: {
          affiliateId: affiliateId!,
          type: "COMMISSION",
          amount: commissionData.amount,
          balanceBefore: updatedAffiliate.balance.toNumber() - commissionData.amount,
          balanceAfter: updatedAffiliate.balance.toNumber(),
          referenceId: referral.id,
          description: `Commission for Order #${order.orderNumber}`
        }
      });
      
    });

    return NextResponse.json({ success: true, affiliateId });

  } catch (error: any) {
    console.error("Order Processing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}