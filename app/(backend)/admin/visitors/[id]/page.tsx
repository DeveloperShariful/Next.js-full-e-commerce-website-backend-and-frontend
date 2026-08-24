//File: app/(backend)/admin/visitors/[id]/page.tsx

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getVisitorDetail } from "@/app/actions/backend/visitors/visitor-insights.actions";
import { getStoreTimezone } from "@/lib/get-store-timezone";
import { formatTz } from "@/lib/store-time";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

function ProofRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="py-2 sm:py-3 px-2 sm:px-4 border-b border-[#f0f0f1] last:border-b-0 grid grid-cols-[90px_1fr] sm:grid-cols-[180px_1fr] gap-2 sm:gap-4">
      <span className="text-[12px] sm:text-[13px] font-semibold text-[#50575e]">{label}</span>
      <span className={`text-[12px] sm:text-[13px] text-[#2c3338] break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// পেজ hide/close হওয়ার আগেই sendBeacon ফায়ার না হলে (ট্যাব crash, বা এখনো
// browsing করছে) durationSeconds কখনো null থাকতে পারে — সেটা honestly জানানো হয়।
function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Not captured (tab closed too fast, or still browsing)";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default async function VisitorDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const [visit, timezone] = await Promise.all([getVisitorDetail(id), getStoreTimezone()]);

  if (!visit) notFound();

  // যে ট্যাব/date-range/search filter থেকে এসেছিল, ঠিক সেখানেই ফিরে যাবে —
  // নাহলে সবসময় ডিফল্ট Overview ট্যাবে রিসেট হয়ে যেত, filter/page হারিয়ে যেত।
  const backHref = from || "/admin/visitors";

  return (
    <div className="w-full">
      <div className="mb-1.5">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[13px] text-[#2271b1] hover:text-[#135e96] hover:underline"
        >
          <ChevronLeft size={14} /> Back to Visitors
        </Link>
      </div>
      <h1 className="text-[23px] font-normal text-[#1d2327] mb-6">Visitor Detail</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* === LEFT COLUMN === */}
        <div className="space-y-6">
          <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white">
            <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9]">
              <span className="text-[13px] font-semibold text-[#1d2327]">Classified As</span>
            </div>
            <ProofRow label="Channel" value={<span className="capitalize font-semibold">{visit.channel}</span>} />
            <ProofRow label="Country" value={visit.country || "Unknown (no IP-geo header — normal on localhost)"} />
            <ProofRow label="City" value={visit.city || "—"} />
            <ProofRow label="Device" value={visit.deviceType || "—"} />
            <ProofRow label="Visit Time" value={formatTz(visit.createdAt, timezone, "MMMM d, yyyy 'at' h:mm:ss a")} />
            <ProofRow label="Time on Site" value={formatDuration(visit.durationSeconds)} />
            <ProofRow
              label="Reached Checkout"
              value={
                visit.reachedCheckout ? (
                  <span className="text-[#996800] font-semibold">Yes</span>
                ) : (
                  <span className="text-[#646970]">No</span>
                )
              }
            />
            <ProofRow
              label="Converted (Order Placed)"
              value={
                visit.convertedOrder ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#00a32a] font-semibold">Yes</span> —{" "}
                    <Link href={`/admin/orders/${visit.convertedOrder.id}`} className="text-[#2271b1] hover:underline">
                      Order #{visit.convertedOrder.orderNumber}
                    </Link>
                  </span>
                ) : (
                  <span className="text-[#646970]">No order placed by this visitor yet</span>
                )
              }
            />
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

        {/* === RIGHT COLUMN === */}
        <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white">
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
      </div>
    </div>
  );
}
