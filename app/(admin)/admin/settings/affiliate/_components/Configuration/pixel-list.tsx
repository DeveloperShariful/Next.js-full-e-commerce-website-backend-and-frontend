// File: app/(admin)/admin/settings/affiliate/_components/Configuration/pixel-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliatePixel } from "@prisma/client";
import { Code2, Trash2, AlertCircle, ToggleLeft, ToggleRight, Facebook, Chrome } from "lucide-react";
import { toast } from "sonner";

// ✅ CORRECTED IMPORT
// ✅ Use Named Imports
import { deletePixelAction, togglePixelStatusAction } from "@/app/actions/admin/settings/affiliates/_services/pixel-service";

interface PixelWithUser extends AffiliatePixel {
  affiliate: {
    slug: string;
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface Props {
  pixels: PixelWithUser[];
}

export default function PixelList({ pixels }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      // ✅ Call Service Method Directly
      const res = await togglePixelStatusAction(id, !currentStatus);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this tracking pixel?")) return;
    startTransition(async () => {
      // ✅ Call Service Method Directly
      const res = await deletePixelAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const getPixelIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('facebook') || t.includes('meta')) return <Facebook className="w-4 h-4 text-blue-600" />;
    if (t.includes('google') || t.includes('ads')) return <Chrome className="w-4 h-4 text-red-500" />;
    if (t.includes('tiktok')) return <span className="font-bold text-black text-xs">Tk</span>;
    return <Code2 className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
                <h3 className="font-bold text-gray-900">Conversion Tracking Pixels</h3>
                <p className="text-xs text-gray-500">Injects scripts on the "Thank You" page for specific affiliates.</p>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
            <tr>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Pixel ID</th>
                <th className="px-6 py-3">Affiliate</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {pixels.length === 0 ? (
                <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-gray-300" />
                    <p>No tracking pixels configured.</p>
                    </div>
                </td>
                </tr>
            ) : (
                pixels.map((px) => (
                <tr key={px.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border">
                        {getPixelIcon(px.type)}
                        </div>
                        <span className="font-medium text-gray-900 capitalize">{px.type}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                        <code className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-600">
                            {px.pixelId}
                        </code>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-xs">{px.affiliate.user.name || "Unknown"}</span>
                        <span className="text-[10px] text-gray-400">/{px.affiliate.slug}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                    <button 
                        onClick={() => handleToggle(px.id, px.isEnabled)}
                        disabled={isPending}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        px.isEnabled 
                            ? 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                    >
                        {px.isEnabled ? <ToggleRight className="w-3 h-3"/> : <ToggleLeft className="w-3 h-3"/>}
                        {px.isEnabled ? 'Active' : 'Disabled'}
                    </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleDelete(px.id)}
                        disabled={isPending}
                        className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Pixel"
                    >
                        <Trash2 className="w-4 h-4" />
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