//app/(backend)/admin/marketing/search-console/_components/GscDashboard.tsx

"use client";

import { useState, useTransition } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Settings, Info, Save, HelpCircle, Flame, Send, Trash2 } from "lucide-react";
import { saveGscConfig, forceGoogleIndexing } from "@/app/actions/backend/marketing/gsc-indexing.actions";

interface Props {
  config: any;
}

export default function GscDashboard({ config }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isIndexing, setIsIndexing] = useState(false);

  // GSC Settings States
  const [formData, setFormData] = useState({
    gscVerificationCode: config.gscVerificationCode || "",
    gscServiceAccountJson: config.gscServiceAccountJson || "",
  });

  // Instant Indexer States
  const [urlToIndex, setUrlToIndex] = useState("");
  const [actionType, setActionType] = useState<"URL_UPDATED" | "URL_DELETED">("URL_UPDATED");

  // ১. সেটিংস সেভ হ্যান্ডলার
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Saving Search Console settings...");

    startTransition(async () => {
      const res = await saveGscConfig(formData);
      if (res.success) {
        toast.success(res.message || "Saved successfully!", { id: toastId });
      } else {
        toast.error(res.error || "Failed to save settings.", { id: toastId });
      }
    });
  };

  // ২. ইনস্ট্যান্ট গুগল ইনডেক্সার হ্যান্ডলার (গুগলের ক্রলারকে লাইভ ফোর্স করা)
  const handleInstantIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlToIndex || urlToIndex.trim() === "") {
      toast.error("Please enter a valid URL to index.");
      return;
    }

    setIsIndexing(true);
    const toastId = toast.loading("Sending instant crawl request to Googlebot...");

    try {
      const res = await forceGoogleIndexing(urlToIndex, actionType);
      if (res.success) {
        toast.success("Crawl request accepted! Google will index your page shortly.", { id: toastId });
        setUrlToIndex(""); // বক্স খালি করা
      } else {
        toast.error(res.error || "Failed to index URL. Check configuration.", { id: toastId });
      }
    } catch (err: any) {
      toast.error("An unexpected system error occurred.", { id: toastId });
    } finally {
      setIsIndexing(false);
    }
  };

  const labelClass = "w-full md:w-[200px] text-[13px] font-semibold text-[#1d2327] py-2 md:py-0 shrink-0";
  const inputClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px] transition-shadow";
  const selectClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:outline-none rounded-[3px] cursor-pointer";
  const formRowClass = "flex flex-col md:flex-row md:items-center py-4 border-b border-[#f0f0f1] last:border-b-0";

  return (
    <div className="w-full min-h-screen bg-[#f0f0f1] text-[#3c434a] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica_Neue',sans-serif] ">
      <Toaster position="top-right" />
      
      {/* Top Header */}
      <div className="bg-white border-b border-[#ccd0d4] py-4 px-4 sm:px-6 mb-6 w-full flex items-center gap-3">
         <div className="text-[20px]">🔍</div>
         <h1 className="text-[23px] font-bold text-[#1d2327] m-0">Google Search Console &amp; Indexing</h1>
      </div>

      <div className="w-full">
        
        {/* 🚀 Google Profile Card Removed for clean & accurate UI as requested! */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SETTINGS & INDEXER */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Card 1: GSC & Indexing API Configuration */}
            <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden">
               <div className="border-b border-[#ccd0d4] px-4 py-3 bg-[#f9f9f9] flex items-center gap-2">
                 <Settings size={14} className="text-[#50575e]" />
                 <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">API &amp; Verification Settings</h3>
               </div>
               
               <form onSubmit={handleSaveSettings} className="p-5 sm:p-6 space-y-1 ">
                 {/* Domain Verification Meta Tag */}
                 <div className={formRowClass}>
                   <label className={labelClass}>Google Site Verification Tag</label>
                   <input 
                     type="text"
                     value={formData.gscVerificationCode}
                     onChange={(e) => setFormData({ ...formData, gscVerificationCode: e.target.value })}
                     placeholder="e.g. google-site-verification=abcde12345"
                     className={inputClass}
                   />
                 </div>

                 {/* Service Account JSON Key */}
                 <div className="flex flex-col md:flex-row md:items-start py-4">
                   <label className="w-full md:w-[200px] text-[13px] font-semibold text-[#1d2327] pt-1">Service Account JSON Key</label>
                   <textarea 
                     value={formData.gscServiceAccountJson}
                     onChange={(e) => setFormData({ ...formData, gscServiceAccountJson: e.target.value })}
                     placeholder='{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "..."\n}'
                     rows={6}
                     className="w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[12px] font-mono text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px] resize-y"
                   />
                 </div>

                 <div className="text-right pt-4 border-t border-[#f0f0f1]">
                   <button 
                     type="submit"
                     disabled={isPending}
                     className="bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white px-5 py-1.5 rounded-[3px] text-[13px] font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 ml-auto disabled:opacity-50"
                   >
                     <Save size={14} /> {isPending ? "Saving..." : "Save Settings"}
                   </button>
                 </div>
               </form>
            </div>

            {/* Card 2: ⚡ Google Instant URL Indexer Tool */}
            <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden animate-in fade-in duration-300">
               <div className="border-b border-[#ccd0d4] px-4 py-3 bg-[#f9f9f9] flex items-center gap-2">
                 <Flame size={14} className="text-[#d63638] animate-pulse" />
                 <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Instant URL Indexer Tool</h3>
               </div>
               
               <form onSubmit={handleInstantIndex} className="p-5 sm:p-6 space-y-4">
                 <p className="text-[12px] text-[#646970] m-0 leading-relaxed">
                   Enter any URL from your store (e.g. your newly created bike product page) to force Googlebot to crawl and index it immediately.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-3">
                   <input 
                     type="url"
                     required
                     value={urlToIndex}
                     onChange={(e) => setUrlToIndex(e.target.value)}
                     placeholder="e.g. https://gobike.au/product/kids-electric-bike"
                     className="flex-1 border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#2271b1] focus:outline-none"
                   />
                   
                   <select 
                     value={actionType}
                     onChange={(e) => setActionType(e.target.value as any)}
                     className="border border-[#8c8f94] rounded-[3px] px-2.5 py-1.5 text-[12px] bg-white cursor-pointer focus:outline-none"
                   >
                     <option value="URL_UPDATED">Publish/Update URL</option>
                     <option value="URL_DELETED">Remove URL</option>
                   </select>

                   <button 
                     type="submit"
                     disabled={isIndexing || !urlToIndex}
                     className="bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white px-5 py-1.5 rounded-[3px] text-[13px] font-semibold cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                   >
                     {actionType === "URL_UPDATED" ? <Send size={12} /> : <Trash2 size={12} />}
                     {isIndexing ? "Indexing..." : "Index URL Now"}
                   </button>
                 </div>
               </form>
            </div>

          </div>

          {/* RIGHT COLUMN (🚀 Australian English Setup Guide) */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#f0f0f1] pb-3">
                   <HelpCircle size={16} className="text-[#50575e]" />
                   <h4 className="text-[13px] font-semibold text-[#1d2327] m-0">Setup Guide</h4>
                </div>
                <ul className="list-decimal pl-4 m-0 text-[12px] text-[#50575e] space-y-3 leading-relaxed">
                  <li>Log in to your <strong>Google Search Console</strong> account, copy the HTML Tag verification meta tag, and paste the code into the first field.</li>
                  <li>Go to your <strong>Google Cloud Console</strong>, select your project, and enable the <strong>Webmaster/Search Console API</strong> and the <strong>Google Indexing API</strong>.</li>
                  <li>Navigate to <strong>IAM &amp; Admin &gt; Service Accounts</strong>, create a new Service Account, and generate a <strong>JSON Private Key</strong>.</li>
                  <li>Open the downloaded JSON file, copy its entire contents, and paste it into the "Service Account JSON Key" field on the left.</li>
                  <li><strong>🚀 CRITICAL STEP:</strong> Copy the <code>client_email</code> address from your JSON file. Go to your real Google Search Console, navigate to <strong>Settings &gt; Users &amp; Permissions</strong>, add that email, and grant it <strong>Owner</strong> permission.</li>
                </ul>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}