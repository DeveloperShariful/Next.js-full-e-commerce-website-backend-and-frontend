// app/(backend)/admin/media/page.tsx

import { getMediaLibraryItems, getStorageUsage } from '@/app/actions/backend/media/media-action';
import MediaLibraryUI from './_components/MediaLibraryUI';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Library ‹ GoBike Admin',
  description: 'Manage your website media files',
};

export default async function AdminMediaPage() {
  const [initialMedia, storageUsage] = await Promise.all([
    getMediaLibraryItems(),
    getStorageUsage(),
  ]);

  return (
    <div className="w-full bg-[#f0f0f1] min-h-screen">
        <MediaLibraryUI initialMedia={initialMedia} storageUsage={storageUsage} />
    </div>
  );
}