// File: app/admin/orders/_components/transdirect-booking.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { syncOrderToTransdirect } from "@/app/actions/order/transdirect-sync-order";
import { toast } from "sonner"; // Make sure Toaster is in layout.tsx

export const TransdirectBooking = ({ order }: { order: any }) => {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    console.log("🖱️ Button Clicked: Starting Sync...");
    setLoading(true);
    
    // Server action call
    const res = await syncOrderToTransdirect(order.id);
    
    console.log("🔄 Sync Result:", res);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error || "Sync failed. Check console for details.");
    }
    
    setLoading(false);
  };

  const isSynced = order.orderNotes?.some((n: any) => n.content.includes("Synced to Transdirect"));

  return (
    <Card className="border-blue-200 shadow-sm border-t-4 border-t-[#2271b1]">
      <CardHeader className="pb-3 border-b border-blue-50 bg-blue-50/30">
        <CardTitle className="text-xs font-bold uppercase text-[#2271b1] flex items-center gap-2 tracking-wider">
          <Truck size={14} /> Transdirect Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        <p className="text-xs text-slate-600">
          Sync this order details to Transdirect to get quotes and book couriers.
        </p>
        
        <Button 
          onClick={handleSync} 
          disabled={loading}
          className={`w-full text-white gap-2 transition-all ${
            loading ? "bg-slate-400" : "bg-[#2271b1] hover:bg-[#1a5c92]"
          }`}
        >
          {loading ? <RefreshCw size={14} className="animate-spin"/> : <Truck size={14}/>}
          {loading ? "Syncing..." : (isSynced ? "Re-Sync Order" : "Book / Sync with Transdirect")}
        </Button>

        {/* Status Indicator */}
        {isSynced && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded justify-center border border-green-200">
                <CheckCircle size={12}/> Order Synced Successfully
            </div>
        )}
        
        {!isSynced && (
             <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium bg-amber-50 p-2 rounded justify-center border border-amber-200">
                <AlertTriangle size={12}/> Not synced yet
            </div>
        )}

      </CardContent>
    </Card>
  );
};