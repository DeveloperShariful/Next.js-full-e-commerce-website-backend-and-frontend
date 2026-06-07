//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabProductFeed.tsx

"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  updateProductChannelVisibility, 
  bulkUpdateProductVisibility 
} from "@/app/actions/backend/merchant-center/gmc-product-sync.actions";

interface Props {
  syncLogs: any[];
  totalProducts: number;
}

export default function TabProductFeed({ syncLogs, totalProducts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // local States
  const [pendingChanges, setPendingChanges] = useState<Record<string, "SYNCED" | "EXCLUDED">>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bulk Selection States (WordPress Style)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");

  // Stats Calculation
  const activeCount = syncLogs.filter(log => log.status === "SYNCED" && !log.googleIssues).length;
  const disapprovedCount = syncLogs.filter(log => log.status === "FAILED").length;
  const warningCount = syncLogs.filter(log => log.status === "SYNCED" && log.googleIssues).length;
  const notSyncedCount = syncLogs.filter(log => log.status === "PENDING").length;

  // Google Issue Parser
  const getGoogleIssueText = (log: any): string => {
    if (log.googleIssues) {
      try {
        const issues = typeof log.googleIssues === "string" 
          ? JSON.parse(log.googleIssues) 
          : log.googleIssues;

        if (Array.isArray(issues) && issues.length > 0) {
          const firstIssue = issues[0];
          return firstIssue.message || firstIssue.description || firstIssue.reason || log.errorMessage || "Unknown Error.";
        }
        
        if (typeof issues === "object" && issues !== null) {
          return (issues as any).message || (issues as any).description || log.errorMessage || "Unknown Error.";
        }
      } catch (e) {
        console.error("Failed to parse googleIssues:", e);
      }
    }
    return log.errorMessage || "Unknown Error.";
  };

  // Smart Suggested Action (Correct Edit URL)
  const getSuggestedAction = (log: any, issueText: string) => {
    const text = issueText.toLowerCase();
    const productId = log.product?.id;
    
    if (text.includes("color") || text.includes("size") || text.includes("attribute") || text.includes("category") || text.includes("mapping")) {
      return (
        <Link href="/admin/marketing/merchant-center?tab=attributes" className="text-[#2271b1] hover:underline font-semibold">
          Fix attribute mapping &rarr;
        </Link>
      );
    }
    
    return (
      <Link href={`/admin/products/create?id=${productId}`} className="text-[#2271b1] hover:underline font-semibold">
        Edit product data &rarr;
      </Link>
    );
  };

  // Dropdown change handler (Only saves in state, does not trigger API)
  const handleDropdownChange = (productId: string, value: "SYNCED" | "EXCLUDED") => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setPendingChanges({
      ...pendingChanges,
      [productId]: value
    });
  };

  // individual Checkbox selection handler
  const handleSelectRow = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, productId]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    }
  };

  // master Checkbox (Select/Unselect All)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(syncLogs.map(log => log.product.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  // WordPress Style Bulk Apply Handler
  const handleSaveAndSync  = () => {
    if (!bulkAction || selectedProductIds.length === 0) return;
    
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = selectedProductIds.map(id => ({
      productId: id,
      status: bulkAction as "SYNCED" | "EXCLUDED"
    }));

    startTransition(async () => {
      const res = await bulkUpdateProductVisibility(payload);
      
      if (res.success) {
        setSuccessMsg(res.message || "Bulk operation completed successfully!");
        setSelectedProductIds([]); 
        setBulkAction(""); 
        router.refresh(); 
      } else {
        setErrorMsg(res.error || "Failed to process bulk operation.");
      }
    });
  };

  // Dynamic Channel Visibility Text
  const getChannelVisibility = (status: string): string => {
    switch (status) {
      case "SYNCED":
        return "Sync and show";
      case "EXCLUDED":
        return "Do not sync (Hide)";
      case "PENDING":
        return "Not synced (Pending)";
      default:
        return "Not synced";
    }
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="w-full text-[#3c434a] pb-10">
      
      {/* Overview Box */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px] mb-8 overflow-hidden">
        <h2 className="text-[14px] font-semibold text-[#1d2327] border-b border-[#ccd0d4] px-4 py-3 m-0">
          Overview
        </h2>
        
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-[1px] bg-[#ccd0d4]">
          <div className="bg-white p-4 sm:p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Active</p>
            <p className="text-[24px] sm:text-[28px] text-[#1d2327] font-normal m-0">{activeCount}</p>
          </div>
          <div className="bg-white p-4 sm:p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Expiring</p>
            <p className="text-[24px] sm:text-[28px] text-[#1d2327] font-normal m-0">0</p>
          </div>
          <div className="bg-white p-4 sm:p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Pending / Warnings</p>
            <p className="text-[24px] sm:text-[28px] text-[#1d2327] font-normal m-0">{warningCount}</p>
          </div>
          <div className="bg-white p-4 sm:p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Disapproved</p>
            <p className="text-[24px] sm:text-[28px] text-[#d63638] font-normal m-0">{disapprovedCount}</p>
          </div>
          <div className="bg-white p-4 sm:p-6">
            <p className="text-[13px] text-[#1d2327] m-0 mb-4 font-medium">Not Synced</p>
            <p className="text-[24px] sm:text-[28px] text-[#1d2327] font-normal m-0">{notSyncedCount}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 hidden max-md:block"></div>
        </div>

        <div className="bg-[#f9f9f9] border-t border-[#ccd0d4] p-4 text-[13px] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-[100px] text-[#646970]">Feed setup:</span>
            <span className="text-[#00a32a] font-semibold flex items-center gap-1">
              <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</span> 
              Product feed setup completed
            </span>
            {disapprovedCount > 0 && <span className="text-[#646970] ml-2">• {disapprovedCount} issues to resolve</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[100px] text-[#646970]">Account status:</span>
            <span className="text-[#00a32a] font-semibold flex items-center gap-1">
              <span className="w-4 h-4 bg-[#00a32a] text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</span> 
              Approved
            </span>
            <span className="text-[#646970] ml-2">• Your product listings are on Google.</span>
          </div>
        </div>
      </div>

      {/* Notices */}
      {successMsg && (
        <div className="bg-white border-l-4 border-[#00a32a] shadow-sm p-3 mb-5">
          <p className="text-[13px] m-0"><strong>Success:</strong> {successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="bg-white border-l-4 border-[#d63638] shadow-sm p-3 mb-5">
          <p className="text-[13px] m-0"><strong>Error:</strong> {errorMsg}</p>
        </div>
      )}

      {/* Issues Table */}
      {disapprovedCount > 0 && (
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] mb-8">
          <div className="flex items-center border-b border-[#ccd0d4]">
            <h2 className="text-[16px] font-normal text-[#1d2327] px-6 py-4 m-0">Issues to resolve</h2>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[13px] min-w-[700px] border-collapse">
              <thead className="bg-[#f9f9f9] border-b border-[#ccd0d4]">
                <tr>
                  <th className="py-3 px-6 font-semibold text-[#1d2327] w-[50px] text-center">Type</th>
                  <th className="py-3 px-6 font-semibold text-[#1d2327]">Affected product</th>
                  <th className="py-3 px-6 font-semibold text-[#1d2327]">Issue (GMC Live Error)</th>
                  <th className="py-3 px-6 font-semibold text-[#1d2327]">Suggested action</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.filter(log => log.status === "FAILED").map((log) => {
                  const issueText = getGoogleIssueText(log);
                  return (
                    <tr key={log.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                      <td className="py-3 px-6 text-center">
                        <span className="text-[#d63638] font-bold border border-[#d63638] rounded-full w-5 h-5 inline-flex items-center justify-center">!</span>
                      </td>
                      <td className="py-3 px-6">
                        <Link href={`/admin/products/create?id=${log.product?.id}`} className="text-[#2271b1] hover:underline font-semibold">
                          {log.product?.name}
                        </Link>
                      </td>
                      <td className="py-3 px-6 text-[#d63638] font-medium max-w-[300px] truncate" title={issueText}>
                        {issueText}
                      </td>
                      <td className="py-3 px-6">
                        {getSuggestedAction(log, issueText)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Actions Header */}
      <div className="flex items-center gap-2 mb-4 bg-white border border-[#ccd0d4] p-3 rounded-[3px] shadow-sm max-w-fit">
        <select 
          value={bulkAction} 
          onChange={(e) => setBulkAction(e.target.value)}
          className="border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] bg-white outline-none cursor-pointer"
        >
          <option value="">Bulk Actions</option>
          <option value="SYNCED">Sync and show Selected</option>
          <option value="EXCLUDED">Do not sync (Hide) Selected</option>
        </select>
        <button 
          onClick={handleSaveAndSync }
          disabled={isPending || !bulkAction || selectedProductIds.length === 0}
          className="bg-[#f6f7f7] text-[#2271b1] border border-[#ccd0d4] hover:bg-[#f0f0f1] rounded-[3px] px-4 py-1.5 text-[13px] font-semibold cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isPending ? "Applying..." : "Apply"}
        </button>
        {selectedProductIds.length > 0 && (
          <span className="text-[12px] text-[#646970] ml-2">
            <strong>{selectedProductIds.length}</strong> items selected
          </span>
        )}
      </div>

      {/* Main Product Feed Table */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px]">
        <div className="flex items-center justify-between border-b border-[#ccd0d4] px-4 py-3 bg-[#f9f9f9]">
          <h2 className="text-[16px] font-semibold text-[#1d2327] m-0">Product Feed</h2>
          
          {hasPendingChanges && (
            <button
              onClick={handleSaveAndSync}
              disabled={isPending}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white border-none rounded-[3px] px-4 py-1.5 text-[12px] font-semibold cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save & Sync Changes"}
            </button>
          )}
        </div>

        {/* DYNAMIC RESPONSIVE TABLE */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[13px] min-w-[750px] border-collapse">
            <thead className="bg-[#f9f9f9] border-b border-[#ccd0d4]">
              <tr>
                <th className="py-3 px-4 w-[40px]">
                  <input 
                    type="checkbox" 
                    checked={selectedProductIds.length === syncLogs.length && syncLogs.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="border-[#8c8f94] rounded-[3px] cursor-pointer" 
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-[#1d2327] w-[45%]">Product Title</th>
                <th className="py-3 px-4 font-semibold text-[#1d2327] w-[25%]">Channel Visibility</th>
                <th className="py-3 px-4 font-semibold text-[#1d2327] w-[20%]">Status</th>
                <th className="py-3 px-4 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#646970]">No products synced yet.</td>
                </tr>
              ) : (
                syncLogs.map(log => {
                  const pId = log.product?.id;
                  const isModified = pendingChanges[pId] !== undefined;
                  const currentStatus = isModified ? pendingChanges[pId] : log.status;
                  const visibilityText = getChannelVisibility(currentStatus);
                  const isChecked = selectedProductIds.includes(pId);

                  return (
                    // 🚀 FIXED: ব্র্যাকেট এরর সমাধান করা হয়েছে ৩৩৪ নম্বর লাইনে
                    <tr key={log.id} className={`border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${isModified ? "bg-[#fffdf0]" : ""} ${isChecked ? "bg-[#f0f6ea]" : ""}`}>
                      <td className="py-3 px-4">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(pId, e.target.checked)}
                          className="border-[#8c8f94] rounded-[3px] cursor-pointer" 
                        />
                      </td>
                      <td className="py-3 px-4 text-[#1d2327] font-medium leading-relaxed">
                        {log.product?.name}
                        {log.status === "PENDING" && <span className="ml-2 text-[10px] bg-[#646970] text-white px-1.5 py-0.5 rounded font-bold">Not Synced</span>}
                        {isModified && <span className="ml-2 text-[10px] bg-[#dba617] text-white px-1.5 py-0.5 rounded font-bold">Unsaved</span>}
                      </td>
                      
                      <td className="py-3 px-4">
                        <select
                          value={currentStatus === "EXCLUDED" ? "EXCLUDED" : currentStatus === "PENDING" ? "EXCLUDED" : "SYNCED"}
                          onChange={(e) => handleDropdownChange(pId, e.target.value as "SYNCED" | "EXCLUDED")}
                          className="border border-[#8c8f94] rounded-[3px] px-2 py-1 text-[13px] focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="SYNCED">Sync and show</option>
                          <option value="EXCLUDED">Do not sync (Hide)</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        {log.status === "SYNCED" && !log.googleIssues && <span className="text-[#00a32a] font-semibold">✓ Approved</span>}
                        {log.status === "SYNCED" && log.googleIssues && <span className="text-[#dba617] font-semibold">⚠ Approved (With Warnings)</span>}
                        {log.status === "FAILED" && <span className="text-[#d63638] font-semibold">✗ Disapproved</span>}
                        {log.status === "EXCLUDED" && <span className="text-[#646970] font-semibold">Excluded</span>}
                        {log.status === "PENDING" && <span className="text-[#646970] font-semibold">Pending (Not Synced)</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/products/create?id=${pId}`} className="text-[#2271b1] hover:underline">Edit</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Bulk Actions Footer */}
        <div className="border-t border-[#ccd0d4] px-4 py-3 flex items-center justify-between gap-4 text-[13px] text-[#646970] bg-[#f9f9f9]">
          <div>
            {hasPendingChanges && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndSync}
                  disabled={isPending}
                  className="bg-[#2271b1] hover:bg-[#135e96] text-white border-none rounded-[3px] px-5 py-2 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isPending ? "Syncing with Google..." : "Save & Sync Changes"}
                </button>
                <button 
                  onClick={() => setPendingChanges({})} 
                  className="text-[13px] text-[#d63638] hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Discard Changes
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button className="border border-[#ccd0d4] bg-white px-2 py-1 rounded-[3px] text-[#8c8f94]" disabled>{"<"}</button>
            <button className="border border-[#ccd0d4] bg-white px-2 py-1 rounded-[3px] text-[#8c8f94]" disabled>{">"}</button>
          </div>
        </div>
      </div>

    </div>
  );
}