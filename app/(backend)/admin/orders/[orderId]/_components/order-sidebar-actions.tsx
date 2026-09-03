// File Location: app/admin/orders/[orderId]/_components/order-sidebar-actions.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions/backend/order/update-status";
import { deleteOrder } from "@/app/actions/backend/order/bulk-update";
import { StatusDropdown, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, FULFILLMENT_STATUS_OPTIONS } from "./status-dropdown";

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType } from "../types";

interface OrderSidebarActionsProps {
  order: OrderDetailsType;
}

export const OrderSidebarActions = ({ order }: OrderSidebarActionsProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();
  const [statusVal, setStatusVal] = useState<string>(order.status);
  const [paymentStatusVal, setPaymentStatusVal] = useState<string>(order.paymentStatus);
  const [fulfillmentStatusVal, setFulfillmentStatusVal] = useState<string>(order.fulfillmentStatus);

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
            className="px-1.5 py-1.5 lg:px-3 lg:py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
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
            <form action={handleUpdate} className="p-1.5 lg:p-3" key={formKey}>
                <input type="hidden" name="orderId" value={order.id} />

                {/* Mobile/tablet (below lg, i.e. the full-width instance of this
                    box at the top of the page): 3 side-by-side columns. Desktop
                    (the actual lg+ narrow sidebar instance): reverts to the
                    original stacked layout — same component, just a different
                    instance is visible at each breakpoint (see page.tsx's
                    block lg:hidden / hidden lg:block wrappers). */}
                <div className="grid grid-cols-3 gap-1.5 lg:block lg:gap-0">

                {/* Order Status (Restored ALL original options) */}
                <div className="space-y-1 lg:mb-4">
                    <label className="text-[11px] lg:text-[12px] text-[#646970] font-semibold">Order Status</label>
                    <StatusDropdown name="status" value={statusVal} onChange={setStatusVal} disabled={isPending} options={ORDER_STATUS_OPTIONS} wideContent />
                </div>

                {/* Payment Status (Restored ALL original options) */}
                <div className="space-y-1 lg:mb-4">
                    <label className="text-[11px] lg:text-[12px] text-[#646970] font-semibold">Payment Status</label>
                    <StatusDropdown name="paymentStatus" value={paymentStatusVal} onChange={setPaymentStatusVal} disabled={isPending} options={PAYMENT_STATUS_OPTIONS} wideContent />
                </div>

                {/* Fulfillment Status (Restored ALL original options) */}
                <div className="space-y-1 lg:mb-4">
                    <label className="text-[11px] lg:text-[12px] text-[#646970] font-semibold">Fulfillment Status</label>
                    <StatusDropdown name="fulfillmentStatus" value={fulfillmentStatusVal} onChange={setFulfillmentStatusVal} disabled={isPending} options={FULFILLMENT_STATUS_OPTIONS} />
                </div>
                </div>

                {/* Footer Actions (WooCommerce Publish Box Style) */}
                <div className="pt-2 lg:pt-3 border-t border-[#f0f0f1] flex justify-between items-center bg-[#f6f7f7] -mx-1.5 -mb-1.5 px-1.5 py-1.5 mt-2 lg:-mx-3 lg:-mb-3 lg:px-3 lg:py-2 lg:mt-4">
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