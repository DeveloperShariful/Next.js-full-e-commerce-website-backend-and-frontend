// app/(frontend)/shop/_components/PaginationControls.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginationControlsProps {
  pageInfo: PageInfo;
  basePath: string;
}

export default function PaginationControls({ pageInfo }: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const createNextPageUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (currentPage + 1).toString()); 
    return `${pathname}?${params.toString()}`;
  };

  const createPrevPageUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentPage - 1 > 1) {
      params.set('page', (currentPage - 1).toString());
    } else {
      params.delete('page');
    }
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-10 mb-8">
      {pageInfo.hasPreviousPage ? (
        <Link 
            href={createPrevPageUrl()} 
            className="px-6 py-3 border border-gray-200 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          &larr; Previous
        </Link>
      ) : (
        <button 
            className="px-6 py-3 border border-gray-200 bg-white rounded-lg text-gray-400 font-medium cursor-not-allowed opacity-60" 
            disabled
        >
          &larr; Previous
        </button>
      )}

      {pageInfo.hasNextPage ? (
        <Link 
            href={createNextPageUrl()} 
            className="px-6 py-3 border border-gray-200 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Next &rarr;
        </Link>
      ) : (
        <button 
            className="px-6 py-3 border border-gray-200 bg-white rounded-lg text-gray-400 font-medium cursor-not-allowed opacity-60" 
            disabled
        >
          Next &rarr;
        </button>
      )}
    </div>
  );
}