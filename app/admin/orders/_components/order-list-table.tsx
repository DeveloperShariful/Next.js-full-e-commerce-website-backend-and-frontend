// File Location: app/admin/orders/_components/order-list-table.tsx

"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderListTableProps {
  orders: any[];
}

export const OrderListTable = ({ orders }: OrderListTableProps) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
      case 'PROCESSING': return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
      case 'SHIPPED': return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
      case 'DELIVERED': return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      case 'CANCELLED': return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-slate-200 border-dashed text-slate-400">
        <ShoppingCart size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium text-slate-600">No orders found</p>
        <p className="text-sm">Try changing your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
            <tr>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Items</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  {/* 👇 FIX: Link changed from 'order' to 'orders' to match your folder */}
                  <Link href={`/admin/orders/${order.id}`} className="font-bold text-blue-600 hover:underline">
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {format(new Date(order.createdAt), "MMM d, yyyy")}
                  <div className="text-[10px] text-slate-400">{format(new Date(order.createdAt), "h:mm a")}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    {order.user?.name || "Guest"}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[150px]">
                    {order.user?.email || order.guestEmail}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    {order._count.items}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">
                  {formatMoney(order.total)}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {/* 👇 FIX: Link changed here too */}
                      <Link href={`/admin/orders/${order.id}`}>
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};