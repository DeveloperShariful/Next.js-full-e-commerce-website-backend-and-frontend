// File: app/(admin)/admin/settings/affiliate/general/page.tsx

import { configService } from "@/app/actions/admin/settings/affiliates/_services/config-service";
import AffiliateGeneralConfigForm from "./_components/config-form";
import { AffiliateGeneralSettings } from "@/app/actions/admin/settings/affiliates/types";

export const metadata = {
  title: "General Settings | Affiliate Program",
};

export default async function GeneralSettingsPage() {
  const settings = await configService.getSettings();

  const defaultValues: AffiliateGeneralSettings = settings || {
    isActive: false,
    programName: "GoBike Partner Program",
    termsUrl: "",
    excludeShipping: true,
    excludeTax: true,
    autoApplyCoupon: false,
    zeroValueReferrals: false,
    referralParam: "ref",
    customSlugsEnabled: false,
    autoCreateSlug: false,
    slugLimit: 5,
    cookieDuration: 30,
    allowSelfReferral: false,
    isLifetimeLinkOnPurchase: false,
    lifetimeDuration: null,
    holdingPeriod: 14,
    autoApprovePayout: false,
    minimumPayout: 50,
    payoutMethods: ["STORE_CREDIT"],
  };

  return (
    <div className="space-y-6">
      {/* Note: We removed the header text here because it's now inside the form tabs */}
      <AffiliateGeneralConfigForm initialData={defaultValues} />
    </div>
  );
}