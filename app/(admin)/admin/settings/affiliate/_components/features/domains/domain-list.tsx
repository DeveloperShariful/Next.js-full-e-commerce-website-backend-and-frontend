//app/(admin)/admin/settings/affiliate/_components/features/domains/domain-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateDomain } from "@prisma/client";
import { Trash2, Globe, CheckCircle, XCircle, RefreshCw, Copy, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addDomainAction, verifyDomainAction, deleteDomainAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-domains";

// Type with relation
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
  
  // Simple Add Form State
  const [newDomain, setNewDomain] = useState("");
  const [affiliateId, setAffiliateId] = useState("");

  const handleVerify = (id: string) => {
    startTransition(async () => {
      const res = await verifyDomainAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remove this domain? It will stop working immediately.")) return;
    startTransition(async () => {
      const res = await deleteDomainAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
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
    toast.success("Verification token copied!");
  };

  return (
    <div className="space-y-6">
      
      {/* Add Domain Section */}
      <div className="bg-gray-50 border rounded-lg p-4">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black"
          >
            <Plus className="w-4 h-4" /> Manually Add Domain
          </button>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1 w-full">
              <label className="text-xs font-medium text-gray-500">Affiliate ID</label>
              <input 
                required
                value={affiliateId}
                onChange={(e) => setAffiliateId(e.target.value)}
                placeholder="UUID of the affiliate"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1 flex-1 w-full">
              <label className="text-xs font-medium text-gray-500">Domain Name</label>
              <input 
                required
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="shop.partner.com"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add Domain"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Domain List */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Domain</th>
              <th className="px-6 py-3">Affiliate</th>
              <th className="px-6 py-3">Verification Token (TXT)</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialDomains.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                  <Globe className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p>No custom domains connected.</p>
                </td>
              </tr>
            ) : (
              initialDomains.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <a 
                      href={`https://${item.domain}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {item.domain}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.affiliate.user.name}</div>
                    <div className="text-xs text-gray-500">/{item.affiliate.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded border w-fit max-w-[200px]">
                      <span className="font-mono text-xs truncate text-gray-600">
                        {item.verificationToken || "N/A"}
                      </span>
                      {item.verificationToken && (
                        <button onClick={() => copyToken(item.verificationToken!)} className="text-gray-400 hover:text-black">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                        <XCircle className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!item.isVerified && (
                        <button 
                          onClick={() => handleVerify(item.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Verify DNS
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
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