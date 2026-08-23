//File: app/(backend)/admin/visitors/[id]/page.tsx

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVisitorDetail } from "@/app/actions/backend/visitors/visitor-insights.actions";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { formatTz } from "@/lib/store-time";

interface PageProps {
  params: Promise<{ id: string }>;
}

function ProofRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="py-3 px-4 border-b border-[#f0f0f1] last:border-b-0 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4">
      <span className="text-[13px] font-semibold text-[#50575e]">{label}</span>
      <span className={`text-[13px] text-[#2c3338] break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default async function VisitorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [visit, timezone] = await Promise.all([getVisitorDetail(id), getStoreTimezone()]);

  if (!visit) notFound();

  return (
    <div className="w-full max-w-[900px]">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Visitor Detail</h1>
        <Link
          href="/admin/visitors"
          className="inline-flex items-center gap-1 border border-[#2271b1] text-[#2271b1] px-3 py-1.5 text-[13px] font-medium rounded-[3px] hover:bg-[#2271b1] hover:text-white transition-colors bg-white shadow-sm"
        >
          &larr; Back to Visitors
        </Link>
      </div>

      <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white mb-6">
        <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9]">
          <span className="text-[13px] font-semibold text-[#1d2327]">Classified As</span>
        </div>
        <ProofRow label="Channel" value={<span className="capitalize font-semibold">{visit.channel}</span>} />
        <ProofRow label="Country" value={visit.country || "Unknown (no IP-geo header — normal on localhost)"} />
        <ProofRow label="City" value={visit.city || "—"} />
        <ProofRow label="Device" value={visit.deviceType || "—"} />
        <ProofRow label="Visit Time" value={formatTz(visit.createdAt, timezone, "MMMM d, yyyy 'at' h:mm:ss a")} />
      </div>

      <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white mb-6">
        <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9]">
          <span className="text-[13px] font-semibold text-[#1d2327]">Raw Proof (exactly what the browser/platform sent)</span>
        </div>
        <ProofRow label="IP Address" value={visit.ipAddress || "Unknown (no IP header — normal on localhost)"} mono />
        <ProofRow label="Landing Page" value={visit.landingPage} mono />
        <ProofRow label="Referrer" value={visit.referrer || "None sent (email client / private browsing / typed directly)"} mono />
        <ProofRow
          label="Ad Click ID"
          value={
            visit.clickId ? (
              <span className="bg-[#fff8e5] px-1.5 py-0.5 rounded-sm border border-[#f0d896]">{visit.clickId}</span>
            ) : (
              "None present"
            )
          }
          mono
        />
        <ProofRow label="utm_source" value={visit.utmSource || "—"} mono />
        <ProofRow label="utm_medium" value={visit.utmMedium || "—"} mono />
        <ProofRow label="utm_campaign" value={visit.utmCampaign || "—"} mono />
        <ProofRow label="utm_content" value={visit.utmContent || "—"} mono />
        <ProofRow label="utm_term" value={visit.utmTerm || "—"} mono />
      </div>

      <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9]">
          <span className="text-[13px] font-semibold text-[#1d2327]">Visitor Identity</span>
        </div>
        <ProofRow label="Anonymous Visitor ID" value={visit.visitorId} mono />
        <p className="p-4 text-[12px] text-[#646970] bg-[#f6f7f7]">
          This is a long-lived, anonymous browser cookie ID — not linked to any customer account. It lets us tell
          repeat visits from the same browser apart from brand-new visitors, without identifying who the person is.
        </p>
      </div>
    </div>
  );
}
