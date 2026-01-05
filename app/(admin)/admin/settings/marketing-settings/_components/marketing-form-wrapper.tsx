// File: app/(admin)/admin/settings/marketing-settings/_components/marketing-form-wrapper.tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, Save } from "lucide-react"; // Icon added

import { MarketingSettingsSchema, MarketingSettingsValues } from "@/app/(admin)/admin/settings/marketing-settings/_schema/marketing-validation";
import { updateMarketingConfig } from "@/app/actions/admin/settings/marketing-settings/update-marketing-config";

import { GtmIntegrationCard } from "./gtm/gtm-integration-card";
import { SearchConsoleCard } from "./search-console/search-console-card";
import { MerchantMainView } from "./merchant-center/merchant-main-view";
import { FacebookPixelCard } from "./facebook/facebook-pixel-card";
import { KlaviyoIntegrationCard } from "./klaviyo/klaviyo-integration-card";
import { KlaviyoProfilesTable } from "./klaviyo/klaviyo-profiles-table"; 

interface MarketingFormWrapperProps {
  initialData: any; 
}

export default function MarketingFormWrapper({ initialData }: MarketingFormWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const klaviyoLists = initialData?.klaviyoListIds || {};
  const verifyStatus = initialData?.verificationStatus || {};

  const form = useForm({
    resolver: zodResolver(MarketingSettingsSchema),
    defaultValues: {
      gtmEnabled: initialData?.gtmEnabled ?? false,
      gtmContainerId: initialData?.gtmContainerId ?? "",
      gtmAuth: initialData?.gtmAuth ?? "",
      gtmPreview: initialData?.gtmPreview ?? "",
      dataLayerName: initialData?.dataLayerName ?? "dataLayer",
      gscVerificationCode: initialData?.gscVerificationCode ?? "",
      gscServiceAccountJson: initialData?.gscServiceAccountJson ?? "",
      gmcMerchantId: initialData?.gmcMerchantId ?? "",
      gmcContentApiEnabled: initialData?.gmcContentApiEnabled ?? false,
      gmcTargetCountry: initialData?.gmcTargetCountry ?? "AU",
      gmcLanguage: initialData?.gmcLanguage ?? "en",
      fbEnabled: initialData?.fbEnabled ?? false,
      fbPixelId: initialData?.fbPixelId ?? "",
      fbAccessToken: initialData?.fbAccessToken ?? "",
      fbTestEventCode: initialData?.fbTestEventCode ?? "",
      fbDomainVerification: initialData?.fbDomainVerification ?? "",
      fbDataProcessingOptions: initialData?.fbDataProcessingOptions 
        ? JSON.stringify(initialData.fbDataProcessingOptions) 
        : "", 
      klaviyoEnabled: initialData?.klaviyoEnabled ?? false,
      klaviyoPublicKey: initialData?.klaviyoPublicKey ?? "",
      klaviyoPrivateKey: initialData?.klaviyoPrivateKey ?? "",
      klaviyoTrackViewedProduct: initialData?.klaviyoTrackViewedProduct ?? true,
      klaviyoTrackAddedToCart: initialData?.klaviyoTrackAddedToCart ?? true,
      klaviyoListIds: {
        newsletter: klaviyoLists.newsletter ?? "",
        abandonedCart: klaviyoLists.abandonedCart ?? ""
      },
      verificationStatus: {
        gtm: verifyStatus.gtm ?? false,
        facebook: verifyStatus.facebook ?? false,
        klaviyo: verifyStatus.klaviyo ?? false,
        searchConsole: verifyStatus.searchConsole ?? false,
        merchantCenter: verifyStatus.merchantCenter ?? false,
      }
    },
  });

  function onSubmit(values: MarketingSettingsValues) {
    startTransition(async () => {
      const result = await updateMarketingConfig(values);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, message]) => {
                form.setError(field as any, { type: "manual", message: message as string });
            });
        }
      }
      if (result.newStatus) {
        form.setValue("verificationStatus", result.newStatus, { shouldValidate: true, shouldDirty: false, shouldTouch: true });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-full overflow-hidden">
        
        {/* Header - Mobile Friendly */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Integrations & Marketing</h1>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isPending && <Save className="mr-2 h-4 w-4" />}
                {isPending ? "Saving..." : "Verify & Save"}
            </Button>
        </div>

        {/* ✅ FIX: Scrollable Tabs for Mobile */}
        <Tabs defaultValue="gtm" className="w-full">
          <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
            <TabsList className="inline-flex w-auto h-auto p-1 justify-start">
              <TabsTrigger value="gtm">Tag Manager</TabsTrigger>
              <TabsTrigger value="gsc">Search Console</TabsTrigger>
              <TabsTrigger value="gmc">Merchant Center</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="klaviyo">Klaviyo</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-4 sm:mt-6">
            <TabsContent value="gtm"><GtmIntegrationCard /></TabsContent>
            <TabsContent value="gsc"><SearchConsoleCard /></TabsContent>
            <TabsContent value="gmc"><MerchantMainView /></TabsContent>
            <TabsContent value="facebook"><FacebookPixelCard /></TabsContent>
            <TabsContent value="klaviyo"><KlaviyoIntegrationCard /></TabsContent>
            <TabsContent value="profiles"><KlaviyoProfilesTable /></TabsContent>
          </div>
        </Tabs>
      </form>
    </Form>
  );
}