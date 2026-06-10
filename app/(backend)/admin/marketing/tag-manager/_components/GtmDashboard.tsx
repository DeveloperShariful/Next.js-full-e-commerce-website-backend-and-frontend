//app/(backend)/admin/marketing/tag-manager/_components/GtmDashboard.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Settings, Info, RefreshCw, Layers, ShieldCheck } from "lucide-react";
import { 
  fetchGtmAccountsAndContainers, 
  fetchGtmWorkspaceDetails, 
  saveGtmContainerId 
} from "@/app/actions/backend/marketing/gtm.actions";

// Types
interface GtmContainer {
  id: string;
  publicId: string;
  name: string;
  path: string;
}

interface GtmAccount {
  accountId: string;
  accountName: string;
  containers: GtmContainer[];
}

interface Props {
  config: any;
}

export default function GtmDashboard({ config }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  
  // GTM Data States with Strict Typing
  const [gtmAccounts, setGtmAccounts] = useState<GtmAccount[]>([]);
  const [selectedAccId, setSelectedAccId] = useState<string>("");
  const [selectedContainerId, setSelectedContainerId] = useState<string>("");
  
  // Live Workspace States
  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"tags" | "triggers" | "variables">("tags");

  // 🚀 ১. পেজ লোড হওয়ামাত্রই সার্ভার থেকে আসা gtmContainerId রিড করে অটোমেটিক লাইভ ওয়ার্কস্পেস লোড করা
  useEffect(() => {
    const initializeGtmDashboard = async () => {
      setIsLoading(true);
      try {
        const dbGtmId = config.gtmContainerId || "";

        // গুগলের কাছ থেকে সব কন্টেইনার নিয়ে আসা
        const res = await fetchGtmAccountsAndContainers();
        if (res.success && res.accounts) {
          const accountsData = res.accounts as GtmAccount[];
          setGtmAccounts(accountsData);

          // 🚀 অটো-লোডার লজিক (রিস্টার্ট বা রিফ্রেশ করলেও ডিসকানেক্ট হবে না)
          if (dbGtmId && accountsData.length > 0) {
            let matchedAccId = "";
            let matchedContId = "";

            for (const acc of accountsData) {
              const found = acc.containers.find((c: GtmContainer) => c.publicId === dbGtmId || c.id === dbGtmId);
              if (found) {
                matchedAccId = acc.accountId;
                matchedContId = found.id; 
                break;
              }
            }

            if (matchedAccId && matchedContId) {
              setSelectedAccId(matchedAccId);
              setSelectedContainerId(matchedContId);
              
              setIsLoadingDetails(true);
              const detailsRes = await fetchGtmWorkspaceDetails(`accounts/${matchedAccId}`, matchedContId);
              if (detailsRes.success && detailsRes.data) {
                setWorkspaceDetails(detailsRes.data);
              }
              setIsLoadingDetails(false);
            }
          } else if (accountsData.length > 0) {
            setSelectedAccId(accountsData[0].accountId || "");
          }
        } else {
          toast.error(res.error || "Failed to load GTM Accounts.");
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGtmDashboard();
  }, [config]);

  const activeAccount = gtmAccounts.find((a: GtmAccount) => a.accountId === selectedAccId);
  const containers: GtmContainer[] = activeAccount?.containers || [];

  const handleLoadGtmDetails = () => {
    if (!selectedContainerId || !activeAccount) return;
    setIsLoadingDetails(true);
    setWorkspaceDetails(null);

    const accountPath = `accounts/${activeAccount.accountId}`;
    
    fetchGtmWorkspaceDetails(accountPath, selectedContainerId).then((res) => {
      if (res.success && res.data) {
        setWorkspaceDetails(res.data);
        toast.success("Loaded live GTM configuration!");
      } else {
        toast.error(res.error || "Failed to load GTM workspace details.");
      }
      setIsLoadingDetails(false);
    });
  };

  const handleSaveGtmId = () => {
    if (!selectedContainerId) return;
    const selectedCont = containers.find((c: GtmContainer) => c.id === selectedContainerId);
    const gtmPublicId = selectedCont ? selectedCont.publicId : selectedContainerId;

    startTransition(async () => {
      const res = await saveGtmContainerId(gtmPublicId);
      if (res.success) {
        toast.success(`Google Tag Manager ${gtmPublicId} connected successfully!`);
      } else {
        toast.error(res.error || "Failed to save GTM ID.");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center text-[13px] text-[#646970]">
        Loading Google Tag Manager settings...
      </div>
    );
  }

  const labelClass = "w-full md:w-[200px] text-[13px] font-semibold text-[#1d2327] py-2 md:py-0 shrink-0";
  const selectClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:outline-none rounded-[3px] cursor-pointer";
  const formRowClass = "flex flex-col md:flex-row md:items-center py-4 border-b border-[#f0f0f1] last:border-b-0";

  return (
    <div className="w-full">
      <Toaster position="top-right" />

      <div className="w-full space-y-6">
        
        {/* 🚀 Google Account Profile Card */}
        {config && config.googleAccountId && (
          <div className="bg-white border border-[#ccd0d4] p-4 sm:p-5 rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-4 min-w-0">
              {config.googleAccountImage ? (
                <img 
                  src={config.googleAccountImage} 
                  alt="Gmail Avatar" 
                  className="w-8 h-8 rounded-full border border-[#ccd0d4] shrink-0" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0">G</div>
              )}
              {/* 🚀 min-w-0 এবং truncate ব্যবহারের ফলে মোবাইল স্ক্রিনে লম্বা ইমেইল এলাইনমেন্ট নষ্ট করবে না বা স্ক্রিনের বাইরে যাবে না */}
              <div className="min-w-0">
                <h4 className="text-[14px] font-semibold text-[#1d2327] m-0 mb-0.5">Google Account</h4>
                <p className="text-[13px] text-[#646970] m-0 truncate max-w-[200px] sm:max-w-none" title={config.googleAccountId}>
                  {config.googleAccountId}
                </p>
              </div>
            </div>
            
            {/* 🚀 self-start sm:self-auto এর ফলে মোবাইলে ব্যাজটি সুন্দরভাবে নিচে নেমে বাম পাশে এলাইন হবে এবং মোবাইলের জন্য একটি হালকা বর্ডার ও গ্রিন ব্যাকগ্রাউন্ড দেওয়া হয়েছে যা দেখতে প্রিমিয়াম লাগবে */}
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#00a32a] self-start sm:self-auto shrink-0 bg-[#e6f4ea] sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-[3px] border border-[#bce3c6] sm:border-0">
              <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px]">✓</span> 
              <span>Connected</span>
            </div>
          </div>
        )}

        {/* GTM Selector Panel */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden">
          <div className="border-b border-[#ccd0d4] px-4 py-3 bg-[#f9f9f9] flex items-center gap-2">
            <Settings size={14} className="text-[#50575e]" />
            <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">GTM Container Settings</h3>
          </div>
          
          <div className="p-5 sm:p-6 space-y-1">
             <div className={formRowClass}>
               <label className={labelClass}>GTM Account</label>
               <select 
                 value={selectedAccId}
                 onChange={(e) => {
                   setSelectedAccId(e.target.value);
                   setSelectedContainerId("");
                   setWorkspaceDetails(null);
                 }}
                 className={selectClass}
               >
                 {gtmAccounts.map(acc => (
                   <option key={acc.accountId} value={acc.accountId}>{acc.accountName}</option>
                 ))}
               </select>
             </div>

             {containers.length > 0 && (
               <div className={formRowClass}>
                 <label className={labelClass}>GTM Container (GTM ID)</label>
                 <select 
                   value={selectedContainerId}
                   onChange={(e) => {
                     setSelectedContainerId(e.target.value);
                     setWorkspaceDetails(null);
                   }}
                   className={selectClass}
                 >
                   <option value="">-- Select Container --</option>
                   {containers.map((c: GtmContainer) => (
                     <option key={c.id} value={c.id}>{c.name} ({c.publicId})</option>
                   ))}
                 </select>
               </div>
             )}
          </div>

          {selectedContainerId && (
            <div className="bg-[#f9f9f9] border-t border-[#ccd0d4] px-5 py-3.5 flex flex-wrap gap-3 justify-end">
               <button
                 type="button"
                 onClick={handleLoadGtmDetails}
                 disabled={isLoadingDetails}
                 className="bg-white hover:bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] px-4 py-1.5 rounded-[3px] text-[12px] font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
               >
                 <RefreshCw size={12} className={isLoadingDetails ? "animate-spin" : ""} />
                 {isLoadingDetails ? "Reading GTM..." : "Load Live Workspace"}
               </button>

               <button
                 type="button"
                 onClick={handleSaveGtmId}
                 disabled={isPending}
                 className="bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white px-5 py-1.5 rounded-[3px] text-[12px] font-semibold cursor-pointer shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
               >
                 <ShieldCheck size={14} /> {isPending ? "Connecting..." : "Connect GTM Container"}
               </button>
            </div>
          )}
        </div>

        {/* Live GTM tags, triggers, variables */}
        <div className="space-y-6">
           {isLoadingDetails && (
             <div className="bg-white border border-[#ccd0d4] rounded-[3px] p-12 text-center text-[#646970] text-[13px] shadow-sm">
               Connecting to Google Server &amp; Reading Live GTM Workspace...
             </div>
           )}

           {workspaceDetails && (
             <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden animate-in fade-in duration-300">
               <div className="bg-[#f9f9f9] border-b border-[#ccd0d4] px-5 py-4 flex items-center gap-3">
                 <Layers className="text-[#2271b1]" size={16} />
                 <div>
                   <h4 className="text-[13.5px] font-semibold text-[#1d2327] m-0">Live Workspace: {workspaceDetails.workspaceName}</h4>
                   <p className="text-[11px] text-[#646970] m-0 mt-0.5">Below are the active configurations currently published in this container.</p>
                 </div>
               </div>

               <div className="flex border-b border-[#ccd0d4] bg-[#f1f3f4] px-4 pt-3 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
                 <button onClick={() => setActiveTab("tags")} className={`px-4 py-1.5 text-[12px] font-semibold border-t border-l border-r rounded-t-[3px] transition-colors ${activeTab === "tags" ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px] border-b-white" : "bg-transparent border-transparent text-[#2271b1]"}`}>Active Tags ({workspaceDetails.tags.length})</button>
                 <button onClick={() => setActiveTab("triggers")} className={`px-4 py-1.5 text-[12px] font-semibold border-t border-l border-r rounded-t-[3px] transition-colors ${activeTab === "triggers" ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px] border-b-white" : "bg-transparent border-transparent text-[#2271b1]"}`}>Triggers ({workspaceDetails.triggers.length})</button>
                 <button onClick={() => setActiveTab("variables")} className={`px-4 py-1.5 text-[12px] font-semibold border-t border-l border-r rounded-t-[3px] transition-colors ${activeTab === "variables" ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px] border-b-white" : "bg-transparent border-transparent text-[#2271b1]"}`}>Variables ({workspaceDetails.variables.length})</button>
               </div>

               <div className="overflow-x-auto w-full">
                 <table className="w-full text-left text-[12px] min-w-[500px]">
                   <thead className="bg-[#f9f9f9] border-b border-[#ccd0d4] text-[#5f6368] font-semibold">
                     <tr>
                       <th className="py-2.5 px-5">Name</th>
                       <th className="py-2.5 px-5">Type</th>
                       {activeTab === "tags" && <th className="py-2.5 px-5 text-right">Status</th>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#f0f0f0]">
                     
                     {activeTab === "tags" && (
                       workspaceDetails.tags.length > 0 ? workspaceDetails.tags.map((tag: any) => (
                         <tr key={tag.id} className="hover:bg-[#fcfcfc] transition-colors">
                           <td className="py-3.5 px-5 font-semibold text-[#1d2327]">{tag.name}</td>
                           <td className="py-3.5 px-5 text-[#646970] capitalize">{tag.type}</td>
                           <td className="py-3.5 px-5 text-right">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] ${tag.liveState === "Active" ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#f1f3f4] text-[#5f6368]"}`}>{tag.liveState}</span>
                           </td>
                         </tr>
                       )) : <tr><td colSpan={3} className="py-8 text-center text-[#646970] p-4">No custom tags found in this workspace.</td></tr>
                     )}

                     {activeTab === "triggers" && (
                       workspaceDetails.triggers.length > 0 ? workspaceDetails.triggers.map((tr: any) => (
                         <tr key={tr.id} className="hover:bg-[#fcfcfc] transition-colors">
                           <td className="py-3.5 px-5 font-semibold text-[#1d2327]">{tr.name}</td>
                           <td className="py-3.5 px-5 text-[#646970] capitalize" colSpan={2}>{tr.type}</td>
                         </tr>
                       )) : <tr><td colSpan={2} className="py-8 text-center text-[#646970] p-4">No custom triggers found.</td></tr>
                     )}

                     {activeTab === "variables" && (
                       workspaceDetails.variables.length > 0 ? workspaceDetails.variables.map((v: any) => (
                         <tr key={v.id} className="hover:bg-[#fcfcfc] transition-colors">
                           <td className="py-3.5 px-5 font-semibold text-[#1d2327]">{v.name}</td>
                           <td className="py-3.5 px-5 text-[#646970] capitalize" colSpan={2}>{v.type}</td>
                         </tr>
                       )) : <tr><td colSpan={2} className="py-8 text-center text-[#646970] p-4">No custom variables found.</td></tr>
                     )}

                   </tbody>
                 </table>
               </div>

             </div>
           )}
        </div>

      </div>
    </div>
  );
}