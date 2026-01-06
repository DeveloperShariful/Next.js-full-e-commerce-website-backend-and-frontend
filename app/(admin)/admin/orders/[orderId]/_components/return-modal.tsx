// File Location: app/admin/orders/[orderId]/_components/return-modal.tsx

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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";
import { updateReturnRequest } from "@/app/actions/admin/order/update-return";

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnReq: any; // The return object
}

export const ReturnModal = ({ isOpen, onClose, returnReq }: ReturnModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const res = await updateReturnRequest(formData);

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
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw size={18} /> Manage Return Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="returnId" value={returnReq?.id} />
          
          <div className="text-sm bg-slate-50 p-3 rounded border border-slate-100">
             <strong>Reason:</strong> {returnReq?.reason}
          </div>

          <div className="grid gap-2">
            <Label>Action Status</Label>
            <Select name="status" defaultValue={returnReq?.status || "REQUESTED"}>
                <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="APPROVED">Approve Return</SelectItem>
                    <SelectItem value="REJECTED">Reject Return</SelectItem>
                    <SelectItem value="RECEIVED">Item Received</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
            </Select>
          </div>

          {/* Restock Option */}
          <div className="flex items-center space-x-2 border p-3 rounded-md">
            <Checkbox id="restock" name="restock" defaultChecked />
            <label
              htmlFor="restock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Restock items to inventory (if Approved)
            </label>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="adminNote">Admin Note</Label>
            <Textarea
              id="adminNote"
              name="adminNote"
              placeholder="Internal note regarding this decision..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};