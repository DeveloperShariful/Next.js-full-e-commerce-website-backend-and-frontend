//app/(admin)/admin/settings/affiliate/pixels/page.tsx

import { pixelService } from "@/app/actions/admin/settings/affiliates/_services/pixel-service";
import PixelList from "@/app/(admin)/admin/settings/affiliate/pixels/_components/pixel-list";
import { Code2, Info } from "lucide-react";

export const metadata = {
  title: "Tracking Pixels | Affiliate Admin",
};

export default async function TrackingPixelsPage() {
  const pixels = await pixelService.getAllPixels();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-purple-600" />
            3rd Party Tracking
          </h2>
          <p className="text-sm text-gray-500">
            Manage Facebook, Google, and TikTok pixels for your affiliates.
          </p>
        </div>
        
        {/* Info Box */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100">
          <Info className="w-4 h-4" />
          Pixels fire on "Order Confirmation" page only.
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* Render Client List */}
      <PixelList pixels={pixels} />
    </div>
  );
}