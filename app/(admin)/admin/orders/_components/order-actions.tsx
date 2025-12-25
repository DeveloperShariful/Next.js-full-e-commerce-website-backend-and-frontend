// File: app/admin/orders/_components/order-actions.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Settings2, Loader2 } from "lucide-react";
import { updateOrderStatus } from "@/app/actions/admin/order/update-status";
import { toast } from "sonner";

interface OrderActionsProps {
  order: any;
}

export const OrderActions = ({ order }: OrderActionsProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
        const res = await updateOrderStatus(formData);
        
        if (res.success) {
            toast.success(res.message);
            router.refresh(); 
        } else {
            toast.error(res.error);
        }
    });
  };

  // ✅ ম্যাজিক কি: যখনই স্ট্যাটাস বা টাইম চেঞ্জ হবে, ফর্মটি নতুন করে তৈরি হবে
  const formKey = `${order.status}-${order.paymentStatus}-${order.fulfillmentStatus}`;

  return (
    <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-600">
      <CardHeader className="pb-3 border-b border-slate-50">
        <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
          <Settings2 size={14} /> Order Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        
        {/* 👇 KEY Added Here */}
        <form action={handleSubmit} className="space-y-4" key={formKey}>
          <input type="hidden" name="orderId" value={order.id} />

          {/* Order Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Order Status</label>
            <select
              name="status"
              defaultValue={order.status}
              disabled={isPending}
              className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer disabled:bg-slate-100"
            >
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Payment Status</label>
            <select
              name="paymentStatus"
              defaultValue={order.paymentStatus}
              disabled={isPending}
              className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer disabled:bg-slate-100"
            >
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            </select>
          </div>

          {/* Fulfillment Status */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Fulfillment</label>
            <select
              name="fulfillmentStatus"
              defaultValue={order.fulfillmentStatus}
              disabled={isPending}
              className="w-full h-9 px-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer disabled:bg-slate-100"
            >
              <option value="UNFULFILLED">Unfulfilled</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>

          <Button 
            type="submit"
            disabled={isPending}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2 transition-all"
          >
            {isPending ? (
                <>
                    <Loader2 size={16} className="animate-spin" /> Updating...
                </>
            ) : (
                <>
                    <Save size={16} /> Update Order
                </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};