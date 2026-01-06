// File: app/admin/orders/[orderId]/_components/order-header.tsx

"use client"

import { useState } from "react"; // ✅ Import State
import { Badge } from "@/components/ui/badge"; 
import { Button } from "@/components/ui/button";
import { Printer, RotateCcw, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns"; 
import { RefundModal } from "./refund-modal"; // ✅ Import Modal

interface OrderHeaderProps {
  order: any; 
}

export const OrderHeader = ({ order }: OrderHeaderProps) => {
  const [isRefundOpen, setIsRefundOpen] = useState(false); // ✅ State for Modal

  // Helper for Badge Colors
  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
        case 'PAID': return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
        case 'REFUNDED': return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100";
        case 'UNPAID': return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
        default: return "bg-gray-100 text-gray-700";
    }
  };

  const getFulfillmentBadgeColor = (status: string) => {
      switch (status) {
          case 'FULFILLED': return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
          case 'PARTIALLY_FULFILLED': return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100";
          default: return "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50";
      }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon" className="h-9 w-9 bg-white hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                #{order.orderNumber}
              </h1>
              {/* STATUS BADGES */}
              <Badge variant="outline" className={getPaymentBadgeColor(order.paymentStatus)}>
                {order.paymentStatus}
              </Badge>
              <Badge variant="outline" className={getFulfillmentBadgeColor(order.fulfillmentStatus)}>
                {order.fulfillmentStatus.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Calendar size={12} />
              <span>{format(new Date(order.createdAt), "PPP p")}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">IP: {order.ipAddress || "Unknown"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
            {/* Print Invoice Button */}
            <Button variant="outline" className="flex-1 sm:flex-none gap-2 bg-white hover:bg-slate-50" asChild>
                <Link href={`/admin/orders/${order.id}/invoice`} target="_blank">
                    <Printer size={16} className="text-slate-500"/> Print Invoice
                </Link>
            </Button>

            {/* Refund Button - Only if PAID or PARTIALLY_REFUNDED */}
            {['PAID', 'PARTIALLY_REFUNDED'].includes(order.paymentStatus) && (
                <Button 
                    variant="outline" 
                    onClick={() => setIsRefundOpen(true)} // ✅ Open Modal
                    className="flex-1 sm:flex-none gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 bg-white"
                >
                    <RotateCcw size={16}/> Refund
                </Button>
            )}
        </div>

        {/* ✅ Refund Modal Component */}
        <RefundModal 
            isOpen={isRefundOpen} 
            onClose={() => setIsRefundOpen(false)} 
            order={order} 
        />
    </div>
  )
}