//app/actions/storefront/checkout/get-shipping-rates.ts

"use server";

import { db } from "@/lib/prisma";
import { getTransdirectQuotes } from "./get-transdirect-quotes";

export type ShippingOption = {
  id: string;
  label: string;
  cost: number;
};

interface RateParams {
  cartId: string;
  address: {
    city: string;
    postcode: string;
    state: string;
  };
}

export async function getShippingRates(params?: RateParams): Promise<ShippingOption[]> {
  try {
    // ১. স্টোর সেটিংস চেক করা (Pickup Enabled কিনা?)
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" }
    });
    
    // JSON থেকে সেটিং বের করা
    const generalConfig = settings?.generalConfig as any || {};
    const enablePickup = generalConfig.enablePickup === true; // Schema অনুযায়ী চেক

    // ২. ডিফল্ট রেসপন্স (যদি অ্যাড্রেস না থাকে)
    if (!params || !params.address.postcode || !params.address.city) {
      // যদি পিকআপ অন থাকে তবেই দেখাবে
      return enablePickup 
        ? [{ id: 'pickup', label: 'Local Pickup', cost: 0.00 }]
        : [];
    }

    // ৩. কার্ট আইটেম আনা
    const cart = await db.cart.findUnique({
      where: { id: params.cartId },
      include: {
        items: { include: { product: true, variant: true } }
      }
    });

    if (!cart || cart.items.length === 0) return [];

    // ৪. আইটেম ম্যাপ করা
    const itemsForQuote = cart.items.map(item => {
      const source = item.variant || item.product;
      return {
        weight: source.weight || 0.5,
        length: source.length || 10,
        width: source.width || 10,
        height: source.height || 10,
        quantity: item.quantity
      };
    });

    // ৫. Transdirect API কল
    const quoteResult = await getTransdirectQuotes({
      items: itemsForQuote,
      receiver: {
        postcode: params.address.postcode,
        suburb: params.address.city,
        state: params.address.state || "NSW",
        type: "residential"
      }
    });

    const dynamicRates: ShippingOption[] = [];

    // ৬. API রেট যোগ করা
    if (quoteResult.success && quoteResult.quotes.length > 0) {
      quoteResult.quotes.forEach((q: any) => {
        dynamicRates.push({
          id: q.id,
          label: `${q.name} (${q.transit_time || 'ETA N/A'})`,
          cost: q.price
        });
      });
    }

    // ৭. লোকাল পিকআপ অপশন যোগ করা (যদি এনাবল থাকে)
    if (enablePickup) {
        dynamicRates.push({ id: 'pickup', label: 'Local Pickup', cost: 0.00 });
    }

    return dynamicRates;

  } catch (error) {
    console.error("Get Shipping Rates Error:", error);
    // এরর হলে এবং পিকআপ অন থাকলে অন্তত পিকআপ দেখাবে
    const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const enablePickup = (settings?.generalConfig as any)?.enablePickup === true;
    
    return enablePickup ? [{ id: 'pickup', label: 'Local Pickup', cost: 0.00 }] : [];
  }
}