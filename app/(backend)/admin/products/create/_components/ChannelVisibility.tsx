//app/admin/products/create/_components/ChannelVisibility.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "react-hot-toast";
import { AlertCircle, CheckCircle, Clock, EyeOff, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { getLocalProductChannelStatus } from "@/app/actions/backend/merchant-center/gmc-status.actions";
import { syncSingleProductStatusFromGoogle, updateProductChannelVisibility } from "@/app/actions/backend/merchant-center/gmc-product-sync.actions";

interface Props {
  productId: string;
}

export function ChannelVisibility({ productId }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [visibility, setVisibility] = useState<"SYNCED" | "EXCLUDED">("SYNCED");

  // ১. মাউন্ট হওয়ার সময় লোকাল ডাটাবেজ থেকে স্ট্যাটাস আনা
  useEffect(() => {
    if (productId) {
      getLocalProductChannelStatus(productId).then((res) => {
        if (res.success && res.status) {
          setStatus(res.status);
          setVisibility(res.status.status === "EXCLUDED" ? "EXCLUDED" : "SYNCED");
        }
      });
    }
  }, [productId]);

  // ২. ড্রপডাউন চেঞ্জ হ্যান্ডলার (ইনস্ট্যান্ট ডাটাবেজ আপডেট)
  const handleVisibilityChange = (val: "SYNCED" | "EXCLUDED") => {
    setVisibility(val);
    startTransition(async () => {
      const toastId = toast.loading("Updating visibility on Google...");
      const res = await updateProductChannelVisibility(productId, val);
      
      if (res.success) {
        toast.success(val === "EXCLUDED" ? "Product excluded from Google." : "Product queued for Google sync.", { id: toastId });
        // স্ট্যাটাস রিলোড করা
        const updated = await getLocalProductChannelStatus(productId);
        if (updated.success) setStatus(updated.status);
      } else {
        toast.error(res.error || "Failed to update channel visibility.", { id: toastId });
      }
    });
  };

  // ৩. ইনস্ট্যান্ট সিঙ্ক হ্যান্ডলার (Sync Now button)
  const handleInstantSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Force syncing product with Google...");
    
    try {
      // সরাসরি গুগলের সার্ভার থেকে লাইভ ডায়াগনস্টিক ফেচ করা
      const res = await syncSingleProductStatusFromGoogle(productId);
      
      if (res.success) {
        toast.success("Successfully synced and updated status!", { id: toastId });
        // লাইভ স্ট্যাটাস রেন্ডার করা
        const updated = await getLocalProductChannelStatus(productId);
        if (updated.success) setStatus(updated.status);
      } else {
        toast.error(res.error || "Sync failed. Check errors.", { id: toastId });
      }
    } catch (e) {
      toast.error("An error occurred during sync.", { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px] overflow-hidden">
      {/* Widget Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2.5 border-b border-[#c3c4c7] bg-white cursor-pointer select-none hover:bg-[#f6f7f7]"
      >
        <span className="font-semibold text-[#1d2327] text-[13px]">Channel visibility</span>
        {isOpen ? <ChevronUp size={16} className="text-[#646970]" /> : <ChevronDown size={16} className="text-[#646970]" />}
      </div>

      {/* Widget Body */}
      {isOpen && (
        <div className="p-3.5 space-y-4">
          
          {/* Dropdown Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
              Google for WooCommerce
            </label>
            <select
              value={visibility}
              onChange={(e) => handleVisibilityChange(e.target.value as any)}
              disabled={isPending || isSyncing}
              className="w-full border border-[#8c8f94] rounded-[3px] px-2.5 py-1.5 text-[12px] focus:border-[#2271b1] focus:ring-1 focus:outline-none bg-white cursor-pointer disabled:opacity-50"
            >
              <option value="SYNCED">Sync and show</option>
              <option value="EXCLUDED">Do not sync (Exclude)</option>
            </select>
          </div>

          {/* Dynamic Sync Status Badge */}
          {status && (
            <div className="border-t border-[#f0f0f1] pt-3.5 space-y-2">
              <span className="block text-[11px] font-semibold text-[#1d2327] uppercase tracking-wide">
                Live Status on Google
              </span>
              
              {status.status === "SYNCED" && (
                <div className="flex items-center gap-2 text-[#137333] bg-[#e6f4ea] border border-[#bce3c6] px-2.5 py-1.5 rounded-[3px] text-[12px] font-medium">
                  <CheckCircle size={14} /> Synced & Active on Google
                </div>
              )}

              {status.status === "PENDING" && (
                <div className="flex items-center gap-2 text-[#947600] bg-[#fef9e7] border border-[#ffeeba] px-2.5 py-1.5 rounded-[3px] text-[12px] font-medium">
                  <Clock size={14} className="animate-pulse" /> Pending Policy Review
                </div>
              )}

              {status.status === "FAILED" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#d63638] bg-[#fcf0f1] border border-[#f5c6cb] px-2.5 py-1.5 rounded-[3px] text-[12px] font-semibold">
                    <AlertCircle size={14} /> Sync Failed (Disapproved)
                  </div>
                  {status.errorMessage && (
                    <p className="text-[11px] text-[#d63638] bg-[#fff5f5] p-2 border border-[#f5c6cb] rounded-[3px] m-0 leading-relaxed break-words font-medium">
                      Error: {status.errorMessage}
                    </p>
                  )}
                </div>
              )}

              {status.status === "EXCLUDED" && (
                <div className="flex items-center gap-2 text-[#5a5a5a] bg-[#f0f0f1] border border-[#ccd0d4] px-2.5 py-1.5 rounded-[3px] text-[12px] font-medium">
                  <EyeOff size={14} /> Excluded from Sales Channel
                </div>
              )}

              <p className="text-[10px] text-[#646970] m-0">
                Last checked: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : "Never"}
              </p>
            </div>
          )}

          {/* Instant Sync Button */}
          {visibility === "SYNCED" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleInstantSync}
                disabled={isSyncing || isPending}
                className="w-full bg-white hover:bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] rounded-[3px] py-1.5 text-[12px] font-semibold cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}