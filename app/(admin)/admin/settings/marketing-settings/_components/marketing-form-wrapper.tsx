// File: app/(admin)/admin/settings/marketing-settings/_components/marketing-form-wrapper.tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

import { MarketingSettingsSchema, MarketingSettingsValues } from "@/app/(admin)/admin/settings/marketing-settings/_schema/marketing-validation";
import { updateMarketingConfig } from "@/app/actions/admin/settings/marketing-settings/update-marketing-config";

import { GtmIntegrationCard } from "./gtm-integration-card";
import { SearchConsoleCard } from "./search-console-card";
import { MerchantMainView } from "./merchant-center/merchant-main-view";
import { FacebookPixelCard } from "./facebook-pixel-card";
import { KlaviyoIntegrationCard } from "./klaviyo-integration-card";
// ✅ Import the Profiles Table
import { KlaviyoProfilesTable } from "./klaviyo-profiles-table"; 

interface MarketingFormWrapperProps {
  initialData: any; 
}

export default function MarketingFormWrapper({ initialData }: MarketingFormWrapperProps) {
  const [isPending, startTransition] = useTransition();

  // Helper to safely get nested objects
  const klaviyoLists = initialData?.klaviyoListIds || {};
  const verifyStatus = initialData?.verificationStatus || {};

  const form = useForm({
    resolver: zodResolver(MarketingSettingsSchema),
    defaultValues: {
      // Google GTM
      gtmEnabled: initialData?.gtmEnabled ?? false,
      gtmContainerId: initialData?.gtmContainerId ?? "",
      gtmAuth: initialData?.gtmAuth ?? "",
      gtmPreview: initialData?.gtmPreview ?? "",
      dataLayerName: initialData?.dataLayerName ?? "dataLayer",
      
      // Google Search Console
      gscVerificationCode: initialData?.gscVerificationCode ?? "",
      gscServiceAccountJson: initialData?.gscServiceAccountJson ?? "",
      
      // Google Merchant Center
      gmcMerchantId: initialData?.gmcMerchantId ?? "",
      gmcContentApiEnabled: initialData?.gmcContentApiEnabled ?? false,
      gmcTargetCountry: initialData?.gmcTargetCountry ?? "AU",
      gmcLanguage: initialData?.gmcLanguage ?? "en",
      
      // Facebook
      fbEnabled: initialData?.fbEnabled ?? false,
      fbPixelId: initialData?.fbPixelId ?? "",
      fbAccessToken: initialData?.fbAccessToken ?? "",
      fbTestEventCode: initialData?.fbTestEventCode ?? "",
      fbDomainVerification: initialData?.fbDomainVerification ?? "",
      fbDataProcessingOptions: initialData?.fbDataProcessingOptions 
        ? JSON.stringify(initialData.fbDataProcessingOptions) 
        : "", 
      
      // Klaviyo
      klaviyoEnabled: initialData?.klaviyoEnabled ?? false,
      klaviyoPublicKey: initialData?.klaviyoPublicKey ?? "",
      klaviyoPrivateKey: initialData?.klaviyoPrivateKey ?? "",
      klaviyoTrackViewedProduct: initialData?.klaviyoTrackViewedProduct ?? true,
      klaviyoTrackAddedToCart: initialData?.klaviyoTrackAddedToCart ?? true,
      
      // Nested Objects
      klaviyoListIds: {
        newsletter: klaviyoLists.newsletter ?? "",
        abandonedCart: klaviyoLists.abandonedCart ?? ""
      },

      // Verification Status
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
                form.setError(field as any, { 
                    type: "manual", 
                    message: message as string 
                });
            });
        }
      }

      if (result.newStatus) {
        form.setValue("verificationStatus", result.newStatus, { 
            shouldValidate: true, 
            shouldDirty: false, 
            shouldTouch: true 
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Integrations & Marketing</h1>
            <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "Verifying..." : "Verify & Save"}
                </Button>
            </div>
        </div>

        <Tabs defaultValue="gtm" className="w-full">
          <TabsList className="flex w-full overflow-x-auto max-w-[800px] h-auto p-1">
            <TabsTrigger value="gtm" className="flex-1">Tag Manager</TabsTrigger>
            <TabsTrigger value="gsc" className="flex-1">Search Console</TabsTrigger>
            <TabsTrigger value="gmc" className="flex-1">Merchant Center</TabsTrigger>
            <TabsTrigger value="facebook" className="flex-1">Facebook</TabsTrigger>
            <TabsTrigger value="klaviyo" className="flex-1">Klaviyo</TabsTrigger>
            {/* ✅ NEW: Profiles Tab Trigger */}
            <TabsTrigger value="profiles" className="flex-1">Klaviyo Profiles</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="gtm"><GtmIntegrationCard /></TabsContent>
            <TabsContent value="gsc"><SearchConsoleCard /></TabsContent>
            <TabsContent value="gmc"><MerchantMainView /></TabsContent>
            <TabsContent value="facebook"><FacebookPixelCard /></TabsContent>
            <TabsContent value="klaviyo"><KlaviyoIntegrationCard /></TabsContent>
            
            {/* ✅ NEW: Profiles Tab Content */}
            <TabsContent value="profiles">
                {/* We render the profiles table here. 
                    It handles its own data fetching, so it works independently of the form submit. */}
                <KlaviyoProfilesTable />
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </Form>
  );
}