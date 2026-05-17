// File Location: app/admin/orders/[orderId]/_components/order-sidebar-actions.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions/backend/order/update-status";
import { deleteOrder } from "@/app/actions/backend/order/order-actions";

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType } from "../types";

interface OrderSidebarActionsProps {
  order: OrderDetailsType;
}

export const OrderSidebarActions = ({ order }: OrderSidebarActionsProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // --- HANDLER: STATUS UPDATE (Triggers Emails from Backend) ---
  const handleUpdate = (formData: FormData) => {
    startTransition(async () => {
        const res = await updateOrderStatus(formData);
        if (res.success) {
            toast.success("Order updated. Notifications sent!");
            router.refresh(); 
        } else {
            toast.error(res.error || "Failed to update order.");
        }
    });
  };

  // --- HANDLER: TRASH ORDER ---
  const handleTrash = () => {
      if(!confirm("Are you sure you want to move this order to trash?")) return;
      
      startTransition(async () => {
          const res = await deleteOrder(order.id, false);
          if (res.success) {
              toast.success("Order moved to trash.");
              router.push("/admin/orders"); 
          } else {
              toast.error(res.error || "Failed to move order to trash.");
          }
      });
  };

  // ✅ ম্যাজিক কি: যখনই স্ট্যাটাস বা টাইম চেঞ্জ হবে, ফর্মটি নতুন করে তৈরি হবে
  const formKey = `${order.status}-${order.paymentStatus}-${order.fulfillmentStatus}`;

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        
        {/* Meta Box Header (Collapsible) */}
        <div 
            className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Order actions</h2>
            <button type="button" className="text-[#646970] hover:text-[#1d2327]">
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
        </div>

        {/* Content */}
        {isOpen && (
            // 👇 KEY Added Here to reset form on external changes
            <form action={handleUpdate} className="p-3" key={formKey}>
                <input type="hidden" name="orderId" value={order.id} />

                {/* Order Status (Restored ALL original options) */}
                <div className="mb-4 space-y-1">
                    <label className="text-[12px] text-[#646970] font-semibold">Order Status</label>
                    <select
                        name="status"
                        defaultValue={order.status}
                        disabled={isPending}
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm rounded-[3px] disabled:bg-[#f6f7f7]"
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending payment</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                        <option value="PACKED">Packed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REFUNDED">Refunded</option>
                        <option value="FAILED">Failed</option>
                        <option value="RETURNED">Returned</option>
                    </select>
                </div>

                {/* Payment Status (Restored ALL original options) */}
                <div className="mb-4 space-y-1">
                    <label className="text-[12px] text-[#646970] font-semibold">Payment Status</label>
                    <select 
                        name="paymentStatus" 
                        defaultValue={order.paymentStatus} 
                        disabled={isPending}
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm rounded-[3px] disabled:bg-[#f6f7f7]"
                    >
                        <option value="UNPAID">Unpaid</option>
                        <option value="PAID">Paid</option>
                        <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                        <option value="REFUNDED">Refunded</option>
                        <option value="VOIDED">Voided</option>
                        <option value="AUTHORIZED">Authorized</option>
                    </select>
                </div>

                {/* Fulfillment Status (Restored ALL original options) */}
                <div className="mb-4 space-y-1">
                    <label className="text-[12px] text-[#646970] font-semibold">Fulfillment Status</label>
                    <select 
                        name="fulfillmentStatus" 
                        defaultValue={order.fulfillmentStatus} 
                        disabled={isPending}
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm rounded-[3px] disabled:bg-[#f6f7f7]"
                    >
                        <option value="UNFULFILLED">Unfulfilled</option>
                        <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
                        <option value="FULFILLED">Fulfilled</option>
                        <option value="RETURNED">Returned</option>
                        <option value="PICKED_UP">Picked Up</option>
                    </select>
                </div>

                {/* Footer Actions (WooCommerce Publish Box Style) */}
                <div className="pt-3 border-t border-[#f0f0f1] flex justify-between items-center bg-[#f6f7f7] -mx-3 -mb-3 px-3 py-2 mt-4">
                    <button 
                        type="button" 
                        onClick={handleTrash}
                        disabled={isPending}
                        className="text-[13px] text-[#d63638] hover:text-[#d63638] hover:underline disabled:opacity-50"
                    >
                        Move to Trash
                    </button>
                    <button 
                        type="submit"
                        disabled={isPending}
                        className="bg-[#2271b1] text-white hover:bg-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm min-w-[80px]"
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : "Update"}
                    </button>
                </div>
            </form>
        )}
    </div>
  );
};