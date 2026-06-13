//File Location: app/(backend)/admin/analytics/revenue/_components/revenue-table.tsx

"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { RevenueTableRow } from "@/app/actions/backend/analytics/revenue.actions";

interface RevenueTableProps {
  data: RevenueTableRow[];
}

export default function RevenueTable({ data }: RevenueTableProps) {
  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden mt-6">
      
      {/* Table Header/Toolbar */}
      <div className="p-4 border-b border-[#c3c4c7] flex justify-between items-center bg-white">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Revenue</h2>
        <div className="flex gap-2">
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
              <th className="py-2.5 px-4 font-semibold min-w-[150px]">Date</th>
              <th className="py-2.5 px-4 font-semibold text-right">Orders</th>
              <th className="py-2.5 px-4 font-semibold text-right">Gross sales</th>
              <th className="py-2.5 px-4 font-semibold text-right">Returns</th>
              <th className="py-2.5 px-4 font-semibold text-right">Coupons</th>
              <th className="py-2.5 px-4 font-semibold text-right">Net sales</th>
              <th className="py-2.5 px-4 font-semibold text-right">Taxes</th>
              <th className="py-2.5 px-4 font-semibold text-right">Shipping</th>
              <th className="py-2.5 px-4 font-semibold text-right">Total sales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#646970]">No data found</td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowDate = new Date(row.date);
                // WooCommerce typically strips time and format as "December 31, 2025"
                const formattedDate = format(rowDate, "MMMM d, yyyy");

                return (
                  <tr key={index} className="hover:bg-[#f6f7f7] transition-colors">
                    <td className="py-3 px-4 text-[#3c434a]">{formattedDate}</td>
                    
                    {/* Orders count links to the orders page filtered by this date */}
                    <td className="py-3 px-4 text-right">
                       <Link 
                          href={`/admin/orders?startDate=${format(rowDate, "yyyy-MM-dd")}&endDate=${format(rowDate, "yyyy-MM-dd")}`} 
                          className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                       >
                          {formatNumber(row.orders)}
                       </Link>
                    </td>
                    
                    <td className="py-3 px-4 text-right">{formatCurrency(row.grossSales)}</td>
                    <td className="py-3 px-4 text-right text-[#d63638]">{formatCurrency(row.returns)}</td>
                    <td className="py-3 px-4 text-right text-[#d63638]">{formatCurrency(row.coupons)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(row.netSales)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(row.taxes)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(row.shipping)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(row.totalSales)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}