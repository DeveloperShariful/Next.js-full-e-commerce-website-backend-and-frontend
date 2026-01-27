// File: app/(admin)/admin/settings/affiliate/_components/campaign-list.tsx

"use client";

import { useTransition } from "react";
import { Trash2, Megaphone, DollarSign, Calendar, MousePointer, Percent } from "lucide-react";
import { toast } from "sonner";
import { deleteCampaignAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-campaigns";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { format } from "date-fns";

interface CampaignItem {
  id: string;
  name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: Date;
  affiliate: {
    slug: string;
    user: {
      name: string | null;
      image: string | null;
    };
  };
}

interface Props {
  data: CampaignItem[];
  totalEntries: number;
}

export default function CampaignList({ data, totalEntries }: Props) {
  const [isPending, startTransition] = useTransition();
  const { formatPrice } = useGlobalStore(); // ✅ Ultra: Dynamic Currency

  const handleDelete = (id: string) => {
    if (!confirm("Delete this campaign? All associated links will stop tracking.")) return;
    
    startTransition(async () => {
      const res = await deleteCampaignAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
         <div>
            <h3 className="font-semibold text-gray-900">Campaign Monitor</h3>
            <p className="text-xs text-gray-500">Performance of specific marketing pushes.</p>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Campaign</th>
              <th className="px-6 py-3">Created By</th>
              <th className="px-6 py-3 text-right">Traffic</th>
              <th className="px-6 py-3 text-right">Sales</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Megaphone className="h-10 w-10 text-gray-300" />
                    <p>No active campaigns found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3"/>
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {item.affiliate.user.image ? (
                                <img src={item.affiliate.user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                item.affiliate.user.name?.charAt(0)
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700">{item.affiliate.user.name}</span>
                            <span className="text-[10px] text-gray-400">/{item.affiliate.slug}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        <MousePointer className="w-3 h-3 text-gray-400"/>
                        {item.clicks.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1 text-gray-600">
                        <Percent className="w-3 h-3 text-gray-400"/>
                        {item.conversions}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-md font-mono text-xs font-bold border border-green-100">
                        {formatPrice(item.revenue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Campaign"
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
      
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
        <span>Total Campaigns: {totalEntries}</span>
        <span>Stats update every hour</span>
      </div>
    </div>
  );
}