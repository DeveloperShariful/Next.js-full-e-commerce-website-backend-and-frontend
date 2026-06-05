// File: app/(backend)/admin/affiliate/_components/Configuration/pixel-manager.tsx

"use client";

import { useTransition } from "react";
import { Code2, Trash2, AlertCircle, ToggleLeft, ToggleRight, Facebook, Chrome } from "lucide-react";
import { toast } from "sonner";
import { TrackingPixelItem } from "@/app/actions/backend/affiliate/types"; // ✅ FIXED: Replaced old Prisma Type
import { deletePixelAction, togglePixelStatusAction } from "@/app/actions/backend/affiliate/_services/pixel-domain-service";

interface Props {
  pixels: TrackingPixelItem[]; // ✅ FIXED: JSON array format mapped perfectly
}

export default function PixelList({ pixels }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await togglePixelStatusAction(id, !currentStatus);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this tracking pixel?")) return;
    startTransition(async () => {
      const res = await deletePixelAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const getPixelIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('facebook') || t.includes('meta')) return <Facebook className="w-4 h-4 text-[#2271b1]" />;
    if (t.includes('google') || t.includes('ads')) return <Chrome className="w-4 h-4 text-[#d63638]" />;
    if (t.includes('tiktok')) return <span className="font-bold text-[#1d2327] text-xs">Tk</span>;
    return <Code2 className="w-4 h-4 text-[#50575e]" />;
  };

  return (
    <div className="font-sans text-[#1d2327]">
        <div className="bg-white border border-[#c3c4c7] shadow-sm mb-4">
            <div className="px-4 py-3">
                <h3 className="text-[14px] font-semibold m-0">Conversion Tracking Pixels</h3>
                <p className="text-[12px] text-[#50575e] m-0">Injects scripts on the "Thank You" page for specific affiliates.</p>
            </div>
        </div>

        {/* WP List Table Style */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
            <tr>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Platform</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Pixel ID</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Affiliate</th>
                <th className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Status</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
            {pixels.length === 0 ? (
                <tr>
                <td colSpan={5} className="p-8 text-center text-[#50575e] italic bg-[#f6f7f7]">
                    <div className="flex flex-col items-center justify-center">
                       <AlertCircle className="w-6 h-6 text-[#c3c4c7] mb-1" />
                       No tracking pixels configured.
                    </div>
                </td>
                </tr>
            ) : (
                pixels.map((px) => (
                <tr key={px.id} className="hover:bg-[#f6f7f7] group transition-colors">
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                      <div className="flex items-center gap-2">
                          {getPixelIcon(px.type)}
                          <span className="font-semibold text-[#2271b1] capitalize">{px.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                        <code className="text-[11px] font-mono bg-[#f0f0f1] border border-[#c3c4c7] px-1.5 py-0.5 rounded-sm text-[#1d2327]">
                            {px.pixelId}
                        </code>
                    </td>
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                       <span className="font-semibold text-[#1d2327]">{px.affiliateName}</span>
                    </td>
                    <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                    <button 
                        onClick={() => handleToggle(px.id, px.status)}
                        disabled={isPending}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold transition-colors border ${
                        px.status 
                            ? 'bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]' 
                            : 'bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7] hover:bg-[#e6e6e6]'
                        }`}
                    >
                        {px.status ? <ToggleRight className="w-3 h-3"/> : <ToggleLeft className="w-3 h-3"/>}
                        {px.status ? 'Active' : 'Disabled'}
                    </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                    <button 
                        onClick={() => handleDelete(px.id)}
                        disabled={isPending}
                        className="text-[#d63638] hover:underline text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Trash
                    </button>
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