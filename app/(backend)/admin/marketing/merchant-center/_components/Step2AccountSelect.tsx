//File Path: app/(backend)/admin/marketing/merchant-center/_components/Step2AccountSelect.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  fetchAvailableMerchantAccounts, 
  saveSelectedMerchantAccount, 
  autoClaimWebsiteDomain 
} from "@/app/actions/backend/merchant-center/gmc-onboarding.actions";
import { 
  fetchAvailableAdsAccounts, 
  saveGoogleAdsAccount 
} from "@/app/actions/backend/merchant-center/gmc-auth.actions";

interface Props {
  config: any;
}

export default function Step2AccountSelect({ config }: Props) {
  // Merchant Center States
  const [gmcAccounts, setGmcAccounts] = useState<{ id: string; name: string }[]>([]);
  const [selectedGmcId, setSelectedGmcId] = useState<string>("");
  
  // Google Ads States
  const [adsAccounts, setAdsAccounts] = useState<{ id: string; name: string }[]>([]);
  const [selectedAdsId, setSelectedAdsId] = useState<string>("");
  const [needsManualAds, setNeedsManualAds] = useState(false);
  const [manualAdsId, setManualAdsId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // পেজ লোড হলেই গুগলের API কল করে Merchant Center এবং Ads একাউন্ট লিস্ট একসাথে আনা
  useEffect(() => {
    const fetchAllAccounts = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // ১. Fetch Merchant Center Accounts
        const gmcResult = await fetchAvailableMerchantAccounts();
        if (gmcResult.success && gmcResult.accounts) {
          setGmcAccounts(gmcResult.accounts);
          if (gmcResult.accounts.length > 0) {
            setSelectedGmcId(gmcResult.accounts[0].id);
          }
        } else {
          setErrorMsg(gmcResult.error || "Failed to load Merchant Center accounts.");
        }

        // ২. Fetch Google Ads Accounts
        const adsResult = await fetchAvailableAdsAccounts();
        if (adsResult.success) {
          if (adsResult.accounts && adsResult.accounts.length > 0) {
            setAdsAccounts(adsResult.accounts);
            setSelectedAdsId(adsResult.accounts[0].id); // প্রথমটা ডিফল্ট সিলেক্ট
          } else if (adsResult.needsManualInput) {
            setNeedsManualAds(true);
          }
        }
      } catch (err: any) {
        console.error("Error fetching accounts:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllAccounts();
  }, []);

  // 🚀 SUBMIT HANDLER (Saves GMC, Claims Domain, and Saves Ads Account)
  const handleSaveAndContinue = () => {
    setErrorMsg(null);
    
    startTransition(async () => {
      // 1. Save Merchant Center Account
      const selectedGmcAcc = gmcAccounts.find(a => a.id === selectedGmcId);
      const gmcSaveRes = await saveSelectedMerchantAccount(selectedGmcId, selectedGmcAcc?.name || "");
      if (!gmcSaveRes.success) {
        setErrorMsg(gmcSaveRes.error || "Failed to save Merchant Center account.");
        return;
      }

      // 2. Save Google Ads Account (If selected or manual ID provided)
      let finalAdsIdToSave = selectedAdsId;
      if (needsManualAds && manualAdsId.trim() !== "") {
        finalAdsIdToSave = manualAdsId.trim();
      }

      if (finalAdsIdToSave) {
        const selectedAdsAcc = adsAccounts.find(a => a.id === finalAdsIdToSave);
        const adsName = selectedAdsAcc ? selectedAdsAcc.name : `Ads Account: ${finalAdsIdToSave}`;
        await saveGoogleAdsAccount(finalAdsIdToSave, adsName);
      }

      // 3. Auto Claim Website Domain (The Magic API Call)
      const claimRes = await autoClaimWebsiteDomain();
      if (!claimRes.success) {
        setErrorMsg(claimRes.error || "Failed to claim domain.");
        return;
      }
      
      // সাকসেস হলে Server Action নিজে থেকেই revalidatePath করবে
      // এবং উইজার্ড অটোমেটিক Step 3 তে চলে যাবে!
    });
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-[13px] text-[#646970]">
        Loading your Google Merchant Center and Ads accounts...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h3 className="text-[16px] font-semibold text-[#1d2327] mb-2 text-center">Select Your Google Accounts</h3>
      <p className="text-[13px] text-[#646970] mb-6 text-center">
        Connected as <strong>{config.googleAccountId}</strong>
      </p>

      {/* WordPress Error Notice */}
      {errorMsg && (
        <div className="bg-[#fcf0f1] border-l-4 border-[#d63638] p-3 mb-6 max-w-[500px] mx-auto text-[13px] text-[#d63638]">
          {errorMsg}
        </div>
      )}

      <div className="max-w-[450px] mx-auto">
        {gmcAccounts.length > 0 ? (
          <div className="bg-[#f9f9f9] border border-[#ccd0d4] p-5 rounded-[3px] mb-6 shadow-sm">
            
            {/* 🛒 1. Merchant Center Dropdown */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">
                Merchant Center Account <span className="text-[#d63638]">*</span>
              </label>
              <p className="text-[11px] text-[#646970] mb-2">Required for syncing products to Google Shopping.</p>
              <select
                value={selectedGmcId}
                onChange={(e) => setSelectedGmcId(e.target.value)}
                className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-2 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none bg-white cursor-pointer"
              >
                {gmcAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-[#ccd0d4] mb-5"></div>

            {/* 🎯 2. Google Ads Dropdown */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">
                Google Ads Account (Optional)
              </label>
              <p className="text-[11px] text-[#646970] mb-2">Required for conversion tracking and running ad campaigns.</p>
              
              {!needsManualAds && adsAccounts.length > 0 ? (
                <select
                  value={selectedAdsId}
                  onChange={(e) => setSelectedAdsId(e.target.value)}
                  className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-2 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">-- I'll connect later --</option>
                  {adsAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={manualAdsId}
                    onChange={(e) => setManualAdsId(e.target.value)}
                    placeholder="Enter Ads ID: 123-456-7890"
                    className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <div className="text-center bg-[#f0f0f1] border border-[#ccd0d4] p-4 rounded-[3px] mb-6">
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

        <button
          onClick={handleSaveAndContinue}
          disabled={isPending || !selectedGmcId}
          className="w-full bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] px-4 py-2 text-[14px] font-semibold shadow-sm disabled:opacity-50 transition-colors"
        >
          {isPending ? "Configuring & Claiming Domain..." : "Save Accounts & Continue"}
        </button>
      </div>
    </div>
  );
}