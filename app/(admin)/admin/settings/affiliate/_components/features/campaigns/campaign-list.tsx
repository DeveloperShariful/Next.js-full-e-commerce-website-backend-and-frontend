//app/(admin)/admin/settings/affiliate/_components/features/campaigns/campaign-list.tsx

"use client";

import { useTransition } from "react";
import { Trash2, TrendingUp, MousePointer, DollarSign, ExternalLink, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { deleteCampaignAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-campaigns";

interface CampaignItem {
  id: string;
  name: string;
  clicks: number;
  conversions: number;
  revenue: any; // Decimal
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

  const handleDelete = (id: string) => {
    if (!confirm("Delete this campaign? All associated links will stop tracking.")) return;
    
    startTransition(async () => {
      const res = await deleteCampaignAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Campaign Name</th>
              <th className="px-6 py-3">Affiliate</th>
              <th className="px-6 py-3 text-right">Clicks</th>
              <th className="px-6 py-3 text-right">Conv.</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500">
                  <Megaphone className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p>No active campaigns found.</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                            {item.affiliate.user.image ? (
                                <img src={item.affiliate.user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    {item.affiliate.user.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-gray-700">{item.affiliate.user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-600">
                    {item.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-600">
                    {item.conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md font-mono text-xs font-medium">
                        <DollarSign className="w-3 h-3" />
                        {Number(item.revenue).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
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
      
      {/* Simple Footer Stats */}
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>Total Campaigns: {totalEntries}</span>
        <span>Showing recent performance</span>
      </div>
    </div>
  );
}