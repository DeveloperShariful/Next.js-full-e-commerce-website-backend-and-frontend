// File: app/(frontend)/affiliates/layout.tsx

import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { getAuthAffiliate } from "@/app/actions/frontend/affiliate/auth-helper";
import { AlertTriangle, Ban, LifeBuoy, ArrowLeft, Clock, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";

export default async function AffiliateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // ✅ FIX: ফাংশনটি কল করে ডাটা একটি ভেরিয়েবলে নিলাম
  const authSession = await getAuthAffiliate();
  
  // ✅ FIX: অবজেক্ট থেকে userId (string) বের করলাম
  const userId = authSession.userId; 

  // 2. Fetch Account & Global Settings
  const [affiliateAccount, settings] = await Promise.all([
    db.affiliateAccount.findUnique({
      where: { userId }, // ✅ এখন এটি স্ট্রিং পাচ্ছে, তাই এরর হবে না
      select: { id: true, status: true, slug: true }
    }),
    db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true, storeEmail: true }
    })
  ]);

  // 3. Global Program Status Check
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

  // 4. Registration Check
  if (!affiliateAccount) {
    redirect("/affiliates/register");
  }

  // 5. Suspension Check
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

  // 6. PENDING — application submitted but not yet approved
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

  return <div className="bg-gray-50 min-h-screen">{children}</div>;
}