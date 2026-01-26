//File: app/(admin)/admin/settings/affiliate/kyc/_components/kyc-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateDocument } from "@prisma/client";
import { Search, Eye, CheckCircle, XCircle, FileText, Download, X, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const verifyDocumentAction = async (id: string) => ({ success: true, message: "Verified" });
const rejectDocumentAction = async (id: string, reason: string) => ({ success: true, message: "Rejected" });

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
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  placeholder="Search by name or doc ID..." 
                  className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <select 
                className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-1 focus:ring-black outline-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            >
                <option value="PENDING">Pending Review</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All Documents</option>
            </select>
         </div>
         <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span>Strict compliance mode enabled</span>
         </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
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
                <tr><td colSpan={6} className="p-12 text-center text-gray-500">No documents found for this filter.</td></tr>
             ) : (
                filteredDocs.map(doc => (
                   <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                {doc.affiliate.user.image ? <img src={doc.affiliate.user.image} alt="" /> : doc.affiliate.user.name?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{doc.affiliate.user.name}</div>
                                <div className="text-xs text-gray-500">{doc.affiliate.user.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                            <FileText className="w-3 h-3" />
                            {doc.type.replace("_", " ")}
                         </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600 text-xs">
                         {doc.documentNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                         {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn("px-2 py-1 rounded-full text-xs font-bold", 
                            doc.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                            doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700 animate-pulse"
                         )}>
                            {doc.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => setViewingDoc(doc)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-black hover:text-white transition-all"
                         >
                            <Eye className="w-3 h-3" /> Review
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

function ReviewModal({ doc, onClose, onUpdate }: any) {
    const [isPending, startTransition] = useTransition();

    const handleVerify = () => {
        if(!confirm("Confirm identity verification? This will allow payouts.")) return;
        startTransition(async () => {
            await verifyDocumentAction(doc.id);
            toast.success("Document verified");
            onUpdate("VERIFIED");
        });
    };

    const handleReject = () => {
        const reason = prompt("Enter rejection reason for email notification:");
        if(!reason) return;
        startTransition(async () => {
            await rejectDocumentAction(doc.id, reason);
            toast.error("Document rejected");
            onUpdate("REJECTED");
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Document Review</h3>
                        <p className="text-xs text-gray-500">ID: {doc.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 relative">
                        <img 
                            src={doc.fileUrl} 
                            alt="Document" 
                            className="max-w-full max-h-full object-contain shadow-lg" 
                        />
                        <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded backdrop-blur-md flex items-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" /> Open Original
                        </a>
                    </div>

                    <div className="w-full md:w-80 bg-white border-l p-6 flex flex-col gap-6 overflow-y-auto">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Submitted By</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                    {doc.affiliate.user.image ? <img src={doc.affiliate.user.image} className="w-full h-full object-cover" /> : null}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{doc.affiliate.user.name}</div>
                                    <div className="text-xs text-gray-500">{doc.affiliate.user.email}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded border">
                                <div className="text-xs text-gray-500">Type</div>
                                <div className="font-medium text-sm capitalize">{doc.type.replace("_", " ")}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <div className="text-xs text-gray-500">Document Number</div>
                                <div className="font-mono text-sm">{doc.documentNumber || "N/A"}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                                <div className="text-xs text-gray-500">Submission Date</div>
                                <div className="text-sm">{new Date(doc.createdAt).toLocaleString()}</div>
                            </div>
                        </div>

                        {doc.status === "PENDING" ? (
                            <div className="mt-auto space-y-3">
                                <button 
                                    onClick={handleVerify}
                                    disabled={isPending}
                                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve & Verify
                                </button>
                                <button 
                                    onClick={handleReject}
                                    disabled={isPending}
                                    className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject Document
                                </button>
                            </div>
                        ) : (
                            <div className={cn("mt-auto p-4 rounded-lg text-center font-bold border", 
                                doc.status === "VERIFIED" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                            )}>
                                Document is {doc.status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}