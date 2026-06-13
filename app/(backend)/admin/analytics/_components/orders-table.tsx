//File Location: app/(backend)/admin/analytics/orders/_components/orders-table.tsx

"use client";

import React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { OrderTableRow } from "@/app/actions/backend/analytics/orders.actions";

interface OrdersTableProps {
  data: OrderTableRow[];
}

export default function OrdersTable({ data }: OrdersTableProps) {
  
  // Status Dots logic mimicking WooCommerce
  const getStatusDot = (status: string) => {
    const s = status.toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return "bg-[#008a20]"; // Green
    if (s === "PROCESSING" || s === "PACKED") return "bg-[#007cba]"; // Blue
    return "bg-[#c3c4c7]"; // Grey for others
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden mt-6">
      
      {/* Table Header/Toolbar */}
      <div className="p-4 border-b border-[#c3c4c7] flex justify-between items-center bg-white">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Orders</h2>
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
              <th className="py-2.5 px-4 font-semibold whitespace-nowrap min-w-[120px]">Date</th>
              <th className="py-2.5 px-4 font-semibold">Order #</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">Customer</th>
              <th className="py-2.5 px-4 font-semibold whitespace-nowrap">Customer type</th>
              <th className="py-2.5 px-4 font-semibold min-w-[250px]">Product(s)</th>
              <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Items sold</th>
              <th className="py-2.5 px-4 font-semibold text-center">Coupon(s)</th>
              <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">Net sales</th>
              <th className="py-2.5 px-4 font-semibold">Attribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#646970]">No orders found for this period.</td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-[#f6f7f7] transition-colors align-top">
                  <td className="py-3 px-4 text-[#3c434a]">{format(parseISO(row.orderDate), "MMMM d, yyyy")}</td>
                  
                  <td className="py-3 px-4">
                     <Link href={`/admin/orders/${row.id}`} className="text-[#2271b1] hover:text-[#135e96] hover:underline font-medium">
                        {row.orderNumber}
                     </Link>
                  </td>
                  
                  <td className="py-3 px-4">
                     <div className="flex items-center gap-2">
                        <span className="capitalize text-[#3c434a]">{row.status.toLowerCase()}</span>
                        <span className={`w-2 h-2 rounded-full ${getStatusDot(row.status)}`}></span>
                     </div>
                  </td>
                  
                  <td className="py-3 px-4 text-[#3c434a]">{row.customerName}</td>
                  <td className="py-3 px-4 text-[#646970]">{row.customerType}</td>
                  
                  <td className="py-3 px-4">
                     <div className="flex flex-col gap-1">
                        {row.productsInfo.map((p, i) => (
                           <Link key={i} href={p.link} className="text-[#2271b1] hover:text-[#135e96] hover:underline truncate max-w-[250px] inline-block">
                              {p.name}
                           </Link>
                        ))}
                        {row.itemsSold > 2 && <span className="text-[#646970] text-[11px]">+ {row.itemsSold - 2} more</span>}
                     </div>
                  </td>
                  
                  <td className="py-3 px-4 text-right">{formatNumber(row.itemsSold)}</td>
                  
                  <td className="py-3 px-4 text-center">
                     {row.couponUsed ? (
                        <span className="text-[#2271b1] hover:underline cursor-pointer">{row.couponUsed}</span>
                     ) : (
                        <span className="text-[#a7aaad]">—</span>
                     )}
                  </td>
                  
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(row.netSales)}</td>
                  <td className="py-3 px-4 text-[#646970]">{row.attribution}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}