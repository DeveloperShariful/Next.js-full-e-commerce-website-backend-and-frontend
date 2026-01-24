// File: app/(admin)/admin/settings/affiliate/general/page.tsx

import { configService } from "@/app/actions/admin/settings/affiliate/_services/config-service";
import AffiliateGeneralConfigForm from "../_components/features/general/config-form";
import { AffiliateGeneralSettings } from "@/app/actions/admin/settings/affiliate/types";

export const metadata = {
  title: "General Settings | Affiliate Program",
};

/**
 * SERVER COMPONENT
 * Fetches the configuration from DB and passes it to the Client Form.
 */
export default async function GeneralSettingsPage() {
  const settings = await configService.getSettings();

  // 🔥 FIX: আমরা এখানে 'AffiliateGeneralSettings' টাইপ ব্যবহার করছি
  // যাতে নিশ্চিত হওয়া যায় যে সব নতুন ফিল্ড (Exclude Tax, Slugs etc.) এখানে আছে।
  const defaultValues: AffiliateGeneralSettings = settings || {
    // --- 1. General ---
    isActive: false,
    programName: "GoBike Partner Program",
    termsUrl: "",

    // --- 2. Commission Logic ---
    excludeShipping: true,
    excludeTax: true,
    autoApplyCoupon: false,
    zeroValueReferrals: false,

    // --- 3. Links ---
    referralParam: "ref",
    customSlugsEnabled: false,
    autoCreateSlug: false,
    slugLimit: 5,

    // --- 4. Tracking ---
    cookieDuration: 30,
    allowSelfReferral: false,
    isLifetimeLinkOnPurchase: false,
    lifetimeDuration: null,

    // --- 5. Payouts ---
    holdingPeriod: 14,
    autoApprovePayout: false,
    minimumPayout: 50,
    payoutMethods: ["STORE_CREDIT"],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">General Configuration</h2>
        <p className="text-sm text-gray-500">
          Manage the core behavior, tracking cookies, and payout rules.
        </p>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* এখন আর এরর দেবে না কারণ defaultValues এর মধ্যে সব ডাটা আছে */}
      <AffiliateGeneralConfigForm initialData={defaultValues} />
    </div>
  );
}