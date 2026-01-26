//File: app/(admin)/admin/settings/affiliate/kyc/page.tsx

import { kycService } from "@/app/actions/admin/settings/affiliates/_services/kyc-service";
import KycManager from "./_components/kyc-manager";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Identity Verification | Affiliate Admin",
};

export default async function KycPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const status = params.status || "PENDING";

  const { documents } = await kycService.getDocuments(page, 20, status === "ALL" ? undefined : status);

  const pendingCount = await kycService.getPendingCount();

  const formattedDocs = documents.map(doc => ({
    ...doc,
    documentNumber: doc.documentNumber || "N/A"
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            Identity Verification (KYC)
          </h2>
          <p className="text-sm text-gray-500">
            Review and verify affiliate identity documents before allowing payouts.
          </p>
        </div>
        
        {pendingCount > 0 && (
            <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg border border-orange-100 text-sm font-medium animate-pulse">
                {pendingCount} Documents Waiting for Review
            </div>
        )}
      </div>
      
      <div className="h-px bg-gray-200" />

      <KycManager initialDocuments={formattedDocs} />
    </div>
  );
}