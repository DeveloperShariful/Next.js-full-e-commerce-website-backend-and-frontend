// File Location: app/admin/orders/[orderId]/_components/dispute-modal.tsx

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateDisputeStatus } from "@/app/actions/backend/order/update-dispute";

interface DisputeItem {
  id: string;
  gatewayDisputeId: string;
  status: string;
}

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeItem;
}

export const DisputeModal = ({ isOpen, onClose, dispute }: DisputeModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const res = await updateDisputeStatus(formData);

    if (res.success) {
        toast.success(res.message);
        onClose();
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 rounded-[3px] overflow-hidden border-[#c3c4c7] shadow-xl">
        
        <div className="bg-white px-4 py-3 border-b border-[#c3c4c7]">
          <DialogTitle className="text-[16px] font-semibold text-[#1d2327]">
            Update Dispute Status
          </DialogTitle>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 bg-[#f0f0f1] space-y-4">
            <input type="hidden" name="disputeId" value={dispute?.id} />
            
            <div className="bg-white border border-[#c3c4c7] p-3 text-[13px] text-[#3c434a] shadow-sm rounded-[3px]">
               <span className="font-semibold">Gateway ID:</span> <span className="font-mono text-[#d63638]">{dispute?.gatewayDisputeId}</span>
            </div>

            <div className="space-y-1">
                <label className="text-[13px] font-semibold text-[#1d2327]">Outcome Status</label>
                <select 
                    name="status" 
                    defaultValue={dispute?.status || "UNDER_REVIEW"}
                    className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                >
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="NEEDS_RESPONSE">Needs Response</option>
                    <option value="WON">Won (Money Returned)</option>
                    <option value="LOST">Lost (Chargeback Accepted)</option>
                </select>
            </div>
            
            <div className="space-y-1">
                <label htmlFor="reason" className="text-[13px] font-semibold text-[#1d2327]">Reason / Note</label>
                <textarea
                    id="reason"
                    name="reason"
                    placeholder="e.g. Evidence submitted, Customer accepted..."
                    className="w-full h-[60px] p-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] resize-none"
                />
            </div>
          </div>

          <div className="bg-white px-4 py-3 border-t border-[#c3c4c7] flex justify-end gap-2">
            <button type="button" onClick={onClose} className="border border-[#8c8f94] bg-[#f6f7f7] text-[#3c434a] hover:bg-[#f0f0f1] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm">
                Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-[#2271b1] text-white hover:bg-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 flex items-center shadow-sm">
                {loading && <Loader2 size={14} className="animate-spin mr-2" />}
                Confirm Update
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};