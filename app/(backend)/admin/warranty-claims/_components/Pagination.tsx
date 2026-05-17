//app/(backend)/admin/warranty-claims/_components/Pagination.tsx

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function Pagination({ totalItems, itemsPerPage }: { totalItems: number, itemsPerPage: number }) {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null; // যদি ১ পেজেই সব ডেটা ধরে যায়, তবে পেজিনেশন দেখাবে না

  // URL-এ পেজ নম্বর যোগ করার ফাংশন (আগের ফিল্টার স্ট্যাটাস ঠিক রেখে)
  const createPageUrl = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `/admin/warranty-claims?${params.toString()}`;
  };

  return (
    <div className="flex justify-end items-center py-2 text-[13px] text-[#50575e]">
      <span className="mr-3">{totalItems} items</span>
      
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <Link 
          href={createPageUrl(1)} 
          className={`px-2 py-1 border border-[#c3c4c7] rounded bg-[#f6f7f7] ${currentPage === 1 ? 'text-gray-400 pointer-events-none' : 'text-[#2271b1] hover:bg-white hover:border-[#2271b1] transition-colors'}`}
        >
          «
        </Link>
        
        {/* Previous Page Button */}
        <Link 
          href={createPageUrl(currentPage - 1)} 
          className={`px-2 py-1 border border-[#c3c4c7] rounded bg-[#f6f7f7] ${currentPage === 1 ? 'text-gray-400 pointer-events-none' : 'text-[#2271b1] hover:bg-white hover:border-[#2271b1] transition-colors'}`}
        >
          ‹
        </Link>

        {/* Current Page Input Style (Like WordPress) */}
        <span className="mx-2 flex items-center gap-2">
          <input 
            type="text" 
            value={currentPage} 
            readOnly 
            className="w-8 text-center border border-[#8c8f94] rounded py-1 outline-none" 
          />
          <span>of {totalPages}</span>
        </span>

        {/* Next Page Button */}
        <Link 
          href={createPageUrl(currentPage + 1)} 
          className={`px-2 py-1 border border-[#c3c4c7] rounded bg-[#f6f7f7] ${currentPage === totalPages ? 'text-gray-400 pointer-events-none' : 'text-[#2271b1] hover:bg-white hover:border-[#2271b1] transition-colors'}`}
        >
          ›
        </Link>

        {/* Last Page Button */}
        <Link 
          href={createPageUrl(totalPages)} 
          className={`px-2 py-1 border border-[#c3c4c7] rounded bg-[#f6f7f7] ${currentPage === totalPages ? 'text-gray-400 pointer-events-none' : 'text-[#2271b1] hover:bg-white hover:border-[#2271b1] transition-colors'}`}
        >
          »
        </Link>
      </div>
    </div>
  );
}