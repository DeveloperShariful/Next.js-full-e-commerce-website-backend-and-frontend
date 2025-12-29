// File Location: app/admin/orders/_components/transdirect-booking.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, RefreshCw, CheckCircle, AlertTriangle, FileText, Printer } from "lucide-react";
import { syncOrderToTransdirect } from "@/app/actions/admin/order/transdirect-sync-order";
import { toast } from "sonner"; 

export const TransdirectBooking = ({ order }: { order: any }) => {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const res = await syncOrderToTransdirect(order.id);
    if (res.success) {
      toast.success(res.message);
      // Optional: window.location.reload() to show new buttons
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const isSynced = !!order.transdirectBookingId;

  return (
    <Card className="border-blue-200 shadow-sm border-t-4 border-t-[#2271b1]">
      <CardHeader className="pb-3 border-b border-blue-50 bg-blue-50/30">
        <CardTitle className="text-xs font-bold uppercase text-[#2271b1] flex items-center gap-2 tracking-wider">
          <Truck size={14} /> Transdirect Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        
        {/* Status Indicator */}
        {isSynced ? (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded justify-center border border-green-200">
                    <CheckCircle size={12}/> Synced: #{order.transdirectBookingId}
                </div>
                
                {/* ✅ NEW: Download Buttons */}
                <div className="flex gap-2">
                    {order.transdirectLabelUrl && (
                        <Button variant="outline" className="flex-1 text-xs h-8 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                            <a href={order.transdirectLabelUrl} target="_blank">
                                <Printer size={12}/> Label
                            </a>
                        </Button>
                    )}
                    {order.transdirectInvoiceUrl && (
                        <Button variant="outline" className="flex-1 text-xs h-8 gap-2 border-slate-200 hover:bg-slate-50" asChild>
                            <a href={order.transdirectInvoiceUrl} target="_blank">
                                <FileText size={12}/> Invoice
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        ) : (
             <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium bg-amber-50 p-2 rounded justify-center border border-amber-200">
                <AlertTriangle size={12}/> Not booked yet
            </div>
        )}

        <p className="text-xs text-slate-600">
          Sync this order to Transdirect to get quotes and book couriers.
        </p>
        
        <Button 
          onClick={handleSync} 
          disabled={loading}
          className={`w-full text-white gap-2 transition-all ${
            loading ? "bg-slate-400" : "bg-[#2271b1] hover:bg-[#1a5c92]"
          }`}
        >
          {loading ? <RefreshCw size={14} className="animate-spin"/> : <Truck size={14}/>}
          {loading ? "Syncing..." : (isSynced ? "Re-Sync Order" : "Book with Transdirect")}
        </Button>

      </CardContent>
    </Card>
  );
};