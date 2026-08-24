//File: app/(backend)/admin/visitors/_components/visitor-log-table.tsx

import React from "react";
import Link from "next/link";
import { formatTz } from "@/lib/store-time";
import type { VisitorLogPage } from "@/app/actions/backend/visitors/visitor-insights.actions";

interface Props {
  log: VisitorLogPage;
  timezone: string;
  basePathWithQuery: string; // pagination লিংক বানানোর জন্য বাকি সব query param সহ base path
}

export default function VisitorLogTable({ log, timezone, basePathWithQuery }: Props) {
  return (
    <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white mt-6">
      <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9] flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#1d2327]">Recent Visitors</span>
        <span className="text-[12px] text-[#646970]">{log.totalCount} total</span>
      </div>

      {log.rows.length === 0 ? (
        <p className="p-4 text-[13px] text-[#646970]">No visitors for this period yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-[#f6f7f7]">
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">Date & Time</th>
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">Channel</th>
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">IP Address</th>
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">Country</th>
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">Landing Page</th>
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7]">Checkout</th>
                <th className="py-2 px-4 text-[12px] font-medium text-[#646970] border-b border-[#c3c4c7] text-right">Proof</th>
              </tr>
            </thead>
            <tbody>
              {log.rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#f6f7f7] border-b border-[#f0f0f1] last:border-b-0">
                  <td className="py-2 px-4 text-[13px] text-[#2c3338] whitespace-nowrap">
                    {formatTz(row.createdAt, timezone, "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="py-2 px-4 text-[13px] text-[#2c3338] capitalize">{row.channel}</td>
                  <td className="py-2 px-4 text-[13px] text-[#646970] font-mono whitespace-nowrap">{row.ipAddress || "—"}</td>
                  <td className="py-2 px-4 text-[13px] text-[#2c3338]">{row.country || "—"}</td>
                  <td className="py-2 px-4 text-[13px] text-[#646970] max-w-[280px] truncate" title={row.landingPage}>
                    {row.landingPage}
                  </td>
                  <td className="py-2 px-4 text-[13px]">
                    {row.reachedCheckout ? (
                      <span className="text-[12px] font-medium px-1.5 py-0.5 rounded-[3px] bg-[#fff8e5] text-[#996800] border border-[#f0d896]">
                        Yes
                      </span>
                    ) : (
                      <span className="text-[#a7aaad]">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <Link
                      href={`/admin/visitors/${row.id}`}
                      className="text-[13px] text-[#2271b1] hover:text-[#135e96] hover:underline font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {log.totalPages > 1 && (
        <div className="p-4 border-t border-[#c3c4c7] flex items-center justify-center gap-2 bg-[#f6f7f7]">
          {log.page > 1 && (
            <Link
              href={`${basePathWithQuery}&vpage=${log.page - 1}`}
              className="px-3 py-1 text-[13px] border border-[#8c8f94] bg-white rounded-sm text-[#2271b1] hover:bg-[#f0f0f1]"
            >
              ‹ Previous
            </Link>
          )}
          <span className="text-[13px] text-[#646970] px-2">
            Page {log.page} of {log.totalPages}
          </span>
          {log.page < log.totalPages && (
            <Link
              href={`${basePathWithQuery}&vpage=${log.page + 1}`}
              className="px-3 py-1 text-[13px] border border-[#8c8f94] bg-white rounded-sm text-[#2271b1] hover:bg-[#f0f0f1]"
            >
              Next ›
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
