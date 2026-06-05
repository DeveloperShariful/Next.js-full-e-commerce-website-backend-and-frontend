// File: app/(frontend)/my-account/_components/subscriptions-view.tsx

"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { CreditCard, Pause, Play, Trash2, Calendar, Loader2 } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { pauseSubscriptionAction, cancelSubscriptionAction } from "@/app/actions/frontend/my-account/subscription-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionItem {
  id: string;
  status: string;
  startDate: string | Date;
  nextBillingDate: string | Date;
  plan: {
    name: string;
    price: number;
    interval: string;
  };
}

interface Props {
  initialSubscriptions: SubscriptionItem[];
}

export default function SubscriptionsView({ initialSubscriptions }: Props) {
  const { formatPrice } = useGlobalStore();
  const [isPending, startTransition] = useTransition();

  const handlePause = (id: string) => {
    if (!confirm("Pause this subscription? You will not be billed next cycle.")) return;
    startTransition(async () => {
      const res = await pauseSubscriptionAction(id);
      if (res.success) {
        toast.success(res.message);
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleCancel = (id: string) => {
    const reason = prompt("Optional: Why are you cancelling your plan?");
    if (reason === null) return; // User pressed cancel on prompt

    startTransition(async () => {
      const res = await cancelSubscriptionAction({ subscriptionId: id, reason });
      if (res.success) {
        toast.success(res.message);
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      {initialSubscriptions.length === 0 ? (
        <div className="p-8 text-center text-[#50575e] bg-white border border-[#c3c4c7] flex flex-col items-center">
          <CreditCard className="w-8 h-8 text-[#c3c4c7] mb-2" />
          <p className="text-[13px] font-medium m-0">No active subscriptions found.</p>
        </div>
      ) : (
        initialSubscriptions.map((sub) => {
          const isPaused = sub.status === "PAUSED";
          const isCancelled = sub.status === "CANCELLED";

          return (
            <div key={sub.id} className={cn("bg-white border border-[#c3c4c7] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4", isCancelled && "opacity-60")}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#f0f6fc] border border-[#2271b1]/30 text-[#2271b1] shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[14px] text-[#1d2327] m-0">{sub.plan.name}</h4>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border", 
                      sub.status === "ACTIVE" ? "bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/20" :
                      sub.status === "PAUSED" ? "bg-[#fcf9e8] text-[#8a6d3b] border-[#f0b849]/30" : "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/20"
                    )}>
                      {sub.status.toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="text-[12px] text-[#50575e] mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Billing: {format(new Date(sub.nextBillingDate), "Y/m/d")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <div className="text-left md:text-right">
                    <p className="text-[10px] text-[#8c8f94] uppercase m-0">Cycle Cost</p>
                    <p className="text-[14px] font-mono font-semibold text-[#1d2327] m-0">
                        {formatPrice(sub.plan.price)} / {sub.plan.interval.toLowerCase()}
                    </p>
                </div>

                <div className="flex gap-2">
                  {!isCancelled && !isPaused && (
                    <button 
                      onClick={() => handlePause(sub.id)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] hover:bg-[#e6e6e6] rounded-sm text-[12px] font-semibold transition-colors flex items-center gap-1"
                    >
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Pause className="w-3 h-3" />}
                      Pause
                    </button>
                  )}
                  {!isCancelled && (
                    <button 
                      onClick={() => handleCancel(sub.id)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 border border-[#d63638] bg-[#fcf0f1] text-[#d63638] hover:bg-[#d63638] hover:text-white rounded-sm text-[12px] font-semibold transition-colors flex items-center gap-1"
                    >
                      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Cancel Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}