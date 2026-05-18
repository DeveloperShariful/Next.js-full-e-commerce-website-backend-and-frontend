"use client";
import { updateTracking } from "@/app/actions/backend/shipment/shipment";
import { ShipmentWithRelations } from "../types";
import { toast } from "sonner";
import { useState } from "react";

export const WcShipmentEditModal = ({ item, onClose, onRefresh }: { item: ShipmentWithRelations, onClose: ()=>void, onRefresh: ()=>void }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await updateTracking(formData);
    
    if (res.success) {
      toast.success(res.message);
      onRefresh();
      onClose();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#00000080] z-[9999] flex justify-center items-center">
      <div className="bg-white w-[400px] shadow-lg border border-[#c3c4c7]">
        <div className="flex justify-between items-center px-4 py-3 border-b border-[#c3c4c7] bg-[#f6f7f7]">
          <h2 className="text-[14px] font-semibold text-[#1d2327]">Edit Tracking Info</h2>
          <button onClick={onClose} className="text-[#a7aaad] hover:text-[#d63638]">✖</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-[13px] text-[#2c3338]">
          <input type="hidden" name="id" value={item.id} />
          
          <div>
            <label className="block mb-1 font-semibold">Courier Name</label>
            <input type="text" name="courier" defaultValue={item.courier || ""} className="w-full border border-[#8c8f94] p-1.5 focus:border-[#2271b1] outline-none" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Tracking Number</label>
            <input type="text" name="trackingNumber" defaultValue={item.trackingNumber || ""} className="w-full border border-[#8c8f94] p-1.5 focus:border-[#2271b1] outline-none" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Tracking URL</label>
            <input type="url" name="trackingUrl" defaultValue={item.trackingUrl || ""} className="w-full border border-[#8c8f94] p-1.5 focus:border-[#2271b1] outline-none" />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Number of Parcels</label>
            <input type="number" name="numberOfParcels" defaultValue={item.numberOfParcels || 1} min="1" className="w-full border border-[#8c8f94] p-1.5 focus:border-[#2271b1] outline-none" />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="border border-[#2271b1] text-[#2271b1] px-3 py-1 hover:bg-[#f6f7f7]">Cancel</button>
            <button type="submit" disabled={loading} className="bg-[#2271b1] text-white px-3 py-1 hover:bg-[#135e96] disabled:opacity-50">
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};