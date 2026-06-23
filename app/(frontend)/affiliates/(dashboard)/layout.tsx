// File: app/(frontend)/affiliates/(dashboard)/layout.tsx

import { redirect } from "next/navigation";
import { AlertTriangle, Ban, LifeBuoy, ArrowLeft, Clock, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { getAuthAffiliate } from "@/app/actions/frontend/affiliate/auth-helper";
import { db } from "@/lib/prisma";
import { GlobalStoreProvider } from "@/app/providers/global-store-provider";
import { serializePrismaData } from "@/lib/format-data";
import {
  getCachedStoreSettings,
  getCachedSeoConfig,
  getCachedMarketingConfig,
  getCachedPaymentMethods,
  getCachedPickupLocations,
} from "@/lib/global-settings-cache";

export default async function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authSession = await getAuthAffiliate();
  const userId = authSession.userId;

  // Fetch affiliate account + cached store data in parallel
  const [affiliateAccount, settings, seo, marketing, paymentMethods, pickupLocations] = await Promise.all([
    db.affiliateAccount.findUnique({
      where: { userId },
      select: { id: true, status: true, slug: true },
    }),
    getCachedStoreSettings(),
    getCachedSeoConfig(),
    getCachedMarketingConfig(),
    getCachedPaymentMethods(),
    getCachedPickupLocations(),
  ]);

  const generalConfig = settings?.generalConfig as { enableAffiliateProgram?: boolean } | null;
  const isProgramActive = generalConfig?.enableAffiliateProgram ?? false;

  if (!isProgramActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Program Under Maintenance</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            The partner program is currently paused by the administrator. Please check back later.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black hover:underline transition-all">
            <ArrowLeft className="w-4 h-4" /> Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (!affiliateAccount) {
    redirect("/affiliates/register");
  }

  if (affiliateAccount.status === "SUSPENDED" || affiliateAccount.status === "REJECTED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-2xl text-center border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-lg font-medium text-red-600 mb-4">Account Status: {affiliateAccount.status}</p>
          <p className="text-gray-500 mb-8">
            Your partner account has been deactivated. You can no longer access the dashboard.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Back to Home</Link>
            <a href={`mailto:${settings?.storeEmail || "support@gobike.au"}`} className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4" /> Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (affiliateAccount.status === "PENDING") {
    const supportEmail = settings?.storeEmail || "support@gobike.au";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-violet-100">
              <Clock className="w-10 h-10 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
            <p className="text-violet-600 font-semibold text-sm mb-4">Status: Pending Approval</p>
            <p className="text-gray-500 leading-relaxed mb-6">
              Your affiliate application has been received and is currently being reviewed by our team.
              We typically approve applications within <strong className="text-gray-700">1–3 business days</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">What happens next?</p>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">Our team will review your application</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">You&apos;ll receive an email once your account is approved</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">After approval, your full affiliate dashboard will unlock</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm no-underline">
                <ArrowLeft className="w-4 h-4" /> Back to Store
              </Link>
              <a href={`mailto:${supportEmail}`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 text-sm no-underline">
                <Mail className="w-4 h-4" /> Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rawData = {
    settings: {
      storeSettings: {
        storeName: settings?.storeName || "",
        storeEmail: settings?.storeEmail,
        storePhone: settings?.storePhone,
        currency: settings?.currency || "",
        currencySymbol: settings?.currencySymbol || "",
        weightUnit: settings?.weightUnit || "",
        dimensionUnit: settings?.dimensionUnit || "",
        logo: settings?.logo,
        favicon: settings?.favicon,
        maintenance: settings?.maintenance || false,
        storeAddress: settings?.storeAddress,
        socialLinks: settings?.socialLinks,
        generalConfig: settings?.generalConfig,
        taxSettings: settings?.taxSettings,
        affiliateConfig: settings?.affiliateConfig,
        logoMedia: settings?.logoMedia,
        faviconMedia: settings?.faviconMedia,
      },
      seoConfig: seo ? {
        siteName: seo.siteName || "",
        titleSeparator: seo.titleSeparator || "|",
        siteUrl: seo.siteUrl || "",
        defaultMetaTitle: seo.defaultMetaTitle,
        defaultMetaDesc: seo.defaultMetaDesc,
        ogImage: seo.ogImage,
        twitterCard: seo.twitterCard || "summary_large_image",
        twitterSite: seo.twitterSite,
        themeColor: seo.themeColor,
        robotsTxtContent: seo.robotsTxtContent,
        organizationData: seo.organizationData,
        manifestJson: seo.manifestJson,
        ogMedia: seo.ogMedia,
      } : null,
      marketingConfig: marketing ? {
        gtmEnabled: marketing.gtmEnabled,
        gtmContainerId: marketing.gtmContainerId,
        gtmAuth: marketing.gtmAuth,
        gtmPreview: marketing.gtmPreview,
        fbEnabled: marketing.fbEnabled,
        fbPixelId: marketing.fbPixelId,
        klaviyoEnabled: marketing.klaviyoEnabled,
        klaviyoPublicKey: marketing.klaviyoPublicKey,
        cookieConsentRequired: false,
      } : null,
    },
    paymentMethods: paymentMethods || [],
    pickupLocations: pickupLocations || [],
  };

  const cleanData = serializePrismaData(rawData);

  return (
    <GlobalStoreProvider
      settings={cleanData.settings}
      paymentMethods={cleanData.paymentMethods}
      pickupLocations={cleanData.pickupLocations}
    >
      <div className="bg-gray-50 min-h-screen">{children}</div>
    </GlobalStoreProvider>
  );
}
