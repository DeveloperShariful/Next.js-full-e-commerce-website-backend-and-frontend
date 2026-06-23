//app/(backend)/admin/marketing/klaviyo/_components/KlaviyoDashboard.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Settings, Info, Save, Eye, EyeOff, HelpCircle, RefreshCw } from "lucide-react";
import { 
  saveKlaviyoSettings, 
  fetchKlaviyoLists, 
  fetchKlaviyoListProfiles, 
  KlaviyoSettings 
} from "@/app/actions/backend/marketing/klaviyo.actions";

interface Props {
  config: any;
}

export default function KlaviyoDashboard({ config }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingLists, setIsFetchingLists] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // States
  const [klaviyoLists, setKlaviyoLists] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; email: string; name: string; phone: string }[]>([]);

  const [formData, setFormData] = useState<KlaviyoSettings>({
    klaviyoEnabled: config.klaviyoEnabled || false,
    klaviyoPublicKey: config.klaviyoPublicKey || "",
    klaviyoPrivateKey: config.klaviyoPrivateKey || "",
    selectedListId: config.selectedListId || "",
  });

  // Load lists on mount
  useEffect(() => {
    const initializeKlaviyoDashboard = async () => {
      setIsLoading(true);
      try {
        if (config.klaviyoPrivateKey && config.klaviyoPrivateKey.trim() !== "") {
          const listRes = await fetchKlaviyoLists(config.klaviyoPrivateKey);
          if (listRes.success && listRes.lists) {
            setKlaviyoLists(listRes.lists);
          }
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeKlaviyoDashboard();
  }, [config]);

  // Load live profiles on list change
  useEffect(() => {
    if (formData.selectedListId && config.klaviyoPrivateKey) {
      setIsLoadingProfiles(true);
      fetchKlaviyoListProfiles(formData.selectedListId).then((res) => {
        if (res.success && res.profiles) {
          setProfiles(res.profiles);
        }
        setIsLoadingProfiles(false);
      });
    } else {
      setProfiles([]);
    }
  }, [formData.selectedListId, config.klaviyoPrivateKey]);

  // Fetch lists handler
  const handleConnectAndFetch = async () => {
    if (!formData.klaviyoPrivateKey || formData.klaviyoPrivateKey.trim() === "") {
      toast.error("Please enter your Private API Key first.");
      return;
    }

    setIsFetchingLists(true);
    setKlaviyoLists([]);
    const toastId = toast.loading("Connecting to Klaviyo & fetching list profiles...");

    try {
      const res = await fetchKlaviyoLists(formData.klaviyoPrivateKey);
      if (res.success && res.lists) {
        setKlaviyoLists(res.lists);
        if (res.lists.length > 0) {
          setFormData(prev => ({ ...prev, selectedListId: res.lists![0].id }));
        }
        toast.success(`Connected successfully! Found ${res.lists.length} lists.`, { id: toastId });
      } else {
        toast.error(res.error || "Failed to load lists from Klaviyo.", { id: toastId });
      }
    } catch (e: any) {
      toast.error("Could not establish connection to Klaviyo.", { id: toastId });
    } finally {
      setIsFetchingLists(false);
    }
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Saving Klaviyo configurations...");

    startTransition(async () => {
      const res = await saveKlaviyoSettings(formData);
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
        Loading Klaviyo Marketing settings...
      </div>
    );
  }

  const labelClass = "w-full md:w-[200px] text-[13px] font-semibold text-[#1d2327] py-2 md:py-0 shrink-0";
  const inputClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] outline-none rounded-[3px] transition-shadow";
  const selectClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#3F51B5] focus:ring-1 focus:outline-none rounded-[3px] cursor-pointer";
  const formRowClass = "flex flex-col md:flex-row md:items-center py-4 border-b border-[#f0f0f1] last:border-b-0";

  return (
    <div className="w-full">
<div className="max-w-[1200px] mx-auto space-y-6">
        
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: SETTINGS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden">
               <div className="border-b border-[#ccd0d4] px-4 py-3 bg-[#f9f9f9] flex items-center gap-2">
                 <Settings size={14} className="text-[#50575e]" />
                 <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Klaviyo API Configurations</h3>
               </div>
               
               <div className="p-5 sm:p-6 space-y-1">
                 
                 {/* Enable Checkbox */}
                 <div className="flex items-center gap-3 py-2">
                    <input 
                      type="checkbox" 
                      id="klaviyoEnabled"
                      checked={formData.klaviyoEnabled}
                      onChange={(e) => setFormData({ ...formData, klaviyoEnabled: e.target.checked })}
                      className="w-4 h-4 border-[#8c8f94] rounded-[3px] text-[#3F51B5] focus:ring-[#3F51B5]" 
                    />
                    <label htmlFor="klaviyoEnabled" className="text-[13px] font-semibold text-[#1d2327] cursor-pointer select-none">
                      Enable Klaviyo Email Marketing integration
                    </label>
                 </div>

                 <div className="border-t border-[#f0f0f1] my-4"></div>

                 {/* Public API Key */}
                 <div className={formRowClass}>
                   <label className={labelClass}>Public API Key (Site ID)</label>
                   <input 
                     type="text"
                     required
                     value={formData.klaviyoPublicKey}
                     onChange={(e) => setFormData({ ...formData, klaviyoPublicKey: e.target.value })}
                     placeholder="e.g. pk_109283746"
                     className={inputClass}
                   />
                 </div>

                 {/* Private API Key */}
                 <div className={formRowClass}>
                   <label className={labelClass}>Private API Key</label>
                   <div className="flex-1 w-full md:max-w-[400px] relative">
                     <input 
                       type={showPrivateKey ? "text" : "password"}
                       required
                       value={formData.klaviyoPrivateKey}
                       onChange={(e) => setFormData({ ...formData, klaviyoPrivateKey: e.target.value })}
                       placeholder="e.g. klaviyo-private-api-key"
                       className="w-full px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#3F51B5] focus:ring-1 focus:ring-[#3F51B5] outline-none rounded-[3px]"
                     />
                     <button
                       type="button"
                       onClick={() => setShowPrivateKey(!showPrivateKey)}
                       className="absolute right-3 top-2 text-[#646970] hover:text-[#3F51B5]"
                     >
                       {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                   
                   <button
                     type="button"
                     onClick={handleConnectAndFetch}
                     disabled={isFetchingLists || !formData.klaviyoPrivateKey}
                     className="mt-3 md:mt-0 md:ml-3 bg-white hover:bg-[#f6f7f7] border border-[#c3c4c7] text-[#3F51B5] px-4 py-1.5 rounded-[3px] text-[12px] font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                   >
                     <RefreshCw size={12} className={isFetchingLists ? "animate-spin" : ""} />
                     {isFetchingLists ? "Connecting..." : "Connect & Fetch Lists"}
                   </button>
                 </div>

                 {/* Dynamic Newsletter List Dropdown */}
                 {klaviyoLists.length > 0 && (
                   <div className={`${formRowClass} animate-in fade-in duration-300`}>
                     <label className={labelClass}>Default Newsletter List</label>
                     <select
                       value={formData.selectedListId}
                       onChange={(e) => setFormData({ ...formData, selectedListId: e.target.value })}
                       className={selectClass}
                     >
                       {klaviyoLists.map(list => (
                         <option key={list.id} value={list.id}>{list.name} (ID: {list.id})</option>
                       ))}
                     </select>
                   </div>
                 )}

               </div>
            </div>

            {/* Submit Button */}
            <div className="text-right">
              <button 
                type="submit"
                disabled={isPending}
                className="bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white px-6 py-2 rounded-[3px] text-[13px] font-semibold cursor-pointer shadow-sm transition-colors flex items-center gap-1.5 ml-auto disabled:opacity-50"
              >
                <Save size={14} /> {isPending ? "Saving..." : "Save Klaviyo Settings"}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN (🚀 Australian English Guide) */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#f0f0f1] pb-3">
                   <HelpCircle size={16} className="text-[#50575e]" />
                   <h4 className="text-[13px] font-semibold text-[#1d2327] m-0">Klaviyo Setup Guide</h4>
                </div>
                <ul className="list-decimal pl-4 m-0 text-[12px] text-[#50575e] space-y-2.5 leading-relaxed">
                  <li>Log in to your Klaviyo dashboard and navigate to <strong>Settings &gt; API Keys</strong>.</li>
                  <li>Copy your <strong>Public API Key (Site ID)</strong> and paste it into the first input field on the left.</li>
                  <li>Create a new <strong>Private API Key</strong> from your Klaviyo account, paste it here, and click "Connect &amp; Fetch Lists".</li>
                  <li>Once your newsletter lists are fetched, select your default subscription list from the dropdown and save your settings.</li>
                </ul>
             </div>
          </div>

        </form>

        {/* Real-time active subscribers list table */}
        {formData.klaviyoEnabled && formData.selectedListId && (
          <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="bg-[#f9f9f9] border-b border-[#ccd0d4] px-5 py-4">
              <h4 className="text-[13.5px] font-semibold text-[#1d2327] m-0">Active Subscribers</h4>
              <p className="text-[11px] text-[#646970] m-0 mt-0.5">Real-time sync of profiles currently stored inside the selected Klaviyo list.</p>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-[12px] min-w-[500px]">
                <thead className="bg-[#f1f3f4] text-[#5f6368] border-b border-[#ccd0d4] font-semibold">
                  <tr>
                    <th className="py-2.5 px-5">Subscriber Email</th>
                    <th className="py-2.5 px-5">Name</th>
                    <th className="py-2.5 px-5">Phone</th>
                    <th className="py-2.5 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {isLoadingProfiles ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#646970]">
                        Syncing live profiles from Klaviyo server...
                      </td>
                    </tr>
                  ) : profiles.length > 0 ? (
                    profiles.map(p => (
                      <tr key={p.id} className="hover:bg-[#fcfcfc] transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#2271b1]">{p.email}</td>
                        <td className="py-3.5 px-5 text-[#3c4043]">{p.name}</td>
                        <td className="py-3.5 px-5 text-[#646970]">{p.phone}</td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#e6f4ea] text-[#137333]">✓ Subscribed</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[#646970] italic">
                        No subscribers found in this list yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}