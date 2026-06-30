//File Location: app/(backend)/admin/analytics/coupons/_components/coupons-table.tsx

"use client";

import React from "react";
import Link from "next/link";
import { parseISO } from "date-fns";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { CouponTableRow } from "@/app/actions/backend/analytics/coupons.actions";

interface CouponsTableProps {
  data: CouponTableRow[];
}

export default function CouponsTable({ data }: CouponsTableProps) {
  const { timezone } = useGlobalStore();
  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden mt-6">
      
      {/* Table Header/Toolbar */}
      <div className="p-4 border-b border-[#c3c4c7] flex justify-between items-center bg-white">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Coupons</h2>
        <div className="flex gap-2">
           <div className="border border-[#8c8f94] flex items-center px-2 h-[30px] rounded-[3px] bg-white w-[250px]">
              <svg className="w-4 h-4 text-[#8c8f94] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search coupons..." className="outline-none text-[13px] w-full" />
           </div>
           <button className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
           </button>
        </div>
      </div>

      {/* The Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#2c3338] border-collapse">
          <thead>
            <tr className="border-b border-[#c3c4c7] bg-[#f8f9f9]">
              <th className="py-2.5 px-4 font-semibold w-[40px]">
                 <input type="checkbox" className="border-[#8c8f94] rounded-[2px]" />
              </th>
              <th className="py-2.5 px-4 font-semibold min-w-[200px]">Coupon code</th>
              <th className="py-2.5 px-4 font-semibold text-right">Orders</th>
              <th className="py-2.5 px-4 font-semibold text-right">Amount discounted</th>
              <th className="py-2.5 px-4 font-semibold">Created</th>
              <th className="py-2.5 px-4 font-semibold">Expires</th>
              <th className="py-2.5 px-4 font-semibold">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#646970]">No data found for this period.</td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.code} className="hover:bg-[#f6f7f7] transition-colors">
                  <td className="py-3 px-4">
                     <input type="checkbox" className="border-[#8c8f94] rounded-[2px]" />
                  </td>
                  <td className="py-3 px-4">
                     <div className="flex items-center gap-2">
                       <Link href={`/admin/marketing/coupons?search=${row.code}`} className="text-[#2271b1] font-medium hover:text-[#135e96] hover:underline">
                          {row.code}
                       </Link>
                       {!row.isLocal && (
                         <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] bg-[#f0f6fc] text-[#50575e] border border-[#c3c4c7] whitespace-nowrap">
                           WC Import
                         </span>
                       )}
                     </div>
                  </td>
                  <td className="py-3 px-4 text-right text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer">
                     <Link href={`/admin/orders?query=${row.code}`}>{formatNumber(row.orders)}</Link>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(row.amount)}</td>
                  <td className="py-3 px-4 text-[#646970]">
                     {row.created ? formatTz(parseISO(row.created), timezone, "MMMM d, yyyy") : <span className="text-[#a7aaad]">—</span>}
                  </td>
                  <td className="py-3 px-4 text-[#646970]">
                     {row.expires ? formatTz(parseISO(row.expires), timezone, "MMMM d, yyyy") : <span className="text-[#a7aaad]">—</span>}
                  </td>
                  <td className="py-3 px-4 text-[#646970]">{row.type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}