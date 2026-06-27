// File Location: app/admin/orders/create/_components/create-sidebar-actions.tsx

"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { OrderDataType, OrderTotalsType } from "../types";
import { getActivePaymentMethods } from "@/app/actions/backend/order/create_order/get-payment-methods";

interface PaymentMethodOption {
  id: string;
  name: string;
  identifier: string;
}

interface CreateSidebarActionsProps {
  orderData: OrderDataType;
  setOrderData: React.Dispatch<React.SetStateAction<OrderDataType>>;
  totals: OrderTotalsType;
  handleCreateOrder: (isDraft: boolean) => void;
  loading: boolean;
}

export const CreateSidebarActions = ({
    orderData,
    setOrderData,
    handleCreateOrder,
    loading
}: CreateSidebarActionsProps) => {

  const [isOpen, setIsOpen] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  useEffect(() => {
    getActivePaymentMethods().then((methods) => {
      const options: PaymentMethodOption[] = methods.map((m) => ({
        id: m.id,
        name: m.name,
        identifier: m.identifier,
      }));
      // Always include Manual option
      if (!options.some((o) => o.identifier === "manual")) {
        options.unshift({ id: "manual", name: "Manual / Bank Transfer", identifier: "manual" });
      }
      setPaymentMethods(options);
    });
  }, []);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">

        {/* Meta Box Header */}
        <div
            className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Order actions</h2>
            <button type="button" className="text-[#646970]">
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
        </div>

        {/* Meta Box Content */}
        {isOpen && (
            <div className="p-3 space-y-4">

                <div className="space-y-1">
                    <label className="text-[12px] text-[#646970] font-semibold">Payment Method</label>
                    <select
                        value={orderData.paymentMethod}
                        onChange={(e) => setOrderData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px] cursor-pointer focus:border-[#2271b1]"
                    >
                        {paymentMethods.length === 0 && (
                            <option value="Manual">Manual / Bank Transfer</option>
                        )}
                        {paymentMethods.map((m) => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[12px] text-[#646970] font-semibold">Payment Status</label>
                    <select
                        value={orderData.status === "PENDING" ? "UNPAID" : "PAID"}
                        disabled
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-[#f6f7f7] text-[#646970] text-[13px] outline-none shadow-sm rounded-[3px] cursor-not-allowed"
                    >
                        <option value="UNPAID">Awaiting payment</option>
                        <option value="PAID">Paid</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[12px] text-[#646970] font-semibold">Fulfillment Status</label>
                    <select
                        value="UNFULFILLED"
                        disabled
                        className="w-full h-[30px] px-2 border border-[#8c8f94] bg-[#f6f7f7] text-[#646970] text-[13px] outline-none shadow-sm rounded-[3px] cursor-not-allowed"
                    >
                        <option value="UNFULFILLED">Unfulfilled</option>
                    </select>
                </div>

                {/* Footer Actions (WooCommerce Style Publish Box) */}
                <div className="pt-3 border-t border-[#f0f0f1] flex justify-between items-center bg-[#f6f7f7] -mx-3 -mb-3 px-3 py-2 mt-4">
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleCreateOrder(true); }}
                        disabled={loading}
                        className="text-[13px] text-[#2271b1] hover:text-[#135e96] hover:underline disabled:opacity-50 font-medium"
                    >
                        Save Draft
                    </button>

                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleCreateOrder(false); }}
                        disabled={loading}
                        className="bg-[#2271b1] text-white hover:bg-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm min-w-[80px]"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : "Create"}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
