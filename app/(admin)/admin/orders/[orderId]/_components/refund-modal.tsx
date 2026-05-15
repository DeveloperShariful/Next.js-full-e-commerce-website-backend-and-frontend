// File Location: app/admin/orders/[orderId]/_components/refund-modal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { processRefund } from "@/app/actions/admin/order/process-refund";
import { useGlobalStore } from "@/app/providers/global-store-provider"; 
import { useRouter } from "next/navigation";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const RefundModal = ({ isOpen, onClose, order }: RefundModalProps) => {
  const router = useRouter();
  const { formatPrice } = useGlobalStore(); 
  const [loading, setLoading] = useState(false);
  
  const refundableAmount = order.total - (order.refundedAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const amount = parseFloat(formData.get("amount") as string);

    if (amount > refundableAmount) {
        toast.error("Refund amount cannot exceed remaining balance.");
        setLoading(false);
        return;
    }

    const res = await processRefund(formData);

    if (res.success) {
        toast.success("Refund processed successfully.");
        onClose();
        router.refresh();
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 rounded-[3px] overflow-hidden border-[#c3c4c7] shadow-xl">
        
        {/* WP Classic Modal Header */}
        <div className="bg-white px-4 py-3 border-b border-[#c3c4c7]">
          <DialogTitle className="text-[16px] font-semibold text-[#1d2327]">
            Process Refund
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Modal Body */}
          <div className="p-4 bg-[#f0f0f1] space-y-4">
            <input type="hidden" name="orderId" value={order.id} />
            
            {/* Warning / Info Box */}
            <div className="bg-white border-l-4 border-[#2271b1] p-3 text-[13px] text-[#3c434a] shadow-sm flex items-start gap-2">
                <AlertCircle size={16} className="text-[#2271b1] shrink-0 mt-0.5"/>
                <div>
                    Refund will be processed automatically via <span className="font-bold uppercase">{order.paymentGateway || "Manual"}</span>. 
                    Available to refund: <span className="font-bold text-[#5b841b]">{formatPrice(refundableAmount)}</span>
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="amount" className="text-[13px] font-semibold text-[#1d2327]">Refund Amount</label>
                <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    max={refundableAmount}
                    defaultValue={refundableAmount}
                    required
                    className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                />
            </div>
            
            <div className="space-y-1">
                <label htmlFor="reason" className="text-[13px] font-semibold text-[#1d2327]">Reason for refund (Optional)</label>
                <textarea
                    id="reason"
                    name="reason"
                    placeholder="e.g. Customer requested, out of stock..."
                    className="w-full h-[60px] p-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] resize-none"
                />
            </div>
          </div>

          {/* Modal Footer (WP Style) */}
          <div className="bg-white px-4 py-3 border-t border-[#c3c4c7] flex justify-end gap-2">
            <button 
                type="button" 
                onClick={onClose}
                className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-[#d63638] text-white hover:bg-[#b32d2e] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px] shadow-sm"
            >
                {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                {loading ? "Processing..." : "Refund via " + (order.paymentGateway || "Manual")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};