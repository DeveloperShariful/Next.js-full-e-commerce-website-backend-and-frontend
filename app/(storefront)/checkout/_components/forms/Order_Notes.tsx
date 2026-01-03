// File: app/(storefront)/checkout/_components/forms/Order_Notes.tsx
"use client";

import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Order_Notes = () => {
  const { customerNote, setCustomerNote } = useCheckoutStore();

  return (
    <div className="space-y-3">
      <Label htmlFor="order-notes" className="text-base font-semibold text-gray-900">
        Order notes <span className="text-gray-400 font-normal text-sm">(optional)</span>
      </Label>
      <Textarea
        id="order-notes"
        placeholder="Notes about your order, e.g. special notes for delivery."
        value={customerNote}
        onChange={(e) => setCustomerNote(e.target.value)}
        className="bg-white border-gray-300 min-h-[100px]"
      />
    </div>
  );
};