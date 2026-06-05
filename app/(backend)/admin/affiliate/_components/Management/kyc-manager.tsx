// File: app/(backend)/admin/affiliate/_components/Management/kyc-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { Search, Eye, CheckCircle, XCircle, FileText, Download, X, Loader2, ShieldCheck, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rejectDocumentAction, verifyDocumentAction } from "@/app/actions/backend/affiliate/_services/kyc-service";
import { AffiliateKycDocument } from "@/app/actions/backend/affiliate/types";

// ✅ FIXED: Updated Interface to match JSON Document Array logic instead of the deleted Prisma Model
interface DocumentWithUser extends AffiliateKycDocument {
  id: string; // Dynamic ID mapping (accountId-index)
  accountId: string;
  docIndex: number;
  affiliate: {
    id: string;
    slug: string;
    kycStatus: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

interface Props {
  initialDocuments: DocumentWithUser[];
}

export default function KycManager({ initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [viewingDoc, setViewingDoc] = useState<DocumentWithUser | null>(null);
  const [filter, setFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  const filteredDocs = documents.filter(doc => {
    const matchesFilter = filter === "ALL" ? true : doc.status === filter;
    const matchesSearch = 
      doc.affiliate.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.affiliate.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      {/* WP Admin Notice Style */}
      <div className="bg-white border-l-4 border-[#00a32a] shadow-sm p-4 flex flex-col sm:flex-row justify-between gap-4 items-center">
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-[#8c8f94]" />
                <input 
                  placeholder="Search affiliate or ID..." 
                  className="pl-8 pr-2 py-1.5 w-full border border-[#8c8f94] rounded-sm text-[13px] focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="relative">
                <select 
                    className="pl-8 pr-6 py-1.5 border border-[#8c8f94] rounded-sm text-[13px] bg-white focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none appearance-none cursor-pointer min-w-[120px] shadow-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ALL">All Files</option>
                </select>
                <Filter className="absolute left-2.5 top-2 h-4 w-4 text-[#8c8f94] pointer-events-none" />
            </div>
         </div>
         
         <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold text-[#00a32a]">
            <ShieldCheck className="w-4 h-4" />
            <span>Identity verification required for payouts</span>
         </div>
      </div>

      {/* WP List Table Style */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
                <tr>
                    <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Affiliate</th>
                    <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Document Type</th>
                    <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Doc Number</th>
                    <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Submitted</th>
                    <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Status</th>
                    <th className="px-4 py-2 font-semibold text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
                {filteredDocs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-[#50575e] bg-[#f6f7f7] italic">No documents found matching filters.</td></tr>
                ) : (
                    filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-[#f6f7f7] transition-colors group">
                        <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-[#f0f0f1] border border-[#c3c4c7] overflow-hidden flex items-center justify-center shrink-0">
                                    {doc.affiliate.user.image ? <img src={doc.affiliate.user.image} alt="" className="w-full h-full object-cover" /> : <span className="font-bold text-[#8c8f94]">{doc.affiliate.user.name?.charAt(0)}</span>}
                                </div>
                                <div>
                                    <div className="font-semibold text-[#2271b1]">{doc.affiliate.user.name}</div>
                                    <div className="text-[11px] text-[#50575e]">{doc.affiliate.user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                            <div className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-[#50575e]" />
                                <span className="capitalize text-[#1d2327] font-medium">{doc.type.replace("_", " ").toLowerCase()}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[#50575e] border-r border-[#c3c4c7]/10">
                            {doc.documentNumber ? (
                                <span className="bg-[#f0f0f1] border border-[#c3c4c7] px-1.5 py-0.5 rounded-sm">{doc.documentNumber}</span>
                            ) : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-[#50575e] text-[12px] border-r border-[#c3c4c7]/10">
                            {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString() : "Pending"}
                        </td>
                        <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                            <span className={cn("px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border", 
                                doc.status === "APPROVED" ? "bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30" :
                                doc.status === "REJECTED" ? "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30" :
                                "bg-[#fcf9e8] text-[#f0b849] border-[#f0b849]/30"
                            )}>
                                {doc.status}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button 
                                onClick={() => setViewingDoc(doc)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#f0f0f1] border border-[#8c8f94] rounded-sm text-[12px] font-semibold text-[#2c3338] hover:bg-[#e6e6e6] transition-colors shadow-sm"
                            >
                                <Eye className="w-3.5 h-3.5" /> Review
                            </button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {viewingDoc && (
         <ReviewModal 
            doc={viewingDoc} 
            onClose={() => setViewingDoc(null)}
            onUpdate={(status: string) => {
                // @ts-ignore
                setDocuments(docs => docs.map(d => d.id === viewingDoc.id ? { ...d, status } : d));
                setViewingDoc(null);
            }}
         />
      )}
    </div>
  );
}

// ============================================================================
// WP STYLE MODAL
// ============================================================================

function ReviewModal({ doc, onClose, onUpdate }: any) {
    const [isPending, startTransition] = useTransition();

    const handleVerify = () => {
        if(!confirm("Confirm identity verification? This will allow payouts for this user.")) return;
        startTransition(async () => {
            // ✅ FIXED: Passing both accountId and docIndex because it's JSON array now
            const res = await verifyDocumentAction(doc.accountId, doc.docIndex);
            if(res.success) {
                toast.success(res.message);
                onUpdate("APPROVED");
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleReject = () => {
        const reason = prompt("Please enter the rejection reason (will be emailed to user):");
        if(!reason) return;
        
        startTransition(async () => {
            // ✅ FIXED: Passing both accountId and docIndex
            const res = await rejectDocumentAction(doc.accountId, doc.docIndex, reason);
            if(res.success) {
                toast.error("Document rejected");
                onUpdate("REJECTED");
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans text-[#1d2327]">
            <div className="bg-white border border-[#c3c4c7] shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-[#f0f0f1]">
                    <div>
                        <h3 className="font-semibold text-[14px] text-[#1d2327] m-0">Document Review</h3>
                        <p className="text-[11px] text-[#50575e] font-mono m-0 mt-0.5">ID: {doc.id}</p>
                    </div>
                    <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638] transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 bg-[#1d2327] flex items-center justify-center p-6 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={doc.url} // ✅ FIXED: JSON key is `url`, not `fileUrl`
                            alt="KYC Document" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-300 group-hover:scale-[1.01] border border-[#2c3338]" 
                        />
                        <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute bottom-6 right-6 bg-[#1d2327]/80 hover:bg-black text-white px-3 py-1.5 rounded-sm border border-[#50575e] flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                        >
                            <Download className="w-4 h-4" /> Download Original
                        </a>
                    </div>

                    <div className="w-full md:w-80 bg-[#f6f7f7] border-l border-[#c3c4c7] p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
                        <div>
                            <h4 className="text-[12px] font-semibold text-[#50575e] uppercase tracking-wider mb-2">Submitted By</h4>
                            <div className="flex items-center gap-3 p-3 bg-white border border-[#c3c4c7] rounded-sm shadow-sm">
                                <div className="w-10 h-10 rounded-sm bg-[#f0f0f1] border border-[#c3c4c7] overflow-hidden flex items-center justify-center shrink-0">
                                    {doc.affiliate.user.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={doc.affiliate.user.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-[#8c8f94]">{doc.affiliate.user.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-semibold text-[13px] text-[#2271b1] hover:underline cursor-pointer truncate">{doc.affiliate.user.name}</div>
                                    <div className="text-[11px] text-[#50575e] truncate" title={doc.affiliate.user.email}>{doc.affiliate.user.email}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-white p-4 border border-[#c3c4c7] rounded-sm shadow-sm">
                            <div>
                                <label className="text-[11px] font-semibold text-[#50575e] uppercase">Document Type</label>
                                <div className="font-semibold text-[13px] text-[#1d2327] capitalize border-b border-[#f0f0f1] pb-1">{doc.type.replace("_", " ")}</div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-[#50575e] uppercase">Reference Number</label>
                                <div className="font-mono text-[13px] text-[#1d2327] border-b border-[#f0f0f1] pb-1">{doc.documentNumber || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-[#50575e] uppercase">Submission Date</label>
                                <div className="text-[13px] text-[#1d2327] border-b border-[#f0f0f1] pb-1">{doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleString() : "Unknown"}</div>
                            </div>
                        </div>

                        {doc.status === "PENDING" ? (
                            <div className="mt-auto space-y-2 pt-4 border-t border-[#c3c4c7]">
                                <button 
                                    onClick={handleVerify}
                                    disabled={isPending}
                                    className="w-full py-2 bg-[#2271b1] border border-[#2271b1] hover:bg-[#135e96] text-white rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve Document
                                </button>
                                <button 
                                    onClick={handleReject}
                                    disabled={isPending}
                                    className="w-full py-2 bg-[#fcf0f1] border border-[#d63638] text-[#d63638] hover:bg-[#d63638] hover:text-white rounded-sm font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject Document
                                </button>
                            </div>
                        ) : (
                            <div className={cn("mt-auto p-3 rounded-sm font-semibold border flex flex-col items-center gap-1", 
                                doc.status === "APPROVED" ? "bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30" : "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30"
                            )}>
                                {doc.status === "APPROVED" ? <CheckCircle className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}
                                <span className="text-[13px]">Document is {doc.status}</span>
                                {doc.rejectionReason && <p className="text-[11px] text-[#d63638] font-normal italic mt-1 text-center border-t border-[#d63638]/20 pt-1">Reason: {doc.rejectionReason}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}