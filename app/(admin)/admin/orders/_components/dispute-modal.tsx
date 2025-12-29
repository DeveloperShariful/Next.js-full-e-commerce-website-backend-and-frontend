// File Location: app/admin/orders/_components/dispute-modal.tsx

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { updateDisputeStatus } from "@/app/actions/admin/order/update-dispute";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: any;
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} /> Update Dispute Status
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="disputeId" value={dispute?.id} />
          
          <div className="text-xs bg-red-50 p-3 rounded border border-red-100 text-red-800">
             Gateway ID: <span className="font-mono">{dispute?.gatewayDisputeId}</span>
          </div>

          <div className="grid gap-2">
            <Label>Outcome Status</Label>
            <Select name="status" defaultValue={dispute?.status || "UNDER_REVIEW"}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="NEEDS_RESPONSE">Needs Response</SelectItem>
                    <SelectItem value="WON">Won (Money Returned)</SelectItem>
                    <SelectItem value="LOST">Lost (Chargeback Accepted)</SelectItem>
                </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason / Note</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="e.g. Evidence submitted, Customer accepted..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};