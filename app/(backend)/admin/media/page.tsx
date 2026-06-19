// app/(backend)/admin/media/page.tsx

import { getAllMedia } from '@/app/actions/backend/media/media-action';
import MediaLibraryUI from './_components/MediaLibraryUI';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Library ‹ GoBike Admin',
  description: 'Manage your website media files',
};

export default async function AdminMediaPage() {
  // Now initialMedia is strongly typed as Media[] 
  const initialMedia = await getAllMedia();

  return (
    <div className="w-full bg-[#f0f0f1] min-h-screen">
        <MediaLibraryUI initialMedia={initialMedia} />
    </div>
  );
}