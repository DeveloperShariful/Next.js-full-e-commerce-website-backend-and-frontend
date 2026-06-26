// File Location: app/(backend)/admin/coupons/create/page.tsx

import { getAffiliateEnabled } from "@/app/actions/backend/coupon/coupon";
import CreateCouponClient from "./_components/create-coupon-client";

export default async function CreateCouponPage() {
  const affiliateEnabled = await getAffiliateEnabled();
  return <CreateCouponClient affiliateEnabled={affiliateEnabled} />;
}
