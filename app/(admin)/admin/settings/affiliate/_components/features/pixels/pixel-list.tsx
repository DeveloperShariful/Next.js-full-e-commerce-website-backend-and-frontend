//app/(admin)/admin/settings/affiliate/_components/features/pixels/pixel-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliatePixel } from "@prisma/client";
import { Code2, Trash2, SwitchCamera, Check, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { togglePixelStatusAction, deletePixelAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-pixels";

// Assuming you might add a creation modal later, for now we list and manage.
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
      const res = await togglePixelStatusAction(id, !currentStatus);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this tracking pixel? This will stop tracking for the affiliate.")) return;
    
    startTransition(async () => {
      const res = await deletePixelAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const getPixelIcon = (type: string) => {
    // You can add specific icons for FB, Google, TikTok here
    return <Code2 className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Optional: Add "Add Pixel" button header here if Admin creates them */}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
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
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-gray-300" />
                    <p>No tracking pixels configured yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pixels.map((px) => (
                <tr key={px.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getPixelIcon(px.type)}
                      </div>
                      <span className="font-medium text-gray-900 capitalize">{px.type.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">
                    {px.pixelId}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{px.affiliate.user.name || "Unknown"}</div>
                    <div className="text-xs text-gray-500">/{px.affiliate.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggle(px.id, px.isEnabled)}
                      disabled={isPending}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        px.isEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          px.isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(px.id)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
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