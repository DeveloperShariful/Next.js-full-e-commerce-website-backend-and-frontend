// File: app/admin/orders/[orderId]/_components/refund-modal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { processRefund } from "@/app/actions/admin/order/process-refund";
import { useGlobalStore } from "@/app/providers/global-store-provider"; // ✅ Global Import

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const RefundModal = ({ isOpen, onClose, order }: RefundModalProps) => {
  const { formatPrice } = useGlobalStore(); // ✅ Hook
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
        toast.success(res.message);
        onClose();
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Refund will be processed via <strong>{order.paymentGateway || "Manual"}</strong>.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="orderId" value={order.id} />
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex gap-2">
             <AlertTriangle size={16} className="shrink-0"/>
             <div>
                {/* ✅ Global Formatting */}
                Available to refund: <strong>{formatPrice(refundableAmount)}</strong>
                <br/>Gateway: {order.paymentGateway?.toUpperCase()}
             </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Refund Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              max={refundableAmount}
              defaultValue={refundableAmount}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="e.g. Out of stock, Customer request..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};