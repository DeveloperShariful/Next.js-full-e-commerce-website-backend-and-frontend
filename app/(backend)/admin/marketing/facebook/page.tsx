//app/(backend)/admin/marketing/facebook/page.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Copy, Check, Info, Settings, HelpCircle, Save } from "lucide-react";
import { getFbSettings, updateFbSettings, getFbProductStats, FbSettingsData } from "@/app/actions/backend/marketing/fb-settings.actions";

export default function FacebookSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [productStats, setProductStats] = useState({ syncShow: 0, syncOnly: 0, excluded: 0, total: 0 });

  const [formData, setFormData] = useState<FbSettingsData>({
    fbEnabled: false,
    fbPixelId: "",
    fbAccessToken: "",
    fbTestEventCode: "",
    fbDomainVerification: "",
  });

  useEffect(() => {
    setOrigin(window.location.origin);
    Promise.all([getFbSettings(), getFbProductStats()]).then(([settings, stats]) => {
      if (settings.success && settings.data) setFormData(settings.data);
      if (stats.success && stats.data) setProductStats(stats.data);
      setIsLoading(false);
    });
  }, []);

  const handleCopyFeedUrl = () => {
    const feedUrl = `${origin}/api/feeds/facebook`;
    navigator.clipboard.writeText(feedUrl);
    setCopy(true);
    toast.success("Catalog Feed URL copied to clipboard!");
    setTimeout(() => setCopy(false), 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Saving Facebook settings...");

    startTransition(async () => {
      const res = await updateFbSettings(formData);
      if (res.success) {
        toast.success(res.message || "Settings saved successfully!", { id: toastId });
      } else {
        toast.error(res.error || "Failed to save settings.", { id: toastId });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center text-[13px] text-[#646970]">
        Loading Facebook Marketing settings...
      </div>
    );
  }

  const catalogFeedUrl = `${origin}/api/feeds/facebook`;

  return (
    <div className="w-full min-h-screen bg-[#f0f0f1] text-[#3c434a] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif] p-0 m-0 pb-10">
      <Toaster position="top-right" />
      
      {/* Top Header */}
      <div className="bg-white border-b border-[#ccd0d4] py-4 px-6 m-0 mb-6 w-full flex items-center gap-3">
         <div className="w-8 h-8 bg-[#1877F2] text-white flex justify-center items-center rounded-full font-bold text-[18px]">f</div>
         <h1 className="text-[23px] font-bold text-[#1d2327] m-0">Facebook (Meta) Business</h1>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6">
        
        {/* notice alert */}
        <div className="bg-[#e5f5fa] border-l-4 border-[#00a32a] p-4 mb-6 rounded-[3px] shadow-sm flex items-start gap-4">
          <Info size={16} className="text-[#00a32a] mt-0.5 shrink-0" />
          <div className="text-[13px] leading-relaxed text-[#1d2327]">
            <strong>Meta Marketing Setup:</strong> Sync your store catalog to Facebook Commerce and install Pixel &amp; Conversions API (CAPI) for advanced tracking.
          </div>
        </div>

        {/* Product Sync Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "In Catalog", value: productStats.syncShow, color: "#00a32a" },
            { label: "Sync Only", value: productStats.syncOnly, color: "#dba617" },
            { label: "Excluded", value: productStats.excluded, color: "#d63638" },
            { label: "Total Active", value: productStats.total, color: "#2271b1" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm p-4 text-center">
              <p className="text-[28px] font-bold m-0" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[12px] text-[#646970] m-0 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN (Settings Area) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* General Settings */}
            <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden">
               <div className="border-b border-[#ccd0d4] px-5 py-3.5 bg-[#f9f9f9] flex items-center gap-2">
                 <Settings size={14} className="text-[#50575e]" />
                 <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Settings</h3>
               </div>
               
               <div className="p-6 space-y-5">
                 
                 {/* Enable Checkbox */}
                 <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="fbEnabled"
                      checked={formData.fbEnabled}
                      onChange={(e) => setFormData({ ...formData, fbEnabled: e.target.checked })}
                      className="w-4 h-4 border-[#8c8f94] rounded-[3px] text-[#1877F2] focus:ring-[#1877F2]" 
                    />
                    <label htmlFor="fbEnabled" className="text-[13px] font-semibold text-[#1d2327] cursor-pointer select-none">
                      Enable Facebook (Meta) Channel integration
                    </label>
                 </div>

                 <div className="border-t border-[#f0f0f1] my-4"></div>

                 {/* Pixel ID */}
                 <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                   <label className="w-full md:w-[180px] text-[13px] font-semibold text-[#1d2327]">Meta Pixel ID</label>
                   <input 
                     type="text"
                     value={formData.fbPixelId}
                     onChange={(e) => setFormData({ ...formData, fbPixelId: e.target.value })}
                     placeholder="e.g. 10928374656"
                     className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] outline-none"
                   />
                 </div>

                 {/* CAPI Access Token */}
                 <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                   <label className="w-full md:w-[180px] text-[13px] font-semibold text-[#1d2327] pt-1">Conversions API Token</label>
                   <textarea 
                     value={formData.fbAccessToken}
                     onChange={(e) => setFormData({ ...formData, fbAccessToken: e.target.value })}
                     placeholder="EAAGb..."
                     rows={3}
                     className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] outline-none resize-y"
                   />
                 </div>

                 {/* Test Event Code */}
                 <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                   <label className="w-full md:w-[180px] text-[13px] font-semibold text-[#1d2327]">Test Event Code</label>
                   <input 
                     type="text"
                     value={formData.fbTestEventCode}
                     onChange={(e) => setFormData({ ...formData, fbTestEventCode: e.target.value })}
                     placeholder="e.g. TEST12345"
                     className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] outline-none"
                   />
                 </div>

                 {/* Domain Verification */}
                 <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                   <label className="w-full md:w-[180px] text-[13px] font-semibold text-[#1d2327]">Domain Meta Tag Code</label>
                   <input 
                     type="text"
                     value={formData.fbDomainVerification}
                     onChange={(e) => setFormData({ ...formData, fbDomainVerification: e.target.value })}
                     placeholder="e.g. facebook-domain-verification=abcde"
                     className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] outline-none"
                   />
                 </div>

               </div>
            </div>

            {/* Save Button */}
            <div className="text-right">
              <button 
                type="submit"
                disabled={isPending}
                className="bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white px-6 py-2 rounded-[3px] text-[13px] font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5 ml-auto disabled:opacity-50"
              >
                <Save size={14} /> {isPending ? "Saving..." : "Save Settings"}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN (🚀 Australian English Guide) */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Product Feed XML Panel */}
             <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#f0f0f1] pb-3">
                   <Info size={16} className="text-[#1877F2]" />
                   <h4 className="text-[13px] font-semibold text-[#1d2327] m-0">Product Catalog Feed</h4>
                </div>
                <p className="text-[12px] text-[#646970] m-0 leading-relaxed">
                   Copy this XML feed URL and paste it as a <strong>"Scheduled Feed"</strong> data source inside Facebook Commerce Manager to list products in your Facebook/Instagram Shop.
                </p>
                <div className="bg-[#f6f7f7] border border-[#ccd0d4] p-3 rounded-[3px]">
                   <p className="text-[11px] font-mono text-[#2c3338] break-words m-0 select-all">{catalogFeedUrl}</p>
                </div>
                <button
                   type="button"
                   onClick={handleCopyFeedUrl}
                   className="w-full bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] border border-[#ccd0d4] rounded-[3px] py-1.5 text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                   {copied ? <Check size={14} className="text-[#00a32a]" /> : <Copy size={14} />}
                   {copied ? "Copied!" : "Copy Feed URL"}
                </button>
             </div>

             {/* Setup Guide Panel */}
             <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#f0f0f1] pb-3">
                   <HelpCircle size={16} className="text-[#50575e]" />
                   <h4 className="text-[13px] font-semibold text-[#1d2327] m-0">Meta Setup Guide</h4>
                </div>
                <ul className="list-decimal pl-4 m-0 text-[12px] text-[#50575e] space-y-2.5 leading-relaxed">
                  <li>To enable browser tracking, please enter your <strong>Meta Pixel ID</strong>.</li>
                  <li>For server-side tracking (Conversions API), generate your <strong>CAPI Access Token</strong> in your Meta Events Manager.</li>
                  <li>To test server-side events in real-time, copy the test code from your Meta Event Testing window and paste it here.</li>
                  <li>To automatically sync your product catalog to your Facebook Shop, copy the XML Feed URL on the left and paste it as a <strong>"Scheduled Feed"</strong> inside your Facebook Commerce Manager dashboard.</li>
                </ul>
             </div>

          </div>

        </form>
      </div>
    </div>
  );
}