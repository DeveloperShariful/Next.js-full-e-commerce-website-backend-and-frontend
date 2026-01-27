// File: app/(admin)/admin/settings/affiliate/_components/kyc-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateDocument } from "@prisma/client";
import { Search, Eye, CheckCircle, XCircle, FileText, Download, X, Loader2, ShieldCheck, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { verifyDocumentAction, rejectDocumentAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-kyc";

interface DocumentWithUser extends AffiliateDocument {
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
      doc.documentNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header / Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  placeholder="Search affiliate or document ID..." 
                  className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="relative">
                <select 
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none appearance-none cursor-pointer min-w-[140px]"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ALL">All Files</option>
                </select>
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
         </div>
         
         <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Identity verification required for payouts</span>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
             <tr>
                <th className="px-6 py-3">Affiliate</th>
                <th className="px-6 py-3">Document Type</th>
                <th className="px-6 py-3">Doc Number</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredDocs.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-500">No documents found matching filters.</td></tr>
             ) : (
                filteredDocs.map(doc => (
                   <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center shrink-0">
                                {doc.affiliate.user.image ? <img src={doc.affiliate.user.image} alt="" className="w-full h-full object-cover" /> : doc.affiliate.user.name?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">{doc.affiliate.user.name}</div>
                                <div className="text-[10px] text-gray-500">{doc.affiliate.user.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="capitalize text-gray-700">{doc.type.replace("_", " ").toLowerCase()}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                         {doc.documentNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                         {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border", 
                            doc.status === "VERIFIED" ? "bg-green-50 text-green-700 border-green-100" :
                            doc.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                            "bg-yellow-50 text-yellow-700 border-yellow-100 animate-pulse"
                         )}>
                            {doc.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => setViewingDoc(doc)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-black hover:border-gray-300 transition-all shadow-sm"
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

      {viewingDoc && (
         <ReviewModal 
            doc={viewingDoc} 
            onClose={() => setViewingDoc(null)}
            onUpdate={(status: string) => {
                setDocuments(docs => docs.map(d => d.id === viewingDoc.id ? { ...d, status } : d));
                setViewingDoc(null);
            }}
         />
      )}
    </div>
  );
}

// --- SUB COMPONENT: Review Modal ---

function ReviewModal({ doc, onClose, onUpdate }: any) {
    const [isPending, startTransition] = useTransition();

    const handleVerify = () => {
        if(!confirm("Confirm identity verification? This will allow payouts for this user.")) return;
        startTransition(async () => {
            const res = await verifyDocumentAction(doc.id);
            if(res.success) {
                toast.success(res.message);
                onUpdate("VERIFIED");
            } else {
                toast.error(res.message);
            }
        });
    };

    const handleReject = () => {
        const reason = prompt("Please enter the rejection reason (will be emailed to user):");
        if(!reason) return;
        
        startTransition(async () => {
            const res = await rejectDocumentAction(doc.id, reason);
            if(res.success) {
                toast.error("Document rejected");
                onUpdate("REJECTED");
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Document Review</h3>
                        <p className="text-xs text-gray-500 font-mono">ID: {doc.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Image Viewer */}
                    <div className="flex-1 bg-slate-900 flex items-center justify-center p-6 relative group">
                        <img 
                            src={doc.fileUrl} 
                            alt="KYC Document" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-transform duration-300 group-hover:scale-[1.01]" 
                        />
                        <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            className="absolute bottom-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 text-sm font-medium transition-all"
                        >
                            <Download className="w-4 h-4" /> Download Original
                        </a>
                    </div>

                    {/* Sidebar Details */}
                    <div className="w-full md:w-80 bg-white border-l p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Submitted By</h4>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-white border overflow-hidden flex items-center justify-center shrink-0">
                                    {doc.affiliate.user.image ? <img src={doc.affiliate.user.image} className="w-full h-full object-cover" /> : <span className="font-bold text-gray-400">{doc.affiliate.user.name?.charAt(0)}</span>}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-sm text-gray-900 truncate">{doc.affiliate.user.name}</div>
                                    <div className="text-xs text-gray-500 truncate" title={doc.affiliate.user.email}>{doc.affiliate.user.email}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Document Type</label>
                                <div className="font-medium text-sm text-gray-900 capitalize border-b border-gray-100 pb-1">{doc.type.replace("_", " ")}</div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Reference Number</label>
                                <div className="font-mono text-sm text-gray-900 border-b border-gray-100 pb-1">{doc.documentNumber || "N/A"}</div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Submission Date</label>
                                <div className="text-sm text-gray-900 border-b border-gray-100 pb-1">{new Date(doc.createdAt).toLocaleString()}</div>
                            </div>
                        </div>

                        {doc.status === "PENDING" ? (
                            <div className="mt-auto space-y-3 pt-6 border-t">
                                <button 
                                    onClick={handleVerify}
                                    disabled={isPending}
                                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Verify Document
                                </button>
                                <button 
                                    onClick={handleReject}
                                    disabled={isPending}
                                    className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject Document
                                </button>
                            </div>
                        ) : (
                            <div className={cn("mt-auto p-4 rounded-xl text-center font-bold border flex flex-col items-center gap-2", 
                                doc.status === "VERIFIED" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                            )}>
                                {doc.status === "VERIFIED" ? <CheckCircle className="w-8 h-8"/> : <XCircle className="w-8 h-8"/>}
                                Document is {doc.status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}