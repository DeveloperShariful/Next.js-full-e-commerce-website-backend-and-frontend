//app/(admin)/admin/_components/recent-orders.tsx

"use client";

import { useGlobalStore } from "@/app/providers/global-store-provider";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Eye } from "lucide-react";
import Link from "next/link";

interface RecentOrdersProps {
  orders: any[]; // Using any for brevity, ideally use Prisma Type
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const { formatPrice } = useGlobalStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-green-100 text-green-700";
      case "PROCESSING": return "bg-blue-100 text-blue-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-lg text-slate-800">Recent Orders</h3>
        <Link href="/admin/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-50 uppercase tracking-wider bg-slate-50/50">
              <th className="px-6 py-3 font-semibold">Order</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Total</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.length === 0 ? (
               <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-sm">No recent orders found.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700 block">#{order.orderNumber}</span>
                    <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(order.createdAt))} ago</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">
                        {order.user?.name || "Guest User"}
                      </span>
                      <span className="text-xs text-slate-400">{order.guestEmail || order.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {order.paymentStatus === "UNPAID" && (
                       <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 border border-red-100 font-bold">Unpaid</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition"
                    >
                      <Eye size={14} />
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