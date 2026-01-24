// File: app/(admin)/admin/settings/affiliate/creatives/page.tsx

import { creativeService } from "@/app/actions/admin/settings/affiliate/_services/creative-service";
import CreativeList from "../_components/features/creatives/creative-list";

export const metadata = {
  title: "Marketing Assets | Admin",
};

/**
 * SERVER COMPONENT
 * Fetches marketing materials (Banners, Social Posts) for affiliates.
 */
export default async function AffiliateCreativesPage() {
  const creatives = await creativeService.getAllCreatives();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Marketing Assets</h2>
          <p className="text-sm text-gray-500">
            Upload banners and links that affiliates can share on social media.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      {/* Client Component */}
      <CreativeList initialCreatives={creatives} />
    </div>
  );
}