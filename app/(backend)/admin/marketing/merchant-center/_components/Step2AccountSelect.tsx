//File Path: app/(backend)/admin/marketing/merchant-center/_components/Step2AccountSelect.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  fetchAvailableMerchantAccounts, 
  saveSelectedMerchantAccount, 
  autoClaimWebsiteDomain 
} from "@/app/actions/backend/merchant-center/gmc-onboarding.actions";

interface Props {
  config: any;
}

export default function Step2AccountSelect({ config }: Props) {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // পেজ লোড হলেই গুগলের API কল করে একাউন্ট লিস্ট আনা
  useEffect(() => {
    const fetchAccounts = async () => {
      const result = await fetchAvailableMerchantAccounts();
      if (result.success && result.accounts) {
        setAccounts(result.accounts);
        if (result.accounts.length > 0) {
          setSelectedId(result.accounts[0].id); // প্রথমটা ডিফল্ট সিলেক্ট
        }
      } else {
        setErrorMsg(result.error || "Failed to load accounts.");
      }
      setIsLoading(false);
    };
    fetchAccounts();
  }, []);

  const handleClaimDomain = () => {
    setErrorMsg(null);
    
    startTransition(async () => {
      const selectedAcc = accounts.find(a => a.id === selectedId);
      
      // ১. একাউন্ট সেভ করা
      const saveRes = await saveSelectedMerchantAccount(selectedId, selectedAcc?.name || "");
      if (!saveRes.success) {
        setErrorMsg(saveRes.error || "Failed to save account.");
        return;
      }

      // ২. ওয়েবসাইট ক্লেইম করা (The Magic API Call)
      const claimRes = await autoClaimWebsiteDomain();
      if (!claimRes.success) {
        setErrorMsg(claimRes.error || "Failed to claim domain.");
      }
      // যদি সাকসেস হয়, Server Action নিজে থেকেই revalidatePath করবে
      // এবং উইজার্ড অটোমেটিক Step 3 তে চলে যাবে!
    });
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-[13px] text-[#646970]">
        Loading your Merchant Center accounts...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h3 className="text-[16px] font-semibold text-[#1d2327] mb-2 text-center">Select Merchant Center Account</h3>
      <p className="text-[13px] text-[#646970] mb-6 text-center">
        Connected as <strong>{config.googleAccountId}</strong>
      </p>

      {/* WordPress Error Notice */}
      {errorMsg && (
        <div className="bg-[#fcf0f1] border-l-4 border-[#d63638] p-3 mb-5 max-w-[500px] mx-auto text-[13px] text-[#d63638]">
          {errorMsg}
        </div>
      )}

      <div className="max-w-[400px] mx-auto">
        {accounts.length > 0 ? (
          <>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-2">
              Available Accounts
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-2 text-[14px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none mb-6"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.id})
                </option>
              ))}
            </select>

            <button
              onClick={handleClaimDomain}
              disabled={isPending || !selectedId}
              className="w-full bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] px-4 py-2 text-[13px] font-semibold shadow-sm disabled:opacity-50"
            >
              {isPending ? "Verifying & Claiming Domain..." : "Claim Domain & Continue"}
            </button>
          </>
        ) : (
          <div className="text-center bg-[#f0f0f1] border border-[#ccd0d4] p-4 rounded-[3px]">
            <p className="text-[13px] text-[#50575e] mb-3">
              We couldn't find any Google Merchant Center account associated with your email.
            </p>
            <a 
              href="https://merchants.google.com/" 
              target="_blank" 
              className="text-[#2271b1] hover:underline text-[13px] font-semibold"
            >
              Create a free account here &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}