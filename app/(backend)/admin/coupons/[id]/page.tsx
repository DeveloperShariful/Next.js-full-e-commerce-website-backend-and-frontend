// File: app/(backend)/admin/coupons/[id]/page.tsx

import { notFound } from "next/navigation";
import { getCouponById, getAffiliateEnabled } from "@/app/actions/backend/coupon/coupon";
import EditCouponPage from "./_components/edit-coupon-page";

interface CouponEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CouponEditServerPage({ params }: CouponEditPageProps) {
  const { id } = await params;

  const [result, affiliateEnabled] = await Promise.all([
    getCouponById(id),
    getAffiliateEnabled(),
  ]);

  if (!result.success || !result.data) notFound();

  return <EditCouponPage coupon={result.data} affiliateEnabled={affiliateEnabled} />;
}
