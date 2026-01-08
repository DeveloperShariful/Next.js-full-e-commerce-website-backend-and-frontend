// app/(admin)/admin/media/page.tsx

import { getAllMedia } from "@/app/actions/admin/media/media-read";
import { MediaLibrary } from "./_components/media-library";

// 🔥 Server Component: Pre-fetching Data
export default async function MediaPage() {
  
  // 1. Initial Fetch on Server
  // আমরা ডিফল্ট ফিল্টার দিয়ে প্রথম পেজ লোড করছি
  const res = await getAllMedia("", "newest", "ALL", "ALL", 1, 40);
  
  const initialData = res.success ? (res.data as any) : [];
  const initialTotal = res.success ? res.meta.total : 0;

  // 2. Pass Data to Client Component
  return (
    <MediaLibrary 
        initialData={initialData} 
        initialTotal={initialTotal} 
    />
  );
}