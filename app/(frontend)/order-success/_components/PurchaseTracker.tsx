"use client";

import { useEffect } from "react";
import { gtmPurchase } from "@/lib/gtm";
import { klaviyoTrackPlacedOrder } from "@/lib/klaviyo";

interface TrackedItem {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  total: number;
  image: string;
}

interface PurchaseTrackerProps {
  orderId: string;
  orderNumber: string;
  total: number;
  tax: number;
  shipping: number;
  items: TrackedItem[];
}

export default function PurchaseTracker({
  orderId,
  orderNumber,
  total,
  tax,
  shipping,
  items,
}: PurchaseTrackerProps) {
  useEffect(() => {
    const gtmItems = items.map((item, i) => ({
      item_name: item.name,
      // ফলব্যাক শুধু বিরল কেসের জন্য — product পরে ডিলিট হয়ে গেলে productId null হতে পারে
      item_id: item.productId || `${orderNumber}-${i}`,
      price: item.price,
      quantity: item.quantity,
    }));

    gtmPurchase({
      transaction_id: orderNumber,
      value: total,
      tax,
      shipping,
      currency: "AUD",
      items: gtmItems,
    });

    const klaviyoItems = items.map((item, i) => ({
      ProductID: item.productId || `${orderNumber}-${i}`,
      ProductName: item.name,
      Quantity: item.quantity,
      ItemPrice: item.price,
      RowTotal: item.total,
      ProductURL: "/",
      ImageURL: item.image,
    }));

    klaviyoTrackPlacedOrder({
      order_id: orderId,
      value: total,
      item_names: items.map((i) => i.name),
      checkout_url: "/checkout",
      items: klaviyoItems,
    });
  }, []); // fire once on mount

  return null;
}
