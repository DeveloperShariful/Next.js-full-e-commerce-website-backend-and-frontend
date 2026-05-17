//app/(backend)/admin/_components/recent-orders.tsx

"use client";

import { useGlobalStore } from "@/app/providers/global-store-provider"; // ✅ Global Import
import { formatDistanceToNow } from "date-fns";
import { Eye } from "lucide-react";
import Link from "next/link";

interface RecentOrdersProps {
  orders: any[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const { formatPrice } = useGlobalStore(); // ✅ Use Global Formatter

  // WP Style Status Labels
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]";
      case "PROCESSING": return "bg-[#f0f6fc] text-[#2271b1] border-[#c5d9ed]";
      case "PENDING": return "bg-[#fff5eb] text-[#c05621] border-[#fbd38d]";
      case "CANCELLED": return "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]";
      default: return "bg-[#f6f7f7] text-[#50575e] border-[#c3c4c7]";
    }
  };

  return (
    // 🚀 WP Style Meta Box
    <div className="bg-white border border-[#c3c4c7] shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] flex justify-between items-center">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Recent Orders</h2>
        <Link href="/admin/orders" className="text-[12px] font-normal text-[#2271b1] hover:text-[#0a4b78] hover:underline">
          View All
        </Link>
      </div>

      {/* 🚀 Responsive Table Wrapper */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="text-[12px] text-[#1d2327] border-b border-[#c3c4c7] bg-white">
              <th className="px-4 py-2 font-semibold">Order</th>
              <th className="px-4 py-2 font-semibold">Customer</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold text-right">Total</th>
              <th className="px-4 py-2 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {orders.length === 0 ? (
               <tr><td colSpan={5} className="p-6 text-center text-[#8c8f94] text-[13px] italic">No recent orders found.</td></tr>
            ) : (
              orders.map((order, index) => (
                // WP alternating row style (Striped)
                <tr key={order.id} className={`hover:bg-[#f6f7f7] transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-[#2271b1] hover:underline block text-[13px]">
                      #{order.orderNumber}
                    </Link>
                    <span className="text-[11px] text-[#8c8f94]">{formatDistanceToNow(new Date(order.createdAt))} ago</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[#3c434a]">
                        {order.user?.name || "Guest User"}
                      </span>
                      <span className="text-[11px] text-[#8c8f94]">{order.guestEmail || order.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded-sm border text-[11px] font-semibold inline-block ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                    {order.paymentStatus === "UNPAID" && (
                       <span className="ml-1 px-1.5 py-0.5 rounded-sm border border-[#fecaca] bg-[#fef2f2] text-[#991b1b] text-[11px] font-semibold inline-block">Unpaid</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-[#3c434a] text-[13px]">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center justify-center p-1.5 text-[#8c8f94] hover:text-[#2271b1] transition-colors"
                      title="View Order"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}