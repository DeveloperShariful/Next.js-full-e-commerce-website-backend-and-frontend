//app/(admin)/admin/settings/affiliate/campaigns/page.tsx

import { campaignService } from "@/app/actions/admin/settings/affiliates/_services/campaign-service";
import CampaignList from "./_components/campaign-list";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "Marketing Campaigns | Affiliate Admin",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const { campaigns, total, totalPages } = await campaignService.getAllCampaigns(
    page,
    20,
    search
  );

  // Map Decimal to Number for Client Component
  const formattedData = campaigns.map(c => ({
    ...c,
    revenue: c.revenue.toNumber(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-pink-600" />
            Campaign Monitor
          </h2>
          <p className="text-sm text-gray-500">
            Track specific marketing pushes (e.g. "Black Friday", "Influencer X").
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <CampaignList 
        data={formattedData} 
        totalEntries={total}
      />
    </div>
  );
}