//app/(backend)/admin/warranty-claims/page.tsx

import Link from 'next/link';
import { db } from '@/lib/prisma';
import FilterButtons from './_components/FilterButtons';
import WarrantyTableClient from './_components/WarrantyTableClient';

export const dynamic = 'force-dynamic';

export default async function WarrantyClaimsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams;
  const filterStatus = resolvedParams?.status || 'ALL';
  const currentPage = Number(resolvedParams?.page) || 1;
  const ITEMS_PER_PAGE = 10; 
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Counts
  const allCount = await db.warrantyClaim.count({ where: { status: { not: 'TRASHED' } } });
  const pendingCount = await db.warrantyClaim.count({ where: { status: 'PENDING' } });
  const approvedCount = await db.warrantyClaim.count({ where: { status: 'APPROVED' } });
  const rejectedCount = await db.warrantyClaim.count({ where: { status: 'REJECTED' } });
  const trashCount = await db.warrantyClaim.count({ where: { status: 'TRASHED' } });

  const counts = { all: allCount, pending: pendingCount, approved: approvedCount, rejected: rejectedCount, trash: trashCount };

  let whereCondition: any = { status: { not: 'TRASHED' } }; 
  if (filterStatus !== 'ALL') whereCondition = { status: filterStatus };

  const totalFilteredItems = await db.warrantyClaim.count({ where: whereCondition });
  const claims = await db.warrantyClaim.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    skip: skip,
    take: ITEMS_PER_PAGE,
  });

  return (
    <div className="max-w-full">
      <div className="flex items-center gap-4 mb-6 px-4 sm:px-0">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Warranty Claims</h1>
        <Link href="/warranty-claim" target="_blank" className="border border-[#2271b1] text-[#2271b1] px-2 py-1 text-[13px] rounded hover:bg-[#2271b1] hover:text-white transition-colors">Add New</Link>
      </div>

      <div className="px-4 sm:px-0">
        <FilterButtons counts={counts} />
      </div>
      
      <WarrantyTableClient 
        claims={claims} 
        currentFilter={filterStatus} 
        totalItems={totalFilteredItems} 
        itemsPerPage={ITEMS_PER_PAGE} 
      />
    </div>
  );
}