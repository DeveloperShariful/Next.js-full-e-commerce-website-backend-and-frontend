// app/api/cron/transdirect-status-sync/route.ts
//
// প্রতি ৩০ মিনিটে চলে (vercel.json দেখুন) — active shipment-গুলোর real-time
// status Transdirect থেকে poll করে, বদলালে Order status/fulfillment আপডেট করে
// এবং customer-কে সঠিক ইমেইল পাঠায় (Shipped/In Transit/Delivered)। আসল লজিক
// app/actions/backend/shipment/shipment.ts-এর refreshTransdirectStatuses()-এ —
// এটা সেই একই function যা admin Shipments পেজের "Refresh Status" বাটনও ব্যবহার
// করে, দুই জায়গাতেই consistent আচরণ থাকার জন্য।

import { NextResponse } from "next/server";
import { refreshTransdirectStatuses } from "@/app/actions/backend/shipment/shipment";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshTransdirectStatuses();

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
