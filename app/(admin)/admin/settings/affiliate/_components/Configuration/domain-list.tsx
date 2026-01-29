// File: app/(admin)/admin/settings/affiliate/_components/Configuration/domain-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateDomain } from "@prisma/client";
import { Trash2, Globe, CheckCircle, RefreshCw, Copy, Plus, Loader2, Link as LinkIcon, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ✅ CORRECTED IMPORT
import { 
  addDomainAction, 
  deleteDomainAction, 
  verifyDomainAction 
} from "@/app/actions/admin/settings/affiliates/_services/domain-service";

interface DomainWithAffiliate extends AffiliateDomain {
  affiliate: {
    slug: string;
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface Props {
  initialDomains: DomainWithAffiliate[];
}

export default function DomainList({ initialDomains }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [affiliateId, setAffiliateId] = useState("");

  const handleVerify = (id: string) => {
    startTransition(async () => {
      // ✅ Call Service Method
      const res = await verifyDomainAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remove this domain? It will stop working immediately.")) return;
    startTransition(async () => {
      // ✅ Call Service Method
      const res = await deleteDomainAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateId || !newDomain) return toast.error("All fields required");

    startTransition(async () => {
      // ✅ Call Service Method
      const res = await addDomainAction({ affiliateId, domain: newDomain });
      if (res.success) {
        toast.success(res.message);
        setIsAdding(false);
        setNewDomain("");
        setAffiliateId("");
      } else {
        toast.error(res.message);
      }
    });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("TXT Record copied!");
  };

  return (
    <div className="space-y-6">
      
      {/* Header / Add Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {!isAdding ? (
          <div className="flex justify-between items-center">
             <div>
                <h3 className="font-bold text-gray-900">Custom Domains</h3>
                <p className="text-xs text-gray-500">Allow top partners to use their own white-label domain.</p>
             </div>
             <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-sm active:scale-95"
             >
                <Plus className="w-4 h-4" /> Add Domain
             </button>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-sm font-bold text-gray-900">Connect New Domain</h4>
                <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-red-500 hover:underline">Cancel</button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase">Affiliate ID (UUID)</label>
                    <input 
                        required
                        value={affiliateId}
                        onChange={(e) => setAffiliateId(e.target.value)}
                        placeholder="e.g. 550e8400-e29b..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                    />
                </div>
                <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase">Domain Name</label>
                    <input 
                        required
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="partners.brand.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isPending}
                    className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {isPending && <Loader2 className="w-3 h-3 animate-spin"/>}
                    {isPending ? "Connecting..." : "Connect"}
                </button>
            </div>
          </form>
        )}
      </div>

      {/* Domain List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Domain</th>
              <th className="px-6 py-3">Affiliate Owner</th>
              <th className="px-6 py-3">DNS Verification (TXT)</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialDomains.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-16 text-center text-gray-500 flex flex-col items-center">
                  <Globe className="h-10 w-10 text-gray-300 mb-3" />
                  <p>No domains connected.</p>
                </td>
              </tr>
            ) : (
              initialDomains.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <a 
                      href={`https://${item.domain}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {item.domain}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-[10px] font-bold flex items-center justify-center text-gray-500">
                            {item.affiliate.user.name?.charAt(0)}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 text-xs">{item.affiliate.user.name}</div>
                            <div className="text-[10px] text-gray-400">/{item.affiliate.slug}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded border border-slate-200 w-fit max-w-[200px] group-hover:border-slate-300 transition-colors">
                      <span className="font-mono text-[10px] truncate text-slate-600 select-all">
                        {item.verificationToken || "N/A"}
                      </span>
                      {item.verificationToken && (
                        <button onClick={() => copyToken(item.verificationToken!)} className="text-slate-400 hover:text-black" title="Copy Token">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.isVerified && (
                        <button 
                          onClick={() => handleVerify(item.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 text-xs font-medium transition-colors"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Verify
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all"
                        title="Delete Domain"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}