//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabSettings.tsx

"use client";

import { useTransition, useState } from "react";
import { 
  disconnectGoogleAdsAccount, 
  saveGoogleAdsAccount,
  fetchAvailableAdsAccounts
} from "@/app/actions/backend/merchant-center/gmc-auth.actions";
import GmcSettingsForm from "./GmcSettingsForm";

interface Props {
  config: any;
  onDisconnect: () => void;
  isPending: boolean;
}

export default function TabSettings({ config, onDisconnect, isPending }: Props) {
  const [isPendingAds, startTransition] = useTransition();
  const [isConnecting, setIsConnecting] = useState(false);
  const [adsAccounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [needsManual, setNeedsManual] = useState(false);
  const [manualId, setManualId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🚀 NEW: Custom Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDisconnectAds = () => {
    if (!confirm("Disconnect Google Ads account?")) return;
    startTransition(async () => {
      const res = await disconnectGoogleAdsAccount();
      if (!res.success) alert(res.error);
    });
  };

  const handleStartConnection = async () => {
    setErrorMsg(null);
    setIsConnecting(true);
    const res = await fetchAvailableAdsAccounts();
    if (res.success) {
      if (res.needsManualInput) {
        setNeedsManual(true);
      } else if (res.accounts && res.accounts.length > 0) {
        setAccounts(res.accounts);
      } else {
        setNeedsManual(true);
      }
    } else {
      setErrorMsg(res.error || null); // 🚀 TS Error Fixed
      setNeedsManual(true);
    }
  };

  const handleSaveAdsAccount = (idToSave: string) => {
    if (!idToSave) return;
    startTransition(async () => {
      const res = await saveGoogleAdsAccount(idToSave, "");
      if (res.success) {
        setIsConnecting(false);
        setNeedsManual(false);
        setManualId("");
      } else {
        setErrorMsg(res.error || null); // 🚀 TS Error Fixed
      }
    });
  };

  return (
    <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 mt-2">
      
      {/* Settings Form */}
      <div className="md:col-span-4">
        <h3 className="text-[15px] font-semibold text-[#1d2327] m-0 mb-2">Sync Settings</h3>
        <p className="text-[13px] text-[#646970] m-0 leading-relaxed">
          Configure your target country and language for Google Merchant Center. These settings apply to all synced products.
        </p>
      </div>

      <div className="md:col-span-8 mb-10">
        <div className="bg-white border border-[#ccd0d4] rounded-[3px]">
          <div className="p-6">
            <GmcSettingsForm initialData={config} disabled={false} />
          </div>
        </div>
      </div>

      <div className="md:col-span-12 border-t border-[#ccd0d4] my-2"></div>

      {/* Linked Accounts */}
      <div className="md:col-span-4">
        <h3 className="text-[15px] font-semibold text-[#1d2327] m-0 mb-2">Linked accounts</h3>
        <p className="text-[13px] text-[#646970] m-0 leading-relaxed">
          A Google account, Google Merchant Center account, and Google Ads account are required to use this extension to its full potential.
        </p>
      </div>

      <div className="md:col-span-8 flex flex-col gap-5">

        {/* 1. Google Account Card */}
        <div className="bg-white border border-[#ccd0d4] p-6 rounded-[3px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            {config.googleAccountImage ? (
              <img src={config.googleAccountImage} alt="Gmail Avatar" className="w-8 h-8 rounded-full border border-[#ccd0d4]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">G</div>
            )}
            <div>
              <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 mb-1">Google</h4>
              <p className="text-[13px] text-[#646970] m-0">{config.googleAccountId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#00a32a]">
            <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
            Connected
          </div>
        </div>

        {/* 2. Merchant Center Card */}
        <div className="bg-white border border-[#ccd0d4] p-6 rounded-[3px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#4285F4] rounded-[3px] flex items-center justify-center text-white font-bold text-[16px]">M</div>
            <div>
              <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 mb-1">Google Merchant Center</h4>
              <p className="text-[13px] text-[#646970] m-0">
                {config.gmcMerchantName || "Store Account"} ({config.gmcMerchantId})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#00a32a]">
            <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
            Connected
          </div>
        </div>

        {/* 3. Google Ads Card */}
        <div className="bg-white border border-[#ccd0d4] p-0 rounded-[3px] shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="#F4B400"/></svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 mb-1">Google Ads</h4>
                  {config.googleAdsConnected ? (
                    <a href={`https://ads.google.com/aw/overview?ocid=${config.googleAdsAccountId}`} target="_blank" className="text-[13px] text-[#2271b1] hover:underline m-0">
                      Account {config.googleAdsAccountId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")} ↗
                    </a>
                  ) : (
                    <p className="text-[13px] text-[#646970] m-0">No account connected</p>
                  )}
                </div>
              </div>
              
              {config.googleAdsConnected ? (
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#00a32a]">
                  <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span>
                  Connected
                </div>
              ) : (
                !isConnecting && (
                  <button 
                    onClick={handleStartConnection}
                    className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] px-5 py-1.5 rounded-[3px] text-[13px] font-semibold transition-colors"
                  >
                    Connect
                  </button>
                )
              )}
            </div>

            {/* Google Ads Connection UI */}
            {!config.googleAdsConnected && isConnecting && (
              <div className="mt-4 pt-4 border-t border-[#ccd0d4] max-w-[400px]">
                {errorMsg && <p className="text-[12px] text-[#d63638] mb-2">{errorMsg}</p>}
                
                {/* DYNAMIC SELECT DROPDOWN */}
                {adsAccounts.length > 0 && !needsManual && (
                  <div>
                    <label className="block text-[12px] text-[#1d2327] font-semibold mb-1">Select Ads Account</label>
                    <div className="flex gap-2">
                      <select 
                        onChange={(e) => handleSaveAdsAccount(e.target.value)}
                        className="flex-1 border border-[#8c8f94] rounded-[3px] px-2 py-1 text-[13px] focus:outline-none bg-white cursor-pointer"
                      >
                        <option value="">-- Choose Account --</option>
                        {adsAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                      <button onClick={() => setIsConnecting(false)} className="text-[13px] text-[#646970] hover:underline">Cancel</button>
                    </div>
                  </div>
                )}

                {needsManual && (
                  <div>
                    <label className="block text-[12px] text-[#1d2327] font-semibold mb-1">Enter Ads Account ID</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="e.g. 123-456-7890"
                        className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1 text-[13px] focus:border-[#2271b1] focus:outline-none"
                      />
                      <button 
                        onClick={() => handleSaveAdsAccount(manualId)}
                        disabled={isPendingAds || !manualId}
                        className="bg-[#2271b1] text-white px-3 py-1 rounded-[3px] text-[13px] font-semibold"
                      >
                        Link Account
                      </button>
                      <button onClick={() => setIsConnecting(false)} className="text-[13px] text-[#646970] hover:underline">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {config.googleAdsConnected && (
            <div className="bg-[#f9f9f9] px-6 py-3 border-t border-[#ccd0d4]">
              <button 
                onClick={handleDisconnectAds}
                disabled={isPendingAds}
                className="text-[#d63638] hover:underline text-[12px] bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
              >
                Disconnect Google Ads account only
              </button>
            </div>
          )}
        </div>

        {/* Global Disconnect Button (Triggering Custom Modal) */}
        <div className="text-right mt-4 mb-10">
          <button
            onClick={() => setIsModalOpen(true)} // 🚀 TRIGGER: কাস্টম পপ-আপ ওপেন হবে
            disabled={isPending}
            className="bg-[#d63638] hover:bg-[#b32d2e] text-white border-none rounded-[3px] px-6 py-2.5 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
          >
            Disconnect from all accounts
          </button>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 🚀 NEW: WOOCOMMERCE STYLE FLAT DISCONNECT CONFIRMATION MODAL */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Flat Semi-transparent dark overlay (NO BLUR, 100% FLAT STYLE) */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Custom Modal Box */}
          <div className="bg-white border border-[#ccd0d4] p-6 max-w-[450px] w-full rounded-[3px] shadow-lg relative z-10 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-semibold text-[#1d2327] m-0 mb-3">
              Disconnect from Google Services?
            </h3>
            <p className="text-[13px] text-[#50575e] leading-relaxed m-0 mb-6">
              Are you sure you want to disconnect? This will stop all product syncs to Google Merchant Center and disable Google Ads campaign tracking on your dashboard.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-[#f6f7f7] text-[#2271b1] border border-[#ccd0d4] px-4 py-2 hover:bg-[#f0f0f1] rounded-[3px] text-[13px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false); // ক্লোজ পপ-আপ
                  onDisconnect(); // ডিকানেক্ট অ্যাকশন ট্রিগার
                }}
                className="bg-[#d63638] hover:bg-[#b32d2e] text-white border border-[#d63638] px-4 py-2 rounded-[3px] text-[13px] font-semibold cursor-pointer"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}