//File: app/(admin)/admin/settings/affiliate/announcements/page.tsx

import { announcementService } from "@/app/actions/admin/settings/affiliates/_services/announcement-service";
import AnnouncementManager from "./_components/announcement-manager";
import { Megaphone } from "lucide-react";

export const metadata = {
  title: "Announcements | Affiliate Admin",
};

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { announcements } = await announcementService.getAllAnnouncements(page, 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Affiliate Announcements
          </h2>
          <p className="text-sm text-gray-500">
            Post updates, news, and offer alerts directly to the affiliate dashboard.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <AnnouncementManager initialData={announcements} />
    </div>
  );
}