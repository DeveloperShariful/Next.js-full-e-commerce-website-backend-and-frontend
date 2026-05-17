//app/(backend)/admin/warranty-claims/_components/FilterButtons.tsx

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function FilterButtons({ counts }: { counts: any }) {
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('status') || 'ALL';

  return (
    // মোবাইলের জন্য Horizontal Scroll এবং স্ক্রলবার হাইড করার ক্লাস দেওয়া হয়েছে
    <div className="flex gap-3 text-[13px] text-[#2271b1] mb-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      <Link href="/admin/warranty-claims" className={currentFilter === 'ALL' ? 'text-black font-semibold' : 'hover:underline'}>
        All <span className="text-[#50575e] font-normal">({counts.all})</span>
      </Link> 
      <span className="text-gray-300">|</span> 
      
      <Link href="/admin/warranty-claims?status=PENDING" className={currentFilter === 'PENDING' ? 'text-black font-semibold' : 'hover:underline'}>
        Pending <span className="text-[#50575e] font-normal">({counts.pending})</span>
      </Link> 
      <span className="text-gray-300">|</span> 
      
      <Link href="/admin/warranty-claims?status=APPROVED" className={currentFilter === 'APPROVED' ? 'text-black font-semibold' : 'hover:underline'}>
        Approved <span className="text-[#50575e] font-normal">({counts.approved})</span>
      </Link> 
      <span className="text-gray-300">|</span> 
      
      <Link href="/admin/warranty-claims?status=REJECTED" className={currentFilter === 'REJECTED' ? 'text-black font-semibold' : 'hover:underline'}>
        Rejected <span className="text-[#50575e] font-normal">({counts.rejected})</span>
      </Link> 
      <span className="text-gray-300">|</span> 
      
      <Link href="/admin/warranty-claims?status=TRASHED" className={currentFilter === 'TRASHED' ? 'text-black font-semibold' : 'hover:underline'}>
        Trash <span className="text-[#50575e] font-normal">({counts.trash})</span>
      </Link>
    </div>
  );
}