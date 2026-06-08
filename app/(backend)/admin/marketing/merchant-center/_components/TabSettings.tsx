//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabSettings.tsx

"use client";

import { useTransition, useState, useEffect } from "react";
import { 
  disconnectGoogleAccount, 
  disconnectGoogleAdsAccount, 
  saveGoogleAdsAccount,
  fetchAvailableAdsAccounts,
  autoFetchAndSaveConversions // 🚀 নতুন ম্যাজিক ফাংশন ইম্পোর্ট করা হলো
} from "@/app/actions/backend/merchant-center/gmc-auth.actions";
import { 
  updateGmcSettings, 
  saveGoogleAdsConversionSettings, 
  GmcSettingsData 
} from "@/app/actions/backend/merchant-center/gmc-settings.actions";

// ============================================================================
// 🌍 GOOGLE SUPPORTED COUNTRIES & LANGUAGES
// ============================================================================
const SUPPORTED_COUNTRIES = [
  { code: "AU", name: "Australia" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
];

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

interface Props {
  config: any;
  onDisconnect: () => void;
  isPending: boolean;
}

export default function TabSettings({ config, onDisconnect, isPending }: Props) {
  // ==========================================
  // 🚀 STATE MANAGEMENT
  // ==========================================
  const [isPendingAds, startTransition] = useTransition();
  const [isPendingForm, startFormTransition] = useTransition();
  const [isPendingConversion, startConversionTransition] = useTransition();
  
  // Connection UI States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingAdsList, setIsFetchingAdsList] = useState(false);
  const [adsAccounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  
  const [selectedAdsId, setSelectedAdsId] = useState(""); // 👈 ড্রপডাউন সিলেক্ট করার জন্য স্টেট
  const [needsManual, setNeedsManual] = useState(false);
  const [manualId, setManualId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Settings Form State
  const [formData, setFormData] = useState<GmcSettingsData>({
    gmcContentApiEnabled: config?.gmcContentApiEnabled || false,
    gmcMerchantId: config?.gmcMerchantId || "",
    gmcTargetCountry: config?.gmcTargetCountry || "AU",
    gmcLanguage: config?.gmcLanguage || "en",
  });
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Conversion Tracking States
  const [conversionId, setConversionId] = useState(config?.googleAdsConversionId || "");
  const [conversionLabel, setConversionLabel] = useState(config?.googleAdsConversionLabel || "");
  const [enhancedConversions, setEnhancedConversions] = useState(config?.googleAdsEnhancedConversionsEnabled || false);
  const [conversionMessage, setConversionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (config) {
      setConversionId(config.googleAdsConversionId || "");
      setConversionLabel(config.googleAdsConversionLabel || "");
      setEnhancedConversions(config.googleAdsEnhancedConversionsEnabled || false);
    }
  }, [config]);

  // ==========================================
  // 🚀 ACTION HANDLERS
  // ==========================================
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    startFormTransition(async () => {
      const result = await updateGmcSettings(formData);
      if (result.success) {
        setFormMessage({ type: "success", text: "Settings saved successfully." });
        setTimeout(() => setFormMessage(null), 3000); 
      } else {
        setFormMessage({ type: "error", text: result.error || "Failed to save." });
      }
    });
  };

  const handleDisconnectAds = () => {
    if (!confirm("Disconnect Google Ads account?")) return;
    startTransition(async () => {
      const res = await disconnectGoogleAdsAccount();
      if (!res.success) alert(res.error);
    });
  };

  const handleStartConnection = () => {
    setErrorMsg(null);
    setIsConnecting(true);
    setNeedsManual(false);
    setAccounts([]);
    setSelectedAdsId("");
  };

  const handleFetchAccounts = async () => {
    setErrorMsg(null);
    setIsFetchingAdsList(true);
    
    const res = await fetchAvailableAdsAccounts();
    
    if (res.success) {
      if (res.accounts && res.accounts.length > 0) {
        setAccounts(res.accounts);
      } else {
        setNeedsManual(true);
      }
    } else {
      setErrorMsg(res.error || null);
      setNeedsManual(true);
    }
    setIsFetchingAdsList(false);
  };

  // 🚀 2-IN-1 ACTION: Link Account AND Auto-Fetch Conversions
  const handleSaveAdsAccount = (idToSave: string) => {
    if (!idToSave) return;
    
    const selectedAcc = adsAccounts.find(a => a.id === idToSave);
    const displayName = selectedAcc ? selectedAcc.name : `Ads Account: ${idToSave}`;

    startTransition(async () => {
      // ১. অ্যাকাউন্ট সেভ করা
      const res = await saveGoogleAdsAccount(idToSave, displayName);
      
      if (res.success) {
        // ২. 🚀 অটো-ফেচ ম্যাজিক কল করা!
        const convRes = await autoFetchAndSaveConversions(idToSave);
        
        if (convRes.success && convRes.found) {
          // ম্যাজিক! ইনপুট বক্সে সাথে সাথে ডাটা বসে যাবে
          setConversionId(convRes.convId);
          setConversionLabel(convRes.convLabel);
          setConversionMessage({ type: "success", text: "Account linked & Purchase tags auto-fetched successfully!" });
        } else {
          setConversionMessage({ type: "error", text: convRes.message || "Account linked, but no Purchase tag found. Please enter manually." });
        }

        setIsConnecting(false);
        setNeedsManual(false);
        setManualId("");
        setSelectedAdsId("");
        
        setTimeout(() => setConversionMessage(null), 6000);
      } else {
        setErrorMsg(res.error || null);
      }
    });
  };

  const handleSaveConversionSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setConversionMessage(null);
    startConversionTransition(async () => {
      const res = await saveGoogleAdsConversionSettings({
        googleAdsConversionId: conversionId.trim(),
        googleAdsConversionLabel: conversionLabel.trim(),
        googleAdsEnhancedConversionsEnabled: enhancedConversions
      });
      if (res.success) {
        setConversionMessage({ type: "success", text: "Tracking preferences saved successfully." });
        setTimeout(() => setConversionMessage(null), 3000);
      } else {
        setConversionMessage({ type: "error", text: res.error || "Failed to save tracking preferences." });
      }
    });
  };

  return (
    <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 mt-2">
      
      {/* ========================================== */}
      {/* 🚀 SECTION 1: GMC CONFIGURATION */}
      {/* ========================================== */}
      <div className="md:col-span-4">
        <h3 className="text-[15px] font-semibold text-[#1d2327] m-0 mb-2">Sync Settings</h3>
        <p className="text-[13px] text-[#646970] m-0 leading-relaxed">
          Configure your target country and language for Google Merchant Center.
        </p>
      </div>

      <div className="md:col-span-8 mb-10">
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] p-6">
            <form onSubmit={handleFormSubmit}>
              {formMessage && (
                <div className={`p-3 mb-4 text-[13px] border-l-4 ${formMessage.type === "success" ? "border-[#00a32a] bg-[#f0f6ea]" : "border-[#d63638] bg-[#fcf0f1]"}`}>
                  {formMessage.text}
                </div>
              )}
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr>
                    <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327]">Enable integration</th>
                    <td className="py-4 align-top">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.gmcContentApiEnabled} onChange={(e) => setFormData({ ...formData, gmcContentApiEnabled: e.target.checked })} className="w-4 h-4 border-[#8c8f94] rounded-[3px] text-[#2271b1]" />
                        <span className="text-[13px]">Enable Content API Product Sync</span>
                      </label>
                    </td>
                  </tr>
                  <tr>
                    <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327]">Merchant Center ID <span className="text-[#d63638]">*</span></th>
                    <td className="py-4 align-top">
                      <input type="text" required value={formData.gmcMerchantId} onChange={(e) => setFormData({ ...formData, gmcMerchantId: e.target.value })} className="w-full max-w-[350px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] bg-[#f6f7f7] focus:outline-none" readOnly />
                    </td>
                  </tr>
                  <tr>
                    <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327]">Target Country</th>
                    <td className="py-4 align-top">
                      <select value={formData.gmcTargetCountry} onChange={(e) => setFormData({ ...formData, gmcTargetCountry: e.target.value })} className="w-full max-w-[350px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:outline-none bg-white cursor-pointer">
                        {SUPPORTED_COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name} ({country.code})</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th className="py-4 align-top w-[200px] text-[13px] font-semibold text-[#1d2327] border-b-0">Content Language</th>
                    <td className="py-4 align-top border-b-0">
                      <select value={formData.gmcLanguage} onChange={(e) => setFormData({ ...formData, gmcLanguage: e.target.value })} className="w-full max-w-[350px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:outline-none bg-white cursor-pointer">
                        {SUPPORTED_LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>)}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-6 pt-4 border-t border-[#ccd0d4]">
                <button type="submit" disabled={isPendingForm} className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] px-4 py-1.5 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50">
                  {isPendingForm ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
        </div>
      </div>

      <div className="md:col-span-12 border-t border-[#ccd0d4] my-2"></div>

      {/* ========================================== */}
      {/* 🚀 SECTION 2: LINKED ACCOUNTS */}
      {/* ========================================== */}
      <div className="md:col-span-4">
        <h3 className="text-[15px] font-semibold text-[#1d2327] m-0 mb-2">Linked accounts</h3>
        <p className="text-[13px] text-[#646970] m-0 leading-relaxed">
          A Google account, Google Merchant Center account, and Google Ads account are required to use this extension.
        </p>
      </div>

      <div className="md:col-span-8 flex flex-col gap-5">

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
            <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span> Connected
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] p-6 rounded-[3px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#4285F4] rounded-[3px] flex items-center justify-center text-white font-bold text-[16px]">M</div>
            <div>
              <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 mb-1">Google Merchant Center</h4>
              <p className="text-[13px] text-[#646970] m-0">{config.gmcMerchantName || "Store Account"} ({config.gmcMerchantId})</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#00a32a]">
            <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span> Connected
          </div>
        </div>

        {/* 3. Google Ads Card */}
        <div className="bg-white border border-[#ccd0d4] p-0 rounded-[3px] shadow-sm transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="#F4B400"/></svg>
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 mb-1">Google Ads</h4>
                  {config.googleAdsConnected && config.googleAdsAccountId ? (
                    <a href={`https://ads.google.com/aw/overview?ocid=${config.googleAdsAccountId}`} target="_blank" className="text-[13px] text-[#2271b1] hover:underline m-0">
                      {config.googleAdsAccountName || `Account ${config.googleAdsAccountId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`} ↗
                    </a>
                  ) : (
                    <p className="text-[13px] text-[#646970] m-0">No account connected</p>
                  )}
                </div>
              </div>
              
              {config.googleAdsConnected ? (
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#00a32a]">
                  <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span> Connected
                </div>
              ) : (
                !isConnecting && (
                  <button onClick={handleStartConnection} className="border border-[#2271b1] text-[#2271b1] hover:bg-[#f6f7f7] px-5 py-1.5 rounded-[3px] text-[13px] font-semibold transition-colors cursor-pointer bg-transparent">
                    Connect
                  </button>
                )
              )}
            </div>

            {/* 🚀 NEW: Google Ads Connection UI with FETCH BUTTON & SEPARATE LINK BUTTON */}
            {!config.googleAdsConnected && isConnecting && (
              <div className="mt-4 pt-4 border-t border-[#ccd0d4] max-w-[600px]">
                {errorMsg && <p className="text-[12px] text-[#d63638] mb-3 font-semibold break-words bg-[#fcf0f1] p-2 border-l-2 border-[#d63638]">API Error: {errorMsg}</p>}
                
                {/* STATE 1: Fetching Area */}
                {adsAccounts.length === 0 && !needsManual && (
                  <div className="bg-[#f6f7f7] p-4 border border-[#ccd0d4] rounded-[3px]">
                    <p className="text-[13px] text-[#1d2327] font-semibold mb-1">Fetch Ads Accounts</p>
                    <p className="text-[12px] text-[#50575e] mb-4">Click the button below to retrieve the Google Ads accounts linked to your email.</p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleFetchAccounts}
                        disabled={isFetchingAdsList}
                        className="bg-[#2271b1] hover:bg-[#135e96] text-white px-4 py-2 rounded-[3px] text-[12px] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isFetchingAdsList ? "Fetching from Google..." : "Fetch My Ads Accounts"}
                      </button>
                      <button 
                        onClick={() => setNeedsManual(true)} 
                        className="text-[12px] text-[#2271b1] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Enter ID manually
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 2: Select & Link Area */}
                {adsAccounts.length > 0 && !needsManual && (
                  <div className="bg-[#f6f7f7] p-4 border border-[#ccd0d4] rounded-[3px]">
                    <label className="block text-[13px] text-[#1d2327] font-semibold mb-2">Select your account to Link</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select 
                        value={selectedAdsId}
                        onChange={(e) => setSelectedAdsId(e.target.value)}
                        className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-2 text-[13px] focus:border-[#2271b1] bg-white cursor-pointer"
                      >
                        <option value="">-- Choose an Account --</option>
                        {adsAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSaveAdsAccount(selectedAdsId)}
                          disabled={isPendingAds || !selectedAdsId}
                          className="bg-[#2271b1] text-white px-5 py-2 rounded-[3px] text-[13px] font-semibold cursor-pointer border-none disabled:opacity-50 whitespace-nowrap"
                        >
                          {isPendingAds ? "Linking & Fetching Tags..." : "Link Selected Account"}
                        </button>
                        <button onClick={() => {setIsConnecting(false); setAccounts([]); setSelectedAdsId("");}} className="text-[13px] px-2 text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STATE 3: MANUAL INPUT */}
                {needsManual && (
                  <div className="bg-[#f6f7f7] p-4 border border-[#ccd0d4] rounded-[3px]">
                    <label className="block text-[12px] text-[#1d2327] font-semibold mb-1">Enter Ads Account ID</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="e.g. 123-456-7890"
                        className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#2271b1] focus:outline-none"
                      />
                      <button 
                        onClick={() => handleSaveAdsAccount(manualId)}
                        disabled={isPendingAds || !manualId}
                        className="bg-[#2271b1] text-white px-4 py-1.5 rounded-[3px] text-[13px] font-semibold cursor-pointer border-none disabled:opacity-50"
                      >
                         {isPendingAds ? "Linking..." : "Link Account"}
                      </button>
                      <button onClick={() => { setIsConnecting(false); setErrorMsg(null); setNeedsManual(false); }} className="text-[13px] text-[#646970] hover:underline bg-transparent border-none cursor-pointer">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {config.googleAdsConnected && (
            <div className="bg-[#f9f9f9] px-6 py-3 border-t border-[#ccd0d4]">
              <button onClick={handleDisconnectAds} disabled={isPendingAds} className="text-[#d63638] hover:underline text-[12px] bg-transparent border-none p-0 cursor-pointer disabled:opacity-50">
                Disconnect Google Ads account only
              </button>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* 🚀 CONVERSION TRACKING CARD (Auto Filled!) */}
        {/* ========================================================== */}
        {config.googleAdsConnected && (
          <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden animate-in fade-in duration-300">
            <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0 bg-[#f9f9f9]">
              Google Ads Tracking & Conversions
            </h2>
            <div className="p-6">
              <form onSubmit={handleSaveConversionSettings}>
                {conversionMessage && (
                  <div className={`p-3 mb-4 text-[13px] border-l-4 ${conversionMessage.type === "success" ? "border-[#00a32a] bg-[#f0f6ea]" : "border-[#d63638] bg-[#fcf0f1]"}`}>
                    {conversionMessage.text}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Google Ads Conversion ID</label>
                  <input type="text" value={conversionId} onChange={(e) => setConversionId(e.target.value)} placeholder="e.g., AW-109283746" className="w-full max-w-[400px] border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#2271b1] focus:outline-none" />
                </div>

                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Purchase Conversion Label</label>
                  <input type="text" value={conversionLabel} onChange={(e) => setConversionLabel(e.target.value)} placeholder="e.g., abCDefGhIJKlMnOpqR" className="w-full max-w-[400px] border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#2271b1] focus:outline-none" />
                </div>

                <div className="mb-5">
                  <label className="flex items-start gap-2 cursor-pointer max-w-[500px]">
                    <input type="checkbox" checked={enhancedConversions} onChange={(e) => setEnhancedConversions(e.target.checked)} className="w-4 h-4 border-[#8c8f94] rounded-[3px] text-[#2271b1] mt-0.5" />
                    <div>
                      <span className="text-[13px] font-semibold text-[#1d2327]">Enable Enhanced Conversions</span>
                      <p className="text-[11px] text-[#646970] m-0 mt-0.5">Sends hashed first-party customer data safely to Google to improve campaign measurement.</p>
                    </div>
                  </label>
                </div>

                <button type="submit" disabled={isPendingConversion} className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] px-4 py-1.5 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50">
                  {isPendingConversion ? "Saving Preferences..." : "Save Tracking Preferences"}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="text-right mt-4 mb-10">
          <button onClick={() => setIsModalOpen(true)} disabled={isPending} className="bg-[#d63638] hover:bg-[#b32d2e] text-white border-none rounded-[3px] px-6 py-2.5 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50 transition-colors">
            Disconnect from all accounts
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white border border-[#ccd0d4] p-6 max-w-[450px] w-full rounded-[3px] shadow-lg relative z-10 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-semibold text-[#1d2327] m-0 mb-3">Disconnect from Google Services?</h3>
            <p className="text-[13px] text-[#50575e] leading-relaxed m-0 mb-6">Are you sure you want to disconnect? This will stop all product syncs and disable Google Ads tracking.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="bg-[#f6f7f7] text-[#2271b1] border border-[#ccd0d4] px-4 py-2 hover:bg-[#f0f0f1] rounded-[3px] text-[13px] font-semibold cursor-pointer">Cancel</button>
              <button onClick={() => { setIsModalOpen(false); onDisconnect(); }} className="bg-[#d63638] hover:bg-[#b32d2e] text-white border border-[#d63638] px-4 py-2 rounded-[3px] text-[13px] font-semibold cursor-pointer">Yes, Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}