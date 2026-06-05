// File: app/(frontend)/my-account/_components/warranty-view.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ShieldCheck, Plus, Trash2, Calendar, FileText, CheckCircle, AlertTriangle, Loader2, X, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MediaPicker } from "@/components/media/media-picker";
import { createWarrantyClaimAction } from "@/app/actions/frontend/my-account/warranty-service";

interface WarrantyClaimData {
  id: string;
  orderNumber: string;
  orderDate: string | Date | null;
  productName: string;
  description: string;
  status: string;
  mediaUrl: string | null;
  createdAt: string | Date;
}

interface Props {
  initialClaims: WarrantyClaimData[];
}

export default function WarrantyView({ initialClaims }: Props) {
  const [claims, setClaims] = useState<WarrantyClaimData[]>(initialClaims);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30">Approved</span>;
      case "REJECTED":
        return <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30">Rejected</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border bg-[#fcf9e8] text-[#f0b849] border-[#f0b849]/30">Pending</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {/* WP Admin Header */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-[14px] font-semibold m-0 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#50575e]"/> Warranty & Replacements</h3>
          <p className="text-[12px] text-[#50575e] m-0 mt-0.5">Submit product warranty claims or check replacement statuses.</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-1.5 border border-[#2271b1] bg-[#2271b1] text-white px-3 py-1.5 text-[13px] rounded-sm hover:bg-[#135e96] hover:border-[#135e96] transition-colors cursor-pointer shadow-sm shrink-0">
          <Plus className="w-3.5 h-3.5" /> New Warranty Claim
        </button>
      </div>

      {/* Claims List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
              <tr>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Order Info</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Product Details</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Description</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Status</th>
                <th className="px-4 py-2 text-right font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1] bg-white">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#50575e] bg-[#f6f7f7] italic">
                     <ShieldCheck className="w-8 h-8 text-[#c3c4c7] mx-auto mb-2 opacity-50" />
                     No warranty claims filed yet.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-[#f6f7f7] transition-colors">
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                      <span className="font-semibold text-[#2271b1]">#{claim.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10 font-semibold">
                      {claim.productName}
                    </td>
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10 max-w-xs truncate text-[#50575e]" title={claim.description}>
                      {claim.description}
                    </td>
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#50575e]">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ClaimFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: CLAIM FORM MODAL (WP STYLE) ---
function ClaimFormModal({ isOpen, onClose, onSuccess }: any) {
  const [isPending, startTransition] = useTransition();
  const [mediaUrl, setMediaUrl] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      orderNumber: "",
      productName: "",
      description: "",
      mediaUrl: ""
    }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await createWarrantyClaimAction({ ...data, mediaUrl });
      if (res.success) {
        toast.success(res.message);
        onClose();
        onSuccess();
      } else {
        toast.error(res.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-sans text-[#1d2327]">
      <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="px-4 py-3 border-b border-[#c3c4c7] bg-white flex justify-between items-center shrink-0">
          <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Submit Warranty Claim</h3>
          <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638] focus:outline-none"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-4 bg-white">
          <form id="warranty-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Order Number *</label>
                <input {...register("orderNumber", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" placeholder="e.g. GoB-12345" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Product Name *</label>
                <input {...register("productName", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" placeholder="e.g. Electric Motor" />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Issue Description *</label>
              <textarea {...register("description", { required: true })} rows={4} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px]" placeholder="Explain the defect in detail..." />
            </div>

            {/* Media Upload Area */}
            <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7]">
                <MediaPicker 
                  label="Upload Photo/Video Proof (URL) *"
                  value={mediaUrl}
                  onChange={(url) => setMediaUrl(url)}
                  onRemove={() => setMediaUrl("")}
                />
            </div>
          </form>
        </div>

        <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm">Cancel</button>
          <button type="submit" form="warranty-form" disabled={isPending || !mediaUrl} className="px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50 flex items-center gap-1">
             {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Submit Claim
          </button>
        </div>
      </div>
    </div>
  );
}