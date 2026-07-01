//app/(backend)/admin/settings/_components/PaymentsTab.tsx

"use client";

import { useState, useEffect } from "react";
import { getAllPaymentGateways } from "@/app/actions/backend/settings/payments/core-actions";
import { Payment_Methods_List } from "./Payment_Methods_List";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function PaymentsTab() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await getAllPaymentGateways();
        if (res.success) {
          setMethods(res.data || []);
        } else {
          setError(res.error || "Failed to load payment methods.");
        }
      } catch (err) {
        console.error("Error fetching payment gateways:", err);
        setError("An unexpected error occurred while loading payment gateways.");
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#2271b1]" size={28} />
      </div>
    );
  }

  return (
    // ডবল bg-[#f0f0f1] এবং pb-20 সরিয়ে নেওয়া হয়েছে যেন ডবল প্যাডিং সমস্যা সমাধান হয়
    <div className="w-full font-sans text-[13px] text-[#3c434a]">
      
      {/* Page Header */}
      <div className="px-4 md:px-1 py-1">
        <h1 className="text-xl font-bold text-slate-800">Payment Settings</h1>
        <p className="text-[#3c434a] m-0 text-[14px]">
          Manage how your customers pay at checkout. Turn methods on/off and configure credentials.
        </p>
      </div>
      
      {/* Main Content Area */}
      <div className="w-full px-1 md:px-1 ">
        {error ? (
           <div className="p-3 bg-white border-l-4 border-[#d63638] shadow-sm flex items-center gap-3 text-[#d63638]">
              <AlertTriangle className="h-5 w-5" />
              <p>Failed to load payment methods: {error}</p>
           </div>
        ) : (
           <Payment_Methods_List initialMethods={methods} />
        )}
      </div>
      
    </div>
  );
}