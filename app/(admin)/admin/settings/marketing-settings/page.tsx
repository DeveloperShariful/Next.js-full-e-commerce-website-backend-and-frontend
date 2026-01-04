// File: app/(admin)/admin/settings/marketing-settings/page.tsx
import { Metadata } from "next";
import { getMarketingConfig } from "@/app/actions/admin/settings/marketing-settings/get-marketing-config";
import MarketingFormWrapper from "./_components/marketing-form-wrapper";

export const metadata: Metadata = {
  title: "Marketing Integrations | Admin",
  description: "Manage GTM, Facebook Pixel and Klaviyo settings",
};

export default async function MarketingSettingsPage() {
  const config = await getMarketingConfig();

  // Convert potential nulls to undefined or empty strings if needed by Zod schema
  // But our wrapper handles null initialData gracefully
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <MarketingFormWrapper initialData={config as any} />
    </div>
  );
}